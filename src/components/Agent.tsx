// The embedded agent. Tools publish their state through useAgentBridge(); the agent reads it, replies,
// and may propose a patch — which is applied to the tool only after the user presses "Apply".
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Sparkles, X, Send, Check, ArrowUpRight } from 'lucide-react'
import { useI18n, useDict } from '../lib/i18n'
import { aiRequest, getStatus } from '../lib/ai'
import { read, K, type Profile } from '../lib/store'
import { getTool } from '../tools/registry'
import { agentDemo, agentSuggestions, intentFromText, type AgentReply } from '../tools/demo'
import { Button, ModeBadge, cn, inputCls } from './ui'

type Bridge = { toolId: string; state: unknown; apply?: (patch: Record<string, any>) => void }
type Msg = { id: number; role: 'user' | 'agent'; text: string; patch?: Record<string, unknown>; next?: string; done?: 'applied' | 'dismissed'; demo?: boolean; toolId?: string }
type Ctx = {
  open: boolean; setOpen: (v: boolean) => void; msgs: Msg[]; busy: boolean; bridge: Bridge | null
  setBridge: (b: Bridge | null) => void; ask: (intent: string, label: string) => void; send: (text: string) => void; resolve: (id: number, apply: boolean) => void
}
const AgentCtx = createContext<Ctx>(null as never)
export const useAgent = () => useContext(AgentCtx)

/** Called by a tool to expose its current inputs and an (optional) way to apply confirmed edits. */
export function useAgentBridge(toolId: string, state: unknown, apply?: (patch: Record<string, any>) => void) {
  const { setBridge } = useAgent()
  const applyRef = useRef(apply); applyRef.current = apply
  useEffect(() => { setBridge({ toolId, state, apply: applyRef.current ? p => applyRef.current?.(p) : undefined }) }, [toolId, state, setBridge])
  useEffect(() => () => setBridge(null), [setBridge])
}

const D = {
  ar: { title: 'مساعد ساندو', ctx: 'الأداة النشطة', none: 'مساحة العمل', placeholder: 'اكتب طلبك…', apply: 'تطبيق', dismiss: 'تجاهل', applied: 'تم التطبيق', dismissed: 'تم التجاهل', proposal: 'تعديل مقترح — يُطبَّق بعد موافقتك', open: 'افتح الأداة', demoTag: 'رد تجريبي مُعدّ مسبقاً', empty: 'أقرأ الأداة المفتوحة وأقترح عليك. اختر اقتراحاً أو اكتب طلبك.', failed: 'تعذّر الوصول إلى الذكاء الاصطناعي، وهذا رد من وضع العرض:', thinking: 'يعمل ساندو…' },
  en: { title: 'SANDO Assistant', ctx: 'Active tool', none: 'Workspace', placeholder: 'Type a request…', apply: 'Apply', dismiss: 'Dismiss', applied: 'Applied', dismissed: 'Dismissed', proposal: 'Proposed edit — applied only after you confirm', open: 'Open tool', demoTag: 'Prepared demo reply', empty: 'I read the open tool and make suggestions. Pick one or type a request.', failed: 'The AI could not be reached; this is a Demo Mode reply:', thinking: 'SANDO is working…' },
}

export function AgentProvider({ children }: { children: ReactNode }) {
  const { lang } = useI18n()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [busy, setBusy] = useState(false)
  const [bridge, setBridge] = useState<Bridge | null>(null)
  const ref = useRef({ bridge, lang }); ref.current = { bridge, lang }
  const seq = useRef(0)

  const run = useCallback(async (intent: string, text: string) => {
    const { bridge: b, lang: lg } = ref.current
    const profile = read<Profile | null>(K.profile, null)
    const toolId = b?.toolId ?? 'workspace'
    const first = profile && getTool(profile.tools[0])
    const state: any = b?.state ?? { firstTool: first?.id, firstToolName: first?.label[lg] }
    setOpen(true)
    setMsgs(m => [...m, { id: ++seq.current, role: 'user', text }])
    const demo = (): AgentReply => (agentDemo.tools[toolId] ?? agentDemo)(intent === 'free' ? intentFromText(text) : intent, state, lg)
    let reply: AgentReply, isDemo = true, note = ''
    if ((await getStatus()).live) {
      setBusy(true)
      try { reply = await aiRequest<AgentReply>('agent', lg, { toolId, state: JSON.stringify(state), message: text, profession: profile?.profession }); isDemo = false }
      catch { reply = demo(); note = '' }
      setBusy(false)
    } else reply = demo()
    setMsgs(m => [...m, { id: ++seq.current, role: 'agent', text: note + reply.message, patch: b?.apply ? reply.patch : undefined, next: reply.next, demo: isDemo, toolId }])
  }, [])

  const resolve = useCallback((id: number, apply: boolean) => {
    setMsgs(m => m.map(x => {
      if (x.id !== id || x.done || !x.patch) return x
      const b = ref.current.bridge
      if (apply && b?.toolId === x.toolId) b?.apply?.(x.patch as Record<string, any>)
      return { ...x, done: apply ? 'applied' : 'dismissed' }
    }))
  }, [])

  const v = useMemo<Ctx>(() => ({ open, setOpen, msgs, busy, bridge, setBridge, resolve, ask: (i, label) => run(i, label), send: t => run('free', t) }), [open, msgs, busy, bridge, resolve, run])
  return <AgentCtx.Provider value={v}>{children}</AgentCtx.Provider>
}

