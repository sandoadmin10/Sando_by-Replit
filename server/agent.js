// SANDO Professional Marketer — server-side agent.
// A bounded plan → act → observe loop. The model decides which skills and tools to use; tools are
// structured contracts executed here (never arbitrary commands). Events stream to the browser as NDJSON.
import dns from 'node:dns/promises'
import net from 'node:net'
import { skills as marketingSkills } from '../src/agents/marketing/skills/index.js'
import { demoScript } from '../src/agents/marketing/demo/coffee.js'
import { skills as salesSkills } from '../src/agents/sales/skills/index.js'
import { salesDemoScript } from '../src/agents/sales/demo/office.js'

// One engine, several agents. Each agent has its persona, skill catalog, tool set and demo replay.
const SHARED_TOOLS = ['load_skill', 'fetch_public_page', 'search_web', 'read_attachment', 'search_in_attachments', 'analyze_table', 'view_image', 'create_deliverable', 'ask_user']
const AGENTS = {
  marketing: {
    persona: 'SANDO Professional Marketer: a senior marketing strategist, researcher and creative director',
    skills: marketingSkills, demo: demoScript, tools: [...SHARED_TOOLS, 'calculate_marketing_metrics', 'retrieve_project_memory', 'save_project_memory'],
    numbers: 'analyze_table / calculate_marketing_metrics',
  },
  sales: {
    persona: 'SANDO Professional Sales Employee: a senior B2B sales professional — prospector, account manager, negotiator and sales analyst',
    skills: salesSkills, demo: salesDemoScript, tools: [...SHARED_TOOLS, 'get_company_profile', 'build_quotation', 'crm_list', 'crm_upsert', 'draft_message', 'calculate_sales_metrics'],
    numbers: 'build_quotation (all prices and totals) / calculate_sales_metrics / analyze_table',
    extra: `- Use get_company_profile before any customer-facing output, and write in the company's tone and signature.
- Prices only from the catalog in the profile or stated by the user; discounts never above the profile's max discount. If something exceeds policy, explain that it needs manager approval.
- Anything that would reach a customer (email, WhatsApp, LinkedIn, closing letter) goes through draft_message: the user reviews, approves and sends it from their own app.
- Never guess personal contact details; only public company channels or data the user provided.
- Keep the CRM current with crm_upsert when you learn something durable (stage, value, next action, score).`,
  },
}

const MAX_STEPS = 12, MAX_ACTIONS = 4, RUN_MS = 8 * 60 * 1000, MAX_BODY = 12 * 1024 * 1024, RUNS_PER_MIN = 6
const str = (v, max = 4000) => (typeof v === 'string' ? v : v == null ? '' : String(v)).slice(0, max)
const clip = (v, max) => { const s = typeof v === 'string' ? v : JSON.stringify(v); return s.length > max ? s.slice(0, max) + ' …[truncated]' : s }
const sleep = ms => new Promise(r => setTimeout(r, ms))

