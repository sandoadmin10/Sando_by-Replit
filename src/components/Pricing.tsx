import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Check, Sparkles } from 'lucide-react'
import { useDict } from '../lib/i18n'
import { Button, cn } from './ui'

const D = {
  ar: {
    eyebrow: 'الباقات', title: 'ادفع مقابل العمل المنجز، لا مقابل التعقيد', sub: 'كل الباقات تشمل إعداد مساحة العمل بالأسئلة، والوكيل داخل الأدوات، والتصدير الاحترافي.',
    monthly: 'شهري', yearly: 'سنوي', save: 'شهران مجاناً', per: '/ شهرياً', perUser: '/ مستخدم شهرياً', billedYearly: 'تُدفع سنوياً', custom: 'حسب الاحتياج', popular: 'الأكثر طلباً',
    plans: [
      { id: 'solo', name: 'فردي', desc: 'للمستقل وصاحب المشروع الصغير.', price: [79, 66], cta: 'ابدأ تجربة مجانية', features: ['مساحة عمل لقطاع واحد', 'المسوّق الاحترافي أو موظف المبيعات', '40 مهمة للوكيل شهرياً', 'تصدير PDF و Word و Excel', 'ذاكرة مشروع واحد'] },
      { id: 'team', name: 'فريق', desc: 'لفرق التسويق والمبيعات حتى 20 شخصاً.', price: [149, 124], perUser: true, cta: 'ابدأ مع فريقك', features: ['القطاعات الأربعة', 'المسوّق الاحترافي وموظف المبيعات', '100 مهمة للوكيل لكل مستخدم شهرياً', 'ذاكرة مشتركة لكل المشاريع', 'هوية الشركة في كل المخرجات', 'موافقات قبل الإرسال'] },
      { id: 'enterprise', name: 'مؤسسات', desc: 'للشركات والجهات الحكومية والتعليمية.', cta: 'تواصل معنا', features: ['أدوات مخصصة لأقسامك', 'ربط CRM والبريد والأنظمة الداخلية', 'استضافة خاصة أو داخل المملكة', 'تسجيل دخول موحّد SSO', 'مدير نجاح مخصص'] },
    ],
    note: 'تجربة مجانية 14 يوماً. مهام إضافية: 100 مهمة بـ 99 ر.س. الأسعار بالريال السعودي ولا تشمل ضريبة القيمة المضافة.',
  },
  en: {
    eyebrow: 'Pricing', title: 'Pay for work done, not for complexity', sub: 'Every plan includes question-based workspace setup, the agent inside the tools, and professional exports.',
    monthly: 'Monthly', yearly: 'Yearly', save: '2 months free', per: '/ month', perUser: '/ user / month', billedYearly: 'billed yearly', custom: 'Custom', popular: 'Most popular',
    plans: [
      { id: 'solo', name: 'Solo', desc: 'For freelancers and small business owners.', price: [79, 66], cta: 'Start free trial', features: ['Workspace for one sector', 'Professional Marketer or Sales Agent', '40 agent tasks per month', 'PDF, Word and Excel export', 'Memory for one project'] },
      { id: 'team', name: 'Team', desc: 'For marketing and sales teams up to 20.', price: [149, 124], perUser: true, cta: 'Start with your team', features: ['All four sectors', 'Professional Marketer and Sales Agent', '100 agent tasks per user per month', 'Shared memory across projects', 'Company branding on every output', 'Approvals before anything is sent'] },
      { id: 'enterprise', name: 'Enterprise', desc: 'For companies, government and education.', cta: 'Contact us', features: ['Tools tailored to your departments', 'CRM, email and internal system integrations', 'Private or in-Kingdom hosting', 'Single sign-on (SSO)', 'Dedicated success manager'] },
    ],
    note: '14-day free trial. Extra tasks: 100 for SAR 99. Prices in Saudi Riyals, excluding VAT.',
  },
}

export function Pricing() {
  const d = useDict(D), nav = useNavigate()
  const [yearly, setYearly] = useState(true)
  return (
    <section id="pricing" className="relative px-5 py-24 sm:px-8 sm:py-36">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-wide brand-text"><span className="h-px w-8 bg-violet-400/60" />{d.eyebrow}<span className="h-px w-8 bg-violet-400/60" /></div>
          <h2 className="font-display text-3xl leading-snug font-bold sm:text-5xl sm:leading-tight">{d.title}</h2>
          <p className="mt-5 text-muted">{d.sub}</p>
          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1 text-sm">
            {[false, true].map(y => (
              <button key={String(y)} onClick={() => setYearly(y)} className={cn('relative rounded-full px-4 py-2 transition', yearly === y ? 'text-white' : 'text-muted hover:text-fg')}>
                {yearly === y && <motion.span layoutId="bill" className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />}
                <span className="relative">{y ? d.yearly : d.monthly}{y && <span className="ms-2 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">{d.save}</span>}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
          {d.plans.map((p, i) => {
            const hot = p.id === 'team'
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay: i * 0.1 }}
                className={cn('relative flex flex-col rounded-3xl border p-6 sm:p-8', hot ? 'border-violet-400/60 bg-gradient-to-b from-violet-500/15 via-surface to-surface shadow-[0_30px_80px_-30px_rgba(124,92,255,.55)]' : 'border-line bg-surface')}>
                {hot && <span className="absolute -top-3 start-6 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-3 py-1 text-[11px] font-medium text-white"><Sparkles size={12} />{d.popular}</span>}
                <div className="font-display text-xl font-bold">{p.name}</div>
                <p className="mt-1 text-sm text-muted">{p.desc}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  {p.price ? (<>
                    <motion.span key={String(yearly)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-5xl font-bold tabular-nums" dir="ltr">{p.price[yearly ? 1 : 0]}</motion.span>
                    <span className="text-sm text-muted">{d.per === '/ شهرياً' ? 'ر.س' : 'SAR'} {p.perUser ? d.perUser : d.per}</span>
                  </>) : <span className="font-display text-4xl font-bold">{d.custom}</span>}
                </div>
                <div className="mt-1 h-4 text-[11px] text-muted">{p.price && yearly ? d.billedYearly : ''}</div>
                <Button className="mt-6 w-full" variant={hot ? 'primary' : 'outline'} onClick={() => nav(p.id === 'enterprise' ? '/signup' : '/onboarding')}>{p.cta}</Button>
                <ul className="mt-7 space-y-3 text-sm">{p.features.map(f => <li key={f} className="flex gap-2.5"><Check size={16} className={cn('mt-0.5 shrink-0', hot ? 'brand-text' : 'ok-text')} /><span className="text-fg/85">{f}</span></li>)}</ul>
              </motion.div>
            )
          })}
        </div>
        <p className="mt-6 text-center text-xs text-muted">{d.note}</p>
      </div>
    </section>
  )
}
