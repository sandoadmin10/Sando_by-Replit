// SANDO server: serves the built SPA and proxies AI requests so API keys never reach the browser.
// Zero dependencies. Works on Replit (binds 0.0.0.0, honours PORT). With no key it reports Demo Mode.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import os from 'node:os'
import { createAgentHandler } from './agent.js'

// Settings: a .env file next to package.json (works the same on Windows, macOS, Linux and Replit),
// or flags such as `node server/index.js --provider=claude-code`. Real environment variables win.
try {
  const envFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env')
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
} catch { /* no .env file */ }
for (const arg of process.argv.slice(2)) { const m = arg.match(/^--provider=(.+)$/); if (m) process.env.AI_PROVIDER = m[1] }

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const PORT = Number(process.env.PORT) || 3000
const env = process.env
const PROVIDER = (env.AI_PROVIDER || (env.ANTHROPIC_API_KEY ? 'anthropic' : env.OPENAI_API_KEY ? 'openai' : env.CLAUDE_CODE_OAUTH_TOKEN ? 'claude-code' : env.CURSOR_API_KEY ? 'cursor' : '')).toLowerCase()
const KEY = PROVIDER === 'anthropic' ? env.ANTHROPIC_API_KEY : PROVIDER === 'openai' ? env.OPENAI_API_KEY : ''
const CURSOR = PROVIDER === 'cursor' // Cursor's agent CLI, signed in with `cursor-agent login` (or CURSOR_API_KEY)
const CLI = PROVIDER === 'claude-code' || CURSOR // sign-in based: uses the Claude Code CLI's own login instead of an API key
const MODEL = env.AI_MODEL || (PROVIDER === 'anthropic' ? 'claude-sonnet-5-5' : CLI ? 'default' : 'gpt-4o-mini')
const LIVE = Boolean(KEY) || CLI
const TIMEOUT_MS = CLI ? 120000 : 30000, MAX_BODY = 32 * 1024, RATE = 20 // requests per minute per IP

// ---------- provider adapter ----------
// Prefer the CLI installed with the project (npm install), so hosts like Replit need no global install.
// The native binary shipped with the npm package — no shell needed, so it also works on Windows.
// ---------------------------------------------------------------- Claude Code / Cursor CLI (sign-in, no API key)
// We look for every Claude Code install on this machine and use the one that actually works: the user's own
// (the one they signed in with) first, then the copy bundled with the project. On Windows npm installs a
// `claude.cmd` shim that Node cannot spawn directly, so we resolve it to the real claude.exe or cli.js.
function claudeCandidates() {
  const win = process.platform === 'win32', out = [], seen = new Set()
  const isFile = f => { try { return fs.statSync(f).isFile() } catch { return false } }
  const add = (bin, pre = [], label = bin) => { const k = [bin, ...pre].join('|'); if (!seen.has(k) && (bin === process.execPath ? isFile(pre[0]) : isFile(bin))) { seen.add(k); out.push({ bin, pre, label }) } }
  const fromPackage = dir => {
    const pkg = path.join(dir, '@anthropic-ai', 'claude-code')
    add(path.join(pkg, 'bin', 'claude.exe'))
    add(process.execPath, [path.join(pkg, 'cli.js')], path.join(pkg, 'cli.js'))
  }
  if (env.CLAUDE_BIN) { if (/\.(c?js|mjs)$/i.test(env.CLAUDE_BIN)) add(process.execPath, [env.CLAUDE_BIN], env.CLAUDE_BIN); else add(env.CLAUDE_BIN) }
  const dirs = (env.PATH || env.Path || '').split(path.delimiter).filter(Boolean)
  const home = env.USERPROFILE || env.HOME || ''
  dirs.push(path.join(home, '.local', 'bin'), path.join(home, '.claude', 'local'), path.join(home, '.claude', 'local', 'node_modules', '.bin'))
  if (win) dirs.push(path.join(env.APPDATA || '', 'npm'))
  for (const dir of dirs) {
    add(path.join(dir, win ? 'claude.exe' : 'claude'))
    if (fs.existsSync(path.join(dir, win ? 'claude.cmd' : 'claude'))) { fromPackage(path.join(dir, 'node_modules')); fromPackage(path.join(dir, '..', 'lib', 'node_modules')) }
  }
  fromPackage(path.join(home, '.claude', 'local', 'node_modules'))
  fromPackage(path.join(DIST, '..', 'node_modules')) // bundled with the project: last resort
  return out
}
const CLAUDE_CANDIDATES = CLI && !CURSOR ? claudeCandidates() : []
let claudeIndex = 0 // the candidate that last worked

