// Streams an agent run from /api/agent (NDJSON). Cancelling aborts the request; the server stops the loop.
export type AgentEvent =
  | { type: 'phase'; phase: string } | { type: 'thinking'; step: number } | { type: 'plan'; text: string }
  | { type: 'tool'; id: string; tool?: string; phase?: string; status: 'running' | 'done' | 'failed'; label?: string; error?: string }
  | { type: 'artifact'; artifact: import('./ui/DocView').Doc } | { type: 'memory'; record: { kind: string; title: string; content: string } }
  | { type: 'done'; status: 'completed' | 'partial' | 'failed' | 'cancelled' | 'needs_input' | 'unavailable'; message: string }

export async function runAgent(body: unknown, onEvent: (e: AgentEvent) => void, signal: AbortSignal) {
  const r = await fetch('/api/agent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal })
  if (!r.ok || !r.body) { const j = await r.json().catch(() => ({})); throw new Error(j.error || `HTTP ${r.status}`) }
  const reader = r.body.pipeThrough(new TextDecoderStream()).getReader()
  let buf = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += value
    let i
    while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (line) try { onEvent(JSON.parse(line)) } catch { /* skip partial */ } }
  }
}