// ---------------------------------------------------------------- safe public fetching (SSRF guard)
function privateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number)
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
  }
  const v = ip.toLowerCase()
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') || (v.startsWith('::ffff:') && privateIp(v.slice(7)))
}
async function assertPublic(u) {
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Only http and https links can be fetched.')
  if (u.port && !['80', '443'].includes(u.port)) throw new Error('Only standard web ports are allowed.')
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(u.hostname)) throw new Error('Local and internal addresses are blocked.')
  if (net.isIP(u.hostname)) { if (privateIp(u.hostname)) throw new Error('Private network addresses are blocked.'); return }
  let addrs = []
  try { addrs = await dns.lookup(u.hostname, { all: true }) } catch { if (!process.env.HTTPS_PROXY) throw new Error('The site address could not be resolved.') }
  if (addrs.some(a => privateIp(a.address))) throw new Error('Private network addresses are blocked.')
}
async function fetchPublic(raw, signal) {
  let u
  try { u = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw) } catch { throw new Error('That is not a valid URL.') }
  for (let hop = 0; hop < 4; hop++) {
    await assertPublic(u)
    const ctl = AbortSignal.any([signal, AbortSignal.timeout(15000)])
    const r = await fetch(u, { redirect: 'manual', signal: ctl, headers: { 'user-agent': 'Mozilla/5.0 (compatible; SANDO-Research/1.0; public page review)', accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5', 'accept-language': 'ar,en;q=0.8' } })
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { u = new URL(r.headers.get('location'), u); continue }
    const type = r.headers.get('content-type') || ''
    const reader = r.body?.getReader(); let size = 0; const parts = []
    while (reader) { const { done, value } = await reader.read(); if (done) break; size += value.length; parts.push(value); if (size > 1_500_000) { reader.cancel(); break } }
    return { status: r.status, finalUrl: u.href, type, body: Buffer.concat(parts).toString('utf8') }
  }
  throw new Error('Too many redirects.')
}
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
const decode = s => s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(parseInt(e[1] === 'x' || e[1] === 'X' ? e.slice(2) : e.slice(1), e[1] === 'x' || e[1] === 'X' ? 16 : 10) || 32) : ENT[e.toLowerCase()] ?? m)
const textOf = s => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')) || [])[2] ?? (tag.match(new RegExp(`\\b${name}\\s*=\\s*'([^']*)'`, 'i')) || [])[1] ?? (tag.match(new RegExp(`\\b${name}\\s*=\\s*([^\\s>"']+)`, 'i')) || [])[1]
function extractPage(html, base) {
  const meta = n => { const m = html.match(new RegExp(`<meta[^>]+(?:name|property)\\s*=\\s*["']${n}["'][^>]*>`, 'i')); return m ? decode(attr(m[0], 'content') || '') : '' }
  const clean = html.replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ')
  const all = (re, f, n = 40) => [...clean.matchAll(re)].slice(0, n).map(f).filter(Boolean)
  const host = new URL(base).host
  const links = all(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, m => { const href = attr(m[1], 'href'); if (!href || href.startsWith('#') || href.startsWith('javascript')) return null; let abs; try { abs = new URL(href, base) } catch { return null } return { text: textOf(m[2]).slice(0, 80), href: abs.href, internal: abs.host === host, cta: /btn|button|cta/i.test(attr(m[1], 'class') || '') } }, 150)
  const buttons = all(/<button\b[^>]*>([\s\S]*?)<\/button>/gi, m => textOf(m[1]).slice(0, 60), 30)
  const forms = all(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi, m => ({ action: attr(m[1], 'action') || '', method: (attr(m[1], 'method') || 'get').toLowerCase(), fields: [...m[2].matchAll(/<(input|select|textarea)\b([^>]*)>/gi)].map(f => ({ tag: f[1].toLowerCase(), type: attr(f[2], 'type') || '', name: attr(f[2], 'name') || '', placeholder: decode(attr(f[2], 'placeholder') || ''), required: /\brequired\b/i.test(f[2]) })).filter(f => !['hidden', 'submit'].includes(f.type)).slice(0, 15) }), 6)
  const imgs = [...clean.matchAll(/<img\b([^>]*)>/gi)]
  const text = textOf(clean.replace(/<\/(p|div|li|h\d|section|br)>/gi, '\n'))
  const TRACK = { 'Google Analytics 4': /gtag\(|googletagmanager\.com\/gtag|\bG-[A-Z0-9]{6,}/, 'Google Tag Manager': /GTM-[A-Z0-9]{4,}/, 'Meta Pixel': /fbq\(|connect\.facebook\.net/, 'Snap Pixel': /snaptr\(|sc-static\.net/, 'TikTok Pixel': /ttq\.|analytics\.tiktok\.com/, 'X Pixel': /twq\(|static\.ads-twitter\.com/, Hotjar: /hotjar/, 'Microsoft Clarity': /clarity\.ms/ }
  return {
    title: textOf((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || ''), description: meta('description'), ogTitle: meta('og:title'), ogDescription: meta('og:description'),
    lang: attr((html.match(/<html\b[^>]*>/i) || [''])[0], 'lang') || '', viewportMeta: /<meta[^>]+name\s*=\s*["']viewport["']/i.test(html),
    headings: all(/<(h[1-3])\b[^>]*>([\s\S]*?)<\/\1>/gi, m => `${m[1].toUpperCase()}: ${textOf(m[2]).slice(0, 140)}`, 30),
    ctas: [...new Set([...buttons, ...links.filter(l => l.cta).map(l => l.text)].filter(t => t && t.length < 60))].slice(0, 25),
    internalLinks: links.filter(l => l.internal && l.text).slice(0, 40).map(l => ({ text: l.text, href: l.href })),
    externalLinks: links.filter(l => !l.internal).slice(0, 15).map(l => l.href),
    contact: { phones: [...new Set(links.filter(l => l.href.startsWith('tel:')).map(l => l.href.slice(4)))], emails: [...new Set(links.filter(l => l.href.startsWith('mailto:')).map(l => l.href.slice(7)))], whatsapp: links.some(l => /wa\.me|whatsapp/i.test(l.href)) },
    pricesSeen: [...new Set((text.match(/(?:SAR|ر\.?\s?س|ريال|\$|USD)\s?[\d,.]+|[\d,.]+\s?(?:SAR|ر\.?\s?س|ريال)/gi) || []).slice(0, 12))],
    forms, images: { total: imgs.length, missingAlt: imgs.filter(m => !/\balt\s*=\s*["'][^"']+/i.test(m[1])).length },
    trackingDetectedInHtml: Object.entries(TRACK).filter(([, re]) => re.test(html)).map(([k]) => k),
    text: text.slice(0, 7000),
  }
}

// ---------------------------------------------------------------- deterministic data tools
const num = v => { if (typeof v === 'number') return Number.isFinite(v) ? v : null; const t = String(v ?? '').replace(/[,٬\s%]|SAR|ر\.?س|ريال|\$/gi, '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)); if (!t) return null; const n = Number(t); return Number.isFinite(n) ? n : null }
const r = (n, d = 2) => (n == null || !Number.isFinite(n) ? null : Math.round(n * 10 ** d) / 10 ** d)
function analyzeTable(t) {
  const cols = t.columns.map((c, i) => {
    const vals = t.rows.map(row => row[i]), filled = vals.filter(v => String(v ?? '').trim() !== '')
    const nums = filled.map(num).filter(v => v != null)
    if (filled.length && nums.length / filled.length >= 0.8) {
      const sum = nums.reduce((a, b) => a + b, 0)
      return { name: c, type: 'number', missing: vals.length - filled.length, count: nums.length, sum: r(sum), mean: r(sum / nums.length), min: Math.min(...nums), max: Math.max(...nums) }
    }
    const freq = {}; filled.forEach(v => { const k = String(v).trim().slice(0, 80); freq[k] = (freq[k] || 0) + 1 })
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])
    return { name: c, type: 'text', missing: vals.length - filled.length, distinct: top.length, top: top.slice(0, 8).map(([value, count]) => ({ value, count })) }
  })
  return { rows: t.rows.length, columns: cols, sample: t.rows.slice(0, 5) }
}
const ALIASES = {
  impressions: ['impressions', 'impr', 'views', 'reach', 'مرات الظهور', 'الظهور', 'المشاهدات'],
  clicks: ['clicks', 'link clicks', 'نقرات', 'النقرات'],
  spend: ['spend', 'cost', 'amount spent', 'budget spent', 'الإنفاق', 'التكلفة', 'المصروف'],
  conversions: ['conversions', 'purchases', 'results', 'leads', 'orders', 'التحويلات', 'المبيعات', 'الطلبات', 'عملاء محتملون'],
  revenue: ['revenue', 'sales', 'purchase value', 'conversion value', 'value', 'الإيرادات', 'العائد', 'قيمة المبيعات'],
}
const norm = s => String(s).toLowerCase().replace(/[_\-()]/g, ' ').replace(/\s+/g, ' ').trim()
function marketingMetrics(t, groupBy, mapping = {}) {
  const idx = name => t.columns.findIndex(c => norm(c) === norm(name))
  const detected = {}
  for (const [k, names] of Object.entries(ALIASES)) {
    const forced = mapping[k] && idx(mapping[k])
    const i = forced >= 0 ? forced : t.columns.findIndex(c => names.includes(norm(c))) >= 0 ? t.columns.findIndex(c => names.includes(norm(c))) : t.columns.findIndex(c => names.some(n => norm(c).includes(n)))
    if (i >= 0) detected[k] = t.columns[i]
  }
  const gi = groupBy ? idx(groupBy) : -1
  if (groupBy && gi < 0) throw new Error(`Column "${groupBy}" was not found. Columns: ${t.columns.join(', ')}`)
  const blank = () => ({ impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0, rows: 0 })
  const total = blank(), groups = new Map()
  for (const row of t.rows) {
    const g = gi >= 0 ? String(row[gi] ?? '—').trim() || '—' : null
    const acc = g == null ? null : groups.get(g) || groups.set(g, blank()).get(g)
    for (const k of Object.keys(ALIASES)) { if (!detected[k]) continue; const v = num(row[t.columns.indexOf(detected[k])]) ?? 0; total[k] += v; if (acc) acc[k] += v }
    total.rows++; if (acc) acc.rows++
  }
  const has = k => Boolean(detected[k])
  const rates = a => ({
    ...Object.fromEntries(Object.keys(ALIASES).filter(has).map(k => [k, r(a[k])])), rows: a.rows,
    ...(has('clicks') && has('impressions') && a.impressions ? { ctr_pct: r(a.clicks / a.impressions * 100) } : {}),
    ...(has('spend') && has('clicks') && a.clicks ? { cpc: r(a.spend / a.clicks) } : {}),
    ...(has('spend') && has('impressions') && a.impressions ? { cpm: r(a.spend / a.impressions * 1000) } : {}),
    ...(has('spend') && has('conversions') && a.conversions ? { cpa: r(a.spend / a.conversions) } : {}),
    ...(has('revenue') && has('spend') && a.spend ? { roas: r(a.revenue / a.spend) } : {}),
    ...(has('conversions') && has('clicks') && a.clicks ? { conversion_rate_pct: r(a.conversions / a.clicks * 100) } : {}),
  })
  const T = rates(total)
  const G = [...groups.entries()].map(([name, a]) => ({ group: name, ...rates(a) })).sort((a, b) => (b.spend ?? 0) - (a.spend ?? 0)).slice(0, 60)
  const anomalies = []
  for (const g of G) {
    if (T.cpa && g.cpa && g.cpa > T.cpa * 1.5 && (g.spend ?? 0) > (T.spend ?? 0) * 0.05) anomalies.push(`${g.group}: CPA ${g.cpa} is ${r(g.cpa / T.cpa, 1)}x the overall ${T.cpa}`)
    if (T.roas && g.roas != null && g.roas < T.roas * 0.5 && (g.spend ?? 0) > (T.spend ?? 0) * 0.05) anomalies.push(`${g.group}: ROAS ${g.roas} is under half the overall ${T.roas}`)
    if (T.ctr_pct && g.ctr_pct != null && g.ctr_pct < T.ctr_pct * 0.5) anomalies.push(`${g.group}: CTR ${g.ctr_pct}% is under half the overall ${T.ctr_pct}%`)
    if (has('spend') && has('conversions') && (g.spend ?? 0) > 0 && !g.conversions) anomalies.push(`${g.group}: spent ${g.spend} with zero conversions`)
  }
  const missing = Object.keys(ALIASES).filter(k => !has(k))
  return { detected_columns: detected, missing_fields: missing, note: missing.length ? `Metrics needing ${missing.join(', ')} could not be computed.` : undefined, totals: T, groups: G, anomalies }
}

// ---------------------------------------------------------------- deliverables
const BLOCKS = ['heading', 'paragraph', 'bullets', 'table', 'metrics', 'chart', 'callout', 'cards', 'sources', 'quote']
function sanitizeBlocks(blocks) {
  if (!Array.isArray(blocks) || !blocks.length) throw new Error('A deliverable needs a non-empty "blocks" array.')
  return blocks.slice(0, 80).map(b => {
    const t = BLOCKS.includes(b?.type) ? b.type : 'paragraph'
    switch (t) {
      case 'heading': return { type: t, text: str(b.text, 200), level: b.level === 3 ? 3 : 2 }
      case 'paragraph': return { type: t, text: str(b.text ?? b.content, 4000) }
      case 'quote': return { type: t, text: str(b.text, 800), source: str(b.source, 200) }
      case 'bullets': return { type: t, items: (Array.isArray(b.items) ? b.items : []).slice(0, 30).map(x => str(x, 600)) }
      case 'callout': return { type: t, tone: ['info', 'warning', 'success', 'danger'].includes(b.tone) ? b.tone : 'info', title: str(b.title, 160), text: str(b.text, 1500) }
      case 'table': { const columns = (Array.isArray(b.columns) ? b.columns : []).slice(0, 10).map(c => str(c, 80)); return { type: t, title: str(b.title, 160), columns, rows: (Array.isArray(b.rows) ? b.rows : []).slice(0, 80).map(row => columns.map((_, i) => str(Array.isArray(row) ? row[i] : '', 500))) } }
      case 'metrics': return { type: t, items: (Array.isArray(b.items) ? b.items : []).slice(0, 8).map(m => ({ label: str(m?.label, 60), value: str(m?.value, 40), note: str(m?.note, 120) })) }
      case 'chart': { const labels = (Array.isArray(b.labels) ? b.labels : []).slice(0, 20).map(x => str(x, 40)); return { type: t, title: str(b.title, 160), unit: str(b.unit, 20), labels, values: labels.map((_, i) => num(b.values?.[i]) ?? 0) } }
      case 'cards': return { type: t, items: (Array.isArray(b.items) ? b.items : []).slice(0, 12).map(c => ({ title: str(c?.title, 160), text: str(c?.text, 1200), tag: str(c?.tag, 40) })) }
      case 'sources': return { type: t, items: (Array.isArray(b.items) ? b.items : []).slice(0, 30).map(s => ({ title: str(s?.title, 160), url: /^https?:\/\//.test(s?.url) ? str(s.url, 500) : '' })) }
    }
  })
}

// ---------------------------------------------------------------- tool registry
// Each tool: description + args contract (shown to the model) + run(args, ctx).
const TOOLS = {
  load_skill: {
    phase: 'planning', args: '{ "id": skill id }', desc: 'Load the detailed working method and quality bar of a skill before applying it.',
    run: ({ id }, c) => { const s = c.skills.find(x => x.id === id); if (!s) throw new Error(`Unknown skill. Available: ${c.skills.map(x => x.id).join(', ')}`); c.loaded.add(id); return { skill: s.id, guidance: s.guidance, usual_tools: s.tools, usual_deliverable: s.deliverable } },
  },
  fetch_public_page: {
    phase: 'researching', args: '{ "url": string }', desc: 'Fetch a public web page and extract title, meta, headings, CTAs, links, forms (never submitted), contact info, prices seen, tracking scripts present in static HTML, and main text.',
    run: async ({ url }, c) => {
      const p = await fetchPublic(str(url, 500), c.signal)
      c.sources.set(p.finalUrl, p.finalUrl)
      if (p.status >= 400) return { url: p.finalUrl, status: p.status, note: 'The site returned an error; the page could not be reviewed.' }
      if (!/html/i.test(p.type)) return { url: p.finalUrl, status: p.status, contentType: p.type, note: 'Not an HTML page.' }
      const page = extractPage(p.body, p.finalUrl)
      if (page.text.length < 200) page.note = 'Very little text in static HTML — the site may render with JavaScript, so some content may not be visible to this tool.'
      return { url: p.finalUrl, status: p.status, ...page }
    },
  },
  search_web: {
    phase: 'researching', args: '{ "query": string, "count"?: number }', desc: 'Web search (only if configured). Returns titles, URLs and snippets.',
    run: async ({ query, count = 8 }, c) => {
      if (!process.env.BRAVE_API_KEY) throw new Error('Web search is not configured on this server. Use URLs the user provided, or ask the user for them.')
      const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(str(query, 300))}&count=${Math.min(10, Number(count) || 8)}`, { signal: AbortSignal.any([c.signal, AbortSignal.timeout(15000)]), headers: { accept: 'application/json', 'x-subscription-token': process.env.BRAVE_API_KEY } })
      if (!res.ok) throw Object.assign(new Error(`Search failed (${res.status})`), { transient: res.status >= 500 || res.status === 429 })
      const j = await res.json()
      return (j.web?.results || []).map(x => ({ title: x.title, url: x.url, snippet: textOf(x.description || '') }))
    },
  },
  read_attachment: {
    phase: 'processing', args: '{ "file": name, "offset"?: number, "length"?: number }', desc: 'Read extracted text of an attached document (or rows of a table as text) in chunks.',
    run: ({ file, offset = 0, length = 6000 }, c) => {
      const a = c.file(file)
      const full = a.kind === 'table' ? [a.columns.join(' | '), ...a.rows.map((row, i) => `#${i + 1}: ${row.join(' | ')}`)].join('\n') : a.text || ''
      const o = Math.max(0, Number(offset) || 0), n = Math.min(12000, Math.max(500, Number(length) || 6000))
      return { file: a.name, total_chars: full.length, offset: o, text: full.slice(o, o + n), more: o + n < full.length }
    },
  },
  search_in_attachments: {
    phase: 'processing', args: '{ "query": "words separated by spaces or |", "file"?: name }', desc: 'Find lines/rows in attachments that mention any of the terms. Returns counts and snippets with row references — use it as evidence.',
    run: ({ query, file }, c) => {
      const terms = str(query, 300).split(/[|،,]|\s+/).map(t => t.trim().toLowerCase()).filter(t => t.length > 1)
      if (!terms.length) throw new Error('Give at least one search term.')
      const hits = []; let count = 0
      for (const a of file ? [c.file(file)] : c.files) {
        const lines = a.kind === 'table' ? a.rows.map(row => row.join(' | ')) : (a.text || '').split(/\n+/)
        lines.forEach((ln, i) => { if (terms.some(t => ln.toLowerCase().includes(t))) { count++; if (hits.length < 25) hits.push({ file: a.name, ref: a.kind === 'table' ? `row ${i + 1}` : `line ${i + 1}`, text: ln.slice(0, 300) }) } })
      }
      return { matches: count, shown: hits.length, hits }
    },
  },
  analyze_table: {
    phase: 'analysis', args: '{ "file": name }', desc: 'Profile a CSV/Excel attachment: row count, column types, missing values, numeric stats, top values. Computed exactly.',
    run: ({ file }, c) => { const a = c.file(file); if (a.kind !== 'table') throw new Error(`"${a.name}" is not a table.`); return { file: a.name, ...analyzeTable(a) } },
  },
  calculate_marketing_metrics: {
    phase: 'analysis', args: '{ "file": name, "group_by"?: column, "columns"?: { "impressions"?, "clicks"?, "spend"?, "conversions"?, "revenue"? } }', desc: 'Exact CTR, CPC, CPM, CPA, ROAS and conversion rate — total and per group — plus flagged anomalies. The only valid source of performance numbers.',
    run: ({ file, group_by, columns }, c) => { const a = c.file(file); if (a.kind !== 'table') throw new Error(`"${a.name}" is not a table.`); return { file: a.name, ...marketingMetrics(a, group_by && str(group_by, 80), columns || {}) } },
  },
  view_image: {
    phase: 'processing', args: '{ "file": name, "question": string }', desc: 'Look at an attached image (screenshot, ad, product photo) and answer a question about it.',
    run: async ({ file, question }, c) => {
      const a = c.file(file)
      if (a.kind !== 'image') throw new Error(`"${a.name}" is not an image.`)
      if (!c.vision) throw new Error('The current AI connection cannot see images. Ask the user to describe it, or rely on other inputs.')
      return { file: a.name, answer: await c.callModel('Describe precisely what is visible. Do not guess what is not visible.', str(question, 500) || 'Describe this image for a marketing review.', { images: [{ mediaType: a.mediaType, data: a.data }], signal: c.signal, maxTokens: 1200 }) }
    },
  },
  retrieve_project_memory: {
    phase: 'memory', args: '{ "query": string }', desc: 'Search saved knowledge of the selected project (brand guidelines, insights, past experiments, results).',
    run: ({ query }, c) => {
      const terms = str(query, 300).toLowerCase().split(/\s+/).filter(t => t.length > 1)
      const scored = c.memory.map(m => ({ m, s: terms.reduce((n, t) => n + (`${m.title} ${m.content} ${m.kind}`.toLowerCase().includes(t) ? 1 : 0), 0) })).sort((a, b) => b.s - a.s)
      const top = (terms.length ? scored.filter(x => x.s > 0) : scored).slice(0, 8).map(x => ({ kind: x.m.kind, title: x.m.title, content: str(x.m.content, 1500), saved: x.m.at }))
      return { project: c.projectName || null, records: top, note: c.memory.length ? undefined : 'No saved memory for this project yet.' }
    },
  },
  save_project_memory: {
    phase: 'memory', args: '{ "kind": "brand"|"insight"|"competitor"|"experiment"|"result"|"preference"|"brief", "title": string, "content": string }', desc: 'Save a durable finding to the project memory (shown to the user, who can edit or delete it).',
    run: ({ kind, title, content }, c) => {
      if (!c.projectName) throw new Error('No project is selected, so nothing can be saved to memory.')
      const rec = { kind: str(kind, 30) || 'insight', title: str(title, 160), content: str(content, 3000) }
      if (!rec.title || !rec.content) throw new Error('Both title and content are required.')
      c.emit({ type: 'memory', record: rec }); return { saved: true }
    },
  },
  create_deliverable: {
    phase: 'producing', args: '{ "kind": "report"|"strategy"|"proposal"|"brief"|"calendar"|"matrix"|"insights"|"dashboard"|"copy"|"workbook", "title": string, "subtitle"?: string, "blocks": Block[], "replace_id"?: string }',
    desc: 'Create (or replace) a professional, editable document shown to the user with PDF/CSV export. Blocks: heading{text,level 2|3}, paragraph{text}, bullets{items[]}, table{title?,columns[],rows[][]}, metrics{items[{label,value,note?}]}, chart{title,labels[],values[],unit?}, callout{tone info|warning|success|danger,title?,text}, cards{items[{title,text,tag?}]}, quote{text,source?}, sources{items[{title,url}]}.',
    run: ({ kind, title, subtitle, blocks, replace_id }, c) => {
      const id = replace_id && c.artifacts.has(replace_id) ? replace_id : `d${c.artifacts.size + 1}`
      const doc = { id, kind: str(kind, 30) || 'report', title: str(title, 200) || 'Untitled', subtitle: str(subtitle, 300), blocks: sanitizeBlocks(blocks), lang: c.lang, demo: c.demo, at: Date.now() }
      c.artifacts.set(id, doc); c.emit({ type: 'artifact', artifact: doc })
      return { id, blocks: doc.blocks.length, note: 'Delivered to the user and final. Do not recreate it; if all requested outputs exist, reply with "final".' }
    },
  },
  // ----- sales tools
  get_company_profile: {
    phase: 'planning', args: '{}', desc: 'The user company profile: description, segments, tone, signature, currency, tax rate, max discount, payment terms, validity, product catalog with prices.',
    run: (_, c) => c.company || { note: 'No company profile yet. Ask the user to complete it in the Company Profile tab, or ask for the essentials (products and prices).' },
  },
  build_quotation: {
    phase: 'analysis', args: '{ "customer": string, "items": [{ "sku"?: string, "name": string, "qty": number, "unit_price"?: number (only if the user stated it), "description"?: string }], "discount_pct"?: number, "tax_pct"?: number }',
    desc: 'Exact quotation math. Matches items to the catalog (catalog price always wins), enforces the max-discount policy, applies tax, returns lines, subtotal, discount, tax, total, quote number, validity and payment terms.',
    run: ({ customer, items, discount_pct = 0, tax_pct }, c) => {
      const p = c.company || {}, cat = Array.isArray(p.catalog) ? p.catalog : []
      if (!Array.isArray(items) || !items.length) throw new Error('Give at least one item.')
      const norm2 = x => String(x || '').toLowerCase().replace(/\s+/g, ' ').trim()
      const lines = items.slice(0, 60).map(it => {
        const hit = cat.find(x => norm2(x.sku) && norm2(x.sku) === norm2(it.sku)) || cat.find(x => norm2(x.name) === norm2(it.name)) || cat.find(x => norm2(it.name) && (norm2(x.name).includes(norm2(it.name)) || norm2(it.name).includes(norm2(x.name))))
        const qty = num(it.qty)
        if (!qty || qty <= 0) throw new Error(`Quantity missing for "${it.name}".`)
        const price = hit ? num(hit.price) : num(it.unit_price)
        if (price == null) throw new Error(`No price for "${it.name}": it is not in the catalog. Ask the user for the price.`)
        return { sku: hit?.sku || it.sku || '', name: hit?.name || str(it.name, 200), description: str(it.description, 400), qty, unit: hit?.unit || '', unit_price: price, price_source: hit ? 'catalog' : 'user-provided', line_total: r(qty * price) }
      })
      const maxD = num(p.maxDiscount) ?? 0, d = Math.max(0, num(discount_pct) ?? 0)
      if (d > maxD) throw new Error(`A ${d}% discount exceeds the company policy maximum of ${maxD}%. Build it at ${maxD}% or less, and tell the user a higher discount needs manager approval.`)
      const subtotal = r(lines.reduce((a, l) => a + l.line_total, 0)), discount = r(subtotal * d / 100), taxPct = num(tax_pct) ?? num(p.taxRate) ?? 15
      const taxable = r(subtotal - discount), tax = r(taxable * taxPct / 100)
      return { number: `Q-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`, date: new Date().toISOString().slice(0, 10), customer: str(customer, 200), currency: p.currency || 'SAR', lines, subtotal, discount_pct: d, discount, taxable, tax_pct: taxPct, tax, total: r(taxable + tax), validity_days: num(p.validityDays) ?? 30, payment_terms: str(p.paymentTerms, 300) }
    },
  },
  crm_list: {
    phase: 'memory', args: '{ "stage"?: string, "query"?: string }', desc: 'Read CRM records (company, contact, stage, value, score, next action/date, notes, last activity). Flags overdue next dates.',
    run: ({ stage, query }, c) => {
      const today = new Date().toISOString().slice(0, 10), q = str(query, 100).toLowerCase()
      const list = c.crm.filter(x => (!stage || x.stage === stage) && (!q || JSON.stringify(x).toLowerCase().includes(q)))
      return { today, count: list.length, records: list.slice(0, 120).map(x => ({ ...x, overdue: x.next_date && x.next_date < today ? true : undefined })) }
    },
  },
  crm_upsert: {
    phase: 'memory', args: '{ "company": string, "contact"?, "email"?, "phone"?, "city"?, "industry"?, "stage"?: "new"|"qualified"|"contacted"|"proposal"|"negotiation"|"won"|"lost", "value"?: number, "score"?: number, "next_action"?, "next_date"?: "YYYY-MM-DD", "notes"?, "source"? }',
    desc: 'Create or update a CRM record by company name (stored in the user workspace). Do not set "won" unless the user said the deal is won.',
    run: (a, c) => {
      const company = str(a.company, 160).trim(); if (!company) throw new Error('company is required')
      const STAGES = ['new', 'qualified', 'contacted', 'proposal', 'negotiation', 'won', 'lost']
      const rec = { company }
      for (const k of ['contact', 'email', 'phone', 'city', 'industry', 'next_action', 'notes', 'source']) if (a[k] != null && a[k] !== '') rec[k] = str(a[k], 600)
      if (a.stage && STAGES.includes(a.stage)) rec.stage = a.stage
      if (num(a.value) != null) rec.value = num(a.value)
      if (num(a.score) != null) rec.score = Math.max(0, Math.min(100, num(a.score)))
      if (/^\d{4}-\d{2}-\d{2}$/.test(a.next_date || '')) rec.next_date = a.next_date
      const i = c.crm.findIndex(x => x.company.toLowerCase() === company.toLowerCase())
      if (i >= 0) c.crm[i] = { ...c.crm[i], ...rec }; else c.crm.push({ stage: 'new', ...rec })
      c.emit({ type: 'crm', record: rec }); return { saved: true, created: i < 0 }
    },
  },
  draft_message: {
    phase: 'producing', args: '{ "channel": "email"|"whatsapp"|"linkedin"|"call", "company"?: string, "to"?: string, "subject"?: string, "body": string }',
    desc: 'Queue a customer-facing message for the user’s approval. You cannot send anything; the user reviews, edits, approves and sends it from their own app.',
    run: (a, c) => {
      const body = str(a.body, 4000); if (!body.trim()) throw new Error('body is required')
      const draft = { id: `m${Date.now().toString(36)}${Math.floor(Math.random() * 99)}`, channel: ['email', 'whatsapp', 'linkedin', 'call'].includes(a.channel) ? a.channel : 'email', company: str(a.company, 160), to: str(a.to, 200), subject: str(a.subject, 200), body }
      c.emit({ type: 'approval', draft }); return { status: 'awaiting_user_approval', id: draft.id }
    },
  },
  calculate_sales_metrics: {
    phase: 'analysis', args: '{ "file": name, "group_by"?: column, "amount_col"?: column, "status_col"?: column, "date_col"?: column }',
    desc: 'Exact sales metrics: revenue (won deals when a status column exists), deal counts, won/lost, win rate, average deal — total, per group and per month.',
    run: ({ file, group_by, amount_col, status_col, date_col }, c) => {
      const t = c.file(file); if (t.kind !== 'table') throw new Error(`"${t.name}" is not a table.`)
      const find = (forced, names) => { const f = forced ? t.columns.findIndex(x => norm(x) === norm(forced)) : -1; return f >= 0 ? f : t.columns.findIndex(x => names.some(n => norm(x).includes(n))) }
      const ai = find(amount_col, ['amount', 'revenue', 'value', 'total', 'sales', 'المبلغ', 'القيمة', 'الإيراد', 'المبيعات']), si = find(status_col, ['status', 'stage', 'result', 'الحالة', 'النتيجة']), di = find(date_col, ['date', 'month', 'التاريخ', 'الشهر'])
      if (ai < 0) throw new Error(`No amount column found. Columns: ${t.columns.join(', ')}`)
      const gi = group_by ? t.columns.findIndex(x => norm(x) === norm(group_by)) : -1
      if (group_by && gi < 0) throw new Error(`Column "${group_by}" was not found. Columns: ${t.columns.join(', ')}`)
      const st = v => { const s2 = norm(v); return /won|win|closed won|مغلق.*رابح|ربح|تم|مكتمل/.test(s2) ? 'won' : /lost|lose|خاسر|مفقود|خسر/.test(s2) ? 'lost' : 'open' }
      const acc = () => ({ deals: 0, won: 0, lost: 0, open: 0, revenue: 0, pipeline_value: 0 })
      const T = acc(), G = new Map(), M = new Map()
      for (const row of t.rows) {
        const amt = num(row[ai]) ?? 0, s3 = si >= 0 ? st(row[si]) : 'won'
        for (const a of [T, gi >= 0 ? (G.get(row[gi]) || G.set(row[gi], acc()).get(row[gi])) : null, di >= 0 ? (M.get(String(row[di]).slice(0, 7)) || M.set(String(row[di]).slice(0, 7), acc()).get(String(row[di]).slice(0, 7))) : null]) {
          if (!a) continue
          a.deals++; a[s3]++; if (s3 === 'won') a.revenue += amt; else if (s3 === 'open') a.pipeline_value += amt
        }
      }
      const fin = a => ({ ...a, revenue: r(a.revenue), pipeline_value: r(a.pipeline_value), win_rate_pct: a.won + a.lost ? r(a.won / (a.won + a.lost) * 100, 1) : null, avg_won_deal: a.won ? r(a.revenue / a.won) : null })
      return { file: t.name, columns_used: { amount: t.columns[ai], status: si >= 0 ? t.columns[si] : '(none: all rows counted as won)', date: di >= 0 ? t.columns[di] : null }, totals: fin(T), groups: [...G.entries()].map(([k, a]) => ({ group: k, ...fin(a) })).sort((a, b) => b.revenue - a.revenue), by_month: [...M.entries()].sort().map(([k, a]) => ({ month: k, ...fin(a) })) }
    },
  },
  ask_user: {
    phase: 'input', args: '{ "question": string }', desc: 'Stop and ask the user for information that is essential and cannot be found any other way.',
    run: ({ question }, c) => { c.needsInput = str(question, 600); return { asked: true } },
  },
}
const toolLine = ([name, t]) => `- ${name} ${t.args}: ${t.desc}`

function systemPrompt(lang, c) {
  return `You are ${c.agent.persona}, working autonomously inside the SANDO workspace.
You complete the user's objective by planning, using tools, observing results and producing professional deliverables. You decide which skills to apply, in what order, and when you are done — there is no fixed workflow.

SKILLS (load_skill gives you a skill's full method before you apply it; combine several when the objective needs it):
${c.skills.map(s => `- ${s.id}: ${s.summary}`).join('\n')}

TOOLS:
${Object.entries(TOOLS).filter(([n]) => c.agent.tools.includes(n)).map(toolLine).join('\n')}

HOW TO RESPOND — every reply is ONE JSON object and nothing else:
{"plan": "one short user-facing sentence about what you are doing next", "actions": [{"tool": "<name>", "args": {...}}]}
Up to ${MAX_ACTIONS} actions per reply; they run in order and you then receive their results. When the objective is complete:
{"final": "a short message to the user summarizing what you delivered and any limitation"}

RULES
- Language: write plans, deliverables and the final message in ${lang === 'ar' ? 'Arabic (Modern Standard, natural Gulf business tone); keep brand names and metric abbreviations in Latin' : 'English'}.
- Evidence first: only state as fact what came from a tool result, an attachment or the user. Label estimates as hypotheses. Cite source URLs in a sources block.
- Numbers: never calculate or invent figures yourself; use ${c.agent.numbers} output.
- Never fabricate reviews, quotes, competitor facts, prices, case studies, logos or results.
- If a tool fails, read the error, try an alternative (another page, another file, a narrower query) or continue with what you have; mention the limitation in the deliverable.
- You cannot send emails/messages, publish, spend budget or change external accounts. Prepare drafts for the user to act on.
- Deliverables must be genuinely useful and specific: tailored structure, clear hierarchy, no filler. Prefer tables, cards and metrics where they communicate better than prose.
- Produce at least one deliverable for any substantive objective. Ask the user (ask_user) only when something essential is missing.
${c.agent.extra ? c.agent.extra + '\n' : ''}- Budget: at most ${MAX_STEPS} replies. Today is ${new Date().toISOString().slice(0, 10)}.${c.vision ? '' : '\n- The current AI connection cannot see images; view_image will fail.'}`
}

function contextBlock(c, body) {
  const files = c.files.map(a => `- "${a.name}" (${a.kind}${a.kind === 'table' ? `, ${a.rows.length} rows; columns: ${a.columns.join(', ')}` : a.kind === 'text' ? `, ${(a.text || '').length} chars; starts: ${clip((a.text || '').slice(0, 300).replace(/\s+/g, ' '), 300)}` : ''})${a.note ? ` — ${a.note}` : ''}`)
  return [
    `OBJECTIVE:\n${str(body.objective, 6000)}`,
    body.skillHints?.length ? `The user launched this from: ${body.skillHints.join(', ')}` : '',
    files.length ? `ATTACHMENTS:\n${files.join('\n')}` : 'ATTACHMENTS: none',
    c.company ? `COMPANY PROFILE: available (${(c.company.catalog || []).length} catalog items) — call get_company_profile` : '',
    c.agentId === 'sales' ? `CRM: ${c.crm.length} records (use crm_list)` : '',
    c.agentId === 'sales' ? '' : c.projectName ? `PROJECT: "${c.projectName}" — ${c.memory.length} memory records (use retrieve_project_memory)` : 'PROJECT: none selected',
    c.demo ? 'NOTE: attached files are SAMPLE DEMO DATA — say so in deliverables.' : '',
  ].filter(Boolean).join('\n\n')
}

function transcript(steps) {
  let out = steps.map((s, i) => `--- step ${i + 1}\nYOU: ${clip(s.reply, 1500)}\n${s.obs.map(o => `RESULT ${o.tool}: ${clip(o.result, 6000)}`).join('\n')}`)
  while (out.join('\n').length > 60000 && out.length > 2) out = [out[0].slice(0, 800) + ' …', ...out.slice(2)]
  return out.join('\n')
}
function parseReply(text) {
  const s = String(text || ''), a = s.indexOf('{'), b = s.lastIndexOf('}')
  if (a < 0 || b <= a) throw new Error('no JSON object')
  const j = JSON.parse(s.slice(a, b + 1))
  if (typeof j.final === 'string') return { final: j.final }
  if (!Array.isArray(j.actions) || !j.actions.length) throw new Error('missing actions or final')
  return { plan: str(j.plan, 300), actions: j.actions.slice(0, MAX_ACTIONS).map(x => ({ tool: str(x?.tool, 40), args: x?.args && typeof x.args === 'object' ? x.args : {} })) }
}
async function withRetry(fn, signal, tries = 3) {
  for (let i = 0; ; i++) {
    try { return await fn() } catch (e) {
      if (signal.aborted || e.name === 'CancelError') throw e
      const transient = e.transient || e.name === 'AbortError' || /\b(429|5\d\d|timeout|ECONN|overloaded)\b/i.test(e.message)
      if (!transient || i >= tries - 1) throw e
      await sleep(1000 * 2 ** i)
    }
  }
}
const friendly = e => (e.name === 'AbortError' ? 'The operation timed out.' : String(e.message || e).replace(/\s+at\s.+/s, '').slice(0, 300))

// ---------------------------------------------------------------- normalize request
function readContext(body) {
  const files = (Array.isArray(body.attachments) ? body.attachments : []).slice(0, 12).map(a => {
    const name = str(a?.name, 120) || 'file'
    if (a?.kind === 'table') { const columns = (a.columns || []).slice(0, 60).map(x => str(x, 80)); return { name, kind: 'table', columns, rows: (a.rows || []).slice(0, 5000).map(row => columns.map((_, i) => str(row?.[i], 300))) } }
    if (a?.kind === 'image') return /^image\/(png|jpeg|webp)$/.test(a.mediaType) ? { name, kind: 'image', mediaType: a.mediaType, data: str(a.data, 3_000_000) } : null
    return { name, kind: 'text', text: str(a?.text, 200000), note: str(a?.note, 200) }
  }).filter(Boolean)
  const project = body.project && typeof body.project === 'object' ? body.project : null
  const co = body.company && typeof body.company === 'object' ? body.company : null
  const company = co ? { ...Object.fromEntries(['name', 'description', 'segments', 'tone', 'signature', 'currency', 'paymentTerms', 'contact'].map(k => [k, str(co[k], 1500)])), taxRate: num(co.taxRate), maxDiscount: num(co.maxDiscount), validityDays: num(co.validityDays),
    catalog: (Array.isArray(co.catalog) ? co.catalog : []).slice(0, 300).map(x => ({ sku: str(x?.sku, 60), name: str(x?.name, 200), price: num(x?.price), unit: str(x?.unit, 40) })).filter(x => x.name) } : null
  const crm = (Array.isArray(body.crm) ? body.crm : []).slice(0, 500).map(x => Object.fromEntries(Object.entries(x || {}).filter(([k]) => /^(company|contact|email|phone|city|industry|stage|value|score|next_action|next_date|notes|source|updated)$/.test(k)).map(([k, v]) => [k, typeof v === 'number' ? v : str(v, 600)]))).filter(x => x.company)
  return { company, crm, files, projectName: project ? str(project.name, 120) : '', memory: project ? (project.records || []).slice(0, 200).map(m => ({ kind: str(m?.kind, 30), title: str(m?.title, 200), content: str(m?.content, 3000), at: m?.at })) : [] }
}

export function createAgentHandler({ callModel, live, vision }) {
  const hits = new Map()
  return async function handleAgent(req, res) {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0]
    const now = Date.now(), recent = (hits.get(ip) || []).filter(t => now - t < 60000)
    if (recent.length >= RUNS_PER_MIN) { res.writeHead(429, { 'content-type': 'application/json' }); return res.end('{"error":"Too many runs. Please wait a minute."}') }
    hits.set(ip, [...recent, now])

    let body
    try {
      body = await new Promise((resolve, reject) => { let n = 0; const parts = []; req.on('data', d => { n += d.length; if (n > MAX_BODY) { reject(new Error('Attachments are too large.')); req.destroy() } else parts.push(d) }); req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(parts).toString('utf8'))) } catch { reject(new Error('Invalid request.')) } }); req.on('error', reject) })
    } catch (e) { res.writeHead(400, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ error: e.message })) }
    if (!str(body.objective).trim()) { res.writeHead(400, { 'content-type': 'application/json' }); return res.end('{"error":"Describe what you want to accomplish."}') }

    res.writeHead(200, { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' })
    const ctl = new AbortController()
    res.on('close', () => { if (!res.writableFinished) ctl.abort() })
    const runTimer = setTimeout(() => ctl.abort(), RUN_MS)
    const emit = ev => { if (!res.writableEnded) res.write(JSON.stringify({ ...ev, t: Date.now() }) + '\n') }
    const lang = body.lang === 'en' ? 'en' : 'ar'
    const agentId = Object.hasOwn(AGENTS, body.agent) ? body.agent : 'marketing', agent = AGENTS[agentId]
    const c = {
      ...readContext(body), agentId, agent, skills: agent.skills, lang, vision, callModel, emit, signal: ctl.signal, demo: Boolean(body.demo),
      loaded: new Set(), sources: new Map(), artifacts: new Map(), rewrites: new Map(), needsInput: '',
      file(name) { const n = str(name, 120).toLowerCase(); const a = this.files.find(f => f.name.toLowerCase() === n) || this.files.find(f => f.name.toLowerCase().includes(n)); if (!a) throw new Error(`No attachment named "${name}". Attached: ${this.files.map(f => f.name).join(', ') || 'none'}`); return a },
    }
    const runTool = async (action, step, k) => {
      const id = `s${step}a${k}`, def = Object.hasOwn(TOOLS, action.tool) && c.agent.tools.includes(action.tool) ? TOOLS[action.tool] : null
      emit({ type: 'tool', id, tool: action.tool, phase: def?.phase, status: 'running', label: clip(action.args?.url || action.args?.file || action.args?.id || action.args?.query || action.args?.title || '', 90) })
      try {
        if (!def) throw new Error(`Unknown tool "${action.tool}". Available: ${c.agent.tools.join(', ')}`)
        const result = await withRetry(() => Promise.resolve(def.run(action.args, c)), ctl.signal)
        emit({ type: 'tool', id, status: 'done' }); return { tool: action.tool, result }
      } catch (e) {
        if (ctl.signal.aborted) throw e
        emit({ type: 'tool', id, status: 'failed', error: friendly(e) }); return { tool: action.tool, result: { error: friendly(e) } }
      }
    }
    const finish = (status, message) => { clearTimeout(runTimer); emit({ type: 'done', status, message, artifacts: c.artifacts.size }); res.end() }

    try {
      // ---------- Demo mode: no model is configured. Replays a fixed plan, but every tool really runs on the sample files.
      if (!live) {
        if (!c.demo) return finish('unavailable', lang === 'ar' ? 'الذكاء الاصطناعي المباشر غير مفعّل على هذا الخادم. يمكنك تشغيل السيناريو التجريبي لرؤية سير العمل كاملاً.' : 'Live AI is not configured on this server. You can run the demo scenario to see the full workflow.')
        let step = 0
        for (const s of agent.demo) {
          if (ctl.signal.aborted) break
          emit({ type: 'plan', text: s.plan[lang] }); step++
          const results = []
          for (const [k, a] of s.actions(lang, c).entries()) results.push(await runTool(a, step, k))
          s.after?.(results, c)
          await sleep(350)
        }
        emit({ type: 'phase', phase: 'validating' })
        return finish('completed', agentId === 'sales' ? (lang === 'ar' ? 'اكتمل السيناريو التجريبي: استيراد العملاء وتقييمهم، عرض سعر من الكتالوج، وبريد ينتظر موافقتك. كل البيانات هنا تجريبية.' : 'Demo scenario complete: leads imported and scored, a catalog-based quotation, and an email awaiting your approval. All data here is sample data.') : (lang === 'ar' ? 'اكتمل سيناريو العرض: رؤى العملاء، مقارنة المنافسين، الأداء السابق، اتجاهات الحملة، والعرض النهائي. كل البيانات هنا تجريبية.' : 'Demo scenario complete: customer insights, competitor comparison, past performance, campaign directions and the final proposal. All data here is sample data.'))
      }

      // ---------- Live agent loop
      const system = systemPrompt(lang, c), ctx = contextBlock(c, body), steps = []
      emit({ type: 'phase', phase: 'understanding' })
      for (let step = 1; step <= MAX_STEPS; step++) {
        if (ctl.signal.aborted) break
        const made = [...c.artifacts.values()].map(a => `- ${a.id}: "${a.title}" (${a.kind}, ${a.blocks.length} blocks)`).join('\n')
        const prompt = `${ctx}\n\n${steps.length ? `WORK SO FAR:\n${transcript(steps)}\n\n` : ''}${made ? `DELIVERABLES ALREADY CREATED:\n${made}\nDo not recreate these. Revise one (replace_id) only to fix a specific, named problem. If the objective is met, reply with "final" now.\n\n` : ''}${step === MAX_STEPS ? 'This is your LAST reply: produce or finalize the deliverable if missing, then the next reply is not possible — respond with actions that create it, or "final".' : 'Your next JSON reply:'}`
        emit({ type: 'thinking', step })
        let reply, parsed
        for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
          reply = await withRetry(() => callModel(system, attempt ? `${prompt}\n\nYour previous reply was not a valid JSON object in the required format. Reply again with ONLY the JSON object.` : prompt, { signal: ctl.signal, maxTokens: 12000, timeout: 240000 }), ctl.signal)
          try { parsed = parseReply(reply) } catch { /* retry once */ }
        }
        if (!parsed) { steps.push({ reply: 'invalid', obs: [] }); continue }
        if (parsed.final) {
          emit({ type: 'phase', phase: 'validating' })
          const issues = [...c.artifacts.values()].flatMap(d => d.blocks.filter(b => b.type === 'table' && !b.rows.length).map(() => `${d.title}: empty table`))
          return finish(c.artifacts.size ? 'completed' : 'partial', parsed.final + (issues.length ? `\n(${issues.join('; ')})` : ''))
        }
        emit({ type: 'plan', text: parsed.plan })
        const obs = []
        for (const [k, a] of parsed.actions.entries()) { obs.push(await runTool(a, step, k)); if (c.needsInput) break }
        // Guard against polishing loops: the same deliverable rewritten again and again.
        for (const a of parsed.actions) if (a.tool === 'create_deliverable') { const key = String(a.args?.title || ''); c.rewrites.set(key, (c.rewrites.get(key) || 0) + 1) }
        if ([...c.rewrites.values()].some(n => n >= 3)) { emit({ type: 'phase', phase: 'validating' }); return finish('completed', lang === 'ar' ? 'اكتملت المخرجات المطلوبة وهي معروضة أدناه.' : 'The requested deliverables are complete and shown below.') }
        steps.push({ reply: JSON.stringify({ plan: parsed.plan, actions: parsed.actions.map(a => ({ tool: a.tool, args: a.tool === 'create_deliverable' ? { title: a.args.title, kind: a.args.kind } : a.args })) }), obs })
        if (c.needsInput) return finish('needs_input', c.needsInput)
      }
      if (ctl.signal.aborted) return finish('cancelled', '')
      return finish(c.artifacts.size ? 'partial' : 'failed', lang === 'ar' ? 'توقّف الوكيل عند حد الخطوات. المخرجات التي أنجزها محفوظة أدناه، ويمكنك طلب إكمال الباقي.' : 'The agent stopped at its step limit. The deliverables it finished are below; you can ask it to complete the rest.')
    } catch (e) {
      if (ctl.signal.aborted) return finish('cancelled', '')
      return finish(c.artifacts.size ? 'partial' : 'failed', lang === 'ar' ? `تعذّر إكمال المهمة: ${friendly(e)}` : `The task could not be completed: ${friendly(e)}`)
    }
  }
}
export const __test = { extractPage, marketingMetrics, analyzeTable, privateIp, parseReply }
