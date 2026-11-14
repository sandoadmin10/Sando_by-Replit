import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react'
import { ArrowLeft, Sparkles, Check, Minus, Plus, ArrowUpRight } from 'lucide-react'
import { useDict, useI18n, fmtMoney } from '../lib/i18n'
import { professions, profList, type ProfId } from '../lib/professions'
import { allTools, toolsFor, getTool, type ToolDef } from '../tools/registry'
import { Button, LangSwitch, ThemeToggle, cn } from '../components/ui'
import { Logo, Wordmark } from '../components/Brand'
import { MockWorkspace } from '../components/MockWorkspace'
import { Pricing } from '../components/Pricing'
import { Problem, Compare } from '../components/BusinessCase'

const D = {
  ar: {
    nav: { problem: 'المشكلة', model: 'نموذج العمل', how: 'كيف يتكيّف', profs: 'المساحات', ai: 'الذكاء في العمل', tools: 'الأدوات', pricing: 'الباقات', login: 'دخول', start: 'ابدأ التجربة' },
    eyebrow: 'لفرق التسويق والمبيعات في المنشآت السعودية', h1a: 'مساحة عمل', h1b: 'تفهمك.',
    sub: 'حسّن تجربة استخدامك للذكاء الاصطناعي، مع أدوات ساندو المخصصة للأعمال.', cta: 'ابدأ التجربة', cta2: 'اكتشف ساندو',
    chipA: 'عرض سعر جاهز', chipB: 'يفهم طبيعة عملك', scroll: 'مرّر لترى التحوّل',
    tTitle: 'من مساحة عامة إلى مساحتك أنت', tSteps: [
      ['مساحة عمل عامة', 'كل شيء متاح، ولا شيء مصمَّم لك.'], ['ساندو يسألك عن عملك', 'أسئلة قصيرة: فرد أم شركة، وكيف يبدو يومك.'], ['تجيب بطريقتك', 'كل إجابة تحدد أداة وأولوية.'],
      ['الواجهة تعيد ترتيب نفسها', 'أدواتك الأهم تتقدّم، والباقي يأخذ مكانه.'], ['لوحة عمل تشبهك', 'تحية، مهام، وأدوات جاهزة من أول لحظة.']],
    pEyebrow: 'إجابات مختلفة، مساحات مختلفة', pTitle: 'هكذا تتبدّل المساحة حين تتغيّر الإجابات', pIf: 'لو كانت إجابتك:', pTools: 'يختار لك ساندو', pTasks: 'أمثلة لمهام اليوم',
    aEyebrow: 'الذكاء داخل العمل، لا في نافذة محادثة', aTitle: 'جرّب بنفسك: عرض سعر يتحسّن أمامك', aSub: 'هذه نسخة حية مصغّرة من منشئ عروض الأسعار. غيّر الكمية، واطلب من ساندو تحسين الوصف.',
    aSteps: ['أنشئ البند', 'ساندو يحسّن الوصف', 'النتيجة جاهزة للتصدير'], aItem: 'تصميم هوية بصرية', aPlain: 'شعار وألوان', aImprove: 'حسّن الوصف مع ساندو', aImproved: 'تم تحسين الوصف', aQty: 'الكمية', aSubtotal: 'المجموع', aVat: 'ضريبة 15%', aTotal: 'الإجمالي', aOpen: 'افتح الأداة الكاملة', aNote: 'الحسابات تجري بجافاسكربت حتمي. نص التحسين هنا نموذج من وضع العرض.',
    eEyebrow: 'منظومة من 12 أداة', eTitle: 'أربع أدوات مشتركة، وأدوات متخصصة لكل مجال', eSub: 'أدوات مشتركة للجميع، وأدوات متخصصة يختارها ساندو لك بحسب إجاباتك.', wEyebrow: 'لمن صُمّم ساندو', wTitle: 'لمن يصنع الحملات والعروض كل أسبوع', solo: ['المسوّق المستقل والوكالات الصغيرة', 'عملاء كثيرون ووقت قليل: كل عميل له ذاكرته، وكل مخرج جاهز للإرسال.'], team: ['فرق المنشآت الصغيرة والمتوسطة', 'التسويق والمبيعات أولاً: مساحة لكل فريق، ومخرجات بهوية المنشأة.'], eShared: 'الأساس المشترك', ready: 'متاحة الآن', soon: 'قريباً',
    fTitle: 'ابدأ بطريقة أذكى.', fSub: 'خمسة أسئلة قصيرة، ومساحتك جاهزة.', fCta: 'ابدأ التجربة', fCta2: 'شاهد الجولة', foot: '© SANDO — ساندو',
  },
  en: {
    nav: { problem: 'Problem', model: 'Business model', how: 'How it adapts', profs: 'Workspaces', ai: 'AI at work', tools: 'Tools', pricing: 'Pricing', login: 'Sign in', start: 'Start Exploring' },
    eyebrow: 'For marketing and sales teams at Saudi businesses', h1a: 'A workspace that', h1b: 'understands you.',
    sub: 'A better way to use AI at work, with SANDO tools built for business.', cta: 'Start Exploring', cta2: 'Discover SANDO',
    chipA: 'Quotation ready', chipB: 'Understands your work', scroll: 'Scroll to watch it transform',
    tTitle: 'From a generic space to your own', tSteps: [
      ['A generic workspace', 'Everything is available; nothing is made for you.'], ['SANDO asks about your work', 'A few short questions: solo or company, and what your day is like.'], ['You answer your way', 'Every answer sets a tool and a priority.'],
      ['The interface reorganizes', 'Your most important tools move forward; the rest fall into place.'], ['A dashboard that fits', 'A greeting, tasks and ready tools from the first moment.']],
    pEyebrow: 'Different answers, different workspaces', pTitle: 'See how the workspace changes with the answers', pIf: 'If your answer is:', pTools: 'SANDO picks for you', pTasks: 'Example tasks for today',
    aEyebrow: 'AI inside the work, not in a chat window', aTitle: 'Try it: a quotation that improves as you watch', aSub: 'This is a live miniature of the Quotation Builder. Change the quantity, then ask SANDO to improve the description.',
    aSteps: ['Create the line item', 'SANDO improves the description', 'The result is ready to export'], aItem: 'Brand identity design', aPlain: 'Logo and colors', aImprove: 'Improve description with SANDO', aImproved: 'Description improved', aQty: 'Qty', aSubtotal: 'Subtotal', aVat: 'VAT 15%', aTotal: 'Total', aOpen: 'Open the full tool', aNote: 'Calculations run in deterministic JavaScript. The improved text here is a Demo Mode sample.',
    eEyebrow: 'A 12-tool ecosystem', eTitle: 'Four shared tools, plus specialists for every field', eSub: 'Shared tools for everyone, plus specialists SANDO picks for you from your answers.', wEyebrow: 'Who SANDO is for', wTitle: 'For people who ship campaigns and proposals every week', solo: ['Freelance marketers and small agencies', 'Many clients, little time: every client has its own memory, every output is ready to send.'], team: ['SME teams', 'Marketing and sales first: a space per team, outputs in the company’s brand.'], eShared: 'Shared foundation', ready: 'Available now', soon: 'Soon',
    fTitle: 'Work smarter. Start with SANDO.', fSub: 'Five short questions and your workspace is ready.', fCta: 'Start Exploring', fCta2: 'Watch the tour', foot: '© SANDO',
  },
}
type Dict = typeof D.ar
const ease = [0.22, 1, 0.36, 1] as const