function classify(text) {
  const t = String(text || '')
  if (/not logged in|\/login|invalid api key|authenticat|unauthori[sz]ed|oauth|session expired|could not be refreshed|credentials|401/i.test(t)) return 'auth'
  if (/usage limit|rate.?limit|limit reached|quota|credit balance/i.test(t)) return 'limit'
  if (/unknown option|unrecognized option|error: option|unknown argument|invalid option/i.test(t)) return 'args'
  if (/prompt is too long|context.*(length|window)|too many tokens/i.test(t)) return 'long'
  return 'other'
}
const CLI_MESSAGES = {
  auth: 'Claude Code sign-in is missing or expired. In a terminal run "claude", type /login and sign in again (if CLAUDE_CODE_OAUTH_TOKEN is set in .env, remove it or create a new one with "claude setup-token"), then restart the server.',
  limit: 'Your Claude plan has reached its usage limit for now. Wait for it to reset, or set ANTHROPIC_API_KEY instead.',
  long: 'The request was too long for the model. Try fewer or smaller files.',
  notfound: 'Claude Code was not found on this computer. Install it (npm install -g @anthropic-ai/claude-code), run "claude" once to sign in, then restart the server.',
}

/** Runs one CLI call. mode "modern" uses flags of current Claude Code; "legacy" works with older versions. */
function runCli(cand, mode, system, user, opts) {
  return new Promise((resolve, reject) => {
    let sysFile = ''
    if (!CURSOR && mode === 'modern') { sysFile = path.join(os.tmpdir(), `sando-system-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.txt`); fs.writeFileSync(sysFile, system, 'utf8') }
    const cleanup = () => { if (sysFile) fs.rm(sysFile, { force: true }, () => {}) }
    const legacyPrompt = `${system}\n\n(Answer in text only. Do not use any tools.)\n\n${user}`
    const args = CURSOR ? ['-p', `${system}\n\n${user}`, '--output-format', 'json']
      : mode === 'modern' ? [...cand.pre, '-p', '--output-format', 'json', '--system-prompt-file', sysFile, '--tools', '', '--strict-mcp-config']
        : [...cand.pre, '-p', '--output-format', 'json']
    if (env.AI_MODEL) args.push('--model', env.AI_MODEL)
    const child = spawn(cand.bin, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })
    let out = '', err = '', settled = false
    const fail = (kind, detail) => { if (settled) return; settled = true; cleanup(); reject(Object.assign(new Error(detail), { kind })) }
    const timer = setTimeout(() => { child.kill('SIGKILL'); fail('timeout', 'timeout') }, opts.timeout || TIMEOUT_MS)
    opts.signal?.addEventListener('abort', () => { child.kill('SIGKILL'); clearTimeout(timer); if (!settled) { settled = true; cleanup(); reject(Object.assign(new Error('cancelled'), { name: 'CancelError' })) } }, { once: true })
    child.stdin.on('error', () => { /* the CLI exited before reading its input; handled on close */ })
    child.stdout.on('data', d => { out += d }); child.stderr.on('data', d => { err += d })
    child.on('error', e => { clearTimeout(timer); fail(e.code === 'ENOENT' ? 'notfound' : 'other', e.message) })
    child.on('close', code => {
      clearTimeout(timer)
      if (settled) return
      let j = null
      try { j = JSON.parse(out.trim().split('\n').filter(Boolean).pop() || '') } catch { /* not JSON */ }
      if (j && !j.is_error && !code) { settled = true; cleanup(); return resolve(String(j.result ?? '')) }
      const reason = (j ? [j.result, ...(Array.isArray(j.errors) ? j.errors : [])].filter(x => typeof x === 'string' && x).join(' — ') : '') || err.trim() || out.trim() || `exit code ${code}`
      fail(classify(reason), reason)
    })
    child.stdin.end(CURSOR ? '' : mode === 'modern' ? user : legacyPrompt)
  })
}

