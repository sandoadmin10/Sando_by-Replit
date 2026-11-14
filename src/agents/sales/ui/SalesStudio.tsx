// SANDO Professional Sales Employee — workspace UI. Reuses the agent studio building blocks from the
// Professional Marketer, plus sales-specific tabs: CRM, company profile, documents, outputs, history.
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Bot, LayoutGrid, FolderOpen, SquareKanban, FileStack, Building2, History, ShieldCheck, Globe, Wifi, WifiOff, Plus, Trash2, Check, X, Send, Copy, Mail, MessageCircle, AtSign, Phone, Upload, Download, Table2, LayoutList, AlertTriangle, PlayCircle, Sparkles } from 'lucide-react'
import { useDict, useI18n, fmtDate, fmtMoney, type L } from '../../../lib/i18n'
import { useStore, write, read } from '../../../lib/store'
import { getStatus, type AiStatus } from '../../../lib/ai'
import { Button, cn, inputCls, copyText } from '../../../components/ui'
import { skills as rawSkills } from '../skills/index.js'
import { demoCompany, demoSalesFiles, DEMO_SALES_OBJECTIVE } from '../demo/office.js'
import { readAttachment, toPayload, MAX_FILES, ACCEPT, type Attachment } from '../../marketing/files'
import { runAgent, type AgentEvent } from '../../marketing/run'
import { DocView, type Doc, type Brand } from '../../marketing/ui/DocView'
import { toExcel } from '../../marketing/exporters'
import { Composer, RunView, SkillSheet, FileChip, Sheet, ICONS, HUES, STUDIO_D, type Run, type Skill } from '../../marketing/ui/MarketerStudio'

// ---------------------------------------------------------------- types & storage
export type CatalogItem = { sku: string; name: string; price: number; unit: string }
export type Company = { name: string; description: string; segments: string; tone: string; signature: string; contact?: string; currency: string; taxRate: number; maxDiscount: number; validityDays: number; paymentTerms: string; catalog: CatalogItem[]; logo?: string; demo?: boolean }
export type Deal = { company: string; contact?: string; email?: string; phone?: string; city?: string; industry?: string; stage: string; value?: number; score?: number; next_action?: string; next_date?: string; notes?: string; source?: string; updated?: string; log?: { at: number; text: string }[] }
export type Draft = { id: string; channel: 'email' | 'whatsapp' | 'linkedin' | 'call'; company: string; to: string; subject: string; body: string; status?: 'pending' | 'sent' | 'discarded'; at?: number }
type HistoryItem = { id: string; objective: string; at: number; status: string; docs: string[] }
const KS = { company: 'sando.sales.company', crm: 'sando.sales.crm', outputs: 'sando.sales.outputs', history: 'sando.sales.history', drafts: 'sando.sales.drafts' }
const NONE: never[] = []
const skills = rawSkills as unknown as Skill[]
const STAGES = ['new', 'qualified', 'contacted', 'proposal', 'negotiation', 'won', 'lost'] as const
const today = () => new Date().toISOString().slice(0, 10)
const uid = () => Math.random().toString(36).slice(2, 10)
const blankCompany = (): Company => ({ name: '', description: '', segments: '', tone: '', signature: '', currency: 'SAR', taxRate: 15, maxDiscount: 10, validityDays: 30, paymentTerms: '', catalog: [] })