function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="aurora-a absolute -start-[18%] -top-[28%] h-[75vh] w-[75vh] rounded-full blur-3xl" />
      <div className="aurora-b absolute -end-[14%] top-[30%] h-[70vh] w-[70vh] rounded-full blur-3xl" />
      <div className="aurora-c absolute start-[35%] -bottom-[35%] h-[60vh] w-[60vh] rounded-full blur-3xl" />
      <div className="grid-bg absolute inset-0" />
    </div>
  )
}
function Eyebrow({ children }: { children: string }) {
  return <div className="mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-wide brand-text"><span className="h-px w-8 bg-violet-400/60" />{children}</div>
}
function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease, delay }}>{children}</motion.div>
}

export default function Landing() {
  const d = useDict(D), nav = useNavigate()
  const start = () => nav('/onboarding')
  return (
    <div className="relative overflow-x-clip bg-bg text-fg">
      <Nav d={d} start={start} />
      <Hero d={d} start={start} />
      <Problem />
      <Transformation d={d} />
      <Who d={d} />
      <Professions d={d} />
      <AiInAction d={d} />
      <Compare />
      <Ecosystem d={d} />
      <Pricing />
      <section className="relative overflow-hidden px-5 py-32 text-center sm:py-44">
        <img src="/img/cta.webp" alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/75 to-bg" />
        <Aurora />
        <Reveal className="relative mx-auto max-w-3xl">
          <Logo size={72} className="mx-auto mb-8" />
          <h2 className="font-display text-4xl leading-tight font-bold sm:text-6xl">{d.fTitle}</h2>
          <p className="mx-auto mt-5 max-w-md text-muted">{d.fSub}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3"><Button size="lg" onClick={start}>{d.fCta}<ArrowLeft size={18} className="ltr:rotate-180" /></Button><Button size="lg" variant="outline" onClick={() => nav('/demo')}>{d.fCta2}</Button></div>
        </Reveal>
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-6 text-xs text-muted sm:px-10"><Wordmark size={22} both /><span>{d.foot}</span></footer>
    </div>
  )
}

