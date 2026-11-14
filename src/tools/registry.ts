// The tool registry: the single place a tool is declared. Registering a tool here makes it appear in
// the right profession's workspace, the sidebar, the landing ecosystem, and the agent — no other wiring.
// See TOOL_DEVELOPMENT_GUIDE.md.
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { Sparkles, Briefcase, FolderSearch, FileText, Table2, ListChecks, Megaphone, TrendingUp, Users, Receipt, CalendarClock, ClipboardList, BookOpen, BrainCircuit, type LucideIcon } from 'lucide-react'
import { l, type L } from '../lib/i18n'
import { professions, goals, type ProfId } from '../lib/professions'
import type { Profile } from '../lib/store'
import { agentDemo, agentSuggestions, type DemoExecutor } from './demo'

export interface ToolProps { autoSample?: boolean }
export interface ToolDef {
  id: string
  name: string                      // internal English name
  label: L                          // Arabic + English display label
  description: L
  category: 'shared' | 'profession'
  profession: ProfId | 'shared'
  icon: LucideIcon
  status: 'ready' | 'preview'       // 'preview' tools show their blueprint and never pretend to work
  inputs: L[]                       // input structure
  outputs: L[]                      // output structure
  component?: LazyExoticComponent<ComponentType<ToolProps>>
  demo?: DemoExecutor               // Demo Mode agent executor
  aiTask?: 'content' | 'quiz'       // server task used for Live AI generation (optional)
  suggestions?: { id: string; label: L }[]
}

const registry: ToolDef[] = []
export function registerTool(t: ToolDef) { if (!registry.some(x => x.id === t.id)) registry.push(t) }
export const allTools = () => registry
export const getTool = (id?: string) => registry.find(t => t.id === id)
/** Profession tools first, then the shared ones. */
export const toolsFor = (p: ProfId) => [...registry.filter(t => t.profession === p), ...registry.filter(t => t.profession === 'shared')]

const shared = (t: Omit<ToolDef, 'category' | 'profession'>) => registerTool({ ...t, category: 'shared', profession: 'shared' })
const prof = (p: ProfId, t: Omit<ToolDef, 'category' | 'profession'>) => registerTool({ ...t, category: 'profession', profession: p })
const agent = (id: string) => ({ demo: agentDemo.tools[id], suggestions: agentSuggestions[id] })

// ---- Shared tools ----
shared({ id: 'file-assistant', name: 'File Assistant', label: l('مساعد الملفات', 'File Assistant'), icon: FolderSearch, status: 'preview',
  description: l('اسأل ملفاتك واحصل على إجابات موثّقة بالمصدر.', 'Ask your files and get answers with sources.'),
  inputs: [l('ملفات PDF و Word', 'PDF and Word files'), l('سؤال بلغتك', 'A question in your language')], outputs: [l('إجابة مع موضع المصدر', 'Answer with source location'), l('ملخص الملف', 'File summary')] })
shared({ id: 'document-studio', name: 'Document Studio', label: l('استوديو المستندات', 'Document Studio'), icon: FileText, status: 'preview',
  description: l('خطابات وعقود وتقارير بصياغة احترافية.', 'Letters, contracts and reports, professionally drafted.'),
  inputs: [l('نوع المستند', 'Document type'), l('النقاط الأساسية', 'Key points'), l('النبرة', 'Tone')], outputs: [l('مستند قابل للتحرير', 'Editable document'), l('تصدير PDF', 'PDF export')] })
shared({ id: 'spreadsheet-analyzer', name: 'Spreadsheet Analyzer', label: l('محلّل الجداول', 'Spreadsheet Analyzer'), icon: Table2, status: 'ready',
  description: l('ارفع CSV واحصل على مجاميع ومتوسطات ورسوم فورية.', 'Upload a CSV and get instant sums, averages and charts.'),
  inputs: [l('ملف CSV', 'CSV file')], outputs: [l('معاينة البيانات', 'Data preview'), l('إحصاءات الأعمدة الرقمية', 'Numeric column stats'), l('رسم بياني', 'Chart'), l('ملخص قابل للتصدير', 'Exportable summary')],
  component: lazy(() => import('./SpreadsheetAnalyzer')), ...agent('spreadsheet-analyzer') })
shared({ id: 'tasks-automation', name: 'Tasks & Automation', label: l('المهام والأتمتة', 'Tasks & Automation'), icon: ListChecks, status: 'preview',
  description: l('حوّل المهام المتكررة إلى خطوات تُنفَّذ تلقائياً.', 'Turn recurring tasks into steps that run themselves.'),
  inputs: [l('وصف المهمة المتكررة', 'Recurring task description'), l('التوقيت', 'Schedule')], outputs: [l('قائمة مهام', 'Task list'), l('تذكيرات', 'Reminders')] })

