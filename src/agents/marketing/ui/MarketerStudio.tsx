import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Radar, MessagesSquare, Crosshair, FlaskConical, FileSignature, ShieldCheck, LineChart, Brain, Users, FileUp, Target, Building2, Mail, CalendarClock, MessageSquareText, Receipt, Handshake, BadgeCheck, SquareKanban, ChartColumn, Swords, Paperclip, ArrowUp, Square, X, FileText, Table2, Image as ImageIcon, AlertTriangle, Check, Loader2, Link2, Sparkles, FolderPlus, Trash2, Download, PlayCircle, ChevronDown, Pencil, CircleDot } from 'lucide-react'
import { useDict, useI18n, fmtDate, type L } from '../../../lib/i18n'
import { Button, cn, download, inputCls } from '../../../components/ui'
import { skills } from '../skills/index.js'
import { demoProject, DEMO_OBJECTIVE } from '../demo/coffee.js'
import { readAttachment, toPayload, ACCEPT, MAX_FILES, type Attachment } from '../files'
import { useProjects, putProject, deleteProject, newId, type Project } from '../memory'
import { runAgent, type AgentEvent } from '../run'
import { DocView, type Doc, type Brand } from './DocView'

export type Skill = (typeof skills)[number]
export const ICONS: Record<string, typeof Radar> = { Radar, MessagesSquare, Crosshair, FlaskConical, FileSignature, ShieldCheck, LineChart, Brain, Users, FileUp, Target, Building2, Mail, CalendarClock, MessageSquareText, Receipt, FileText, Handshake, BadgeCheck, SquareKanban, ChartColumn, Swords }
export const HUES = ['#a78bfa', '#22d3ee', '#f472b6', '#fbbf24', '#818cf8', '#34d399', '#60a5fa', '#c084fc', '#fb923c', '#2dd4bf', '#e879f9', '#4ade80', '#f87171', '#38bdf8']

