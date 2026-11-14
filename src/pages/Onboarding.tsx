// SANDO never asks "pick your field". It asks about your work, scores the answers with clear rules,
// and derives the workspace (dashboard + ordered tools) from them — for an individual or a company.
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Check, Sparkles, User, Users, Building2, GraduationCap, FileText, Megaphone, Table2, BookOpen } from 'lucide-react'
import { useDict, useI18n, l, type L } from '../lib/i18n'
import { professions, profList, goals, type ProfId } from '../lib/professions'
import { buildProfile, getTool } from '../tools/registry'
import { write, read, K, DEMO_SESSION } from '../lib/store'
import { Button, LangSwitch, ThemeToggle, inputCls, cn } from '../components/ui'
import { Wordmark } from '../components/Brand'

type Score = Partial<Record<ProfId, number>>
const WHO: { id: string; org: string; label: L; hint: L; icon: typeof User; score: Score }[] = [
  { id: 'solo', org: 'freelance', icon: User, label: l('لنفسي — أعمل بشكل مستقل', 'For myself — I work independently'), hint: l('فرد', 'Individual'), score: {} },
  { id: 'team', org: 'sme', icon: Users, label: l('لفريق صغير أو مشروع ناشئ', 'For a small team or startup'), hint: l('فريق', 'Team'), score: {} },
  { id: 'company', org: 'enterprise', icon: Building2, label: l('لشركة أو جهة بعدة أقسام', 'For a company with several departments'), hint: l('شركة', 'Company'), score: { admin: 1 } },
  { id: 'institute', org: 'institute', icon: GraduationCap, label: l('لجهة تعليمية أو مركز تدريب', 'For a school or training center'), hint: l('جهة تعليمية', 'Institute'), score: { education: 3 } },
]
const OUTPUT: { id: string; label: L; icon: typeof User; score: Score }[] = [
  { id: 'o1', icon: FileText, label: l('عروض أسعار وعقود', 'Quotations and contracts'), score: { sales: 3 } },
  { id: 'o2', icon: Megaphone, label: l('محتوى وحملات', 'Content and campaigns'), score: { marketing: 3 } },
  { id: 'o3', icon: Table2, label: l('تقارير وجداول ومحاضر', 'Reports, sheets and minutes'), score: { admin: 3 } },
  { id: 'o4', icon: BookOpen, label: l('مواد تعليمية واختبارات', 'Learning material and quizzes'), score: { education: 3 } },
]
// The two most specific tasks of each field, mixed so the question is about work, not about a field.
const TASKS = [0, 1].flatMap(i => profList.map(p => ({ ...p.tasks[i], prof: p.id })))

const D = {
  ar: { q: ['لمن تبني مساحة العمل؟', 'كيف يبدو يوم عملك غالباً؟', 'ما المهام التي تكررها أكثر؟', 'ما أكثر شيء تُنتجه في عملك؟', 'بماذا تريد أن يساعدك ساندو؟'], hint: ['سواء كنت فرداً أو شركة، نرتّب المساحة على هذا الأساس.', 'اختر الوصف الأقرب ليومك.', 'اختر كل ما ينطبق.', 'نوع المخرجات يحدد أدواتك الأولى.', 'اختر هدفاً، وأضف تفاصيل إن أحببت.'], next: 'التالي', back: 'رجوع', finish: 'ابنِ مساحتي', more: 'تفاصيل إضافية (اختياري)', ready: 'مساحتك جاهزة', found: 'من إجاباتك، بنى ساندو لك مساحة', readySub: 'هذه أدواتك مرتّبة حسب الأولوية، مع سبب كل اختيار:', enter: 'ادخل إلى مساحة العمل', step: 'السؤال', of: 'من', special: 'أدواتك المتخصصة', shared: 'أدوات مشتركة' },
  en: { q: ['Who is this workspace for?', 'What does your work day usually look like?', 'Which tasks do you repeat most?', 'What do you produce most at work?', 'What should SANDO help you with?'], hint: ['Individual or company — we arrange the workspace accordingly.', 'Pick the description closest to your day.', 'Pick all that apply.', 'The kind of output sets your first tools.', 'Choose a goal, and add details if you like.'], next: 'Next', back: 'Back', finish: 'Build my workspace', more: 'More detail (optional)', ready: 'Your workspace is ready', found: 'From your answers, SANDO built you a workspace for', readySub: 'Here are your tools in priority order, with the reason for each:', enter: 'Enter the workspace', step: 'Question', of: 'of', special: 'Your specialist tools', shared: 'Shared tools' },
}
function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick} aria-pressed={on} className={cn('flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-start text-sm transition-colors', on ? 'border-violet-400 bg-violet-500/10' : 'border-line bg-surface/60 hover:border-fg/25')}>
      {children}{on && <Check size={16} className="brand-text ms-auto shrink-0" />}
    </motion.button>
  )
}
const Ico = ({ icon: I }: { icon: typeof User }) => <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-fg/[0.07]"><I size={17} /></span>