/** Tries the last working install first, then the others; falls back to legacy flags for older versions. */
async function callClaudeCode(system, user, opts = {}) {
  if (CURSOR) {
    try { return await runCli({ bin: env.CURSOR_BIN || 'cursor-agent', pre: [] }, 'modern', system, user, opts) }
    catch (e) { if (e.name === 'CancelError') throw e; throw new Error(e.kind === 'notfound' ? 'Cursor CLI not found. Install it and run: cursor-agent login' : `Cursor error: ${String(e.message).slice(0, 300)}`) }
  }
  if (!CLAUDE_CANDIDATES.length) throw new Error(CLI_MESSAGES.notfound)
  const order = [claudeIndex, ...CLAUDE_CANDIDATES.keys()].filter((v, i, a) => a.indexOf(v) === i)
  const problems = []
  for (const i of order) {
    for (const mode of ['modern', 'legacy']) {
      try {
        const text = await runCli(CLAUDE_CANDIDATES[i], mode, system, user, opts)
        if (claudeIndex !== i) console.log(`[claude-code] using ${CLAUDE_CANDIDATES[i].label}`)
        claudeIndex = i
        return text
      } catch (e) {
        if (e.name === 'CancelError') throw e
        if (e.kind === 'timeout') throw Object.assign(new Error('timeout'), { name: 'AbortError' })
        problems.push({ kind: e.kind, at: CLAUDE_CANDIDATES[i].label, detail: String(e.message).slice(0, 300) })
        console.error(`[claude-code] ${CLAUDE_CANDIDATES[i].label} (${mode}): ${String(e.message).slice(0, 300)}`)
        if (e.kind === 'limit' || e.kind === 'long') throw new Error(`${CLI_MESSAGES[e.kind]} (${String(e.message).slice(0, 160)})`)
        if (e.kind !== 'args') break // legacy flags only help when the version rejected our options
      }
    }
  }
  const main = problems.find(p => p.kind === 'auth') || problems[0]
  throw new Error(`${CLI_MESSAGES[main.kind] || 'Claude Code error.'} (${main.detail})`)
}

/** opts: { signal, images: [{ mediaType, data(base64) }], maxTokens, timeout } */
export async function callModel(system, user, opts = {}) {
  if (CLI) return callClaudeCode(system, user, opts)
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), opts.timeout || TIMEOUT_MS)
  opts.signal?.addEventListener('abort', () => ctl.abort(), { once: true })
  const imgs = opts.images || []
  try {
    if (PROVIDER === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: ctl.signal,
        headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: MODEL, max_tokens: opts.maxTokens || 2500, system, messages: [{ role: 'user', content: imgs.length ? [...imgs.map(i => ({ type: 'image', source: { type: 'base64', media_type: i.mediaType, data: i.data } })), { type: 'text', text: user }] : user }] }),
      })
      if (!r.ok) throw new Error(`provider responded ${r.status}`)
      const j = await r.json()
      return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('')
    }
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', signal: ctl.signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ model: MODEL, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: imgs.length ? [...imgs.map(i => ({ type: 'image_url', image_url: { url: `data:${i.mediaType};base64,${i.data}` } })), { type: 'text', text: user }] : user }] }),
    })
    if (!r.ok) throw new Error(`provider responded ${r.status}`)
    const j = await r.json()
    return j.choices?.[0]?.message?.content || ''
  } finally { clearTimeout(timer) }
}
function parseJson(text) {
  const a = text.indexOf('{'), b = text.lastIndexOf('}')
  if (a < 0 || b <= a) throw new Error('model did not return JSON')
  return JSON.parse(text.slice(a, b + 1))
}