export const STUDIO_D = {
  ar: {
    ph: 'ما الذي تريد إنجازه تسويقيًا اليوم؟', hint: 'صِف هدفك، الصق روابط، أو أرفق ملفات — ساندو يخطط وينفّذ ويسلّمك مخرجات جاهزة.', attach: 'إرفاق', run: 'ابدأ', stop: 'إيقاف', drop: 'أفلت الملفات هنا',
    project: 'المشروع', noProject: 'بدون مشروع', newProject: 'مشروع جديد', demo: 'جرّب سيناريو علامة القهوة', demoTag: 'تجريبي',
    skillsT: 'مهارات المسوّق', skillsS: 'شغّل مهارة بنقرة، أو اكتب هدفاً كبيراً ودع ساندو يجمع المهارات بنفسه.', start: 'ابدأ', inputs: 'المدخلات', outputs: 'المخرجات', examples: 'أمثلة',
    activity: 'نشاط الوكيل', deliverables: 'المخرجات', empty: 'ستظهر المخرجات هنا أثناء العمل.', you: 'أنت', newTask: 'مهمة جديدة',
    status: { understanding: 'فهم الهدف', planning: 'التخطيط', researching: 'البحث', processing: 'قراءة الملفات', analysis: 'التحليل', producing: 'إعداد المخرجات', memory: 'الذاكرة', validating: 'التحقق', input: 'بانتظارك', completed: 'اكتمل', partial: 'اكتمل جزئياً', failed: 'تعذّر الإكمال', cancelled: 'أُوقف', needs_input: 'يحتاج معلومة منك', unavailable: 'غير متاح', running: 'يعمل' } as Record<string, string>,
    tools: { get_company_profile: 'قراءة ملف الشركة', build_quotation: 'حساب عرض السعر', crm_list: 'قراءة الـ CRM', crm_upsert: 'تحديث الـ CRM', draft_message: 'تجهيز رسالة للموافقة', calculate_sales_metrics: 'حساب مؤشرات المبيعات', load_skill: 'تحميل مهارة', fetch_public_page: 'قراءة صفحة ويب', search_web: 'بحث في الويب', read_attachment: 'قراءة ملف', search_in_attachments: 'بحث في الملفات', analyze_table: 'تحليل جدول', calculate_marketing_metrics: 'حساب مؤشرات الأداء', view_image: 'فحص صورة', retrieve_project_memory: 'استرجاع الذاكرة', save_project_memory: 'حفظ في الذاكرة', create_deliverable: 'إنشاء مخرج', ask_user: 'سؤال لك' } as Record<string, string>,
    fileErr: { legacy: 'صيغة قديمة: احفظه كـ DOCX/XLSX/PPTX', 'too-large': 'أكبر من 15 MB', unsupported: 'نوع غير مدعوم', unreadable: 'تعذّرت القراءة' } as Record<string, string>, scanned: 'نص قليل (قد يكون ممسوحاً)', rows: 'صف', chars: 'حرف', pages: 'صفحة',
    required: 'أكمل الحقول المطلوبة', cancel: 'إلغاء', reply: 'أجب هنا ثم أرسل للمتابعة',
    mem: { title: 'ذاكرة التسويق', sub: 'كل ما يعرفه ساندو عن مشاريعك. يسترجعه الوكيل قبل المهام ويضيف إليه بعدها.', records: 'السجلات', docs: 'المخرجات المحفوظة', add: 'إضافة سجل', kind: 'النوع', titleF: 'العنوان', content: 'المحتوى', save: 'حفظ', export: 'تصدير JSON', del: 'حذف المشروع', confirmDel: 'سيُحذف المشروع وكل سجلاته ومخرجاته نهائياً. هل أنت متأكد؟', confirmRec: 'حذف هذا السجل؟', none: 'لا توجد مشاريع بعد. ابدأ مهمة وسيُنشأ مشروع تلقائياً.', open: 'فتح', fromAgent: 'من الوكيل', select: 'اختيار' },
  },
  en: {
    ph: 'What would you like to accomplish today?', hint: 'Describe your goal, paste links or attach files — SANDO plans, executes and hands you finished deliverables.', attach: 'Attach', run: 'Start', stop: 'Stop', drop: 'Drop files here',
    project: 'Project', noProject: 'No project', newProject: 'New project', demo: 'Try the coffee brand scenario', demoTag: 'Demo',
    skillsT: 'Marketer skills', skillsS: 'Launch a skill in one click, or write a big objective and let SANDO combine skills itself.', start: 'Start', inputs: 'Inputs', outputs: 'Outputs', examples: 'Examples',
    activity: 'Agent activity', deliverables: 'Deliverables', empty: 'Deliverables appear here as the agent works.', you: 'You', newTask: 'New task',
    status: { understanding: 'Understanding objective', planning: 'Planning', researching: 'Researching', processing: 'Reading files', analysis: 'Running analysis', producing: 'Producing deliverables', memory: 'Memory', validating: 'Validating', input: 'Waiting for you', completed: 'Completed', partial: 'Partially completed', failed: 'Could not complete', cancelled: 'Stopped', needs_input: 'Needs your input', unavailable: 'Unavailable', running: 'Working' } as Record<string, string>,
    tools: { get_company_profile: 'Reading company profile', build_quotation: 'Calculating quotation', crm_list: 'Reading CRM', crm_upsert: 'Updating CRM', draft_message: 'Drafting message for approval', calculate_sales_metrics: 'Calculating sales metrics', load_skill: 'Loading skill', fetch_public_page: 'Reading web page', search_web: 'Searching the web', read_attachment: 'Reading file', search_in_attachments: 'Searching files', analyze_table: 'Profiling table', calculate_marketing_metrics: 'Calculating metrics', view_image: 'Inspecting image', retrieve_project_memory: 'Recalling memory', save_project_memory: 'Saving to memory', create_deliverable: 'Creating deliverable', ask_user: 'Question for you' } as Record<string, string>,
    fileErr: { legacy: 'Old format: save as DOCX/XLSX/PPTX', 'too-large': 'Larger than 15 MB', unsupported: 'Unsupported type', unreadable: 'Could not be read' } as Record<string, string>, scanned: 'Little text (maybe scanned)', rows: 'rows', chars: 'chars', pages: 'pages',
    required: 'Complete the required fields', cancel: 'Cancel', reply: 'Answer here and send to continue',
    mem: { title: 'Marketing Memory', sub: 'Everything SANDO knows about your projects. The agent recalls it before tasks and adds to it after.', records: 'Records', docs: 'Saved deliverables', add: 'Add record', kind: 'Kind', titleF: 'Title', content: 'Content', save: 'Save', export: 'Export JSON', del: 'Delete project', confirmDel: 'This permanently deletes the project and all its records and deliverables. Are you sure?', confirmRec: 'Delete this record?', none: 'No projects yet. Start a task and a project is created automatically.', open: 'Open', fromAgent: 'from agent', select: 'Select' },
  },
}
export type Dict = typeof STUDIO_D.ar
export type Step = { kind: 'plan'; text: string } | { kind: 'tool'; id: string; tool: string; label: string; status: 'running' | 'done' | 'failed'; error?: string }
export type Run = { objective: string; status: string; phase: string; steps: Step[]; message: string; docs: Doc[] }