const D = {
  ar: {
    tabs: { agent: 'الوكيل', skills: 'المهارات', outputs: 'المخرجات', crm: 'الـ CRM', docs: 'المستندات', profile: 'ملف الشركة', history: 'السجل' },
    hello: 'أنا موظف المبيعات المحترف. أخبرني بهدفك وسأخطط وأنفّذ بالمهارات المتاحة، أو اختر مهارة بضغطة.',
    ph: 'ما الذي تريد إنجازه في المبيعات اليوم؟', demo: 'جرّب سيناريو تجريبي', completeProfile: 'أكمل ملف الشركة', live: 'ذكاء اصطناعي متصل', offline: 'الذكاء الاصطناعي غير متصل', webOn: 'بحث الويب مفعّل', webOff: 'بحث الويب غير مفعّل',
    skillsT: 'مهارات موظف المبيعات', skillsS: 'شغّل مهارة بنقرة، أو اكتب هدفاً كبيراً ودع ساندو يجمع المهارات بنفسه.', start: 'ابدأ', needsApproval: 'تتطلب موافقتك قبل الإرسال',
    approvals: 'بانتظار موافقتك', approve: { email: 'موافقة وفتح في البريد', whatsapp: 'موافقة وفتح واتساب', linkedin: 'موافقة ونسخ للينكدإن', call: 'موافقة ونسخ النص' }, copy: 'نسخ', discard: 'تجاهل', sent: 'تمت الموافقة', to: 'إلى', subject: 'الموضوع', channel: { email: 'بريد', whatsapp: 'واتساب', linkedin: 'لينكدإن', call: 'مكالمة' }, sentLog: 'أُرسلت رسالة {c} بموافقة المستخدم',
    noOutputs: 'لا توجد مخرجات بعد. ابدأ مهمة من تبويب الوكيل.', del: 'حذف', confirmDel: 'حذف هذا العنصر نهائياً؟',
    crm: { board: 'المسار', table: 'جدول', add: 'إضافة عميل', empty: 'الـ CRM فارغ. استورد ملف عملاء أو أضف عميلاً.', company: 'الشركة', contact: 'جهة الاتصال', email: 'البريد', phone: 'الهاتف', city: 'المدينة', industry: 'القطاع', stage: 'المرحلة', value: 'القيمة', score: 'التقييم', next: 'الإجراء التالي', date: 'التاريخ', notes: 'ملاحظات', save: 'حفظ', overdue: 'متأخر', stalled: 'راكد', export: 'تصدير Excel', total: 'قيمة المسار المفتوح', log: 'السجل' },
    stages: { new: 'جديد', qualified: 'مؤهل', contacted: 'تم التواصل', proposal: 'عرض مُرسل', negotiation: 'تفاوض', won: 'مغلقة رابحة', lost: 'خاسرة' } as Record<string, string>,
    docs: { t: 'المستندات المرفوعة', s: 'يقرأها الوكيل في كل مهامك خلال هذه الجلسة. تُستخرج داخل متصفحك.', upload: 'رفع ملفات', empty: 'لا توجد مستندات. ارفع كتالوجاً أو طلب عميل أو تقرير مبيعات.', preview: 'معاينة' },
    prof: { t: 'ملف الشركة', s: 'يستخدمه الوكيل في كل عرض ورسالة: الأسعار من الكتالوج، والخصم ضمن السياسة، وبنبرة شركتك.', name: 'اسم الشركة', description: 'نبذة', segments: 'القطاعات والعملاء المستهدفون', tone: 'نبرة التواصل', signature: 'التوقيع', contact: 'بيانات التواصل', currency: 'العملة', taxRate: 'الضريبة %', maxDiscount: 'أقصى خصم مسموح %', validityDays: 'صلاحية العرض (يوم)', paymentTerms: 'شروط الدفع', catalog: 'الكتالوج والأسعار المعتمدة', sku: 'الرمز', item: 'المنتج أو الخدمة', price: 'السعر', unit: 'الوحدة', addItem: 'إضافة بند', logo: 'الشعار', save: 'حفظ الملف', saved: 'تم الحفظ', loadDemo: 'تحميل شركة تجريبية', demoTag: 'بيانات تجريبية' },
    hist: { empty: 'لا توجد مهام سابقة.', outputs: 'مخرجات', open: 'عرض المخرجات' },
  },
  en: {
    tabs: { agent: 'Agent', skills: 'Skills', outputs: 'Outputs', crm: 'CRM', docs: 'Documents', profile: 'Company profile', history: 'History' },
    hello: 'I am your Professional Sales Employee. Tell me your goal and I will plan and execute with my skills, or pick a skill in one click.',
    ph: 'What would you like to accomplish in sales today?', demo: 'Try a sample scenario', completeProfile: 'Complete company profile', live: 'AI connected', offline: 'AI not connected', webOn: 'Web search on', webOff: 'Web search off',
    skillsT: 'Sales Employee skills', skillsS: 'Launch a skill in one click, or write a big objective and let SANDO combine skills itself.', start: 'Start', needsApproval: 'Requires your approval before sending',
    approvals: 'Awaiting your approval', approve: { email: 'Approve & open in email', whatsapp: 'Approve & open WhatsApp', linkedin: 'Approve & copy for LinkedIn', call: 'Approve & copy script' }, copy: 'Copy', discard: 'Discard', sent: 'Approved', to: 'To', subject: 'Subject', channel: { email: 'Email', whatsapp: 'WhatsApp', linkedin: 'LinkedIn', call: 'Call' }, sentLog: '{c} message sent with user approval',
    noOutputs: 'No outputs yet. Start a task from the Agent tab.', del: 'Delete', confirmDel: 'Delete this permanently?',
    crm: { board: 'Pipeline', table: 'Table', add: 'Add customer', empty: 'The CRM is empty. Import a lead file or add a customer.', company: 'Company', contact: 'Contact', email: 'Email', phone: 'Phone', city: 'City', industry: 'Industry', stage: 'Stage', value: 'Value', score: 'Score', next: 'Next action', date: 'Date', notes: 'Notes', save: 'Save', overdue: 'Overdue', stalled: 'Stalled', export: 'Export Excel', total: 'Open pipeline value', log: 'Activity' },
    stages: { new: 'New', qualified: 'Qualified', contacted: 'Contacted', proposal: 'Proposal sent', negotiation: 'Negotiation', won: 'Won', lost: 'Lost' } as Record<string, string>,
    docs: { t: 'Uploaded documents', s: 'The agent reads them in every task this session. Extracted inside your browser.', upload: 'Upload files', empty: 'No documents. Upload a catalog, a customer request or a sales report.', preview: 'Preview' },
    prof: { t: 'Company profile', s: 'Used in every quote and message: catalog prices, discounts within policy, your company tone.', name: 'Company name', description: 'About', segments: 'Target industries and customers', tone: 'Communication tone', signature: 'Signature', contact: 'Contact details', currency: 'Currency', taxRate: 'Tax %', maxDiscount: 'Max allowed discount %', validityDays: 'Quote validity (days)', paymentTerms: 'Payment terms', catalog: 'Approved catalog and prices', sku: 'SKU', item: 'Product or service', price: 'Price', unit: 'Unit', addItem: 'Add item', logo: 'Logo', save: 'Save profile', saved: 'Saved', loadDemo: 'Load sample company', demoTag: 'Sample data' },
    hist: { empty: 'No previous tasks.', outputs: 'outputs', open: 'View outputs' },
  },
}
type SD = typeof D.ar
type Tab = keyof SD['tabs']