function Nav({ d, start }: { d: Dict; start: () => void }) {
  const [solid, setSolid] = useState(false)
  useEffect(() => { const f = () => setSolid(window.scrollY > 30); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f) }, [])
  return (
    <header className={cn('fixed inset-x-0 top-0 z-40 transition-colors duration-300', solid && 'border-b border-line bg-bg/80 backdrop-blur-xl')}>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 sm:px-8">
        <Link to="/" aria-label="SANDO"><Wordmark size={30} /></Link>
        <nav className="mx-auto hidden gap-7 text-[13px] text-muted lg:flex">
          {([['problem', '#problem'], ['how', '#how'], ['ai', '#ai'], ['pricing', '#pricing']] as const).map(([k, h]) => <a key={k} href={h} className="transition hover:text-fg">{d.nav[k]}</a>)}
        </nav>
        <div className="ms-auto flex items-center gap-2 lg:ms-0">
          <LangSwitch />
          <ThemeToggle />
          <Link to="/login" className="hidden h-9 items-center px-3 text-[13px] text-muted hover:text-fg sm:inline-flex">{d.nav.login}</Link>
          <Button size="sm" onClick={start} className="hidden sm:inline-flex">{d.nav.start}</Button>
        </div>
      </div>
    </header>
  )
}

// ---------- Scene 1: Hero ----------
function Hero({ d, start }: { d: Dict; start: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const mx = useMotionValue(0), my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 50, damping: 16 }), sy = useSpring(my, { stiffness: 50, damping: 16 })
  const rotY = useTransform(sx, [-1, 1], [-9, 9]), rotX = useTransform(sy, [-1, 1], [6, -6])
  const nearX = useTransform(sx, v => v * 26), nearY = useTransform(sy, v => v * 20)
  const farX = useTransform(sx, v => v * -14), farY = useTransform(sy, v => v * -10)
  const textY = useTransform(scrollYProgress, [0, 1], [0, -140]), fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const mockY = useTransform(scrollYProgress, [0, 1], [0, 90]), mockScale = useTransform(scrollYProgress, [0, 1], [1, 1.1])
  const [i, setI] = useState(0)
  useEffect(() => { const t = setInterval(() => setI(v => (v + 1) % 4), 5200); return () => clearInterval(t) }, [])
  const move = (e: MouseEvent) => { mx.set((e.clientX / window.innerWidth) * 2 - 1); my.set((e.clientY / window.innerHeight) * 2 - 1) }
  const words = [...d.h1a.split(' ').map(w => [w, false] as const), ...d.h1b.split(' ').map(w => [w, true] as const)]
  return (
    <section ref={ref} onMouseMove={move} className="relative flex min-h-screen items-center px-5 pt-24 pb-16 sm:px-8">
      <motion.div style={{ x: farX, y: farY }} className="absolute inset-0"><Aurora /></motion.div>
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1fr_1.08fr] lg:gap-10">
        <motion.div style={{ y: textY, opacity: fade }}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }} className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-fg/5 px-3.5 py-1.5 text-xs text-fg/80"><Sparkles size={13} className="ok-text" />{d.eyebrow}</motion.div>
          <h1 className="font-display text-[2.9rem] leading-[1.2] font-bold tracking-tight sm:text-7xl lg:text-[5.2rem] lg:leading-[1.15]">
            {words.map(([w, g], k) => (
              <span key={k} className="me-[0.25em] inline-block overflow-hidden pb-[0.18em] align-bottom">
                <motion.span initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.9, ease, delay: 0.15 + k * 0.09 }} className={cn('inline-block', g && 'grad-text')}>{w}</motion.span>
              </span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.6 }} className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">{d.sub}</motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.75 }} className="mt-9 flex flex-wrap gap-3">
            <Button size="lg" onClick={start}>{d.cta}<ArrowLeft size={18} className="ltr:rotate-180" /></Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>{d.cta2}</Button>
          </motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 60, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1.2, ease, delay: 0.35 }} style={{ perspective: 1400 }} className="relative">
          <motion.div style={{ rotateX: rotX, rotateY: rotY, y: mockY, scale: mockScale, transformStyle: 'preserve-3d' }} className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-violet-500/25 via-indigo-500/10 to-cyan-400/20 blur-3xl" />
            <MockWorkspace prof={profList[i].id} stage={4} className="relative" />
            <motion.div style={{ x: nearX, y: nearY }} className="absolute -end-2 -top-4 hidden items-center gap-2 rounded-full border border-line bg-raised/95 px-3.5 py-2 text-xs shadow-2xl sm:flex lg:-end-6"><span className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400"><Sparkles size={11} className="text-white" /></span>{d.chipB}</motion.div>
          </motion.div>
        </motion.div>
      </div>
      <motion.div style={{ opacity: fade }} className="absolute inset-x-0 bottom-6 hidden justify-center text-[11px] text-muted lg:flex"><span className="flex items-center gap-2"><span className="h-6 w-px animate-pulse bg-fg/40" />{d.scroll}</span></motion.div>
    </section>
  )
}