export default function MarketerStudio() {
  const d = useDict(STUDIO_D), { tr, lang } = useI18n()
  const [projects] = useProjects()
  const [pid, setPid] = useState<string>(() => { try { return localStorage.getItem('sando.marketer.project') || '' } catch { return '' } })
  const project = projects.find(p => p.id === pid) || null
  useEffect(() => { try { localStorage.setItem('sando.marketer.project', pid) } catch { /* ignore */ } }, [pid])

  const [objective, setObjective] = useState('')
  const [files, setFiles] = useState<Attachment[]>([])
  const [run, setRun] = useState<Run | null>(null)
  const [active, setActive] = useState<string>('')
  const [skill, setSkill] = useState<Skill | null>(null)
  const [memoryOpen, setMemoryOpen] = useState(false)
  const ctl = useRef<AbortController | null>(null)
  const projRef = useRef<Project | null>(null); projRef.current = project
  const running = run?.status === 'running'

  const addFiles = async (list: FileList | File[]) => {
    const arr = [...list].slice(0, Math.max(0, MAX_FILES - files.length))
    const placeholders = arr.map(f => ({ id: Math.random().toString(36).slice(2), name: f.name, size: f.size, mime: f.type, kind: 'text' as const, status: 'reading' as const }))
    setFiles(c => [...c, ...placeholders])
    await Promise.all(arr.map(async (f, i) => { const a = await readAttachment(f); setFiles(c => c.map(x => (x.id === placeholders[i].id ? a : x))) }))
  }
  const urls = useMemo(() => [...new Set(objective.match(/https?:\/\/[^\s،,)]+/g) || [])], [objective])

  const ensureProject = async (title: string) => {
    if (projRef.current) return projRef.current
    const p = await putProject({ id: newId(), name: title.slice(0, 48) || d.newProject, records: [], artifacts: [], runs: [], at: Date.now() })
    setPid(p.id); projRef.current = p; return p
  }
  const patchProject = async (fn: (p: Project) => Project) => { const p = projRef.current; if (p) projRef.current = await putProject(fn(p)) }

  async function start(text: string, hints: string[] = []) {
    const obj = text.trim()
    if (!obj || running) return
    const p = await ensureProject(obj)
    const ready = files.filter(f => f.status === 'ready')
    setRun({ objective: obj, status: 'running', phase: 'understanding', steps: [], message: '', docs: [] }); setActive(''); setObjective('')
    const c = new AbortController(); ctl.current = c
    const on = (e: AgentEvent) => {
      if (e.type === 'phase') setRun(r => r && { ...r, phase: e.phase })
      else if (e.type === 'thinking') setRun(r => r && { ...r, phase: r.steps.length ? 'planning' : 'understanding' })
      else if (e.type === 'plan') setRun(r => r && { ...r, steps: [...r.steps, { kind: 'plan', text: e.text }] })
      else if (e.type === 'tool') setRun(r => {
        if (!r) return r
        const i = r.steps.findIndex(s => s.kind === 'tool' && s.id === e.id)
        if (i < 0) return { ...r, phase: e.phase || r.phase, steps: [...r.steps, { kind: 'tool', id: e.id, tool: e.tool || '', label: e.label || '', status: e.status }] }
        return { ...r, steps: r.steps.map((s, j) => (j === i ? { ...s, status: e.status, error: e.error } as Step : s)) }
      })
      else if (e.type === 'artifact') {
        setRun(r => r && { ...r, docs: [...r.docs.filter(x => x.id !== e.artifact.id), e.artifact] }); setActive(e.artifact.id)
        patchProject(pp => ({ ...pp, artifacts: [...pp.artifacts.filter(x => !(x.id === e.artifact.id && x.at === e.artifact.at)), e.artifact] }))
      } else if (e.type === 'memory') patchProject(pp => ({ ...pp, records: [...pp.records, { id: newId(), ...e.record, at: Date.now(), source: pp.demo ? 'demo' : 'agent' }] }))
      else if (e.type === 'done') { setRun(r => r && { ...r, status: e.status, message: e.message }); patchProject(pp => ({ ...pp, runs: [...pp.runs, { objective: obj, at: Date.now(), status: e.status }].slice(-30) })) }
    }
    try {
      await runAgent({ objective: obj, lang, skillHints: hints, demo: Boolean(p.demo), attachments: ready.map(toPayload), project: { name: p.name, records: p.records } }, on, c.signal)
      setRun(r => (r && r.status === 'running' ? { ...r, status: 'failed', message: lang === 'ar' ? 'انقطع الاتصال قبل اكتمال المهمة.' : 'The connection ended before the task finished.' } : r))
    } catch (e) {
      setRun(r => r && (c.signal.aborted ? { ...r, status: 'cancelled' } : { ...r, status: 'failed', message: (e as Error).message }))
    }
  }
  const stop = () => { ctl.current?.abort(); setRun(r => r && { ...r, status: 'cancelled' }) }
  const loadDemo = async () => {
    const existing = projects.find(p => p.demo)
    const p = existing ?? await putProject({ id: newId(), name: tr(demoProject.name as L), demo: true, records: demoProject.records.map(r => ({ id: newId(), ...r, at: Date.now(), source: 'demo' as const })), artifacts: [], runs: [], at: Date.now() })
    setPid(p.id)
    setFiles(demoProject.attachments.map(a => ({ id: newId(), name: a.name, size: 'text' in a && a.text ? a.text.length : 0, mime: '', status: 'ready', ...(a as object) } as Attachment)))
    setObjective(tr(DEMO_OBJECTIVE as L))
  }
  const updateDoc = (doc: Doc) => { setRun(r => r && { ...r, docs: r.docs.map(x => (x.id === doc.id ? doc : x)) }); patchProject(pp => ({ ...pp, artifacts: pp.artifacts.map(x => (x.id === doc.id && x.at === doc.at ? doc : x)) })) }

  return (
    <div className="space-y-8" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files) }}>
      <Composer d={d} objective={objective} setObjective={setObjective} files={files} setFiles={setFiles} addFiles={addFiles} urls={urls} running={running}
        onRun={() => start(objective)} onStop={stop} projects={projects} pid={pid} setPid={setPid} onDemo={loadDemo} needsInput={run?.status === 'needs_input'} />

      {run && <RunView d={d} run={run} active={active} setActive={setActive} onDoc={updateDoc} onNew={() => setRun(null)} />}

      <section>
        <div className="mb-4"><h2 className="font-display text-lg font-bold">{d.skillsT}</h2><p className="mt-1 text-sm text-muted">{d.skillsS}</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {skills.map((s, i) => { const Icon = ICONS[s.icon] ?? Sparkles; return (
            <motion.div key={s.id} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }} style={{ '--hue': HUES[i] } as CSSProperties}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface p-4">
              <div className="pointer-events-none absolute -end-10 -top-10 size-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40" style={{ background: 'var(--hue)' }} />
              <div className="relative flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-xl" style={{ background: 'color-mix(in srgb, var(--hue) 18%, transparent)', color: 'var(--hue)' }}><Icon size={19} /></span><span className="font-display text-xs font-bold text-fg/25" dir="ltr">0{i + 1}</span></div>
              <div className="relative mt-3 font-display text-sm font-semibold">{tr(s.label)}</div>
              <p className="relative mt-1 flex-1 text-xs leading-relaxed text-muted">{tr(s.short)}</p>
              <div className="relative mt-3 flex flex-wrap gap-1">{s.outputs.slice(0, 3).map((o, j) => <span key={j} className="rounded-md bg-fg/[0.06] px-1.5 py-0.5 text-[10px] text-fg/70">{tr(o)}</span>)}</div>
              <Button size="sm" variant="soft" className="relative mt-3.5 w-full" disabled={running} onClick={() => (s.id === 'marketing-memory' ? setMemoryOpen(true) : setSkill(s))}>{d.start}</Button>
            </motion.div>
          ) })}
        </div>
      </section>

      <AnimatePresence>
        {skill && <SkillSheet d={d} skill={skill} files={files} addFiles={addFiles} setFiles={setFiles} onClose={() => setSkill(null)} onRun={text => { setSkill(null); start(text, [skill.id]); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />}
        {memoryOpen && <MemorySheet d={d} projects={projects} pid={pid} setPid={setPid} onClose={() => setMemoryOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------- composer
export function FileChip({ a, d, onRemove }: { a: Attachment; d: Dict; onRemove: () => void }) {
  const Icon = a.kind === 'table' ? Table2 : a.kind === 'image' ? ImageIcon : FileText
  const meta = a.status === 'failed' ? d.fileErr[a.error || 'unreadable'] : a.status === 'reading' ? '…' : a.kind === 'table' ? `${a.rows?.length ?? 0} ${d.rows}` : a.kind === 'image' ? 'image' : a.note === 'scanned' ? d.scanned : a.pages ? `${a.pages} ${d.pages}` : `${(a.text?.length ?? 0).toLocaleString('en')} ${d.chars}`
  return (
    <span title={(a.kind === 'text' ? a.text?.slice(0, 400) : a.kind === 'table' ? a.columns?.join(' · ') : a.name) || a.name} className={cn('inline-flex max-w-full items-center gap-2 rounded-xl border py-1.5 ps-1.5 pe-2 text-xs', a.status === 'failed' ? 'border-rose-400/50 bg-rose-500/10' : 'border-line bg-fg/[0.04]')}>
      {a.kind === 'image' && a.preview ? <img src={a.preview} alt="" className="size-6 rounded-md object-cover" /> : <span className="flex size-6 items-center justify-center rounded-md bg-fg/[0.08]">{a.status === 'reading' ? <Loader2 size={13} className="animate-spin" /> : a.status === 'failed' ? <AlertTriangle size={13} className="text-rose-400" /> : <Icon size={13} />}</span>}
      <span className="min-w-0 truncate font-medium" dir="auto">{a.name}</span><span className="shrink-0 text-muted">{meta}</span>
      <button onClick={onRemove} aria-label="Remove" className="rounded p-0.5 text-muted hover:text-fg"><X size={12} /></button>
    </span>
  )
}
export function Composer(p: { d: Dict; objective: string; setObjective: (s: string) => void; files: Attachment[]; setFiles: (f: (c: Attachment[]) => Attachment[]) => void; addFiles: (f: FileList) => void; urls: string[]; running: boolean; onRun: () => void; onStop: () => void; projects: Project[]; pid: string; setPid: (s: string) => void; onDemo: () => void; needsInput: boolean; placeholder?: string; badges?: ReactNode; demoLabel?: string; hideProject?: boolean }) {
  const { d } = p
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="relative">
      <div className="aurora-b pointer-events-none absolute inset-x-0 -top-6 h-56 rounded-full opacity-40 blur-3xl" />
      <div className="relative rounded-3xl border border-line bg-surface p-3 shadow-xl sm:p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2 px-1">
          {p.badges}
          {!p.hideProject && <label className="relative inline-flex items-center">
            <select value={p.pid} onChange={e => p.setPid(e.target.value)} className="h-8 appearance-none rounded-lg border border-line bg-bg/60 ps-2.5 pe-7 text-xs outline-none">
              <option value="">{d.noProject}</option>
              {p.projects.map(pr => <option key={pr.id} value={pr.id}>{pr.name}{pr.demo ? ` · ${d.demoTag}` : ''}</option>)}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute end-2 text-muted" />
          </label>}
          <button onClick={p.onDemo} disabled={p.running} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-muted transition hover:bg-fg/5 hover:text-fg disabled:opacity-50"><PlayCircle size={14} />{p.demoLabel ?? d.demo}</button>
        </div>
        <textarea value={p.objective} onChange={e => p.setObjective(e.target.value)} rows={3} placeholder={p.needsInput ? d.reply : p.placeholder ?? d.ph} disabled={p.running}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) p.onRun() }}
          className="w-full resize-none bg-transparent px-2 py-2 font-display text-lg leading-relaxed outline-none placeholder:text-muted/60 sm:text-xl" />
        {(p.files.length > 0 || p.urls.length > 0) && (
          <div className="flex flex-wrap gap-1.5 px-1 pb-2">
            {p.urls.map(u => <span key={u} className="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-2 py-1.5 text-xs"><Link2 size={13} className="ok-text shrink-0" /><span className="truncate" dir="ltr">{u.replace(/^https?:\/\//, '')}</span></span>)}
            {p.files.map(a => <FileChip key={a.id} a={a} d={d} onRemove={() => p.setFiles(c => c.filter(x => x.id !== a.id))} />)}
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-line px-1 pt-3">
          <input ref={input} type="file" multiple accept={ACCEPT} hidden onChange={e => { if (e.target.files) p.addFiles(e.target.files); e.target.value = '' }} />
          <Button size="sm" variant="ghost" onClick={() => input.current?.click()} disabled={p.running}><Paperclip size={15} />{d.attach}</Button>
          <span className="hidden min-w-0 flex-1 truncate text-xs text-muted sm:block">{d.hint}</span>
          {p.running
            ? <Button size="sm" variant="outline" className="ms-auto" onClick={p.onStop}><Square size={13} className="fill-current" />{d.stop}</Button>
            : <Button size="sm" className="ms-auto" disabled={!p.objective.trim() || p.files.some(f => f.status === 'reading')} onClick={p.onRun}>{d.run}<ArrowUp size={15} /></Button>}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- run view
export function RunView({ d, run, active, setActive, onDoc, onNew, skillList = skills, extra, brand }: { d: Dict; run: Run; active: string; setActive: (s: string) => void; onDoc: (doc: Doc) => void; onNew: () => void; skillList?: Skill[]; extra?: ReactNode; brand?: Brand }) {
  const { lang } = useI18n()
  const doc = run.docs.find(x => x.id === active) ?? run.docs.at(-1)
  const live = run.status === 'running'
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }) }, [run.steps.length])
  const label = (s: Extract<Step, { kind: 'tool' }>) => {
    if (s.tool === 'load_skill') { const sk = skillList.find(x => x.id === s.label); return sk ? sk.label[lang] : s.label }
    return s.label
  }
  const tone = run.status === 'completed' ? 'ok-text' : ['failed', 'unavailable'].includes(run.status) ? 'text-rose-400' : run.status === 'running' ? 'brand-text' : 'text-amber-500'
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <div className="rounded-2xl border border-line bg-surface p-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto thin-scroll">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-display text-sm font-semibold">{d.activity}</h3>
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', tone)}>{live ? <Loader2 size={13} className="animate-spin" /> : run.status === 'completed' ? <Check size={13} /> : <CircleDot size={13} />}{d.status[live ? run.phase : run.status] ?? d.status.running}</span>
        </div>
        <div className="mb-3 rounded-xl bg-fg/[0.05] p-3 text-xs leading-relaxed"><span className="text-muted">{d.you}: </span>{run.objective}</div>
        <ol className="relative space-y-2.5 border-s border-line ps-4">
          {run.steps.map((s, i) => s.kind === 'plan'
            ? <li key={i} className="relative text-[13px] leading-relaxed text-fg/90"><span className="absolute -start-[21px] top-1.5 size-2.5 rounded-full bg-violet-400" />{s.text}</li>
            : <li key={i} className="relative flex items-start gap-2 text-xs text-muted">
                <span className="absolute -start-[19px] top-1 size-1.5 rounded-full bg-fg/30" />
                {s.status === 'running' ? <Loader2 size={12} className="mt-0.5 shrink-0 animate-spin" /> : s.status === 'done' ? <Check size={12} className="ok-text mt-0.5 shrink-0" /> : <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-500" />}
                <span className="min-w-0"><span className="text-fg/80">{d.tools[s.tool] ?? s.tool}</span>{label(s) && <span className="block truncate" dir="auto">{label(s)}</span>}{s.error && <span className="block text-amber-500/90">{s.error}</span>}</span>
              </li>)}
        </ol>
        {extra}
        <div ref={end} />
        {!live && run.message && <p className={cn('mt-4 rounded-xl border p-3 text-[13px] leading-relaxed whitespace-pre-wrap', run.status === 'needs_input' ? 'border-amber-400/50 bg-amber-400/10' : 'border-line bg-fg/[0.03]')}>{run.message}</p>}
        {!live && <Button size="sm" variant="ghost" className="mt-3 w-full" onClick={onNew}>{d.newTask}</Button>}
      </div>
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="me-2 font-display text-sm font-semibold">{d.deliverables}</h3>
          {run.docs.map(x => <button key={x.id} onClick={() => setActive(x.id)} className={cn('max-w-[16rem] truncate rounded-full border px-3 py-1.5 text-xs transition', doc?.id === x.id ? 'border-violet-400 bg-violet-500/10' : 'border-line hover:bg-fg/5')}>{x.title}</button>)}
        </div>
        {doc ? <DocView key={doc.id} doc={doc} onChange={onDoc} brand={brand} /> : (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line text-center text-sm text-muted">
            {live && <Loader2 size={22} className="animate-spin text-violet-400" />}{d.empty}
          </div>
        )}
      </div>
    </motion.section>
  )
}

// ---------------------------------------------------------------- sheets
export function Sheet({ children, onClose, wide }: { children: ReactNode; onClose: () => void; wide?: boolean }) {
  useEffect(() => { const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f) }, [onClose])
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 32 }} onClick={e => e.stopPropagation()}
        className={cn('thin-scroll max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 text-fg shadow-2xl sm:rounded-3xl sm:p-7', wide ? 'sm:max-w-4xl' : 'sm:max-w-2xl')}>
        {children}
      </motion.div>
    </motion.div>
  )
}
export function SkillSheet({ d, skill, files, addFiles, setFiles, onClose, onRun, list = skills }: { list?: Skill[]; d: Dict; skill: Skill; files: Attachment[]; addFiles: (f: FileList) => void; setFiles: (f: (c: Attachment[]) => Attachment[]) => void; onClose: () => void; onRun: (t: string) => void }) {
  const { tr } = useI18n()
  const [v, setV] = useState<Record<string, string | string[]>>({})
  const [err, setErr] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const Icon = ICONS[skill.icon] ?? Sparkles, hue = HUES[list.indexOf(skill) % HUES.length]
  const submit = () => {
    if (skill.fields.some(f => f.required && !String(v[f.id] ?? '').trim())) return setErr(true)
    const lines = skill.fields.map(f => { const x = v[f.id]; const s = Array.isArray(x) ? x.join(', ') : (x ?? '').trim(); return s ? `${tr(f.label)}: ${s}` : '' }).filter(Boolean)
    onRun(`${tr(skill.label)}\n${lines.join('\n')}`)
  }
  return (
    <Sheet onClose={onClose}>
      <div className="flex items-start gap-3" style={{ '--hue': hue } as CSSProperties}>
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: 'color-mix(in srgb, var(--hue) 18%, transparent)', color: 'var(--hue)' }}><Icon size={22} /></span>
        <div className="min-w-0 flex-1"><h2 className="font-display text-xl font-bold">{tr(skill.label)}</h2><p className="mt-1 text-sm text-muted">{tr(skill.short)}</p></div>
        <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-muted hover:bg-fg/5"><X size={18} /></button>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">{skill.examples.map((x, i) => <button key={i} onClick={() => setV(c => ({ ...c, [skill.fields.find(f => f.type === 'textarea')?.id ?? skill.fields[0]?.id ?? 'note']: tr(x) }))} className="rounded-full border border-line px-3 py-1.5 text-xs text-fg/80 hover:bg-fg/5">{tr(x)}</button>)}</div>
      <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
        {skill.fields.map(f => (
          <label key={f.id} className={cn('block', (f.type === 'textarea' || f.type === 'chips') && 'sm:col-span-2')}>
            <span className="mb-1.5 block text-xs font-medium text-muted">{tr(f.label)}{f.required && <span className="text-rose-400"> *</span>}</span>
            {f.type === 'textarea' ? <textarea rows={3} className={inputCls} value={(v[f.id] as string) ?? ''} onChange={e => setV(c => ({ ...c, [f.id]: e.target.value }))} />
              : f.type === 'select' ? <select className={inputCls} value={(v[f.id] as string) ?? ''} onChange={e => setV(c => ({ ...c, [f.id]: e.target.value }))}><option value="">—</option>{f.options!.map((o, i) => <option key={i}>{tr(o)}</option>)}</select>
                : f.type === 'chips' ? <span className="flex flex-wrap gap-1.5">{f.options!.map((o, i) => { const on = ((v[f.id] as string[]) ?? []).includes(tr(o)); return <button type="button" key={i} onClick={() => setV(c => { const cur = (c[f.id] as string[]) ?? []; return { ...c, [f.id]: on ? cur.filter(x => x !== tr(o)) : [...cur, tr(o)] } })} className={cn('rounded-full border px-3 py-1.5 text-xs transition', on ? 'border-violet-400 bg-violet-500/15' : 'border-line hover:bg-fg/5')}>{tr(o)}</button> })}</span>
                  : <input type={f.type === 'url' ? 'url' : 'text'} dir={f.type === 'url' ? 'ltr' : undefined} placeholder={f.type === 'url' ? 'https://' : ''} className={inputCls} value={(v[f.id] as string) ?? ''} onChange={e => setV(c => ({ ...c, [f.id]: e.target.value }))} />}
          </label>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-dashed border-line p-3" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); e.stopPropagation(); addFiles(e.dataTransfer.files) }}>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={input} type="file" multiple accept={ACCEPT} hidden onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }} />
          <Button size="sm" variant="outline" onClick={() => input.current?.click()}><Paperclip size={14} />{d.attach}</Button>
          <span className="text-xs text-muted">{skill.inputs.map(x => tr(x)).join(' · ')}</span>
        </div>
        {files.length > 0 && <div className="mt-2.5 flex flex-wrap gap-1.5">{files.map(a => <FileChip key={a.id} a={a} d={d} onRemove={() => setFiles(c => c.filter(x => x.id !== a.id))} />)}</div>}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-xs text-muted">{err ? <span className="text-rose-400">{d.required}</span> : skill.outputs.map(x => tr(x)).join(' · ')}</span>
        <div className="flex gap-2"><Button variant="ghost" onClick={onClose}>{d.cancel}</Button><Button onClick={submit} disabled={files.some(f => f.status === 'reading')}>{d.start}<ArrowUp size={15} /></Button></div>
      </div>
    </Sheet>
  )
}

function MemorySheet({ d, projects, pid, setPid, onClose }: { d: Dict; projects: Project[]; pid: string; setPid: (s: string) => void; onClose: () => void }) {
  const { lang } = useI18n()
  const [sel, setSel] = useState(pid || projects[0]?.id || '')
  const p = projects.find(x => x.id === sel)
  const [draft, setDraft] = useState<{ id?: string; kind: string; title: string; content: string } | null>(null)
  const [view, setView] = useState<Doc | null>(null)
  const saveDraft = async () => {
    if (!p || !draft?.title.trim() || !draft.content.trim()) return
    const rec = { id: draft.id ?? newId(), kind: draft.kind || 'insight', title: draft.title.trim(), content: draft.content.trim(), at: Date.now(), source: 'user' as const }
    await putProject({ ...p, records: draft.id ? p.records.map(r => (r.id === draft.id ? rec : r)) : [...p.records, rec] }); setDraft(null)
  }
  return (
    <Sheet onClose={onClose} wide>
      <div className="flex items-start gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-400"><Brain size={22} /></span>
        <div className="min-w-0 flex-1"><h2 className="font-display text-xl font-bold">{d.mem.title}</h2><p className="mt-1 text-sm text-muted">{d.mem.sub}</p></div>
        <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-muted hover:bg-fg/5"><X size={18} /></button>
      </div>
      {!projects.length ? <p className="mt-8 rounded-2xl bg-fg/5 p-6 text-center text-sm text-muted">{d.mem.none}</p> : view ? (
        <div className="mt-5"><Button size="sm" variant="ghost" className="mb-3" onClick={() => setView(null)}><X size={14} />{view.title}</Button><DocView doc={view} onChange={async doc => { setView(doc); if (p) await putProject({ ...p, artifacts: p.artifacts.map(a => (a.id === doc.id && a.at === doc.at ? doc : a)) }) }} /></div>
      ) : (
        <div className="mt-5 grid gap-5 md:grid-cols-[14rem_minmax(0,1fr)]">
          <ul className="space-y-1.5">{projects.map(x => <li key={x.id}><button onClick={() => setSel(x.id)} className={cn('w-full rounded-xl border px-3 py-2.5 text-start text-sm transition', x.id === sel ? 'border-violet-400 bg-violet-500/10' : 'border-line hover:bg-fg/5')}><span className="block truncate font-medium">{x.name}</span><span className="text-[11px] text-muted">{x.records.length} · {x.artifacts.length} · {fmtDate(x.at, lang)}{x.demo ? ` · ${d.demoTag}` : ''}</span></button></li>)}</ul>
          {p && (
            <div className="min-w-0 space-y-5">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant={p.id === pid ? 'soft' : 'outline'} onClick={() => { setPid(p.id); onClose() }}><Check size={14} />{d.mem.select}</Button>
                <Button size="sm" variant="ghost" onClick={() => download(`SANDO-project-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(p, null, 2), 'application/json')}><Download size={14} />{d.mem.export}</Button>
                <Button size="sm" variant="ghost" className="text-rose-400" onClick={async () => { if (window.confirm(d.mem.confirmDel)) { await deleteProject(p.id); if (pid === p.id) setPid(''); setSel('') } }}><Trash2 size={14} />{d.mem.del}</Button>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-semibold text-muted">{d.mem.records}</h3><Button size="sm" variant="ghost" onClick={() => setDraft({ kind: 'brand', title: '', content: '' })}><FolderPlus size={14} />{d.mem.add}</Button></div>
                {draft && (
                  <div className="mb-3 space-y-2 rounded-2xl border border-violet-400/40 p-3">
                    <div className="grid gap-2 sm:grid-cols-[8rem_1fr]"><select className={inputCls} value={draft.kind} onChange={e => setDraft({ ...draft, kind: e.target.value })}>{['brand', 'insight', 'competitor', 'experiment', 'result', 'preference', 'brief'].map(k => <option key={k}>{k}</option>)}</select><input className={inputCls} placeholder={d.mem.titleF} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></div>
                    <textarea rows={3} className={inputCls} placeholder={d.mem.content} value={draft.content} onChange={e => setDraft({ ...draft, content: e.target.value })} />
                    <div className="flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => setDraft(null)}>{d.cancel}</Button><Button size="sm" onClick={saveDraft}>{d.mem.save}</Button></div>
                  </div>
                )}
                <ul className="space-y-2">{p.records.map(r => (
                  <li key={r.id} className="group rounded-xl border border-line p-3">
                    <div className="flex items-start gap-2"><span className="rounded-md bg-fg/[0.07] px-1.5 py-0.5 text-[10px]">{r.kind}</span><span className="min-w-0 flex-1 text-sm font-medium">{r.title}</span>
                      {r.source !== 'user' && <span className="text-[10px] text-muted">{r.source === 'demo' ? d.demoTag : d.mem.fromAgent}</span>}
                      <button onClick={() => setDraft({ id: r.id, kind: r.kind, title: r.title, content: r.content })} aria-label="Edit" className="rounded p-1 text-muted hover:text-fg"><Pencil size={13} /></button>
                      <button onClick={async () => { if (window.confirm(d.mem.confirmRec)) await putProject({ ...p, records: p.records.filter(x => x.id !== r.id) }) }} aria-label="Delete" className="rounded p-1 text-muted hover:text-rose-400"><Trash2 size={13} /></button></div>
                    <p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap text-muted">{r.content}</p>
                  </li>))}</ul>
              </div>
              {p.artifacts.length > 0 && (
                <div><h3 className="mb-2 text-xs font-semibold text-muted">{d.mem.docs}</h3>
                  <ul className="grid gap-2 sm:grid-cols-2">{p.artifacts.map(a => <li key={a.id + a.at}><button onClick={() => setView(a)} className="flex w-full items-center gap-2.5 rounded-xl border border-line p-3 text-start text-sm hover:bg-fg/5"><FileText size={15} className="shrink-0 text-muted" /><span className="min-w-0 flex-1 truncate">{a.title}</span><span className="text-[11px] text-muted">{fmtDate(a.at, lang)}</span></button></li>)}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Sheet>
  )
}