// ---------------------------------------------------------------- root
export default function SalesStudio() {
  const d = useDict(D), sd = useDict(STUDIO_D), { tr, lang } = useI18n()
  const company = useStore<Company | null>(KS.company, null)
  const crm = useStore<Deal[]>(KS.crm, NONE)
  const outputs = useStore<Doc[]>(KS.outputs, NONE)
  const history = useStore<HistoryItem[]>(KS.history, NONE)
  const drafts = useStore<Draft[]>(KS.drafts, NONE)
  const [tab, setTab] = useState<Tab>('agent')
  const [files, setFiles] = useState<Attachment[]>([])
  const [objective, setObjective] = useState('')
  const [run, setRun] = useState<Run | null>(null)
  const [runDrafts, setRunDrafts] = useState<string[]>([])
  const [active, setActive] = useState('')
  const [skill, setSkill] = useState<Skill | null>(null)
  const [status, setStatus] = useState<AiStatus & { search?: boolean }>({ live: false })
  const [openDoc, setOpenDoc] = useState('')
  const ctl = useRef<AbortController | null>(null)
  useEffect(() => { getStatus().then(setStatus) }, [])
  const urls = useUrls(objective)
  const brand: Brand | undefined = company?.name ? { name: company.name, logo: company.logo } : undefined
  const running = run?.status === 'running'
  const profileReady = Boolean(company?.name && company.catalog.length)

  const addFiles = async (list: FileList | File[]) => {
    const arr = [...list].slice(0, Math.max(0, MAX_FILES - files.length))
    const ph = arr.map(f => ({ id: uid(), name: f.name, size: f.size, mime: f.type, kind: 'text' as const, status: 'reading' as const }))
    setFiles(c => [...c, ...ph])
    await Promise.all(arr.map(async (f, i) => { const a = await readAttachment(f); setFiles(c => c.map(x => (x.id === ph[i].id ? a : x))) }))
  }
  const upsertDeal = (rec: Partial<Deal> & { company: string }, logText?: string) => {
    const list = read<Deal[]>(KS.crm, NONE), i = list.findIndex(x => x.company.toLowerCase() === rec.company.toLowerCase())
    const log = logText ? [{ at: Date.now(), text: logText }] : []
    const next = i >= 0 ? list.map((x, j) => (j === i ? { ...x, ...rec, updated: today(), log: [...(x.log || []), ...log].slice(-30) } : x)) : [...list, { stage: 'new', ...rec, updated: today(), log } as Deal]
    write(KS.crm, next)
  }

  async function start(text: string, hints: string[] = []) {
    const obj = text.trim(); if (!obj || running) return
    setTab('agent'); setRun({ objective: obj, status: 'running', phase: 'understanding', steps: [], message: '', docs: [] }); setActive(''); setRunDrafts([]); setObjective('')
    const hid = uid(); write(KS.history, [{ id: hid, objective: obj, at: Date.now(), status: 'running', docs: [] }, ...read<HistoryItem[]>(KS.history, NONE)].slice(0, 40))
    const patchHist = (fn: (h: HistoryItem) => HistoryItem) => write(KS.history, read<HistoryItem[]>(KS.history, NONE).map(h => (h.id === hid ? fn(h) : h)))
    const c = new AbortController(); ctl.current = c
    const on = (e: AgentEvent | { type: 'crm'; record: Deal } | { type: 'approval'; draft: Draft }) => {
      if (e.type === 'phase') setRun(r => r && { ...r, phase: e.phase })
      else if (e.type === 'thinking') setRun(r => r && { ...r, phase: r.steps.length ? 'planning' : 'understanding' })
      else if (e.type === 'plan') setRun(r => r && { ...r, steps: [...r.steps, { kind: 'plan', text: e.text }] })
      else if (e.type === 'tool') setRun(r => {
        if (!r) return r
        const i = r.steps.findIndex(s => s.kind === 'tool' && s.id === e.id)
        if (i < 0) return { ...r, phase: e.phase || r.phase, steps: [...r.steps, { kind: 'tool', id: e.id, tool: e.tool || '', label: e.label || '', status: e.status }] }
        return { ...r, steps: r.steps.map((s, j) => (j === i ? { ...s, status: e.status, error: e.error } as typeof s : s)) }
      })
      else if (e.type === 'artifact') {
        const doc = { ...e.artifact, id: `${hid}-${e.artifact.id}` }
        setRun(r => r && { ...r, docs: [...r.docs.filter(x => x.id !== doc.id), doc] }); setActive(doc.id)
        write(KS.outputs, [doc, ...read<Doc[]>(KS.outputs, NONE).filter(x => x.id !== doc.id)].slice(0, 40))
        patchHist(h => ({ ...h, docs: [...new Set([...h.docs, doc.id])] }))
      } else if (e.type === 'crm') upsertDeal(e.record)
      else if (e.type === 'approval') { write(KS.drafts, [{ ...e.draft, status: 'pending', at: Date.now() }, ...read<Draft[]>(KS.drafts, NONE)].slice(0, 60)); setRunDrafts(x => [...x, e.draft.id]) }
      else if (e.type === 'done') { setRun(r => r && { ...r, status: e.status, message: e.message }); patchHist(h => ({ ...h, status: e.status })) }
    }
    try {
      await runAgent({ agent: 'sales', objective: obj, lang, skillHints: hints, demo: Boolean(company?.demo) || files.some(f => demoSalesFiles.some(x => x.name === f.name)), attachments: files.filter(f => f.status === 'ready').map(toPayload), company: company ?? undefined, crm: read<Deal[]>(KS.crm, NONE) }, on as (e: AgentEvent) => void, c.signal)
      setRun(r => (r && r.status === 'running' ? { ...r, status: 'failed', message: lang === 'ar' ? 'انقطع الاتصال قبل اكتمال المهمة.' : 'The connection ended before the task finished.' } : r))
    } catch (err) {
      setRun(r => r && (c.signal.aborted ? { ...r, status: 'cancelled' } : { ...r, status: 'failed', message: (err as Error).message }))
    }
  }
  const loadDemo = () => {
    write(KS.company, { ...demoCompany, demo: true })
    setFiles(demoSalesFiles.map(a => ({ id: uid(), name: a.name, size: 0, mime: '', status: 'ready', ...(a as object) } as Attachment)))
    setObjective(tr(DEMO_SALES_OBJECTIVE as L))
  }

  const badges = (<>
    {!profileReady && <button onClick={() => setTab('profile')} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-400/10 px-2.5 text-xs font-medium text-amber-600 dark:text-amber-400"><Building2 size={13} />{d.completeProfile}</button>}
    <span className={cn('inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs', status.live ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-600 dark:text-emerald-400' : 'border-line text-muted')}>{status.live ? <Wifi size={13} /> : <WifiOff size={13} />}{status.live ? d.live : d.offline}</span>
    <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs text-muted"><Globe size={13} />{status.search ? d.webOn : d.webOff}</span>
  </>)
  const pending = drafts.filter(x => x.status === 'pending')
  const TABS: [Tab, typeof Bot, number?][] = [['agent', Bot], ['skills', LayoutGrid], ['outputs', FolderOpen, outputs.length], ['crm', SquareKanban, crm.length], ['docs', FileStack, files.length], ['profile', Building2], ['history', History, history.length]]

  return (
    <div className="space-y-6" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files) }}>
      <nav className="thin-scroll -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {TABS.map(([id, I, n]) => (
          <button key={id} onClick={() => setTab(id)} className={cn('relative inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm transition', tab === id ? 'text-fg' : 'text-muted hover:bg-fg/5 hover:text-fg')}>
            {tab === id && <motion.span layoutId="sales-tab" className="absolute inset-0 rounded-xl border border-violet-400/40 bg-violet-500/10" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
            <I size={15} className="relative" /><span className="relative">{d.tabs[id]}</span>{n ? <span className="relative rounded-full bg-fg/10 px-1.5 text-[10px] tabular-nums">{n}</span> : null}
            {id === 'agent' && pending.length > 0 && <span className="relative size-2 rounded-full bg-amber-400" />}
          </button>
        ))}
      </nav>

      {tab === 'agent' && (<>
        <Composer d={sd} objective={objective} setObjective={setObjective} files={files} setFiles={setFiles} addFiles={addFiles} urls={urls} running={running}
          onRun={() => start(objective)} onStop={() => { ctl.current?.abort(); setRun(r => r && { ...r, status: 'cancelled' }) }} projects={[]} pid="" setPid={() => {}} onDemo={loadDemo} needsInput={run?.status === 'needs_input'}
          placeholder={d.ph} badges={badges} demoLabel={d.demo} hideProject />
        {run ? (
          <RunView d={sd} run={run} active={active} setActive={setActive} onDoc={doc => { setRun(r => r && { ...r, docs: r.docs.map(x => (x.id === doc.id ? doc : x)) }); write(KS.outputs, read<Doc[]>(KS.outputs, NONE).map(x => (x.id === doc.id ? doc : x))) }} onNew={() => setRun(null)}
            skillList={skills} brand={brand} extra={<Approvals d={d} drafts={drafts.filter(x => runDrafts.includes(x.id))} onSent={upsertDeal} />} />
        ) : (<>
          <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-sm leading-relaxed text-fg/85"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-white"><Bot size={17} /></span><p className="pt-1.5">{d.hello}</p></div>
          {pending.length > 0 && <div className="rounded-2xl border border-amber-400/40 bg-surface p-4"><Approvals d={d} drafts={pending} onSent={upsertDeal} /></div>}
          <SkillGrid d={d} running={running} onPick={setSkill} compact />
        </>)}
      </>)}
      {tab === 'skills' && <SkillGrid d={d} running={running} onPick={setSkill} />}
      {tab === 'outputs' && <Outputs d={d} outputs={outputs} brand={brand} open={openDoc} setOpen={setOpenDoc} />}
      {tab === 'crm' && <Crm d={d} crm={crm} currency={company?.currency} upsert={upsertDeal} />}
      {tab === 'docs' && <Docs d={d} files={files} setFiles={setFiles} addFiles={addFiles} />}
      {tab === 'profile' && <Profile d={d} company={company} onDemo={loadDemo} />}
      {tab === 'history' && <HistoryTab d={d} history={history} outputs={outputs} onOpen={id => { setOpenDoc(id); setTab('outputs') }} />}

      {skill && <SkillSheet d={sd} skill={skill} list={skills} files={files} addFiles={addFiles} setFiles={setFiles} onClose={() => setSkill(null)} onRun={t => { setSkill(null); start(t, [skill.id]); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />}
    </div>
  )
}
const useUrls = (s: string) => useMemo(() => [...new Set(s.match(/https?:\/\/[^\s،,)]+/g) || [])], [s])

