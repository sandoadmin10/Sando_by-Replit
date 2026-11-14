import { Suspense, useEffect, useState, type CSSProperties } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Home, Settings as Cog, Sparkles, Menu, X, PanelLeft, LogOut, RotateCcw, ArrowLeft, Clock, FolderOpen, Trash2, Hammer, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { useDict, useI18n, fmtDate } from '../lib/i18n'
import { useStore, write, K, DEMO_SESSION, NO_SAVED, NO_ACTIVITY, removeSaved, resetDemo, auth, type Session, type Profile, type Saved, type Activity } from '../lib/store'
import { professions, orgTypes } from '../lib/professions'
import { getTool, buildProfile, type ToolDef } from '../tools/registry'
import { Button, Card, LangSwitch, ThemeToggle, ModeBadge, useAiStatus, cn } from '../components/ui'
import { Logo, Wordmark } from '../components/Brand'
import { AgentProvider, AgentPanel, useAgent } from '../components/Agent'

const D = {
  ar: { home: 'الرئيسية', settings: 'الإعدادات', myTools: 'أدواتي', ask: 'اسأل ساندو', askPh: 'اطلب من ساندو: اكتب، حلّل، جهّز…', send: 'أرسل', quick: 'أو ابدأ بمهمة:', demoAcc: 'حساب تجريبي', logout: 'تسجيل الخروج', reset: 'إعادة بناء المساحة', profTools: 'أدواتك المتخصصة', byAnswers: 'مرتّبة حسب إجاباتك', shared: 'أدوات مشتركة', ready: 'جاهزة', preview: 'قريباً', start: 'اقتراح البداية', open: 'افتح الأداة', activity: 'النشاط الأخير', saved: 'المخرجات المحفوظة', noSaved: 'ما تحفظه من الأدوات يظهر هنا.', examples: 'مهام مقترحة لليوم:', sample: 'أمثلة تجريبية', back: 'مساحة العمل', notFound: 'الأداة غير موجودة.', pvTitle: 'هذه الأداة قادمة قريباً', pvBody: 'نعمل على إضافتها إلى مساحتك. هذا ما ستقدّمه لك:', inputs: 'ما تحتاجه منك', outputs: 'ما تحصل عليه', tryReady: 'افتح أداة متاحة الآن', lang: 'اللغة', theme: 'المظهر', profile: 'ملفك', field: 'المجال', role: 'الدور', org: 'الجهة', ai: 'حالة الذكاء الاصطناعي', aiLive: 'متصل عبر الخادم. المزوّد والنموذج:', aiDemo: 'وضع العرض: لا يوجد مفتاح API على الخادم، فكل ردود المساعد والتوليد نماذج مُعدّة مسبقاً ومعلَّمة بوضوح. أضف ANTHROPIC_API_KEY أو OPENAI_API_KEY في متغيرات البيئة لتفعيل الذكاء المباشر.', resetNote: 'يمسح ملفك ومحفوظاتك ويعيدك إلى أسئلة البداية.', account: 'الحساب', demoNote: 'جلسة محلية للعرض — ليست مصادقة حقيقية.', collapse: 'طيّ القائمة', menu: 'القائمة', tour: 'الجولة الإرشادية' },
  en: { home: 'Home', settings: 'Settings', myTools: 'My tools', ask: 'Ask SANDO', askPh: 'Ask SANDO: write, analyze, prepare…', send: 'Send', quick: 'Or start with a task:', demoAcc: 'Demo account', logout: 'Log out', reset: 'Rebuild workspace', profTools: 'Your specialist tools', byAnswers: 'Ordered by your answers', shared: 'Shared tools', ready: 'Ready', preview: 'Soon', start: 'Suggested start', open: 'Open tool', activity: 'Recent activity', saved: 'Saved outputs', noSaved: 'Anything you save in a tool appears here.', examples: 'Suggested tasks for today:', sample: 'Sample tasks', back: 'Workspace', notFound: 'Tool not found.', pvTitle: 'This tool is coming soon', pvBody: 'We are adding it to your workspace. Here is what it will do for you:', inputs: 'What it needs', outputs: 'What you get', tryReady: 'Open a tool available now', lang: 'Language', theme: 'Appearance', profile: 'Your profile', field: 'Field', role: 'Role', org: 'Organization', ai: 'AI status', aiLive: 'Connected through the server. Provider and model:', aiDemo: 'Demo Mode: no API key is configured on the server, so every assistant reply and generation is a prepared, clearly labelled sample. Add ANTHROPIC_API_KEY or OPENAI_API_KEY to the environment to enable Live AI.', resetNote: 'Clears your profile and saved outputs and returns you to the opening questions.', account: 'Account', demoNote: 'A local demo session — not real authentication.', collapse: 'Collapse sidebar', menu: 'Menu', tour: 'Guided tour' },
}
type Dict = typeof D.ar

