// /demo — a presenter-friendly guided tour. Every step runs the real components, not recordings.
import { Suspense, useEffect, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, RotateCcw, Sparkles, Lightbulb } from 'lucide-react'
import { useDict, useI18n } from '../lib/i18n'
import { professions, profList, type ProfId } from '../lib/professions'
import { getTool, buildProfile } from '../tools/registry'
import { write, read, K, DEMO_SESSION } from '../lib/store'
import { Button, LangSwitch, ThemeToggle, ModeBadge, cn } from '../components/ui'
import { Logo, Wordmark } from '../components/Brand'
import { MockWorkspace } from '../components/MockWorkspace'
import { AgentProvider, AgentPanel, useAgent } from '../components/Agent'

const D = {
  ar: {
    steps: ['ادخل إلى ساندو', 'أجب عن سؤال', 'المساحة تتكيّف', 'افتح أداة حقيقية', 'أنجز مهمة عملية', 'شاهد النتيجة', 'جرّب مساعدة الذكاء', 'غيّر الإجابة', 'مساحة متخصصة أخرى'],
    introT: 'جولة ساندو في تسع خطوات', introS: 'سترى مساحة العمل تتكيّف مع المهنة، وتستخدم أداة حقيقية، وتجرّب المساعد المدمج — بلا تسجيل.', begin: 'ابدأ الجولة',
    pick: 'كيف يبدو يوم عملك؟', pickS: 'ساندو يبني مساحتك من إجاباتك. اختر الأقرب لك.', adapt: 'ساندو يعيد بناء المساحة حول اختيارك', adaptS: 'الأدوات المتخصصة تتقدّم، والتحية والمهام تتغيّر.',
    pick2: 'الآن جرّب إجابة مختلفة', pick2S: 'إجابة مختلفة، مساحة مختلفة تماماً.', last: 'مساحة {p} جاهزة', lastS: 'هذه نهاية الجولة. ادخل إلى المساحة الكاملة وجرّب كل شيء بنفسك.', enter: 'ادخل إلى المساحة الكاملة',
    next: 'التالي', back: 'السابق', restart: 'إعادة الجولة', askAi: 'افتح المساعد', home: 'الرئيسية',
    guide: {
      'quotation-builder': ['هذا منشئ عروض الأسعار الحقيقي، معبّأ بمثال جاهز.', 'غيّر كمية أو سعراً أو نسبة الخصم، وراقب الإجمالي يتحدّث فوراً.', 'المعاينة على اليسار/اليمين هي المستند النهائي. اضغط «تصدير PDF» أو «حفظ».', 'اضغط «حسّن الأوصاف مع ساندو» ثم «تطبيق» لترى الأوصاف تتغيّر داخل العرض.'],
      'campaign-studio': ['هذا استوديو الحملات الحقيقي، وموجز الحملة معبّأ بمثال جاهز.', 'اضغط «أنشئ المحتوى» لتوليد فكرة ومنشور وإعلان وجدول نشر.', 'كل حقل قابل للتحرير. جرّب «نسخ الكل» أو «تصدير» أو «حفظ».', 'افتح المساعد واطلب «اختصر المنشور» ثم «تطبيق».'],
      'spreadsheet-analyzer': ['هذا محلّل الجداول الحقيقي، وقد حمّلنا ملف مصروفات جاهزاً.', 'بدّل عمود القيمة في الرسم البياني، أو ارفع ملف CSV من جهازك.', 'المجاميع والمتوسطات محسوبة في متصفحك. اضغط «تصدير الملخص».', 'اضغط «اشرح النتائج مع ساندو» ليقرأ المساعد الأرقام المحسوبة.'],
      'quiz-generator': ['هذا مولّد الاختبارات الحقيقي، مع اختبار جاهز عن التصيّد الإلكتروني.', 'اضغط «ابدأ الاختبار» وأجب عن الأسئلة ثم «سلّم الإجابات».', 'تظهر نتيجتك مع الإجابة الصحيحة وشرح كل سؤال.', 'اضغط «اشرح نتيجتي مع ساندو» ليخبرك بما تراجعه.'],
    } as Record<string, string[]>,
  },
  en: {
    steps: ['Enter SANDO', 'Answer a question', 'The workspace adapts', 'Open a real tool', 'Complete a practical task', 'View the result', 'Try AI assistance', 'Change the answer', 'Another specialized workspace'],
    introT: 'The SANDO tour in nine steps', introS: 'Watch the workspace adapt to a profession, use a real tool, and try the embedded assistant — no sign-up.', begin: 'Begin the tour',
    pick: 'What does your work day look like?', pickS: 'SANDO builds your workspace from your answers. Pick the closest.', adapt: 'SANDO rebuilds the workspace around your choice', adaptS: 'Specialist tools move forward; the greeting and tasks change.',
    pick2: 'Now try a different answer', pick2S: 'A different answer, a completely different workspace.', last: 'The {p} workspace is ready', lastS: 'That is the end of the tour. Enter the full workspace and try everything yourself.', enter: 'Enter the full workspace',
    next: 'Next', back: 'Back', restart: 'Restart tour', askAi: 'Open assistant', home: 'Home',
    guide: {
      'quotation-builder': ['This is the real Quotation Builder, prefilled with an example.', 'Change a quantity, a price or the discount and watch the total update instantly.', 'The preview is the final document. Press “Export PDF” or “Save”.', 'Press “Improve descriptions with SANDO”, then “Apply”, and watch the descriptions change in the quote.'],
      'campaign-studio': ['This is the real Campaign Studio, with the brief prefilled with an example.', 'Press “Generate content” to produce a concept, post, ad copy and schedule.', 'Every field is editable. Try “Copy all”, “Export” or “Save”.', 'Open the assistant, ask it to “Shorten the post”, then “Apply”.'],
      'spreadsheet-analyzer': ['This is the real Spreadsheet Analyzer, with an expenses file loaded.', 'Switch the chart’s value column, or upload a CSV from your device.', 'Sums and averages are calculated in your browser. Press “Export summary”.', 'Press “Explain results with SANDO” so the assistant reads the calculated numbers.'],
      'quiz-generator': ['This is the real Quiz Generator, with a ready quiz on phishing awareness.', 'Press “Start quiz”, answer the questions, then “Submit answers”.', 'Your score appears with the correct answer and an explanation for each question.', 'Press “Explain my score with SANDO” to learn what to review.'],
    } as Record<string, string[]>,
  },
}
type Dict = typeof D.ar