// ---------------------------------------------------------------- skills grid
function SkillGrid({ d, running, onPick, compact }: { d: SD; running: boolean; onPick: (s: Skill) => void; compact?: boolean }) {
  const { tr } = useI18n()
  return (
    <section>
      <div className="mb-4"><h2 className="font-display text-lg font-bold">{d.skillsT}</h2><p className="mt-1 text-sm text-muted">{d.skillsS}</p></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {skills.map((s, i) => { const Icon = ICONS[s.icon] ?? Sparkles, hue = HUES[i % HUES.length]; return (
          <motion.div key={s.id} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }} style={{ '--hue': hue } as CSSProperties} className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface p-4">
            <div className="relative flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl" style={{ background: 'color-mix(in srgb, var(--hue) 18%, transparent)', color: 'var(--hue)' }}><Icon size={19} /></span><span className="font-display text-xs font-bold text-fg/25" dir="ltr">{String(i + 1).padStart(2, '0')}</span></div>
            <div className="relative mt-3 flex items-center gap-1.5 font-display text-sm font-semibold">{tr(s.label)}{(s as { approval?: boolean }).approval && <span title={d.needsApproval}><ShieldCheck size={14} className="ok-text" /></span>}</div>
            {!compact && <p className="relative mt-1 flex-1 text-xs leading-relaxed text-muted">{tr(s.short)}</p>}
            {!compact && <div className="relative mt-3 flex flex-wrap gap-1">{s.outputs.slice(0, 3).map((o, j) => <span key={j} className="rounded-md bg-fg/[0.06] px-1.5 py-0.5 text-[10px] text-fg/70">{tr(o)}</span>)}</div>}
            <Button size="sm" variant="soft" className={cn('relative w-full', compact ? 'mt-3' : 'mt-3.5')} disabled={running} onClick={() => onPick(s)}>{d.start}</Button>
          </motion.div>
        ) })}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- approvals (nothing reaches a customer without the user)
