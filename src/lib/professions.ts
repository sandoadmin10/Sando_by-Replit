import { Megaphone, Handshake, Building2, GraduationCap, type LucideIcon } from 'lucide-react'
import { l, type L } from './i18n'

export type ProfId = 'marketing' | 'sales' | 'admin' | 'education'
export interface Profession {
  id: ProfId; label: L; day: L; accent: string; icon: LucideIcon; greeting: L; blurb: L
  roles: L[]; tasks: { id: string; label: L; tool: string }[]; today: L[]; heroTool: string
}

export const professions: Record<ProfId, Profession> = {
  marketing: {
    id: 'marketing', label: l('التسويق', 'Marketing'), accent: '#b98bff', icon: Megaphone, heroTool: 'professional-marketer', day: l('أكتب محتوى وأدير حملات', 'I write content and run campaigns'),
    greeting: l('أهلاً {name}، حملتك القادمة تبدأ من هنا.', 'Welcome {name} — your next campaign starts here.'),
    blurb: l('أفكار حملات، محتوى جاهز للنشر، وقراءة واضحة للأداء.', 'Campaign ideas, publish-ready content, and a clear read on performance.'),
    roles: [l('مدير تسويق', 'Marketing Manager'), l('صانع محتوى', 'Content Creator'), l('مسؤول حملات', 'Campaign Specialist'), l('مدير علامة تجارية', 'Brand Manager')],
    tasks: [
      { id: 'm1', label: l('كتابة منشورات وإعلانات', 'Writing posts and ads'), tool: 'campaign-studio' },
      { id: 'm2', label: l('تحليل نتائج الحملات', 'Analyzing campaign results'), tool: 'campaign-analyzer' },
      { id: 'm3', label: l('تقارير أداء من جداول البيانات', 'Performance reports from spreadsheets'), tool: 'spreadsheet-analyzer' },
      { id: 'm4', label: l('جدولة المحتوى والمهام', 'Scheduling content and tasks'), tool: 'tasks-automation' },
    ],
    today: [l('صياغة حملة إطلاق باقة الخريف', 'Draft the autumn bundle launch campaign'), l('مراجعة أداء إعلانات الأسبوع الماضي', 'Review last week’s ad performance'), l('اعتماد تقويم محتوى الشهر', 'Approve this month’s content calendar')],
  },
  sales: {
    id: 'sales', label: l('المبيعات', 'Sales'), accent: '#38d6f5', icon: Handshake, heroTool: 'sales-employee', day: l('أتواصل مع العملاء وأرسل عروض أسعار', 'I talk to customers and send quotations'),
    greeting: l('أهلاً {name}، عروضك وعملاؤك في مكان واحد.', 'Welcome {name} — your quotes and customers, in one place.'),
    blurb: l('عروض أسعار دقيقة، ومتابعة عملاء لا تفوّت فرصة.', 'Accurate quotations and follow-ups that never drop a lead.'),
    roles: [l('مدير مبيعات', 'Sales Manager'), l('مندوب مبيعات', 'Sales Representative'), l('مدير حسابات', 'Account Manager'), l('مطوّر أعمال', 'Business Developer')],
    tasks: [
      { id: 's1', label: l('إعداد عروض الأسعار', 'Preparing quotations'), tool: 'quotation-builder' },
      { id: 's2', label: l('متابعة العملاء المحتملين', 'Following up with leads'), tool: 'followup-manager' },
      { id: 's3', label: l('تحليل أرقام المبيعات', 'Analyzing sales numbers'), tool: 'spreadsheet-analyzer' },
      { id: 's4', label: l('صياغة العقود والمستندات', 'Drafting contracts and documents'), tool: 'document-studio' },
    ],
    today: [l('إرسال عرض سعر لشركة أفق الرياض', 'Send a quotation to Ofuq Riyadh Co.'), l('متابعة ثلاثة عملاء بانتظار الرد', 'Follow up with three leads awaiting replies'), l('تحديث أرقام مبيعات الربع', 'Update this quarter’s sales figures')],
  },
  admin: {
    id: 'admin', label: l('الإدارة', 'Administration'), accent: '#7f92ff', icon: Building2, heroTool: 'spreadsheet-analyzer', day: l('أنظّم اجتماعات وتقارير ومراسلات', 'I organize meetings, reports and correspondence'),
    greeting: l('أهلاً {name}، يومك الإداري مرتّب وجاهز.', 'Welcome {name} — your admin day, organized and ready.'),
    blurb: l('محاضر اجتماعات، مراسلات، وتقارير إدارية بلا عناء.', 'Meeting minutes, correspondence, and admin reports without the grind.'),
    roles: [l('مدير إداري', 'Administrative Manager'), l('مساعد تنفيذي', 'Executive Assistant'), l('منسّق مكتب', 'Office Coordinator'), l('مدير عمليات', 'Operations Manager')],
    tasks: [
      { id: 'a1', label: l('محاضر الاجتماعات والمراسلات', 'Meeting minutes and correspondence'), tool: 'meeting-assistant' },
      { id: 'a2', label: l('إعداد التقارير الإدارية', 'Building administrative reports'), tool: 'report-builder' },
      { id: 'a3', label: l('مراجعة المصروفات والجداول', 'Reviewing expenses and sheets'), tool: 'spreadsheet-analyzer' },
      { id: 'a4', label: l('تنظيم الملفات والمستندات', 'Organizing files and documents'), tool: 'file-assistant' },
    ],
    today: [l('مراجعة مصروفات الأقسام لهذا الشهر', 'Review this month’s department expenses'), l('تجهيز محضر اجتماع الإدارة', 'Prepare the management meeting minutes'), l('إرسال التقرير الأسبوعي', 'Send the weekly report')],
  },
  education: {
    id: 'education', label: l('التعليم والتدريب', 'Education & Training'), accent: '#6ee7c5', icon: GraduationCap, heroTool: 'quiz-generator', day: l('أدرّب أو أعلّم وأعدّ مواد واختبارات', 'I train or teach and prepare material and quizzes'),
    greeting: l('أهلاً {name}، دوراتك ومتدربوك بين يديك.', 'Welcome {name} — your courses and trainees at hand.'),
    blurb: l('محتوى تعليمي واختبارات تُبنى من مادتك مباشرة.', 'Learning content and quizzes built straight from your material.'),
    roles: [l('مدرّب', 'Trainer'), l('معلّم', 'Teacher'), l('مدير أكاديمي', 'Academic Manager'), l('منسّق تدريب', 'Training Coordinator')],
    tasks: [
      { id: 'e1', label: l('إعداد الاختبارات والأسئلة', 'Preparing quizzes and questions'), tool: 'quiz-generator' },
      { id: 'e2', label: l('إدارة الدورات والمتدربين', 'Managing courses and trainees'), tool: 'courses-manager' },
      { id: 'e3', label: l('تحليل درجات المتدربين', 'Analyzing trainee scores'), tool: 'spreadsheet-analyzer' },
      { id: 'e4', label: l('كتابة المواد التعليمية', 'Writing learning material'), tool: 'document-studio' },
    ],
    today: [l('إعداد اختبار قصير لدورة الأمن السيبراني', 'Prepare a short quiz for the cybersecurity course'), l('مراجعة حضور دفعة نوفمبر', 'Review attendance for the November cohort'), l('تحديث خطة الدورة القادمة', 'Update the next course plan')],
  },
}
export const profList = Object.values(professions)

export const orgTypes: { id: string; label: L }[] = [
  { id: 'startup', label: l('شركة ناشئة', 'Startup') }, { id: 'sme', label: l('منشأة صغيرة أو متوسطة', 'Small or medium business') },
  { id: 'enterprise', label: l('شركة كبرى', 'Enterprise') }, { id: 'gov', label: l('جهة حكومية', 'Government entity') },
  { id: 'institute', label: l('معهد أو جهة تعليمية', 'Institute or school') }, { id: 'freelance', label: l('عمل حر', 'Freelance') },
]
export const goals: { id: string; label: L; tool: string }[] = [
  { id: 'g1', label: l('اختصار وقت المهام المتكررة', 'Cut time on repetitive tasks'), tool: 'tasks-automation' },
  { id: 'g2', label: l('مستندات احترافية أسرع', 'Professional documents, faster'), tool: 'document-studio' },
  { id: 'g3', label: l('فهم بياناتي واتخاذ قرارات', 'Understand my data and decide'), tool: 'spreadsheet-analyzer' },
  { id: 'g4', label: l('العثور على المعلومة داخل ملفاتي', 'Find answers inside my files'), tool: 'file-assistant' },
]