export default function Workspace() {
  const session = useStore<Session | null>(K.session, null)
  const profile = useStore<Profile | null>(K.profile, null)
  const theme = useStore<string>(K.theme, 'dark')
  const { lang } = useI18n()
  const toolId = useLocation().pathname.match(/^\/app\/tool\/([\w-]+)/)?.[1]
  useEffect(() => { if (!session) write(K.session, DEMO_SESSION) }, [session])
  // Opening a tool directly (e.g. from the landing page) should never hit a wall: create a default demo profile.
  useEffect(() => {
    if (profile || !toolId) return
    const t = getTool(toolId)
    const prof = t && t.profession !== 'shared' ? t.profession : 'sales'
    write(K.profile, buildProfile({ profession: prof, role: professions[prof].roles[0][lang] }))
  }, [profile, toolId, lang])
  if (!profile) return toolId ? null : <Navigate to="/onboarding" replace />
  return <AgentProvider><Shell profile={profile} session={session ?? DEMO_SESSION} light={theme === 'light'} /></AgentProvider>
}

function Shell({ profile, session, light }: { profile: Profile; session: Session; light: boolean }) {
  const d = useDict(D), { tr } = useI18n(), agent = useAgent(), loc = useLocation()
  const [slim, setSlim] = useState(false), [drawer, setDrawer] = useState(false)
  const p = professions[profile.profession]
  useEffect(() => setDrawer(false), [loc.pathname])
  const item = (slimNow: boolean) => ({ isActive }: { isActive: boolean }) => cn('flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors', slimNow && 'justify-center px-0', isActive ? 'accent-bg text-fg' : 'text-muted hover:bg-fg/5 hover:text-fg')
  const all = profile.tools.map(getTool).filter((t): t is ToolDef => !!t)
  const groups: [string, ToolDef[]][] = [[d.profTools, all.filter(t => t.profession !== 'shared')], [d.shared, all.filter(t => t.profession === 'shared')]]
  const order = groups.flatMap(g => g[1]).map(t => t.id)
  const nav = (slimNow: boolean) => (
    <nav className="thin-scroll flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      <NavLink to="/app" end className={item(slimNow)} title={d.home}><Home size={17} className="shrink-0" />{!slimNow && d.home}</NavLink>
      {groups.map(([title, list]) => (
        <div key={title} className="contents">
          {slimNow ? <div className="mx-3 my-2 h-px bg-line" /> : <div className="mt-4 mb-1 px-3 text-[11px] font-medium text-muted/70">{title}</div>}
          {list.map(t => (
            <NavLink key={t.id} to={`/app/tool/${t.id}`} className={item(slimNow)} title={tr(t.label)}>
              <t.icon size={17} className="shrink-0" />{!slimNow && <span className="min-w-0 flex-1 truncate">{tr(t.label)}</span>}
              {!slimNow && <span className="shrink-0 text-[10px] text-muted/60 tabular-nums" dir="ltr">{String(order.indexOf(t.id) + 1).padStart(2, '0')}</span>}
            </NavLink>
          ))}
        </div>
      ))}
      <NavLink to="/app/settings" className={s => cn(item(slimNow)(s), 'mt-auto')} title={d.settings}><Cog size={17} className="shrink-0" />{!slimNow && d.settings}</NavLink>
    </nav>
  )
  return (
    <div className={cn('flex min-h-screen bg-bg text-fg', light && 'light')} style={{ '--accent': p.accent } as CSSProperties}>
      <aside className={cn('sticky top-0 hidden h-screen shrink-0 flex-col border-e border-line bg-surface transition-[width] duration-300 lg:flex', slim ? 'w-[4.5rem]' : 'w-64')}>
        <Link to="/" className="flex h-16 items-center border-b border-line px-4">{slim ? <Logo size={32} className="mx-auto" /> : <Wordmark size={28} />}</Link>
        {nav(slim)}
      </aside>
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
          <motion.aside initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col border-e border-line bg-surface">
            <div className="flex h-16 items-center justify-between border-b border-line px-4"><Wordmark size={28} /><button onClick={() => setDrawer(false)} aria-label="Close" className="rounded-lg p-2 text-muted hover:bg-fg/5"><X size={18} /></button></div>
            {nav(false)}
          </motion.aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-bg/85 px-3 backdrop-blur-xl sm:px-6">
          <button onClick={() => setDrawer(true)} aria-label={d.menu} className="rounded-xl p-2.5 text-muted hover:bg-fg/5 lg:hidden"><Menu size={19} /></button>
          <button onClick={() => setSlim(s => !s)} aria-label={d.collapse} className="hidden rounded-xl p-2.5 text-muted hover:bg-fg/5 lg:block"><PanelLeft size={18} className="rtl:-scale-x-100" /></button>
          <ModeBadge className="hidden sm:inline-flex" />
          <div className="ms-auto flex items-center gap-2">
            <Button size="sm" variant="soft" onClick={() => agent.setOpen(!agent.open)}><Sparkles size={15} className="brand-text" /><span className="hidden sm:inline">{d.ask}</span></Button>
            <LangSwitch className="px-2.5" />
            <ThemeToggle />
            <Link to="/app/settings" title={session.name} className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-xs font-semibold text-white uppercase">{session.name.slice(0, 1)}</Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route index element={<Dashboard d={d} profile={profile} session={session} />} />
            <Route path="tool/:id" element={<ToolPage d={d} profile={profile} />} />
            <Route path="settings" element={<SettingsPage d={d} profile={profile} session={session} />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </main>
      </div>
      <AgentPanel />
    </div>
  )
}

function ToolCard({ t, d, reason, n }: { t: ToolDef; d: Dict; reason?: string; n: number }) {
  const { tr } = useI18n(), ready = t.status === 'ready'
  return (
    <Link to={`/app/tool/${t.id}`} className={cn('group flex items-center gap-3.5 rounded-2xl border bg-surface p-3.5 transition hover:-translate-y-0.5 hover:shadow-lg', ready ? 'border-line hover:border-fg/25' : 'border-dashed border-line opacity-70 hover:opacity-100')}>
      <span className="w-6 shrink-0 text-center font-display text-sm font-bold text-fg/35 tabular-nums" dir="ltr">{String(n).padStart(2, '0')}</span>
      <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', t.profession === 'shared' ? 'bg-fg/[0.07] text-fg/80' : 'accent-bg accent-text')}><t.icon size={19} /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-display text-sm font-semibold"><span className="truncate">{tr(t.label)}</span>{!ready && <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] font-normal text-muted">{d.preview}</span>}</span>
        <span className="mt-0.5 block truncate text-xs text-muted">{reason ?? tr(t.description)}</span>
      </span>
      <ArrowLeft size={16} className="shrink-0 text-muted transition group-hover:text-fg ltr:rotate-180" />
    </Link>
  )
}

function Dashboard({ d, profile, session }: { d: Dict; profile: Profile; session: Session }) {
  const { tr, lang } = useI18n(), agent = useAgent()
  const [ask, setAsk] = useState('')
  const p = professions[profile.profession]
  const mixed = profile.tools.map(getTool).filter((t): t is ToolDef => !!t)
  const tools = [...mixed.filter(t => t.profession !== 'shared'), ...mixed.filter(t => t.profession === 'shared')]
  const first = tools[0]
  const saved = useStore<Saved[]>(K.saved, NO_SAVED), activity = useStore<Activity[]>(K.activity, NO_ACTIVITY)
  return (
    <div className="space-y-8">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative overflow-hidden rounded-3xl border border-line bg-surface px-5 py-8 sm:px-8 sm:py-12">
        <div className="pointer-events-none absolute -end-24 -top-40 size-96 rounded-full opacity-25 blur-3xl" style={{ background: p.accent }} />
        <div className="aurora-a pointer-events-none absolute -start-24 -bottom-48 size-96 rounded-full blur-3xl" />
        <div className="relative mx-auto max-w-2xl text-center">
          <div className="accent-text mb-3 inline-flex items-center gap-2 text-xs font-medium"><p.icon size={14} />{tr(p.label)} · {profile.role}</div>
          <h1 className="font-display text-2xl leading-snug font-bold sm:text-3xl">{tr(p.greeting).replace('{name}', session.name === DEMO_SESSION.name ? (lang === 'ar' ? 'بك' : 'back') : session.name)}</h1>
          <form onSubmit={e => { e.preventDefault(); if (ask.trim()) { agent.send(ask.trim()); setAsk('') } }} className="mt-6 flex items-center gap-2 rounded-2xl border border-line bg-bg p-2 shadow-lg transition focus-within:border-violet-400">
            <span className="ms-1.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-white"><Sparkles size={15} /></span>
            <input value={ask} onChange={e => setAsk(e.target.value)} placeholder={d.askPh} maxLength={800} className="h-10 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted/70" />
            <Button type="submit" size="sm" disabled={!ask.trim()}>{d.send}</Button>
          </form>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-muted">{d.quick}</span>
            {p.tasks.map(t => <Link key={t.id} to={`/app/tool/${t.tool}`} className="rounded-full border border-line bg-surface px-3.5 py-2 text-xs text-fg/85 transition hover:border-fg/30 hover:bg-fg/5">{tr(t.label)}</Link>)}
          </div>
        </div>
      </motion.section>

      {([[d.profTools, tools.filter(t => t.profession !== 'shared'), 'sm:grid-cols-2'], [d.shared, tools.filter(t => t.profession === 'shared'), 'sm:grid-cols-2']] as const).map(([title, list, cols]) => (
        <section key={title}>
          <h2 className="mb-3 flex items-baseline gap-3 font-display text-base font-semibold"><span className="accent-solid h-4 w-1 self-center rounded-full" />{title}<span className="text-xs font-normal text-muted">{list.length} · {d.byAnswers}</span></h2>
          <div className={cn('grid gap-3', cols)}>{list.map(t => <ToolCard key={t.id} t={t} d={d} n={tools.indexOf(t) + 1} reason={t.profession !== 'shared' ? tr(profile.reasons[t.id]) : undefined} />)}</div>
        </section>
      ))}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold"><Clock size={15} className="text-muted" />{d.activity}</h2>
          {activity.length ? (
            <ul className="space-y-1">{activity.slice(0, 6).map((a, i) => { const t = getTool(a.toolId); return (
              <li key={i}><Link to={`/app/tool/${a.toolId}`} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-fg/5">{t && <t.icon size={15} className="shrink-0 text-muted" />}<span className="min-w-0 flex-1 truncate">{tr(a.text)}</span><span className="shrink-0 text-[11px] text-muted">{fmtDate(a.at, lang)}</span></Link></li>) })}</ul>
          ) : (<>
            <p className="text-xs leading-relaxed text-muted">{d.examples}</p>
            <ul className="mt-3 space-y-2">{p.today.map((t, i) => <li key={i} className="flex items-center gap-3 text-sm text-fg/85"><span className="accent-border size-3 shrink-0 rounded-full border" />{tr(t)}</li>)}</ul>
          </>)}
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold"><FolderOpen size={15} className="text-muted" />{d.saved}</h2>
          {saved.length ? (
            <ul className="space-y-1">{saved.slice(0, 6).map(s => { const t = getTool(s.toolId); return (
              <li key={s.id} className="flex items-center gap-1 rounded-xl hover:bg-fg/5">
                <Link to={`/app/tool/${s.toolId}?open=${s.id}`} className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 text-sm">{t && <t.icon size={15} className="shrink-0 text-muted" />}<span className="min-w-0 flex-1 truncate">{s.title}</span><span className="shrink-0 text-[11px] text-muted">{fmtDate(s.at, lang)}</span></Link>
                <button onClick={() => removeSaved(s.id)} aria-label="Delete" className="rounded-lg p-2 text-muted hover:text-red-400"><Trash2 size={14} /></button>
              </li>) })}</ul>
          ) : <p className="text-xs leading-relaxed text-muted">{d.noSaved}</p>}
        </Card>
      </div>
    </div>
  )
}

function ToolPage({ d, profile }: { d: Dict; profile: Profile }) {
  const { id } = useParams(), { tr } = useI18n(), agent = useAgent(), nav = useNavigate()
  const t = getTool(id)
  if (!t) return <div className="py-20 text-center text-muted">{d.notFound} <Link to="/app" className="brand-text underline">{d.back}</Link></div>
  const Comp = t.component
  const readyAlt = profile.tools.map(getTool).find(x => x?.status === 'ready')
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start gap-4">
        <span className="accent-bg accent-text flex size-12 shrink-0 items-center justify-center rounded-2xl"><t.icon size={22} /></span>
        <div className="min-w-0 flex-1 basis-[calc(100%-4.5rem)] sm:basis-0">
          <Link to="/app" className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg"><ArrowLeft size={12} className="rtl:rotate-180" />{d.back}</Link>
          <h1 className="font-display text-xl font-bold sm:text-2xl">{tr(t.label)}</h1>
          <p className="mt-0.5 text-sm text-muted">{tr(t.description)}</p>
        </div>
        {Comp && <div className="flex items-center gap-2"><ModeBadge /><Button size="sm" variant="soft" onClick={() => agent.setOpen(true)}><Sparkles size={15} className="brand-text" />{d.ask}</Button></div>}
      </div>
      {Comp ? <Suspense fallback={<div className="h-64 rounded-2xl border border-line bg-surface" />}><Comp key={t.id} /></Suspense> : (
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-fg/[0.07]"><Hammer size={18} className="text-muted" /></span>
              <div><h2 className="font-display font-semibold">{d.pvTitle}</h2><p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{d.pvBody}</p>
                {readyAlt && <Button size="sm" className="mt-4" onClick={() => nav(`/app/tool/${readyAlt.id}`)}>{d.tryReady}: {tr(readyAlt.label)}</Button>}</div></div>
          </Card>
          {([[d.inputs, t.inputs, ArrowDownToLine], [d.outputs, t.outputs, ArrowUpFromLine]] as const).map(([title, list, Icon]) => (
            <Card key={title} className="p-5"><h3 className="mb-3 flex items-center gap-2 text-xs font-medium text-muted"><Icon size={14} />{title}</h3>
              <ul className="space-y-2">{list.map((x, i) => <li key={i} className="rounded-xl border border-dashed border-line px-3 py-2.5 text-sm text-fg/80">{tr(x)}</li>)}</ul></Card>
          ))}
        </div>
      )}
    </div>
  )
}

function SettingsPage({ d, profile, session }: { d: Dict; profile: Profile; session: Session }) {
  const { tr } = useI18n(), nav = useNavigate(), ai = useAiStatus()
  const p = professions[profile.profession]
  const row = 'flex flex-wrap items-center justify-between gap-3 py-3.5'
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-2xl font-bold">{d.settings}</h1>
      <Card className="divide-y divide-line px-5">
        <div className={row}><span className="text-sm">{d.lang}</span><LangSwitch /></div>
        <div className={row}><span className="text-sm">{d.theme}</span><ThemeToggle /></div>
      </Card>
      <Card className="p-5">
        <h2 className="mb-3 font-display text-sm font-semibold">{d.profile}</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted">{d.field}</dt><dd>{tr(p.label)}</dd>
          <dt className="text-muted">{d.role}</dt><dd>{profile.role}</dd>
          <dt className="text-muted">{d.org}</dt><dd>{tr(orgTypes.find(o => o.id === profile.org)?.label ?? orgTypes[1].label)}</dd>
        </dl>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <Button variant="outline" size="sm" onClick={() => { resetDemo(); nav('/onboarding') }}><RotateCcw size={14} />{d.reset}</Button>
          <Button variant="ghost" size="sm" onClick={() => nav('/demo')}>{d.tour}</Button>
          <p className="w-full text-xs text-muted">{d.resetNote}</p>
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="mb-3 font-display text-sm font-semibold">{d.account}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-semibold text-white uppercase">{session.name.slice(0, 1)}</span>
          <div className="min-w-0 flex-1"><div className="text-sm font-medium">{session.name}</div><div className="truncate text-xs text-muted" dir="ltr">{session.email}</div></div>
          <Button variant="outline" size="sm" onClick={async () => { await auth.signOut(); nav('/') }}><LogOut size={14} className="rtl:-scale-x-100" />{d.logout}</Button>
        </div>
      </Card>
    </div>
  )
}