function Approvals({ d, drafts, onSent }: { d: SD; drafts: Draft[]; onSent: (r: Partial<Deal> & { company: string }, log?: string) => void }) {
  if (!drafts.length) return null
  const set = (id: string, patch: Partial<Draft>) => write(KS.drafts, read<Draft[]>(KS.drafts, NONE).map(x => (x.id === id ? { ...x, ...patch } : x)))
  const CH = { email: Mail, whatsapp: MessageCircle, linkedin: AtSign, call: Phone }
  const approve = async (x: Draft) => {
    if (x.channel === 'email') window.open(`mailto:${encodeURIComponent(x.to)}?subject=${encodeURIComponent(x.subject)}&body=${encodeURIComponent(x.body)}`, '_blank')
    else if (x.channel === 'whatsapp') window.open(`https://wa.me/${x.to.replace(/\D/g, '')}?text=${encodeURIComponent(x.body)}`, '_blank', 'noopener')
    else await copyText(`${x.subject ? x.subject + '\n\n' : ''}${x.body}`)
    set(x.id, { status: 'sent' })
    if (x.company) onSent({ company: x.company }, d.sentLog.replace('{c}', d.channel[x.channel]))
  }
  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400"><ShieldCheck size={14} />{d.approvals}</div>
      {drafts.map(x => { const I = CH[x.channel]; return (
        <div key={x.id} className={cn('rounded-xl border p-3 text-[13px]', x.status === 'pending' ? 'border-amber-400/50 bg-amber-400/5' : 'border-line opacity-70')}>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted"><I size={13} /><span className="font-medium text-fg">{d.channel[x.channel]}</span>{x.company && <span>· {x.company}</span>}{x.to && <span dir="ltr">· {x.to}</span>}</div>
          {x.subject && <input className={inputCls + ' mb-2 py-1.5 text-[13px]'} disabled={x.status !== 'pending'} value={x.subject} onChange={e => set(x.id, { subject: e.target.value })} aria-label={d.subject} />}
          <textarea rows={6} className={inputCls + ' text-[13px] leading-relaxed'} disabled={x.status !== 'pending'} value={x.body} onChange={e => set(x.id, { body: e.target.value })} />
          {x.status === 'pending' ? (
            <div className="mt-2 flex flex-wrap gap-2"><Button size="sm" onClick={() => approve(x)}><Send size={13} className="rtl:-scale-x-100" />{d.approve[x.channel]}</Button><Button size="sm" variant="ghost" onClick={() => copyText(x.body)}><Copy size={13} />{d.copy}</Button><Button size="sm" variant="ghost" onClick={() => set(x.id, { status: 'discarded' })}><X size={13} />{d.discard}</Button></div>
          ) : <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">{x.status === 'sent' ? <><Check size={13} className="ok-text" />{d.sent}</> : d.discard}</div>}
        </div>
      ) })}
    </div>
  )
}