// ---------- validated tasks (the only things the agent is allowed to do) ----------
const str = (v, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : '')
const langName = l => (l === 'en' ? 'English' : 'Arabic')
// Per-tool whitelist of fields the agent may propose changes to. The client applies a patch only after the user confirms.
const PATCH_KEYS = {
  'quotation-builder': { descriptions: 'list', notes: 'text' },
  'campaign-studio': { concept: 'text', post: 'text', ad: 'text', cta: 'text' },
}
const TASKS = {
  content(p, lang) {
    const input = { product: str(p.product, 300), audience: str(p.audience, 300), platform: str(p.platform, 60), tone: str(p.tone, 60), goal: str(p.goal, 200) }
    if (!input.product) throw new Error('product is required')
    return {
      system: `You are SANDO, a marketing content assistant. Write in ${langName(lang)}. Reply with ONLY a JSON object: {"concept": string, "post": string, "ad": string, "cta": string, "schedule": [{"day": string, "idea": string}]} with 4 schedule entries.`,
      user: JSON.stringify(input),
      check(o) {
        const schedule = (Array.isArray(o.schedule) ? o.schedule : []).slice(0, 7).map(s => ({ day: str(s?.day, 60), idea: str(s?.idea, 300) }))
        return { concept: str(o.concept), post: str(o.post), ad: str(o.ad), cta: str(o.cta, 300), schedule }
      },
    }
  },
  quiz(p, lang) {
    const text = str(p.text, 8000), count = Math.min(10, Math.max(1, Number(p.count) || 5))
    if (text.trim().length < 40) throw new Error('educational text is too short')
    return {
      system: `You are SANDO, an assessment assistant. Write in ${langName(lang)}. Create ${count} multiple-choice questions strictly from the supplied material at "${str(p.difficulty, 20)}" difficulty. Reply with ONLY JSON: {"questions": [{"q": string, "options": [4 strings], "answer": 0-3, "explanation": string}]}.`,
      user: `Topic: ${str(p.topic, 200)}\n\nMaterial:\n${text}`,
      check(o) {
        const questions = (Array.isArray(o.questions) ? o.questions : []).slice(0, count)
          .map(q => ({ q: str(q?.q, 500), options: (Array.isArray(q?.options) ? q.options : []).slice(0, 4).map(x => str(x, 300)), answer: Number(q?.answer) | 0, explanation: str(q?.explanation, 600) }))
          .filter(q => q.q && q.options.length === 4 && q.answer >= 0 && q.answer < 4)
        if (!questions.length) throw new Error('model returned no valid questions')
        return { questions }
      },
    }
  },
  agent(p, lang) {
    const toolId = str(p.toolId, 60), keys = PATCH_KEYS[toolId]
    const message = str(p.message, 1000)
    if (!message) throw new Error('message is required')
    return {
      system: `You are SANDO, an assistant embedded inside a workspace tool ("${toolId}") for a user working in ${str(p.profession, 40) || 'business'}. Answer in ${langName(lang)}, briefly and practically. You receive the tool's current state as JSON. All totals and statistics in it were computed by the app: explain them, never recalculate or invent numbers. Reply with ONLY JSON: {"message": string${keys ? ', "patch": object (optional)' : ''}}.` +
        (keys ? ` A patch proposes edits the user must confirm. Allowed patch keys: ${Object.entries(keys).map(([k, t]) => `"${k}" (${t === 'list' ? 'array of strings, one per line item, same order' : 'string'})`).join(', ')}. Use no other keys.` : ' You cannot change this tool; only explain and advise.'),
      user: `Tool state:\n${str(typeof p.state === 'string' ? p.state : JSON.stringify(p.state ?? {}), 6000)}\n\nUser request: ${message}`,
      check(o) {
        const out = { message: str(o.message, 3000) }
        if (keys && o.patch && typeof o.patch === 'object') {
          const patch = {}
          for (const [k, t] of Object.entries(keys)) {
            if (t === 'text' && typeof o.patch[k] === 'string') patch[k] = str(o.patch[k])
            if (t === 'list' && Array.isArray(o.patch[k])) patch[k] = o.patch[k].slice(0, 40).map(x => str(x, 800))
          }
          if (Object.keys(patch).length) out.patch = patch
        }
        if (!out.message) throw new Error('empty model reply')
        return out
      },
    }
  },
}