// ---- Marketing ----
prof('marketing', { id: 'professional-marketer', name: 'Professional Marketer', label: l('المسوّق الاحترافي', 'Professional Marketer'), icon: Sparkles, status: 'ready',
  description: l('وكيل تسويق يبحث ويحلّل ويخطط ويسلّمك مخرجات احترافية — بثماني مهارات قابلة للدمج.', 'A marketing agent that researches, analyzes, plans and delivers professional work — with eight composable skills.'),
  inputs: [l('هدفك بكلماتك', 'Your objective in plain words'), l('روابط وملفات', 'Links and files'), l('ذاكرة المشروع', 'Project memory')],
  outputs: [l('تقارير وخطط وعروض', 'Reports, plans and proposals'), l('PDF و CSV', 'PDF and CSV'), l('ذاكرة محدّثة', 'Updated memory')],
  component: lazy(() => import('../agents/marketing/ui/MarketerStudio')) })
prof('marketing', { id: 'campaign-studio', name: 'Campaign Studio', label: l('استوديو الحملات', 'Campaign Studio'), icon: Megaphone, status: 'ready',
  description: l('من فكرة المنتج إلى حملة كاملة: فكرة، منشور، إعلان، وجدول نشر.', 'From product idea to full campaign: concept, post, ad copy and schedule.'),
  inputs: [l('المنتج أو الخدمة', 'Product or service'), l('الجمهور', 'Audience'), l('المنصة', 'Platform'), l('النبرة', 'Tone'), l('هدف الحملة', 'Campaign goal')],
  outputs: [l('فكرة الحملة', 'Campaign concept'), l('منشور', 'Social post'), l('نص إعلاني', 'Ad copy'), l('دعوة لاتخاذ إجراء', 'Call to action'), l('جدول محتوى', 'Content schedule')],
  component: lazy(() => import('./ContentStudio')), aiTask: 'content', ...agent('campaign-studio') })
prof('marketing', { id: 'campaign-analyzer', name: 'Campaign Performance Analyzer', label: l('محلّل أداء الحملات', 'Campaign Performance Analyzer'), icon: TrendingUp, status: 'preview',
  description: l('قارن القنوات واعرف أين يذهب الإنفاق وأين يعود.', 'Compare channels and see where spend goes and returns.'),
  inputs: [l('بيانات الحملات', 'Campaign data'), l('الفترة', 'Period')], outputs: [l('تكلفة العميل المحتمل لكل قناة', 'Cost per lead by channel'), l('توصيات إعادة التوزيع', 'Reallocation recommendations')] })

// ---- Sales ----
prof('sales', { id: 'sales-employee', name: 'Professional Sales Employee', label: l('موظف المبيعات المحترف', 'Professional Sales Employee'), icon: Briefcase, status: 'ready',
  description: l('وكيل مبيعات ذاتي: يجد العملاء، يتواصل ويتابع، يبني عروض الأسعار والعروض الفنية، يفاوض ويغلق، ويحلل — ويسلّم ملفات PDF و Excel و Word و PowerPoint.', 'An autonomous sales agent: finds leads, reaches out and follows up, builds quotations and proposals, negotiates, closes and analyzes — delivering PDF, Excel, Word and PowerPoint files.'),
  inputs: [l('هدفك بكلماتك', 'Your objective in plain words'), l('ملفات وعملاء', 'Files and leads'), l('ملف الشركة والكتالوج', 'Company profile and catalog')],
  outputs: [l('عروض أسعار وعروض فنية', 'Quotations and proposals'), l('CRM محدّث', 'Updated CRM'), l('رسائل بموافقتك', 'Messages with your approval')],
  component: lazy(() => import('../agents/sales/ui/SalesStudio')) })
prof('sales', { id: 'followup-manager', name: 'Customer Follow-up Manager', label: l('مدير متابعة العملاء', 'Customer Follow-up Manager'), icon: Users, status: 'preview',
  description: l('لا تفوّت متابعة: مواعيد ورسائل مقترحة لكل عميل.', 'Never miss a follow-up: timing and suggested messages per customer.'),
  inputs: [l('قائمة العملاء', 'Customer list'), l('آخر تواصل', 'Last contact')], outputs: [l('أولويات المتابعة', 'Follow-up priorities'), l('رسائل مقترحة', 'Suggested messages')] })
prof('sales', { id: 'quotation-builder', name: 'Quotation Builder', label: l('منشئ عروض الأسعار', 'Quotation Builder'), icon: Receipt, status: 'ready',
  description: l('عرض سعر احترافي بحسابات دقيقة وتصدير PDF.', 'A professional quotation with exact calculations and PDF export.'),
  inputs: [l('بيانات العميل', 'Client details'), l('البنود والكميات والأسعار', 'Items, quantities and prices'), l('الخصم والضريبة', 'Discount and tax')],
  outputs: [l('معاينة العرض', 'Quotation preview'), l('ملف PDF', 'PDF file'), l('عرض محفوظ', 'Saved quotation')],
  component: lazy(() => import('./QuotationBuilder')), ...agent('quotation-builder') })