// ---------------------------------------------------------------- outputs & history
function Outputs({ d, outputs, brand, open, setOpen }: { d: SD; outputs: Doc[]; brand?: Brand; open: string; setOpen: (s: string) => void }) {
  const { lang } = useI18n()
  const doc = outputs.find(x => x.id === open) ?? outputs[0]
  if (!outputs.length) return <Empty>{d.noOutputs}</Empty>
  return (
    <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <ul className="thin-scroll space-y-1.5 lg:max-h-[75vh] lg:overflow-y-auto">{outputs.map(x => (
        <li key={x.id} className={cn('flex items-center gap-1 rounded-xl border', doc?.id === x.id ? 'border-violet-400/60 bg-violet-500/10' : 'border-line')}>
          <button onClick={() => setOpen(x.id)} className="min-w-0 flex-1 px-3 py-2.5 text-start"><span className="block truncate text-sm font-medium">{x.title}</span><span className="text-[11px] text-muted">{fmtDate(x.at, lang)}</span></button>
          <button onClick={() => { if (window.confirm(d.confirmDel)) write(KS.outputs, outputs.filter(y => y.id !== x.id)) }} aria-label={d.del} className="p-2 text-muted hover:text-rose-400"><Trash2 size={14} /></button>
        </li>))}</ul>
      {doc && <DocView key={doc.id} doc={doc} brand={brand} onChange={nd => write(KS.outputs, outputs.map(x => (x.id === nd.id ? nd : x)))} />}
    </div>
  )
}
function HistoryTab({ d, history, outputs, onOpen }: { d: SD; history: HistoryItem[]; outputs: Doc[]; onOpen: (id: string) => void }) {
  const { lang } = useI18n(), sd = useDict(STUDIO_D)
  if (!history.length) return <Empty>{d.hist.empty}</Empty>
  return (
    <ul className="space-y-2">{history.map(h => { const docs = h.docs.filter(id => outputs.some(o => o.id === id)); return (
      <li key={h.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4">
        <div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm">{h.objective}</p><p className="mt-1 text-[11px] text-muted">{fmtDate(h.at, lang)} · {sd.status[h.status] ?? h.status} · {docs.length} {d.hist.outputs}</p></div>
        {docs.length > 0 && <Button size="sm" variant="outline" onClick={() => onOpen(docs[0])}>{d.hist.open}</Button>}
      </li>) })}</ul>
  )
}
const Empty = ({ children }: { children: ReactNode }) => <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">{children}</div>

// ---------------------------------------------------------------- CRM
function Crm({ d, crm, currency, upsert }: { d: SD; crm: Deal[]; currency?: string; upsert: (r: Partial<Deal> & { company: string }, log?: string) => void }) {
  const { lang } = useI18n()
  const [view, setView] = useState<'board' | 'table'>('board'), [edit, setEdit] = useState<Deal | null>(null)
  const t = today(), idle = (x: Deal) => x.updated && (Date.parse(t) - Date.parse(x.updated)) / 864e5 > 14 && !['won', 'lost'].includes(x.stage)
  const money = (n?: number) => (n == null ? '—' : currency && currency !== 'SAR' ? `${n.toLocaleString('en-US')} ${currency}` : fmtMoney(n, lang))
  const open = crm.filter(x => !['won', 'lost'].includes(x.stage)).reduce((s, x) => s + (x.value || 0), 0)
  const exportXlsx = () => toExcel({ id: 'crm', kind: 'workbook', title: 'CRM', lang, at: Date.now(), blocks: [{ type: 'table', title: 'CRM', columns: [d.crm.company, d.crm.stage, d.crm.value, d.crm.score, d.crm.contact, d.crm.email, d.crm.phone, d.crm.city, d.crm.industry, d.crm.next, d.crm.date, d.crm.notes], rows: crm.map(x => [x.company, d.stages[x.stage] ?? x.stage, String(x.value ?? ''), String(x.score ?? ''), x.contact ?? '', x.email ?? '', x.phone ?? '', x.city ?? '', x.industry ?? '', x.next_action ?? '', x.next_date ?? '', x.notes ?? '']) }] })
  const Card = ({ x }: { x: Deal }) => (
    <button onClick={() => setEdit(x)} className="w-full rounded-xl border border-line bg-surface p-3 text-start transition hover:border-fg/25">
      <div className="flex items-start justify-between gap-2"><span className="text-[13px] leading-snug font-medium">{x.company}</span>{x.score != null && <span className="shrink-0 rounded-md bg-violet-500/15 px-1.5 text-[10px] font-semibold brand-text tabular-nums">{x.score}</span>}</div>
      {x.value != null && <div className="mt-1 text-xs font-semibold tabular-nums" dir="ltr">{money(x.value)}</div>}
      {x.next_action && <div className="mt-1.5 truncate text-[11px] text-muted">{x.next_action}{x.next_date ? ` · ${x.next_date}` : ''}</div>}
      <div className="mt-1.5 flex gap-1">{x.next_date && x.next_date < t && !['won', 'lost'].includes(x.stage) && <span className="rounded bg-rose-500/15 px-1.5 text-[10px] text-rose-400">{d.crm.overdue}</span>}{idle(x) && <span className="rounded bg-amber-500/15 px-1.5 text-[10px] text-amber-500">{d.crm.stalled}</span>}</div>
    </button>
  )
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-line p-1">{(['board', 'table'] as const).map(v => <button key={v} onClick={() => setView(v)} className={cn('inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs', view === v ? 'bg-fg/10 text-fg' : 'text-muted')}>{v === 'board' ? <SquareKanban size={13} /> : <LayoutList size={13} />}{d.crm[v]}</button>)}</div>
        <span className="text-xs text-muted">{d.crm.total}: <b className="text-fg tabular-nums" dir="ltr">{money(open)}</b></span>
        <div className="ms-auto flex gap-2">{crm.length > 0 && <Button size="sm" variant="ghost" onClick={exportXlsx}><Table2 size={14} />{d.crm.export}</Button>}<Button size="sm" onClick={() => setEdit({ company: '', stage: 'new' })}><Plus size={14} />{d.crm.add}</Button></div>
      </div>
      {!crm.length ? <Empty>{d.crm.empty}</Empty> : view === 'board' ? (
        <div className="thin-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">{STAGES.map(st => { const col = crm.filter(x => x.stage === st); return (
          <div key={st} className="w-60 shrink-0 rounded-2xl bg-fg/[0.03] p-2.5">
            <div className="mb-2 flex items-center justify-between px-1 text-xs font-semibold"><span>{d.stages[st]}</span><span className="text-muted tabular-nums">{col.length}</span></div>
            <div className="space-y-2">{col.map(x => <Card key={x.company} x={x} />)}</div>
          </div>) })}</div>
      ) : (
        <div className="thin-scroll overflow-x-auto rounded-2xl border border-line bg-surface"><table className="w-full min-w-[760px] text-xs">
          <thead><tr className="bg-fg/5">{[d.crm.company, d.crm.stage, d.crm.value, d.crm.score, d.crm.next, d.crm.date, d.crm.city].map(h => <th key={h} className="p-3 text-start font-medium">{h}</th>)}</tr></thead>
          <tbody>{[...crm].sort((a, b) => (b.score ?? -1) - (a.score ?? -1)).map(x => (
            <tr key={x.company} onClick={() => setEdit(x)} className="cursor-pointer border-t border-line hover:bg-fg/[0.03]">
              <td className="p-3 font-medium">{x.company}</td><td className="p-3">{d.stages[x.stage] ?? x.stage}</td><td className="p-3 tabular-nums" dir="ltr">{money(x.value)}</td><td className="p-3 tabular-nums">{x.score ?? '—'}</td><td className="p-3">{x.next_action ?? '—'}</td>
              <td className={cn('p-3 tabular-nums', x.next_date && x.next_date < t && !['won', 'lost'].includes(x.stage) && 'text-rose-400')}>{x.next_date ?? '—'}</td><td className="p-3">{x.city ?? '—'}</td>
            </tr>))}</tbody>
        </table></div>
      )}
      {edit && <DealSheet d={d} deal={edit} onClose={() => setEdit(null)} onSave={x => { const old = crm.find(y => y.company.toLowerCase() === edit.company.toLowerCase()); if (old && old.company !== x.company) write(KS.crm, crm.filter(y => y !== old)); upsert(x); setEdit(null) }} onDelete={edit.company ? () => { if (window.confirm(d.confirmDel)) { write(KS.crm, crm.filter(y => y.company !== edit.company)); setEdit(null) } } : undefined} />}
    </div>
  )
}
function DealSheet({ d, deal, onClose, onSave, onDelete }: { d: SD; deal: Deal; onClose: () => void; onSave: (x: Deal) => void; onDelete?: () => void }) {
  const { lang } = useI18n()
  const [x, setX] = useState<Deal>(deal)
  const F = (k: keyof Deal, label: string, type = 'text') => (
    <label className="block"><span className="mb-1 block text-xs text-muted">{label}</span>
      <input type={type} dir={['email', 'phone'].includes(k) || type !== 'text' ? 'ltr' : undefined} className={inputCls} value={(x[k] as string | number | undefined) ?? ''} onChange={e => setX({ ...x, [k]: type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value })} /></label>
  )
  return (
    <Sheet onClose={onClose}>
      <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-bold">{deal.company || d.crm.add}</h2><button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-muted hover:bg-fg/5"><X size={18} /></button></div>
      <div className="grid gap-3 sm:grid-cols-2">
        {F('company', d.crm.company)}
        <label className="block"><span className="mb-1 block text-xs text-muted">{d.crm.stage}</span><select className={inputCls} value={x.stage} onChange={e => setX({ ...x, stage: e.target.value })}>{STAGES.map(s => <option key={s} value={s}>{d.stages[s]}</option>)}</select></label>
        {F('value', d.crm.value, 'number')}{F('score', d.crm.score, 'number')}{F('contact', d.crm.contact)}{F('email', d.crm.email)}{F('phone', d.crm.phone)}{F('city', d.crm.city)}{F('industry', d.crm.industry)}{F('next_action', d.crm.next)}{F('next_date', d.crm.date, 'date')}
        <label className="block sm:col-span-2"><span className="mb-1 block text-xs text-muted">{d.crm.notes}</span><textarea rows={3} className={inputCls} value={x.notes ?? ''} onChange={e => setX({ ...x, notes: e.target.value })} /></label>
      </div>
      {!!deal.log?.length && <div className="mt-4"><div className="mb-1.5 text-xs font-medium text-muted">{d.crm.log}</div><ul className="space-y-1 text-xs">{deal.log.slice().reverse().map((l, i) => <li key={i} className="flex justify-between gap-3"><span>{l.text}</span><span className="shrink-0 text-muted">{fmtDate(l.at, lang)}</span></li>)}</ul></div>}
      <div className="mt-5 flex items-center justify-between gap-2">{onDelete ? <Button size="sm" variant="ghost" className="text-rose-400" onClick={onDelete}><Trash2 size={14} />{d.del}</Button> : <span />}<Button disabled={!x.company.trim()} onClick={() => onSave({ ...x, company: x.company.trim() })}>{d.crm.save}</Button></div>
    </Sheet>
  )
}

