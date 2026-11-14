import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { useDict } from '../lib/i18n'
import { auth, read, K } from '../lib/store'
import { Button, Field, inputCls, LangSwitch, ThemeToggle } from '../components/ui'
import { Logo, Wordmark } from '../components/Brand'

const D = {
  ar: { login: 'تسجيل الدخول', signup: 'إنشاء حساب', subL: 'ادخل إلى مساحة عملك.', subS: 'أنشئ مساحتك في أقل من دقيقة.', name: 'الاسم', email: 'البريد الإلكتروني', pass: 'كلمة المرور', go: 'متابعة', demo: 'ادخل مباشرة بدون حساب', or: 'أو', toSignup: 'ليس لديك حساب؟ أنشئ حساباً', toLogin: 'لديك حساب؟ سجّل الدخول', note: 'هذا حساب تجريبي للعرض فقط: لا يوجد تحقق حقيقي ولا تُحفظ كلمة المرور. البيانات تبقى في متصفحك.', tag: 'مساحة عمل تفهمك.', back: 'الرئيسية' },
  en: { login: 'Sign in', signup: 'Create account', subL: 'Enter your workspace.', subS: 'Set up your workspace in under a minute.', name: 'Name', email: 'Email', pass: 'Password', go: 'Continue', demo: 'Continue without an account', or: 'or', toSignup: 'No account? Create one', toLogin: 'Have an account? Sign in', note: 'This is a demonstration account: there is no real verification and the password is never stored. Data stays in your browser.', tag: 'A workspace that understands you.', back: 'Home' },
}
export default function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const d = useDict(D), nav = useNavigate()
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [pass, setPass] = useState('')
  const enter = () => nav(read(K.profile, null) ? '/app' : '/onboarding')
  const submit = async (e: FormEvent) => { e.preventDefault(); await (mode === 'login' ? auth.signIn(email, pass) : auth.signUp(name, email, pass)); enter() }
  return (
    <div className="grid min-h-screen bg-bg text-fg lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-e border-line lg:block">
        <div className="absolute -start-1/4 -top-1/4 size-[80vh] rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,.25),rgba(124,92,255,.2)_45%,transparent)] blur-2xl" />
        <div className="absolute -end-1/4 -bottom-1/4 size-[80vh] rounded-full bg-[radial-gradient(closest-side,rgba(139,92,246,.3),transparent)] blur-2xl" />
        <img src="/img/auth.webp" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a1a6e]/85 via-[#0b0d22]/80 to-[#0a3a55]/80" />
        <div className="relative flex h-full flex-col items-center justify-center gap-8 p-12 text-center text-white">
          <motion.div initial={{ scale: 0.8, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}><Logo size={180} /></motion.div>
          <p className="font-display text-3xl font-bold">{d.tag}</p>
        </div>
      </div>
      <div className="flex flex-col p-5 sm:p-8">
        <div className="flex items-center justify-between"><Link to="/"><Wordmark size={28} /></Link><div className="flex gap-2"><LangSwitch /><ThemeToggle /></div></div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="m-auto w-full max-w-sm py-10">
          <h1 className="font-display text-3xl font-bold">{mode === 'login' ? d.login : d.signup}</h1>
          <p className="mt-2 text-sm text-muted">{mode === 'login' ? d.subL : d.subS}</p>
          <Button variant="soft" size="lg" className="mt-7 w-full" onClick={async () => { await auth.demo(); enter() }}>{d.demo}<ArrowLeft size={17} className="ltr:rotate-180" /></Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />{d.or}<span className="h-px flex-1 bg-line" /></div>
          <form onSubmit={submit} className="space-y-3.5">
            {mode === 'signup' && <Field label={d.name}><input required className={inputCls} value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></Field>}
            <Field label={d.email}><input required type="email" dir="ltr" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></Field>
            <Field label={d.pass}><input required type="password" dir="ltr" minLength={4} className={inputCls} value={pass} onChange={e => setPass(e.target.value)} /></Field>
            <Button type="submit" size="lg" className="w-full">{d.go}</Button>
          </form>
          <Link to={mode === 'login' ? '/signup' : '/login'} className="mt-5 block text-center text-sm brand-text hover:underline">{mode === 'login' ? d.toSignup : d.toLogin}</Link>
        </motion.div>
      </div>
    </div>
  )
}