// ---------- Scene 2: pinned, scroll-driven transformation ----------
function Transformation({ d }: { d: Dict }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [stage, setStage] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', v => setStage(Math.min(4, Math.max(0, Math.floor(v * 5.2)))))
  const rotY = useTransform(scrollYProgress, [0, 0.5, 1], [-14, 0, 8]), rotX = useTransform(scrollYProgress, [0, 1], [8, 0])
  const scale = useTransform(scrollYProgress, [0, 0.85, 1], [0.86, 1, 1.03])
  const glow = useTransform(scrollYProgress, [0, 1], [0.15, 1])
  const numY = useTransform(scrollYProgress, [0, 1], ['8%', '-8%'])
  return (
    <section id="how" ref={ref} className="relative h-[460vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden px-5 sm:px-8">
        <motion.div aria-hidden style={{ y: numY }} className="pointer-events-none absolute end-4 top-16 font-display text-[38vh] leading-none font-bold text-fg/[0.035] select-none" dir="ltr">0{stage + 1}</motion.div>
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div>
            <Eyebrow>{d.nav.how}</Eyebrow>
            <h2 className="font-display text-2xl leading-snug font-bold sm:text-4xl">{d.tTitle}</h2>
            <div className="relative mt-8 hidden lg:block">
              <div className="absolute start-[7px] top-2 bottom-2 w-px bg-line" />
              <motion.div style={{ scaleY: scrollYProgress }} className="absolute start-[7px] top-2 bottom-2 w-px origin-top bg-gradient-to-b from-violet-400 to-cyan-300" />
              {d.tSteps.map(([t, s], i) => (
                <div key={i} className={cn('relative ps-9 pb-6 transition-opacity duration-500', i === stage ? 'opacity-100' : 'opacity-35')}>
                  <span className={cn('absolute start-0 top-1.5 size-[15px] rounded-full border-2 transition-colors duration-500', i <= stage ? 'border-violet-400 bg-violet-400' : 'border-fg/25 bg-bg')} />
                  <div className="font-display text-lg font-semibold">{t}</div>
                  <motion.div initial={false} animate={{ height: i === stage ? 'auto' : 0, opacity: i === stage ? 1 : 0 }} className="overflow-hidden text-sm text-muted"><p className="pt-1">{s}</p></motion.div>
                </div>
              ))}
            </div>
            <div className="mt-4 h-16 lg:hidden">
              <AnimatePresence mode="wait">
                <motion.div key={stage} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                  <div className="font-display text-base font-semibold"><span className="me-2 brand-text" dir="ltr">0{stage + 1}</span>{d.tSteps[stage][0]}</div>
                  <p className="mt-1 text-sm text-muted">{d.tSteps[stage][1]}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div style={{ perspective: 1600 }} className="relative">
            <motion.div style={{ opacity: glow }} className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-tr from-cyan-400/20 via-indigo-500/10 to-violet-500/25 blur-3xl" />
            <motion.div style={{ rotateY: rotY, rotateX: rotX, scale }} className="relative"><MockWorkspace prof="sales" stage={stage} /></motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Photo({ src, tint, className }: { src: string; tint: string; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-3xl', className)}>
      <img src={src} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 mix-blend-multiply" style={{ background: `linear-gradient(150deg, ${tint}88, #1a1454aa 80%)` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070815]/75 via-transparent to-transparent" />
    </div>
  )
}
function Who({ d }: { d: Dict }) {
  return (
    <section className="relative px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal><Eyebrow>{d.wEyebrow}</Eyebrow><h2 className="max-w-2xl font-display text-3xl leading-snug font-bold sm:text-5xl sm:leading-tight">{d.wTitle}</h2></Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {([['solo', d.solo, '#22d3ee'], ['team', d.team, '#a855f7']] as const).map(([k, t, tint], i) => (
            <Reveal key={k} delay={i * 0.12}>
              <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }} className="group relative">
                <Photo src={`/img/${k}.webp`} tint={tint} className="h-80 sm:h-[28rem]" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8"><div className="font-display text-2xl font-bold sm:text-3xl">{t[0]}</div><p className="mt-2 max-w-sm text-sm leading-relaxed text-white/85">{t[1]}</p></div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------- Scene 3: workspaces ----------
function Professions({ d }: { d: Dict }) {
  const { tr } = useI18n()
  const [id, setId] = useState<ProfId>('marketing')
  const p = professions[id]
  return (
    <section id="professions" className="relative px-5 py-24 sm:px-8 sm:py-36" style={{ '--accent': p.accent } as CSSProperties}>
      <div className="mx-auto max-w-7xl">
        <Reveal><Eyebrow>{d.pEyebrow}</Eyebrow><h2 className="max-w-2xl font-display text-3xl leading-snug font-bold sm:text-5xl sm:leading-tight">{d.pTitle}</h2></Reveal>
        <Reveal delay={0.1} className="mt-10 flex flex-wrap gap-2">
          {profList.map(x => (
            <button key={x.id} onClick={() => setId(x.id)} className={cn('relative flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition-colors', x.id === id ? 'text-[#070815]' : 'border border-line text-fg/80 hover:bg-fg/5')}>
              {x.id === id && <motion.span layoutId="prof-pill" className="absolute inset-0 rounded-full" style={{ background: x.accent }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} />}
              <x.icon size={15} className="relative" /><span className="relative font-medium">{tr(x.label)}</span>
            </button>
          ))}
        </Reveal>
        <div className="mt-10 grid items-center gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <AnimatePresence mode="wait">
            <motion.div key={id} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.35, ease }}>
              <div className="text-xs font-medium text-muted">{d.pIf}</div>
              <p className="accent-text mt-2 font-display text-lg font-semibold">«{tr(p.day)}»</p>
              <p className="mt-4 font-display text-xl leading-relaxed font-semibold sm:text-2xl">{tr(p.blurb)}</p>
              <div className="mt-7 text-xs font-medium text-muted">{d.pTools}</div>
              <div className="mt-3 flex flex-wrap gap-2">{toolsFor(id).slice(0, 2).map(t => <span key={t.id} className="accent-bg accent-border flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><t.icon size={15} className="accent-text" />{tr(t.label)}</span>)}</div>
            </motion.div>
          </AnimatePresence>
          <Reveal className="relative pb-14 sm:pb-20">
            <AnimatePresence mode="wait">
              <motion.div key={id} initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
                <Photo src={`/img/${id}.webp`} tint={p.accent} className="ms-auto h-64 w-[90%] sm:h-[27rem]" />
              </motion.div>
            </AnimatePresence>
            <div className="absolute start-0 bottom-0 w-[86%] sm:w-[68%]"><MockWorkspace prof={id} stage={4} /></div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ---------- Scene 4: AI in action (a real, working miniature) ----------
const AD = {
  ar: { eyebrow: 'الإيجنت داخل الأداة', title: 'اطلب بكلماتك، وساندو ينفّذ', sub: 'بلا قوائم ولا نماذج طويلة. اكتب ما تريد، والإيجنت يعمل داخل الأداة المناسبة.', ph: 'اختر طلباً لتجرّب…', working: 'ساندو يعمل داخل', done: 'جاهز', open: 'افتح في ساندو',
    asks: [['جهّز عرض سعر لعميل جديد', 'quotation-builder'], ['اكتب حملة لإطلاق منتج', 'campaign-studio'], ['حلّل ملف المبيعات', 'spreadsheet-analyzer'], ['أنشئ اختباراً من هذا الدرس', 'quiz-generator']] },
  en: { eyebrow: 'The agent inside the tool', title: 'Ask in your own words. SANDO does it.', sub: 'No menus, no long forms. Say what you need and the agent works inside the right tool.', ph: 'Pick a request to try…', working: 'SANDO is working in', done: 'Ready', open: 'Open in SANDO',
    asks: [['Prepare a quotation for a new client', 'quotation-builder'], ['Write a product launch campaign', 'campaign-studio'], ['Analyze the sales file', 'spreadsheet-analyzer'], ['Create a quiz from this lesson', 'quiz-generator']] },
}
function AiInAction(_: { d: Dict }) {
  const a = useDict(AD), { tr, lang } = useI18n(), nav = useNavigate()
  const [pick, setPick] = useState(-1), [typed, setTyped] = useState(0), [done, setDone] = useState(false)
  const text = pick >= 0 ? a.asks[pick][0] : '', tool = pick >= 0 ? getTool(a.asks[pick][1]) : undefined
  useEffect(() => { setPick(-1) }, [lang])
  useEffect(() => {
    if (pick < 0) return
    if (typed < text.length) { const t = setTimeout(() => setTyped(n => n + 1), 28); return () => clearTimeout(t) }
    const t = setTimeout(() => setDone(true), 1300); return () => clearTimeout(t)
  }, [pick, typed, text])
  const working = pick >= 0 && typed >= text.length && !done
  return (
    <section id="ai" className="relative px-5 py-24 sm:px-8 sm:py-36">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal><div className="flex justify-center"><Eyebrow>{a.eyebrow}</Eyebrow></div><h2 className="font-display text-3xl leading-snug font-bold sm:text-5xl sm:leading-tight">{a.title}</h2><p className="mx-auto mt-5 max-w-lg leading-relaxed text-muted">{a.sub}</p></Reveal>
        <Reveal delay={0.1} className="relative mt-10">
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-violet-500/25 to-cyan-400/20 blur-3xl" />
          <div className="relative rounded-3xl border border-line bg-surface p-4 text-start shadow-2xl sm:p-6">
            <div className="flex h-14 items-center gap-3 rounded-2xl border border-line bg-bg px-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-white"><Sparkles size={16} /></span>
              <span className={cn('min-w-0 flex-1 truncate', pick < 0 && 'text-muted')}>{pick < 0 ? a.ph : text.slice(0, typed)}{pick >= 0 && typed < text.length && <span className="ms-0.5 inline-block h-4 w-px animate-pulse bg-fg/70 align-middle" />}</span>
            </div>
            <div className="mt-3 flex h-14 items-center">
              <AnimatePresence mode="wait">
                {working && tool && <motion.div key="w" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5 text-sm text-muted"><span className="size-2 animate-pulse rounded-full bg-violet-400" />{a.working}<span className="flex items-center gap-1.5 font-medium text-fg"><tool.icon size={15} />{tr(tool.label)}</span></motion.div>}
                {done && tool && <motion.div key="d" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex w-full flex-wrap items-center justify-between gap-3"><span className="flex items-center gap-2.5 text-sm font-medium"><span className="flex size-7 items-center justify-center rounded-full bg-cyan-400 text-[#070815]"><Check size={15} /></span>{a.done} · {tr(tool.label)}</span><Button size="sm" onClick={() => nav('/app/tool/' + tool.id)}>{a.open}<ArrowUpRight size={14} className="rtl:-scale-x-100" /></Button></motion.div>}
              </AnimatePresence>
            </div>
            <div className="hairline mb-4" />
            <div className="flex flex-wrap gap-2">
              {a.asks.map(([q], i) => <button key={i} onClick={() => { setPick(i); setTyped(0); setDone(false) }} className={cn('rounded-full border px-3.5 py-2 text-xs transition', i === pick ? 'border-violet-400 bg-violet-500/10' : 'border-line text-fg/85 hover:border-fg/30 hover:bg-fg/5')}>{q}</button>)}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// ---------- Scene 5: the 12-tool ecosystem ----------
function ToolNode({ t, d }: { t: ToolDef; d: Dict }) {
  const { tr } = useI18n(), nav = useNavigate()
  return (
    <button onClick={() => nav('/app/tool/' + t.id)} className="group flex w-full items-start gap-3 rounded-xl border border-line bg-bg/40 p-3 text-start transition hover:border-fg/25 hover:bg-fg/[0.04]">
      <span className="accent-bg accent-text flex size-9 shrink-0 items-center justify-center rounded-lg"><t.icon size={16} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{tr(t.label)}</span>
        <span className={cn('mt-2 inline-flex items-center gap-1.5 text-[10px] font-medium', t.status === 'ready' ? 'ok-text' : 'text-muted')}><span className={cn('size-1.5 rounded-full', t.status === 'ready' ? 'bg-cyan-300' : 'bg-fg/30')} />{t.status === 'ready' ? d.ready : d.soon}</span>
      </span>
    </button>
  )
}
function Ecosystem({ d }: { d: Dict }) {
  const { tr } = useI18n()
  const tools = allTools()
  return (
    <section id="tools" className="relative px-5 py-24 sm:px-8 sm:py-36">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center"><div className="flex justify-center"><Eyebrow>{d.eEyebrow}</Eyebrow></div><h2 className="font-display text-3xl leading-snug font-bold sm:text-5xl sm:leading-tight">{d.eTitle}</h2><p className="mt-5 text-muted">{d.eSub}</p></Reveal>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {profList.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08} className="relative">
              <div className="h-full rounded-2xl border border-line bg-surface p-4" style={{ '--accent': p.accent } as CSSProperties}>
                <div className="mb-4 flex items-center gap-2.5"><span className="accent-solid flex size-8 items-center justify-center rounded-lg text-[#070815]"><p.icon size={15} /></span><span className="font-display font-semibold">{tr(p.label)}</span></div>
                <div className="space-y-2.5">{tools.filter(t => t.profession === p.id).map(t => <ToolNode key={t.id} t={t} d={d} />)}</div>
              </div>
              <div className="mx-auto hidden h-8 w-px lg:block" style={{ background: `linear-gradient(${p.accent}, rgba(139,92,246,.5))` }} />
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2} className="mt-4 lg:mt-0">
          <div className="rounded-2xl border border-violet-400/30 bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-cyan-400/10 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2.5"><Logo size={30} /><span className="font-display font-semibold">{d.eShared}</span></div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">{tools.filter(t => t.profession === 'shared').map(t => <ToolNode key={t.id} t={t} d={d} />)}</div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