// ---------------------------------------------------------------- documents
function Docs({ d, files, setFiles, addFiles }: { d: SD; files: Attachment[]; setFiles: (f: (c: Attachment[]) => Attachment[]) => void; addFiles: (f: FileList) => void }) {
  const sd = useDict(STUDIO_D), input = useRef<HTMLInputElement>(null)
  const [sel, setSel] = useState('')
  const a = files.find(f => f.id === sel)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-line p-5">
        <div><h2 className="font-display font-semibold">{d.docs.t}</h2><p className="mt-1 text-xs text-muted">{d.docs.s}</p></div>
        <input ref={input} type="file" multiple accept={ACCEPT} hidden onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }} />
        <Button size="sm" onClick={() => input.current?.click()}><Upload size={14} />{d.docs.upload}</Button>
      </div>
      {!files.length ? <Empty>{d.docs.empty}</Empty> : (
        <div className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="flex flex-col gap-2">{files.map(f => <button key={f.id} onClick={() => setSel(f.id)} className={cn('rounded-xl text-start', sel === f.id && 'ring-2 ring-violet-400/60')}><FileChip a={f} d={sd} onRemove={() => setFiles(c => c.filter(x => x.id !== f.id))} /></button>)}</div>
          {a && a.status === 'ready' && (
            <div className="min-w-0 rounded-2xl border border-line bg-surface p-4">
              <div className="mb-2 text-xs font-medium text-muted">{d.docs.preview} · {a.name}</div>
              {a.kind === 'image' ? <img src={a.preview} alt="" className="max-h-[60vh] rounded-lg" /> : a.kind === 'table' ? (
                <div className="thin-scroll overflow-x-auto"><table className="w-full text-xs"><thead><tr className="bg-fg/5">{a.columns?.map((c, i) => <th key={i} className="p-2 text-start font-medium whitespace-nowrap">{c}</th>)}</tr></thead><tbody>{a.rows?.slice(0, 30).map((r, i) => <tr key={i} className="border-t border-line">{r.map((c, j) => <td key={j} className="p-2 whitespace-nowrap">{c}</td>)}</tr>)}</tbody></table></div>
              ) : <pre className="thin-scroll max-h-[60vh] overflow-auto text-xs leading-relaxed whitespace-pre-wrap" dir="auto">{a.text?.slice(0, 6000)}</pre>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- company profile
function Profile({ d, company, onDemo }: { d: SD; company: Company | null; onDemo: () => void }) {
  const [c, setC] = useState<Company>(company ?? blankCompany())
  const [saved, setSaved] = useState(false)
  useEffect(() => { if (company) setC(company) }, [company])
  const set = <K extends keyof Company>(k: K, v: Company[K]) => { setC(x => ({ ...x, [k]: v })); setSaved(false) }
  const logo = async (f?: File) => {
    if (!f || !/^image\//.test(f.type)) return
    const bmp = await createImageBitmap(f), s = Math.min(1, 320 / Math.max(bmp.width, bmp.height))
    const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * s); cv.height = Math.round(bmp.height * s); cv.getContext('2d')!.drawImage(bmp, 0, 0, cv.width, cv.height)
    set('logo', cv.toDataURL('image/png'))
  }
  const T = (k: 'name' | 'currency' | 'paymentTerms' | 'contact' | 'tone', label: string) => <label className="block"><span className="mb-1 block text-xs text-muted">{label}</span><input className={inputCls} value={(c[k] as string) ?? ''} onChange={e => set(k, e.target.value)} /></label>
  const N = (k: 'taxRate' | 'maxDiscount' | 'validityDays', label: string) => <label className="block"><span className="mb-1 block text-xs text-muted">{label}</span><input type="number" dir="ltr" min={0} className={inputCls} value={c[k]} onChange={e => set(k, Math.max(0, Number(e.target.value) || 0))} /></label>
  const A = (k: 'description' | 'segments' | 'signature', label: string) => <label className="block sm:col-span-2"><span className="mb-1 block text-xs text-muted">{label}</span><textarea rows={2} className={inputCls} value={c[k]} onChange={e => set(k, e.target.value)} /></label>
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-display text-lg font-bold">{d.prof.t}{c.demo && <span className="ms-2 rounded-full border border-amber-400/50 px-2 py-0.5 align-middle text-[10px] text-amber-500">{d.prof.demoTag}</span>}</h2><p className="mt-1 max-w-2xl text-sm text-muted">{d.prof.s}</p></div>
        <Button size="sm" variant="ghost" onClick={onDemo}><PlayCircle size={14} />{d.prof.loadDemo}</Button>
      </div>
      <div className="grid gap-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-2">
        {T('name', d.prof.name)}
        <label className="block"><span className="mb-1 block text-xs text-muted">{d.prof.logo}</span><span className="flex items-center gap-3">{c.logo && <img src={c.logo} alt="" className="h-10 rounded border border-line bg-white object-contain p-1" />}<span className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-line px-3 text-xs hover:bg-fg/5"><Upload size={13} />{d.prof.logo}<input type="file" accept="image/*" hidden onChange={e => logo(e.target.files?.[0])} /></span></span></label>
        {A('description', d.prof.description)}{A('segments', d.prof.segments)}{T('tone', d.prof.tone)}{T('contact', d.prof.contact)}{A('signature', d.prof.signature)}
        {T('currency', d.prof.currency)}{N('taxRate', d.prof.taxRate)}{N('maxDiscount', d.prof.maxDiscount)}{N('validityDays', d.prof.validityDays)}
        <label className="block sm:col-span-2"><span className="mb-1 block text-xs text-muted">{d.prof.paymentTerms}</span><input className={inputCls} value={c.paymentTerms} onChange={e => set('paymentTerms', e.target.value)} /></label>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="mb-3 flex items-center justify-between"><h3 className="font-display font-semibold">{d.prof.catalog}</h3><Button size="sm" variant="outline" onClick={() => set('catalog', [...c.catalog, { sku: '', name: '', price: 0, unit: '' }])}><Plus size={14} />{d.prof.addItem}</Button></div>
        <div className="space-y-2">{c.catalog.map((it, i) => (
          <div key={i} className="grid grid-cols-[5rem_minmax(0,1fr)_6rem_5rem_auto] items-center gap-2">
            {(['sku', 'name', 'price', 'unit'] as const).map(k => <input key={k} placeholder={d.prof[k === 'name' ? 'item' : k]} type={k === 'price' ? 'number' : 'text'} dir={k === 'price' || k === 'sku' ? 'ltr' : undefined} className={inputCls + ' py-2'} value={it[k]} onChange={e => set('catalog', c.catalog.map((x, j) => (j === i ? { ...x, [k]: k === 'price' ? Number(e.target.value) || 0 : e.target.value } : x)))} />)}
            <button onClick={() => set('catalog', c.catalog.filter((_, j) => j !== i))} aria-label={d.del} className="p-2 text-muted hover:text-rose-400"><Trash2 size={14} /></button>
          </div>))}</div>
      </div>
      <div className="flex justify-end"><Button onClick={() => { write(KS.company, { ...c, catalog: c.catalog.filter(x => x.name.trim()) }); setSaved(true) }}>{saved ? <Check size={15} /> : <Download size={15} className="rotate-180" />}{saved ? d.prof.saved : d.prof.save}</Button></div>
      {!c.catalog.length && <p className="flex items-center gap-2 text-xs text-amber-500"><AlertTriangle size={13} />{d.completeProfile}</p>}
    </div>
  )
}