// ---- Administration ----
prof('admin', { id: 'meeting-assistant', name: 'Meeting & Correspondence Assistant', label: l('مساعد الاجتماعات والمراسلات', 'Meeting & Correspondence Assistant'), icon: CalendarClock, status: 'preview',
  description: l('محاضر واضحة وخطابات رسمية من نقاطك السريعة.', 'Clear minutes and formal letters from your quick notes.'),
  inputs: [l('ملاحظات الاجتماع', 'Meeting notes'), l('الحضور', 'Attendees')], outputs: [l('محضر اجتماع', 'Meeting minutes'), l('قائمة قرارات ومهام', 'Decisions and action items')] })
prof('admin', { id: 'report-builder', name: 'Administrative Report Builder', label: l('منشئ التقارير الإدارية', 'Administrative Report Builder'), icon: ClipboardList, status: 'preview',
  description: l('تقارير دورية منسّقة من بياناتك ونقاطك.', 'Formatted periodic reports from your data and notes.'),
  inputs: [l('نوع التقرير', 'Report type'), l('البيانات والنقاط', 'Data and points')], outputs: [l('تقرير منسّق', 'Formatted report'), l('ملخص تنفيذي', 'Executive summary')] })

// ---- Education ----
prof('education', { id: 'courses-manager', name: 'Courses & Trainees Manager', label: l('مدير الدورات والمتدربين', 'Courses & Trainees Manager'), icon: BookOpen, status: 'preview',
  description: l('الدورات والدفعات والحضور في لوحة واحدة.', 'Courses, cohorts and attendance in one board.'),
  inputs: [l('الدورات', 'Courses'), l('قائمة المتدربين', 'Trainee list')], outputs: [l('سجل الحضور', 'Attendance record'), l('تقدّم كل متدرب', 'Progress per trainee')] })
prof('education', { id: 'quiz-generator', name: 'Learning Content & Quiz Generator', label: l('مولّد المحتوى والاختبارات', 'Learning Content & Quiz Generator'), icon: BrainCircuit, status: 'ready',
  description: l('أسئلة اختيار من متعدد مع الشرح ووضع اختبار تفاعلي.', 'Multiple-choice questions with explanations and an interactive quiz mode.'),
  inputs: [l('النص التعليمي', 'Educational text'), l('الموضوع', 'Topic'), l('الصعوبة', 'Difficulty'), l('عدد الأسئلة', 'Number of questions')],
  outputs: [l('أسئلة وإجابات', 'Questions and answers'), l('شرح لكل إجابة', 'Explanation per answer'), l('اختبار تفاعلي ونتيجة', 'Interactive quiz and score')],
  component: lazy(() => import('./QuizGenerator')), aiTask: 'quiz', ...agent('quiz-generator') })

// ---- Deterministic workspace personalization (no AI involved) ----
export interface Answers { profession: ProfId; role?: string; org?: string; tasks?: string[]; goal?: string; goalText?: string }
export function buildProfile(a: Answers): Profile {
  const p = professions[a.profession]
  const tasks = a.tasks ?? []
  const reasons: Record<string, L> = {}
  const score = new Map<string, number>()
  const bump = (id: string, n: number) => score.set(id, (score.get(id) ?? 0) + n)
  p.tasks.filter(t => tasks.includes(t.id)).forEach(t => {
    bump(t.tool, 10)
    reasons[t.tool] ??= l(`لأنك تكرر: ${t.label.ar}`, `Because you often do: ${t.label.en}`)
  })
  const g = goals.find(x => x.id === a.goal)
  if (g) { bump(g.tool, 6); reasons[g.tool] ??= l(`لأن هدفك: ${g.label.ar}`, `Because your goal is: ${g.label.en}`) }
  const list = toolsFor(a.profession)
  list.forEach((t, i) => { bump(t.id, (t.status === 'ready' ? 3 : 0) + (t.profession !== 'shared' ? 2 : 0) - i * 0.01) })
  list.forEach(t => { reasons[t.id] ??= t.profession === 'shared' ? l('أداة مشتركة مفيدة لكل المجالات', 'A shared tool useful across every field') : l(`أداة أساسية في ${p.label.ar}`, `A core ${p.label.en} tool`) })
  list.forEach(t => { if (t.profession !== 'shared') bump(t.id, 1000); if (t.id === p.heroTool) bump(t.id, 50) })
  const tools = list.map(t => t.id).sort((x, y) => (score.get(y) ?? 0) - (score.get(x) ?? 0))
  return { profession: a.profession, role: a.role ?? p.roles[0].en, org: a.org ?? 'sme', tasks, goal: a.goal ?? '', goalText: a.goalText ?? '', tools, reasons }
}