export function AgentPanel({ bottom = 0 }: { bottom?: number }) {
  const { open, setOpen, msgs, busy, bridge, ask, send, resolve } = useAgent()
  const { tr, lang } = useI18n(), d = useDict(D), nav = useNavigate()
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs.length, busy, open])
  const tool = getTool(bridge?.toolId)
  const chips = agentSuggestions[bridge?.toolId ?? 'workspace'] ?? agentSuggestions.workspace
  const submit = () => { const t = text.trim(); if (t && !busy) { send(t); setText('') } }
  const preview = (p: Record<string, unknown>) => Object.values(p).flatMap(v => (Array.isArray(v) ? v : [v])).map(String)

  return (
    <AnimatePresence>
      {open && (
        <motion.aside initial={{ opacity: 0, x: lang === 'ar' ? -40 : 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: lang === 'ar' ? -40 : 40 }} transition={{ type: 'spring', stiffness: 300, damping: 32 }} style={{ bottom }}
          className="fixed inset-y-0 end-0 z-50 flex w-full flex-col border-s border-line bg-surface text-fg shadow-2xl sm:w-[400px] print:hidden">
          <header className="flex items-center gap-3 border-b border-line p-4">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-white"><Sparkles size={17} /></span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-semibold">{d.title}</div>
              <div className="truncate text-xs text-muted">{d.ctx}: {tool ? tr(tool.label) : d.none}</div>
            </div>
            <ModeBadge />
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-1.5 text-muted hover:bg-fg/5 hover:text-fg"><X size={18} /></button>
          </header>
          <div className="thin-scroll flex-1 space-y-3 overflow-y-auto p-4">
            {!msgs.length && <p className="rounded-xl bg-fg/5 p-4 text-sm leading-relaxed text-muted">{d.empty}</p>}
            {msgs.map(m => (
              <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed', m.role === 'user' ? 'bg-violet-500 text-white' : 'border border-line bg-raised/70')}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.patch && (
                    <div className="mt-3 rounded-xl border border-line bg-bg/50 p-3">
                      <div className="mb-2 text-[11px] font-medium text-muted">{d.proposal}</div>
                      <ul className="space-y-1.5 text-[13px]">{preview(m.patch).map((t, i) => <li key={i} className="border-s-2 border-violet-400/60 ps-2 whitespace-pre-wrap">{t}</li>)}</ul>
                      {m.done ? <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">{m.done === 'applied' && <Check size={14} className="ok-text" />}{m.done === 'applied' ? d.applied : d.dismissed}</div> : (
                        <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => resolve(m.id, true)}><Check size={14} />{d.apply}</Button><Button size="sm" variant="ghost" onClick={() => resolve(m.id, false)}>{d.dismiss}</Button></div>
                      )}
                    </div>
                  )}
                  {m.next && getTool(m.next) && <Button size="sm" variant="soft" className="mt-3" onClick={() => { nav('/app/tool/' + m.next); if (window.innerWidth < 640) setOpen(false) }}>{d.open}: {tr(getTool(m.next)!.label)}<ArrowUpRight size={14} className="rtl:-scale-x-100" /></Button>}
                </div>
              </div>
            ))}
            {busy && <div className="text-xs text-muted">{d.thinking}</div>}
            <div ref={end} />
          </div>
          <div className="border-t border-line p-3">
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {chips.map(c => <button key={c.id} disabled={busy} onClick={() => ask(c.id, tr(c.label))} className="rounded-full border border-line px-3 py-1.5 text-xs text-fg/90 transition hover:border-violet-400 hover:bg-violet-500/10 disabled:opacity-50">{tr(c.label)}</button>)}
            </div>
            <form onSubmit={e => { e.preventDefault(); submit() }} className="flex gap-2">
              <input value={text} onChange={e => setText(e.target.value)} placeholder={d.placeholder} maxLength={800} className={inputCls} />
              <Button type="submit" disabled={busy || !text.trim()} aria-label="Send" className="w-11 px-0"><Send size={16} className="rtl:-scale-x-100" /></Button>
            </form>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
