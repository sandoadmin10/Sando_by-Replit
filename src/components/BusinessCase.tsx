// Landing sections: the problem, and how SANDO compares with the alternatives teams use today.

import { motion } from 'motion/react'
import { Check, X, Minus } from 'lucide-react'
import { useDict } from '../lib/i18n'
import { cn } from './ui'

const ease = [0.22, 1, 0.36, 1] as const
function Head({ eyebrow, title, sub, center }: { eyebrow: string; title: string; sub?: string; center?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease }} className={cn('max-w-3xl', center && 'mx-auto text-center')}>
      <div className={cn('mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-wide brand-text', center && 'justify-center')}><span className="h-px w-8 bg-violet-400/60" />{eyebrow}</div>
      <h2 className="font-display text-3xl leading-snug font-bold sm:text-5xl sm:leading-tight">{title}</h2>
      {sub && <p className="mt-5 leading-relaxed text-muted">{sub}</p>}
    </motion.div>
  )
}

// ------------------------------------------------------------------ Problem & market
const P = {
  ar: {
    eyebrow: 'المشكلة', title: 'الذكاء الاصطناعي متاح للجميع. المخرجات الجاهزة؟ لا.',
    sub: 'عميلنا: مسوّق أو مندوب مبيعات في منشأة صغيرة أو متوسطة، يجهّز كل أسبوع حملات وعروضاً وتقارير بالعربي، بلا فريق تقني ولا وقت لتعلّم كتابة البرومبتات.',
    pains: [['يشرح شركته من الصفر', 'كل محادثة جديدة مع مساعد عام تبدأ بلا سياق: المنتج، الجمهور، الأسعار، الهوية.'], ['يحصل على نص، لا مستند', 'الناتج فقرات طويلة تحتاج نسخاً وتنسيقاً، والعربي والجداول تتكسّر في المستندات.'], ['يراجع كل رقم بنفسه', 'النماذج العامة قد تخطئ في الحساب، فلا يثق المسوّق بالأرقام قبل إعادة حسابها.']],
    stats: [['1.7 مليون', 'سجل تجاري نشط للمنشآت الصغيرة والمتوسطة في المملكة (الربع الثالث 2025)'], ['8.88 مليون', 'عامل في المنشآت الصغيرة والمتوسطة بنهاية 2025']],
    src: 'استناداً إلى بيانات الهيئة العامة للمنشآت الصغيرة والمتوسطة «منشآت»',
  },
  en: {
    eyebrow: 'The problem', title: 'Everyone has AI. Ready-to-use outputs? Not yet.',
    sub: 'Our customer: a marketer or salesperson at a Saudi SME who produces campaigns, proposals and reports in Arabic every week — with no technical team and no time to learn prompt writing.',
    pains: [['Explains the company from scratch', 'Every new chat with a general assistant starts with no context: product, audience, prices, brand.'], ['Gets text, not a document', 'The output is long paragraphs that need copying and formatting; Arabic and tables break in documents.'], ['Rechecks every number', 'General models can miscalculate, so marketers do not trust figures until they redo them.']],
    stats: [['1.7 million', 'active commercial registrations of SMEs in Saudi Arabia (Q3 2025)'], ['8.88 million', 'people working in Saudi SMEs at the end of 2025']],
    src: 'Based on data from Monsha’at, the SME General Authority',
  },
}
export function Problem() {
  const d = useDict(P)
  return (
    <section id="problem" className="relative px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <Head eyebrow={d.eyebrow} title={d.title} sub={d.sub} />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {d.pains.map(([t, s], i) => (
            <motion.div key={t} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.08 }} className="rounded-2xl border border-line bg-surface p-5">
              <span className="font-display text-sm font-bold text-rose-400" dir="ltr">0{i + 1}</span>
              <div className="mt-2 font-display text-lg font-semibold">{t}</div><p className="mt-1.5 text-sm leading-relaxed text-muted">{s}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-5 grid gap-4 rounded-2xl border border-line bg-surface p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          {d.stats.map(([n, t]) => <div key={n}><div className="font-display text-4xl font-bold grad-text">{n}</div><p className="mt-1 text-sm text-muted">{t}</p></div>)}
          <p className="text-xs text-muted sm:max-w-56">{d.src}</p>
        </div>
      </div>
    </section>
  )
}