// ---------- http ----------
const hits = new Map()
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter(t => now - t < 60000)
  list.push(now); hits.set(ip, list)
  if (hits.size > 5000) hits.clear()
  return list.length > RATE
}
const json = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)) }
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = []
    req.on('data', c => { size += c.length; if (size > MAX_BODY) { reject(new Error('payload too large')); req.destroy() } else chunks.push(c) })
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')) } catch { reject(new Error('invalid JSON')) } })
    req.on('error', reject)
  })
}
async function handleAi(req, res) {
  if (!LIVE) return json(res, 503, { error: 'AI is not configured. SANDO is running in Demo Mode.' })
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0]
  if (limited(ip)) return json(res, 429, { error: 'Too many requests. Please wait a minute.' })
  let body
  try { body = await readBody(req) } catch (e) { return json(res, 400, { error: e.message }) }
  const build = Object.hasOwn(TASKS, body.task) ? TASKS[body.task] : null
  if (!build || typeof body.payload !== 'object' || !body.payload) return json(res, 400, { error: 'unsupported task' })
  try {
    const t = build(body.payload, body.lang === 'en' ? 'en' : 'ar')
    const result = t.check(parseJson(await callModel(t.system, t.user)))
    json(res, 200, { result })
  } catch (e) {
    json(res, e.name === 'AbortError' ? 504 : 502, { error: e.name === 'AbortError' ? 'The AI provider timed out.' : String(e.message || e) })
  }
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' }
function serveStatic(req, res) {
  const url = decodeURIComponent((req.url || '/').split('?')[0])
  let file = path.normalize(path.join(DIST, url))
  if (!file.startsWith(DIST)) return json(res, 403, { error: 'forbidden' })
  // SPA fallback: any path that is not a real file gets index.html so client routes survive a refresh.
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html')
  if (!fs.existsSync(file)) { res.writeHead(500, { 'content-type': 'text/plain' }); return res.end('Build not found. Run: npm run build') }
  const ext = path.extname(file)
  res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': url.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache' })
  fs.createReadStream(file).pipe(res)
}

const handleAgent = createAgentHandler({ callModel, live: LIVE, vision: LIVE && !CLI, provider: PROVIDER })

http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0]
  if (url === '/api/status') return json(res, 200, { live: LIVE, vision: LIVE && !CLI, search: Boolean(env.BRAVE_API_KEY), provider: LIVE ? PROVIDER : null, model: LIVE ? MODEL : null })
  if (url === '/api/agent') return req.method === 'POST' ? handleAgent(req, res) : json(res, 405, { error: 'POST only' })
  if (url === '/api/ai') return req.method === 'POST' ? handleAi(req, res) : json(res, 405, { error: 'POST only' })
  if (url.startsWith('/api/')) return json(res, 404, { error: 'not found' })
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'method not allowed' })
  serveStatic(req, res)
}).listen(PORT, '0.0.0.0', () => {
  console.log(`SANDO running on http://0.0.0.0:${PORT} — ${LIVE ? `Live AI (${PROVIDER}, ${MODEL})` : 'Demo Mode (no API key)'}`)
  if (PROVIDER === 'claude-code') {
    console.log(CLAUDE_CANDIDATES.length ? `Claude Code installs found:\n  ${CLAUDE_CANDIDATES.map(c => c.label).join('\n  ')}` : CLI_MESSAGES.notfound)
    if (CLAUDE_CANDIDATES.length && env.SANDO_SKIP_CHECK !== '1') callClaudeCode('Reply with exactly: OK', 'ping', { timeout: 90000 })
      .then(() => console.log(`Claude Code connection: OK (${CLAUDE_CANDIDATES[claudeIndex].label})`))
      .catch(e => console.log(`Claude Code connection FAILED: ${e.message}`))
  }
})