export default function Showcase() {
  useEffect(() => { if (!read(K.session, null)) write(K.session, DEMO_SESSION) }, [])
  return <AgentProvider><Tour /></AgentProvider>
}

function ProfGrid({ onPick, exclude }: { onPick: (id: ProfId) => void; exclude?: ProfId | null }) {
  const { tr } = useI18n()
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-3 sm:grid-cols-2">
      {profList.filter(p => p.id !== exclude).map((p, i) => (
        <motion.button key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} onClick={() => onPick(p.id)}
          style={{ '--accent': p.accent } as CSSProperties} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 text-start transition-colors hover:border-[var(--accent)]">
          <span className="accent-bg accent-text flex size-12 shrink-0 items-center justify-center rounded-xl"><p.icon size={22} /></span>
          <span><span className="block font-display text-base leading-snug font-semibold">{tr(p.day)}</span><span className="mt-0.5 block text-xs leading-relaxed text-muted">{tr(p.blurb)}</span></span>
        </motion.button>
      ))}
    </div>
  )
}
function Heading({ t, s }: { t: string; s: string }) {
  return <div className="mx-auto mb-8 max-w-2xl text-center"><h1 className="font-display text-2xl leading-snug font-bold sm:text-4xl">{t}</h1><p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{s}</p></div>
}