// ------------------------------------------------------------------ Versus the existing alternative
const C = {
  ar: {
    eyebrow: 'لماذا ساندو؟', title: 'أفضل من البديل الذي يستخدمه فريقك اليوم', cols: ['ساندو', 'مساعد ذكاء اصطناعي عام', 'وكالة أو مستقل', 'يدوياً'],
    rows: [
      ['يحتاج خبرة في كتابة البرومبت', ['no', 'لا'], ['yes', 'نعم'], ['no', 'لا'], ['mid', '—']],
      ['خبرة المهنة مخزّنة داخل الأداة', ['yes', 'مهارات بمنهجية المحترف ومعايير الجودة'], ['no', 'تكتبها أنت في كل برومبت'], ['yes', 'حسب خبرة الشخص'], ['mid', 'حسب خبرة الموظف']],
      ['يعرف شركتك من المرة الأولى', ['yes', 'ذاكرة لكل مشروع'], ['mid', 'جزئياً'], ['mid', 'بعد اجتماعات'], ['yes', 'نعم']],
      ['المخرج مستند جاهز (PDF، جداول، عربي سليم)', ['yes', 'نعم'], ['no', 'نص يحتاج تنسيق'], ['yes', 'نعم'], ['mid', 'ساعات عمل']],
      ['دقة الأرقام', ['yes', 'محسوبة برمجياً'], ['mid', 'قد يخطئ'], ['mid', 'حسب الشخص'], ['mid', 'حسب الشخص']],
      ['لا يرسل شيئاً دون موافقتك', ['yes', 'نعم'], ['mid', '—'], ['mid', '—'], ['yes', 'نعم']],
      ['الوقت حتى المخرج', ['yes', 'دقائق (حسب المهمة)'], ['mid', 'دقائق + تنسيق'], ['no', 'أيام'], ['no', 'ساعات']],
      ['التكلفة', ['yes', 'من 66 ر.س شهرياً'], ['mid', 'اشتراك عام'], ['no', 'لكل مشروع'], ['no', 'وقت الموظف']],
    ] as [string, ...[string, string][]][],
  },
  en: {
    eyebrow: 'Why SANDO?', title: 'Better than what your team uses today', cols: ['SANDO', 'General AI assistant', 'Agency or freelancer', 'Manual'],
    rows: [
      ['Needs prompt-writing skills', ['no', 'No'], ['yes', 'Yes'], ['no', 'No'], ['mid', '—']],
      ['Professional expertise built into the tool', ['yes', 'Skills with expert methods and quality criteria'], ['no', 'You write it in every prompt'], ['yes', 'Depends on the person'], ['mid', 'Depends on the employee']],
      ['Knows your company from the first task', ['yes', 'Memory per project'], ['mid', 'Partly'], ['mid', 'After meetings'], ['yes', 'Yes']],
      ['Output is a finished document (PDF, tables, proper Arabic)', ['yes', 'Yes'], ['no', 'Text to format'], ['yes', 'Yes'], ['mid', 'Hours of work']],
      ['Number accuracy', ['yes', 'Computed in code'], ['mid', 'Can miscalculate'], ['mid', 'Depends'], ['mid', 'Depends']],
      ['Sends nothing without your approval', ['yes', 'Yes'], ['mid', '—'], ['mid', '—'], ['yes', 'Yes']],
      ['Time to output', ['yes', 'Minutes (task-dependent)'], ['mid', 'Minutes + formatting'], ['no', 'Days'], ['no', 'Hours']],
      ['Cost', ['yes', 'From SAR 66 / month'], ['mid', 'General subscription'], ['no', 'Per project'], ['no', 'Employee time']],
    ] as [string, ...[string, string][]][],
  },
}
// "good" means good for the user: for the first row, needing prompt skills is bad.
const mark = (k: string, row: number) => { const good = row === 0 ? k === 'no' : k === 'yes'; const bad = row === 0 ? k === 'yes' : k === 'no'; return good ? <Check size={15} className="ok-text shrink-0" /> : bad ? <X size={15} className="shrink-0 text-rose-400" /> : <Minus size={15} className="shrink-0 text-muted" /> }
export function Compare() {
  const d = useDict(C)
  return (
    <section id="compare" className="relative px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <Head eyebrow={d.eyebrow} title={d.title} center />
        <div className="thin-scroll mt-12 overflow-x-auto rounded-3xl border border-line bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr><th className="w-[30%] p-4" />{d.cols.map((c, i) => <th key={c} className={cn('p-4 text-start font-display font-semibold', i === 0 && 'bg-violet-500/10 brand-text')}>{c}</th>)}</tr></thead>
            <tbody>{d.rows.map(([label, ...cells], r) => (
              <tr key={label} className="border-t border-line"><td className="p-4 text-fg/85">{label}</td>
                {cells.map(([k, t], i) => <td key={i} className={cn('p-4', i === 0 && 'bg-violet-500/10 font-medium')}><span className="flex items-center gap-2">{mark(k, r)}<span className={i === 0 ? '' : 'text-muted'}>{t}</span></span></td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