export default function Onboarding() {
  const d = useDict(D), { tr, lang } = useI18n(), nav = useNavigate()
  const [step, setStep] = useState(0)
  const [who, setWho] = useState(''), [day, setDay] = useState<ProfId | ''>(''), [tasks, setTasks] = useState<string[]>([]), [output, setOutput] = useState(''), [goal, setGoal] = useState(''), [goalText, setGoalText] = useState('')
  useEffect(() => { if (!read(K.session, null)) write(K.session, DEMO_SESSION) }, [])

  // Deterministic scoring: every answer adds points to the workspace it points at.
  const profile = useMemo(() => {
    const s: Record<ProfId, number> = { marketing: 0, sales: 0, admin: 0, education: 0 }
    const add = (x?: Score, k = 1) => x && (Object.keys(x) as ProfId[]).forEach(p => { s[p] += (x[p] ?? 0) * k })
    const w = WHO.find(x => x.id === who)
    add(w?.score); if (day) s[day] += 5
    TASKS.filter(t => tasks.includes(t.id)).forEach(t => { s[t.prof] += 2 })
    add(OUTPUT.find(x => x.id === output)?.score)
    const best = (Object.keys(s) as ProfId[]).sort((a, b) => s[b] - s[a] || (a === day ? -1 : b === day ? 1 : 0))[0]
    return buildProfile({ profession: best, role: w ? tr(w.hint) : '', org: w?.org, tasks, goal, goalText })
  }, [who, day, tasks, output, goal, goalText, lang]) // eslint-disable-line
  const p = professions[profile.profession]
  const can = [!!who, !!day, tasks.length > 0, !!output, !!goal][step] ?? true
  const done = step === 5
  const list = profile.tools.map(id => getTool(id)!).filter(Boolean)
  const groups = [[d.special, list.filter(t => t.profession !== 'shared')], [d.shared, list.filter(t => t.profession === 'shared')]] as const

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-bg text-fg" style={{ '--accent': done ? p.accent : '#8b5cf6' } as CSSProperties}>
      <div className="aurora-b pointer-events-none absolute -end-1/4 -top-1/3 size-[90vh] rounded-full blur-3xl" />
      <div className="aurora-a pointer-events-none absolute -start-1/4 -bottom-1/2 size-[80vh] rounded-full blur-3xl" />
      <header className="relative flex items-center justify-between p-5 sm:px-8"><Link to="/"><Wordmark size={28} /></Link><div className="flex gap-2"><LangSwitch /><ThemeToggle /></div></header>
      <div className="relative mx-auto flex w-full max-w-2xl gap-1.5 px-5">{[0, 1, 2, 3, 4].map(i => <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-fg/10"><motion.div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400" initial={false} animate={{ width: i < step || done ? '100%' : i === step ? '50%' : '0%' }} transition={{ duration: 0.4 }} /></div>)}</div>
      <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: lang === 'ar' ? -30 : 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: lang === 'ar' ? 30 : -30 }} transition={{ duration: 0.3 }} className="flex-1">
            {!done ? (<>
              <div className="text-xs text-muted">{d.step} <span dir="ltr">{step + 1}</span> {d.of} 5</div>
              <h1 className="mt-2 font-display text-3xl leading-snug font-bold sm:text-4xl">{d.q[step]}</h1>
              <p className="mt-2 text-sm text-muted">{d.hint[step]}</p>
              <div className="mt-8 grid gap-2.5">
                {step === 0 && WHO.map(x => <Choice key={x.id} on={who === x.id} onClick={() => setWho(x.id)}><Ico icon={x.icon} />{tr(x.label)}</Choice>)}
                {step === 1 && profList.map(x => <Choice key={x.id} on={day === x.id} onClick={() => setDay(x.id)}><Ico icon={x.icon} />{tr(x.day)}</Choice>)}
                {step === 2 && <div className="grid gap-2.5 sm:grid-cols-2">{TASKS.map(t => <Choice key={t.id} on={tasks.includes(t.id)} onClick={() => setTasks(c => (c.includes(t.id) ? c.filter(x => x !== t.id) : [...c, t.id]))}>{tr(t.label)}</Choice>)}</div>}
                {step === 3 && <div className="grid gap-2.5 sm:grid-cols-2">{OUTPUT.map(x => <Choice key={x.id} on={output === x.id} onClick={() => setOutput(x.id)}><Ico icon={x.icon} />{tr(x.label)}</Choice>)}</div>}
                {step === 4 && (<><div className="grid gap-2.5 sm:grid-cols-2">{goals.map(g => <Choice key={g.id} on={goal === g.id} onClick={() => setGoal(g.id)}>{tr(g.label)}</Choice>)}</div>
                  <textarea rows={2} className={inputCls + ' mt-2'} placeholder={d.more} value={goalText} onChange={e => setGoalText(e.target.value)} /></>)}
              </div>
            </>) : (<>
              <div className="accent-text flex items-center gap-2 text-sm font-medium"><Sparkles size={16} />{d.ready}</div>
              <h1 className="mt-2 font-display text-3xl leading-snug font-bold sm:text-4xl">{d.found} <span className="accent-text">{tr(p.label)}</span></h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">{d.readySub}</p>
              {groups.map(([title, items]) => (
                <div key={title} className="mt-6">
                  <div className="mb-2 text-xs font-medium text-muted">{title}</div>
                  <ul className="space-y-2">{items.map(t => { const n = list.indexOf(t); return (
                    <motion.li key={t.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + n * 0.07 }} className={cn('flex items-center gap-3 rounded-2xl border bg-surface/70 p-3.5', n === 0 ? 'accent-border' : 'border-line')}>
                      <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold', n === 0 ? 'accent-solid text-[#070815]' : 'bg-fg/10')} dir="ltr">{n + 1}</span>
                      <t.icon size={17} className="shrink-0 text-muted" />
                      <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{tr(t.label)}</span><span className="block truncate text-xs text-muted">{tr(profile.reasons[t.id])}</span></span>
                    </motion.li>) })}</ul>
                </div>
              ))}
            </>)}
          </motion.div>
        </AnimatePresence>
        <div className="sticky bottom-0 mt-8 flex items-center justify-between gap-3 bg-gradient-to-t from-bg via-bg to-transparent pt-6 pb-4">
          <Button variant="ghost" onClick={() => setStep(s => s - 1)} className={step === 0 ? 'invisible' : ''}>{d.back}</Button>
          {done ? <Button size="lg" data-testid="enter" onClick={() => { write(K.profile, profile); nav('/app') }}>{d.enter}<ArrowLeft size={18} className="ltr:rotate-180" /></Button>
            : <Button size="lg" data-testid="next" disabled={!can} onClick={() => setStep(s => s + 1)}>{step === 4 ? d.finish : d.next}<ArrowLeft size={18} className="ltr:rotate-180" /></Button>}
        </div>
      </main>
    </div>
  )
}
