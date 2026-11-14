// A live miniature of the SANDO workspace, used by the landing page and the showcase.
// stage: 0 generic → 1 asks profession → 2 profession picked → 3 layout reorganizes → 4 fully personalized.
import { useEffect, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Home, Sparkles, Settings, Check } from 'lucide-react'
import { useDict, useI18n } from '../lib/i18n'
import { professions, type ProfId } from '../lib/professions'
import { toolsFor } from '../tools/registry'
import { Logo } from './Brand'
import { cn } from './ui'

const D = {
  ar: { generic: 'مساحة عمل عامة', hello: 'مرحباً', ask: 'ساندو يتعرّف على عملك', q: ['تستخدم ساندو لـ', 'كيف يبدو يومك؟', 'أكثر مهمة تكررها'], who: 'شركة', today: 'مهام اليوم', ai: 'ساندو جاهز للمساعدة داخل كل أداة', name: 'سارة', yours: 'مساحتك' },
  en: { generic: 'Generic workspace', hello: 'Hello', ask: 'SANDO is learning about your work', q: ['You use SANDO for', 'What is your day like?', 'Your most repeated task'], who: 'A company', today: 'Today', ai: 'SANDO is ready to help inside every tool', name: 'Sara', yours: 'Your workspace' },
}
function Typed({ text }: { text: string }) {
  const [n, setN] = useState(0)
  useEffect(() => { if (n >= text.length) return; const t = setTimeout(() => setN(n + 1), 38); return () => clearTimeout(t) }, [n, text])
  return <><span className="min-w-0 flex-1 truncate text-[11px]">{text.slice(0, n)}{n < text.length && <span className="ms-0.5 inline-block h-3 w-px animate-pulse bg-fg/60 align-middle" />}</span>{n >= text.length && <Check size={13} className="ok-text shrink-0" />}</>
}
const spring = { type: 'spring', stiffness: 170, damping: 24 } as const

export function MockWorkspace({ prof, stage, className }: { prof: ProfId | null; stage: number; className?: string }) {
  const d = useDict(D), { tr } = useI18n()
  const p = prof ? professions[prof] : null
  const tools = p ? toolsFor(p.id) : []
  const organized = stage >= 3 && !!p, full = stage >= 4 && !!p
  const accent = stage >= 2 && p ? p.accent : '#6b7096'
  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-line bg-surface text-fg mock-shadow', className)} style={{ '--accent': accent } as CSSProperties}>
      <div className="flex h-9 items-center gap-1.5 border-b border-line px-3.5">
        {[0, 1, 2].map(i => <span key={i} className="size-2 rounded-full bg-fg/15" />)}
        <span className="mx-auto rounded-md bg-fg/5 px-3 py-0.5 text-[10px] text-muted transition-colors">{full ? `${d.yours} · ${tr(p!.label)}` : d.generic}</span>
      </div>
      <div className="flex min-h-[15rem] sm:min-h-[17.5rem]">
        <div className="flex w-11 shrink-0 flex-col items-center gap-3 border-e border-line py-3 sm:w-12">
          <Logo size={22} />
          <span className="accent-bg accent-text flex size-7 items-center justify-center rounded-lg transition-colors duration-500"><Home size={13} /></span>
          {(organized ? tools.slice(0, 4) : [null, null, null, null]).map((t, i) => (
            <span key={i} className="flex size-7 items-center justify-center rounded-lg text-muted">{t ? <t.icon size={13} /> : <span className="size-3 rounded bg-fg/10" />}</span>
          ))}
          <Settings size={13} className="mt-auto text-muted/60" />
        </div>
        <div className="min-w-0 flex-1 p-3.5 sm:p-5">
          <div className="mb-3.5 h-10">
            <AnimatePresence mode="wait">
              <motion.div key={full ? p!.id : 'g'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                {full ? (<>
                  <div className="truncate font-display text-[13px] font-semibold sm:text-sm">{tr(p!.greeting).replace('{name}', d.name)}</div>
                </>) : (<>
                  <div className="font-display text-[13px] font-semibold sm:text-sm">{d.hello}</div>
                  <div className="mt-2 h-2 w-32 rounded bg-fg/10" />
                </>)}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className={cn('grid gap-2', organized ? 'grid-cols-4' : 'grid-cols-3')}>
            {[0, 1, 2, 3, 4, 5].map(i => {
              const t = tools[i], main = organized && i < 2
              return (
                <motion.div layout transition={spring} key={i} className={cn('overflow-hidden rounded-xl border p-2.5 transition-colors duration-500', main ? 'accent-border accent-bg col-span-2 h-[5.5rem]' : 'h-16 border-line bg-fg/[0.03]', organized && !main && 'col-span-1')}>
                  <AnimatePresence mode="wait">
                    {full && t ? (
                      <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
                        <span className={cn('flex size-6 items-center justify-center rounded-md', main ? 'accent-solid text-[#070815]' : 'bg-fg/10 text-fg/80')}><t.icon size={12} /></span>
                        <div className={cn('mt-1.5 truncate font-medium', main ? 'text-[11px]' : 'text-[9px] sm:text-[10px]')}>{tr(t.label)}</div>
                      </motion.div>
                    ) : (
                      <motion.div key="s" exit={{ opacity: 0 }}>
                        <div className="size-6 rounded-md bg-fg/10" /><div className="mt-2 h-1.5 w-3/4 rounded bg-fg/10" /><div className="mt-1.5 h-1.5 w-1/2 rounded bg-fg/5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
          <div className="mt-3 h-10">
            {full && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="flex h-10 items-center gap-2 rounded-xl border border-line bg-fg/[0.03] px-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400"><Sparkles size={10} className="text-white" /></span>
                <Typed key={p!.id} text={tr(p!.today[0])} />
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {(stage === 1 || stage === 2) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 top-9 flex items-center justify-center bg-bg/70 p-4 backdrop-blur-[3px]">
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={spring} className="w-full max-w-xs rounded-2xl border border-line bg-raised p-4 shadow-2xl">
              <div className="mb-3 flex items-center gap-2 font-display text-sm font-semibold"><Sparkles size={14} className="brand-text" />{d.ask}</div>
              <div className="space-y-2">
                {d.q.map((q, i) => {
                  const a = p ? [d.who, tr(p.day), tr(p.tasks[0].label)][i] : ''
                  return (
                    <div key={i} className="text-[10px]">
                      <div className="mb-1 text-muted">{q}</div>
                      <motion.div animate={{ scale: stage === 2 ? 1 : 0.98 }} transition={{ delay: i * 0.12 }} className={cn('flex h-7 items-center gap-1.5 rounded-lg border px-2 transition-colors duration-300', stage === 2 && p ? 'accent-border accent-bg' : 'border-line')}>
                        {stage === 2 && p ? <><Check size={11} className="accent-text shrink-0" /><span className="truncate">{a}</span></> : <span className="h-1.5 w-1/2 rounded bg-fg/10" />}
                      </motion.div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