function Tour() {
  const d: Dict = useDict(D), { tr } = useI18n(), nav = useNavigate(), agent = useAgent()
  const [step, setStep] = useState(0)
  const [a, setA] = useState<ProfId | null>(null), [b, setB] = useState<ProfId | null>(null)
  const [stage, setStage] = useState(0)
  const pa = a ? professions[a] : null, pb = b ? professions[b] : null
  const tool = pa ? getTool(pa.heroTool) : undefined
  const Comp = tool?.component

  // Step 2: play the adaptation, one stage at a time.
  useEffect(() => {
    if (step !== 2) return
    setStage(0)
    const timers = [1, 2, 3, 4].map(n => setTimeout(() => setStage(n), n * 850))
    return () => timers.forEach(clearTimeout)
  }, [step, a])
  useEffect(() => { if (step === 6) agent.setOpen(true); else if (step < 3 || step > 6) agent.setOpen(false) }, [step]) // eslint-disable-line
  useEffect(() => { window.scrollTo({ top: 0 }) }, [step])

  const restart = () => { setA(null); setB(null); setStep(0); agent.setOpen(false) }
  const enter = (id: ProfId) => { write(K.profile, buildProfile({ profession: id, role: tr(professions[id].roles[0]) })); nav('/app') }
  const canNext = step === 0 || step === 2 || (step >= 3 && step <= 6)
  const inTool = step >= 3 && step <= 6

  return (
    <div className="relative min-h-screen bg-bg pb-32 text-fg" style={{ '--accent': (step >= 7 ? pb : pa)?.accent ?? '#8b5cf6' } as CSSProperties}>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur-xl sm:px-8">
        <Link to="/" aria-label={d.home}><Wordmark size={28} /></Link>
        <div className="ms-auto flex items-center gap-2"><ModeBadge /><LangSwitch /><ThemeToggle /></div>
      </header>

      <main className={cn('mx-auto w-full px-4 py-8 sm:px-8 sm:py-12', inTool ? 'max-w-7xl' : 'max-w-5xl')}>
        {inTool && tool && Comp ? (
          <div>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="accent-border accent-bg mb-6 flex flex-wrap items-center gap-3 rounded-2xl border p-4">
                <Lightbulb size={18} className="accent-text shrink-0" />
                <p className="min-w-0 flex-1 text-sm leading-relaxed">{d.guide[tool.id]?.[step - 3]}</p>
                {step === 6 && <Button size="sm" variant="soft" onClick={() => agent.setOpen(true)}><Sparkles size={14} className="brand-text" />{d.askAi}</Button>}
              </motion.div>
            </AnimatePresence>
            <div className="mb-5 flex items-center gap-3"><span className="accent-bg accent-text flex size-11 items-center justify-center rounded-xl"><tool.icon size={20} /></span><div><h1 className="font-display text-xl font-bold">{tr(tool.label)}</h1><p className="text-xs text-muted">{tr(tool.description)}</p></div></div>
            <Suspense fallback={<div className="h-64 rounded-2xl border border-line bg-surface" />}><Comp key={a} autoSample /></Suspense>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
              {step === 0 && (
                <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                  <motion.div initial={{ scale: 0.7, rotate: -12, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}><Logo size={120} /></motion.div>
                  <h1 className="mt-8 font-display text-3xl leading-snug font-bold sm:text-5xl">{d.introT}</h1>
                  <p className="mt-4 max-w-lg leading-relaxed text-muted">{d.introS}</p>
                  <Button size="lg" className="mt-8" onClick={() => setStep(1)}>{d.begin}<ArrowLeft size={18} className="ltr:rotate-180" /></Button>
                </div>
              )}
              {step === 1 && (<><Heading t={d.pick} s={d.pickS} /><ProfGrid onPick={id => { setA(id); setStep(2) }} /></>)}
              {step === 2 && a && (<><Heading t={d.adapt} s={d.adaptS} /><MockWorkspace prof={a} stage={stage} className="mx-auto max-w-3xl" /></>)}
              {step === 7 && (<><Heading t={d.pick2} s={d.pick2S} /><ProfGrid exclude={a} onPick={id => { setB(id); setStep(8) }} /></>)}
              {step === 8 && pb && (<>
                <Heading t={d.last.replace('{p}', tr(pb.label))} s={d.lastS} />
                <MockWorkspace prof={pb.id} stage={4} className="mx-auto max-w-3xl" />
                <div className="mt-8 flex flex-wrap justify-center gap-3"><Button size="lg" onClick={() => enter(pb.id)}>{d.enter}<ArrowLeft size={18} className="ltr:rotate-180" /></Button><Button size="lg" variant="outline" onClick={restart}><RotateCcw size={16} />{d.restart}</Button></div>
              </>)}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-[60] h-16 border-t border-line bg-surface/95 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4 sm:px-8">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex gap-1">{d.steps.map((_, i) => <span key={i} className={cn('h-1 flex-1 rounded-full transition-colors duration-300', i <= step ? 'accent-solid' : 'bg-fg/10')} />)}</div>
            <div className="flex items-center gap-2 text-xs sm:text-sm"><span className="shrink-0 text-muted" dir="ltr">{step + 1}/9</span><span className="truncate font-medium">{d.steps[step]}</span></div>
          </div>
          <button onClick={restart} title={d.restart} aria-label={d.restart} className="rounded-xl p-2.5 text-muted hover:bg-fg/5 hover:text-fg"><RotateCcw size={16} /></button>
          <Button size="sm" variant="ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}>{d.back}</Button>
          <Button size="sm" disabled={!canNext} onClick={() => setStep(s => s + 1)}>{d.next}<ArrowLeft size={14} className="ltr:rotate-180" /></Button>
        </div>
      </div>
      <AgentPanel bottom={64} />
    </div>
  )
}
