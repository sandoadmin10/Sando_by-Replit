// Client side of the AI adapter. Keys live only on the server (/api/ai). If the server reports no
// provider, or is unreachable, callers fall back to clearly-labelled Demo Mode executors.
import type { Lang } from './i18n'
export type AiStatus = { live: boolean; provider?: string; model?: string }
let status: Promise<AiStatus> | null = null
export function getStatus(): Promise<AiStatus> {
  status ??= fetch('/api/status').then(r => (r.ok ? r.json() : { live: false })).then(j => ({ ...j, live: j?.live === true })).catch(() => ({ live: false }))
  return status
}
export async function aiRequest<T>(task: 'content' | 'quiz' | 'agent', lang: Lang, payload: unknown): Promise<T> {
  const r = await fetch('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ task, lang, payload }) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || `AI request failed (${r.status})`)
  return j.result as T
}
