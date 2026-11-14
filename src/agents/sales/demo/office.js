// DEMO DATA — a fictional Saudi office-furniture supplier ("Rukn Office"). All companies, people and
// numbers are invented and labelled as sample data in the UI. With no AI provider configured, the demo
// script replays fixed steps, but each tool really runs on these files and the CRM/quotation math is real.

const L = (ar, en) => ({ ar, en })
const table = csv => { const [h, ...rows] = csv.trim().split('\n').map(r => r.split(';').map(x => x.trim())); return { columns: h, rows } }

export const DEMO_SALES_OBJECTIVE = L(
  'استورد قائمة العملاء المرفقة، قيّمهم ورتّبهم، ثم جهّز عرض سعر لأفضل عميل وبريد تواصل له.',
  'Import the attached lead list, score and rank the leads, then prepare a quotation and an outreach email for the best one.')

export const demoCompany = {
  name: 'رُكن للأثاث المكتبي (تجريبي)', description: 'مورّد أثاث مكتبي وتجهيز مكاتب للشركات في الرياض وجدة منذ 2017.',
  segments: 'شركات المقاولات والعقار، المكاتب الهندسية، الشركات الناشئة',
  tone: 'مهنية وودية، جمل قصيرة، بلا مبالغة', signature: 'فريق المبيعات — رُكن للأثاث المكتبي\n+966 11 000 0000',
  currency: 'SAR', taxRate: 15, maxDiscount: 10, validityDays: 30, paymentTerms: '50% عند التعميد و50% عند التسليم',
  catalog: [
    { sku: 'DSK-120', name: 'مكتب عمل 120 سم', price: 1450, unit: 'قطعة' },
    { sku: 'DSK-160', name: 'مكتب مدير 160 سم', price: 2900, unit: 'قطعة' },
    { sku: 'CHR-ERG', name: 'كرسي مريح قابل للتعديل', price: 980, unit: 'قطعة' },
    { sku: 'CHR-VIS', name: 'كرسي زوار', price: 420, unit: 'قطعة' },
    { sku: 'MTG-08', name: 'طاولة اجتماعات 8 أشخاص', price: 4200, unit: 'قطعة' },
    { sku: 'STR-CAB', name: 'خزانة ملفات معدنية', price: 760, unit: 'قطعة' },
    { sku: 'SRV-INS', name: 'تركيب وتجهيز موقع', price: 1800, unit: 'مشروع' },
  ],
}

export const demoSalesFiles = [
  { name: 'leads-riyadh.csv', kind: 'table', ...table(`Company;City;Industry;Employees;Status;Last contact;Note
شركة أساس البناء (تجريبي);الرياض;مقاولات;180;رد على البريد;2026-11-05;طلبوا كتالوج لمقر جديد في حي الملقا
مكتب المدار الهندسي (تجريبي);الرياض;استشارات هندسية;45;لم يُتواصل;;افتتاح فرع ثانٍ
نماء العقارية (تجريبي);جدة;تطوير عقاري;320;اجتماع تم;2026-10-28;ميزانية تجهيز معتمدة للربع الأول
شركة سحاب للتقنية (تجريبي);الرياض;تقنية;60;لم يُتواصل;;نمو سريع في التوظيف
أفق للتشغيل والصيانة (تجريبي);الدمام;تشغيل وصيانة;210;رد على البريد;2026-09-30;أبدوا اهتماماً ثم توقفوا
شركة أساس البناء (تجريبي);الرياض;مقاولات;180;رد على البريد;2026-11-05;مكرر في الملف
بيت الخبرة للمحاسبة (تجريبي);الرياض;خدمات مهنية;25;لم يُتواصل;;
مجموعة رواسي (تجريبي);الرياض;مقاولات;540;اجتماع تم;2026-11-10;يقارنون عرضنا بمنافس أرخص`) },
  { name: 'meeting-notes-asas.txt', kind: 'text', text: `[بيانات تجريبية] محضر اتصال — شركة أساس البناء — 5 نوفمبر
العميل (م. خالد، مدير المشتريات): "ننتقل لمقر جديد في الملقا بداية فبراير، نحتاج 40 مكتب عمل و40 كرسي ومكتبين للمدراء وطاولة اجتماعات."
العميل: "الميزانية معتمدة، لكن الإدارة تبي خصم لأن الكمية كبيرة."
العميل: "أهم شي التسليم والتركيب قبل 25 يناير."
العميل: "المنافس عطانا سعر أقل في الكراسي، بس جودتهم ما نعرفها."
الخطوة التالية: إرسال عرض سعر رسمي قبل نهاية الأسبوع.` },
  { name: 'sales-2026.csv', kind: 'table', ...table(`Rep;Product;Customer;Date;Amount;Status
سارة;مكاتب;شركة الرواد;2026-07-14;38500;won
فهد;كراسي;مكتب الأفق;2026-07-22;12400;won
سارة;طاولات اجتماعات;نماء العقارية;2026-08-03;16800;lost
عمر;مكاتب;مجموعة البيان;2026-08-19;52300;won
فهد;تركيب;شركة الرواد;2026-08-25;5400;won
عمر;كراسي;سحاب للتقنية;2026-09-09;9800;lost
سارة;مكاتب;أساس البناء;2026-09-18;27600;won
فهد;خزائن;بيت الخبرة;2026-10-02;4600;won
عمر;مكاتب;رواسي;2026-10-15;61200;lost
سارة;كراسي;المدار الهندسي;2026-10-27;14700;won`) },
]

const scoreRow = (r, h) => {
  const v = k => r[h.indexOf(k)] || ''
  const fit = /مقاولات|عقاري|هندسية/.test(v('Industry')) ? 30 : 20
  const size = Number(v('Employees')) >= 150 ? 10 : 5
  const eng = /اجتماع/.test(v('Status')) ? 25 : /رد/.test(v('Status')) ? 15 : 0
  const days = v('Last contact') ? Math.round((Date.parse('2026-11-14') - Date.parse(v('Last contact'))) / 864e5) : null
  const rec = days == null ? 0 : days <= 14 ? 15 : days <= 30 ? 8 : 2
  const stage = /اجتماع/.test(v('Status')) ? 15 : /رد/.test(v('Status')) ? 8 : 0
  return { fit: fit + size, eng, stage, rec, total: fit + size + eng + stage + rec }
}

export const salesDemoScript = [
  {
    plan: L('أقرأ ملف الشركة وأحلّل ملف العملاء قبل الاستيراد.', 'Reading the company profile and profiling the lead file before importing.'),
    actions: () => [{ tool: 'get_company_profile', args: {} }, { tool: 'load_skill', args: { id: 'lead-import' } }, { tool: 'analyze_table', args: { file: 'leads-riyadh.csv' } }, { tool: 'crm_list', args: {} }],
  },
  {
    plan: L('أستورد العملاء إلى الـ CRM مع حذف المكرر، وأقيّم كل عميل بنقاط شفافة.', 'Importing leads into the CRM without duplicates, and scoring each lead transparently.'),
    actions: (lang, c) => {
      const f = c.files.find(x => x.name === 'leads-riyadh.csv'); const seen = new Set(); const out = [{ tool: 'load_skill', args: { id: 'lead-qualification' } }]
      for (const r of f.rows) {
        const name = r[0]; if (seen.has(name)) continue; seen.add(name)
        const s = scoreRow(r, f.columns)
        out.push({ tool: 'crm_upsert', args: { company: name, city: r[1], industry: r[2], stage: /اجتماع/.test(r[4]) ? 'qualified' : /رد/.test(r[4]) ? 'contacted' : 'new', score: s.total, notes: r[6], source: 'leads-riyadh.csv (demo)' } })
      }
      return out
    },
  },
  {
    plan: L('أقرأ محضر الاتصال مع أعلى عميل لتحديد الاحتياج والاعتراضات.', 'Reading the call notes with the top lead to pin down needs and objections.'),
    actions: () => [{ tool: 'search_in_attachments', args: { file: 'meeting-notes-asas.txt', query: 'نحتاج|خصم|التسليم|المنافس' } }],
  },
  {
    plan: L('أبني عرض السعر من الكتالوج المعتمد وضمن سياسة الخصم.', 'Building the quotation from the approved catalog and within discount policy.'),
    actions: () => [{ tool: 'load_skill', args: { id: 'quotation' } }, { tool: 'build_quotation', args: { customer: 'شركة أساس البناء (تجريبي)', discount_pct: 8, items: [{ name: 'مكتب عمل 120 سم', qty: 40 }, { name: 'كرسي مريح قابل للتعديل', qty: 40 }, { name: 'مكتب مدير 160 سم', qty: 2 }, { name: 'طاولة اجتماعات 8 أشخاص', qty: 1 }, { name: 'تركيب وتجهيز موقع', qty: 1 }] } }],
    after: (res, c) => { c.quote = res[1].result },
  },
  {
    plan: L('أكتب جدول الأولويات وعرض السعر، وأجهّز بريد التواصل لموافقتك.', 'Writing the priority table and the quotation, and drafting the email for your approval.'),
    actions: (lang, c) => {
      const ar = lang === 'ar', f = c.files.find(x => x.name === 'leads-riyadh.csv'), seen = new Set()
      const ranked = f.rows.filter(r => !seen.has(r[0]) && seen.add(r[0])).map(r => ({ r, s: scoreRow(r, f.columns) })).sort((a, b) => b.s.total - a.s.total)
      const q = c.quote || { lines: [], subtotal: 0, discount: 0, tax: 0, total: 0, discount_pct: 0, tax_pct: 15 }
      const cls = t => (t >= 70 ? 'A' : t >= 45 ? 'B' : 'C'), sar = n => `${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR`
      return [
        { tool: 'create_deliverable', args: { kind: 'workbook', title: ar ? 'أولويات العملاء المحتملين' : 'Lead priorities', subtitle: ar ? 'بيانات تجريبية · تقييم من 100' : 'Sample data · score out of 100', blocks: [
          { type: 'metrics', items: [{ label: ar ? 'صفوف الملف' : 'File rows', value: String(f.rows.length) }, { label: ar ? 'عملاء فريدون' : 'Unique leads', value: String(ranked.length) }, { label: ar ? 'مكرر حُذف' : 'Duplicates removed', value: String(f.rows.length - ranked.length) }, { label: ar ? 'أولوية A' : 'Class A', value: String(ranked.filter(x => x.s.total >= 70).length) }] },
          { type: 'table', title: ar ? 'الترتيب' : 'Ranking', columns: ar ? ['العميل', 'الملاءمة /40', 'التفاعل /25', 'المرحلة /20', 'الحداثة /15', 'المجموع', 'الفئة'] : ['Lead', 'Fit /40', 'Engagement /25', 'Stage /20', 'Recency /15', 'Total', 'Class'], rows: ranked.map(({ r, s }) => [r[0], String(s.fit), String(s.eng), String(s.stage), String(s.rec), String(s.total), cls(s.total)]) },
          { type: 'callout', tone: 'info', title: ar ? 'كيف حُسبت النقاط' : 'How scores were computed', text: ar ? 'الملاءمة: القطاع والحجم مقابل ملف الشركة. التفاعل والمرحلة: من حالة التواصل في الملف. الحداثة: أيام منذ آخر تواصل. العوامل غير المعروفة = صفر.' : 'Fit: industry and size vs. the company profile. Engagement and stage: from the contact status in the file. Recency: days since last contact. Unknown factors score zero.' },
        ] } },
        { tool: 'create_deliverable', args: { kind: 'proposal', title: ar ? `عرض سعر — ${q.customer || 'أساس البناء'}` : `Quotation — ${q.customer || 'Asas'}`, subtitle: ar ? `رقم ${q.number || ''} · صالح ${q.validity_days || 30} يوماً · بيانات تجريبية` : `No. ${q.number || ''} · valid ${q.validity_days || 30} days · sample data`, blocks: [
          { type: 'paragraph', text: ar ? 'بناءً على اتصالكم في 5 نوفمبر بخصوص تجهيز المقر الجديد في حي الملقا، يسعدنا تقديم العرض التالي مع التسليم والتركيب قبل 25 يناير.' : 'Following your call on 5 November about furnishing the new Al Malqa office, we are pleased to offer the following, with delivery and installation before 25 January.' },
          { type: 'table', columns: ar ? ['البند', 'الكمية', 'سعر الوحدة', 'الإجمالي'] : ['Item', 'Qty', 'Unit price', 'Total'], rows: (q.lines || []).map(l => [l.name, String(l.qty), sar(l.unit_price), sar(l.line_total)]) },
          { type: 'metrics', items: [{ label: ar ? 'المجموع' : 'Subtotal', value: sar(q.subtotal) }, { label: ar ? `خصم ${q.discount_pct}%` : `Discount ${q.discount_pct}%`, value: sar(q.discount) }, { label: ar ? `ضريبة ${q.tax_pct}%` : `VAT ${q.tax_pct}%`, value: sar(q.tax) }, { label: ar ? 'الإجمالي النهائي' : 'Grand total', value: sar(q.total) }] },
          { type: 'bullets', items: ar ? [`الدفع: ${q.payment_terms || ''}`, 'التسليم والتركيب قبل 25 يناير', 'الأسعار من الكتالوج المعتمد، والخصم ضمن السياسة'] : [`Payment: ${q.payment_terms || ''}`, 'Delivery and installation before 25 January', 'Prices from the approved catalog; discount within policy'] },
        ] } },
        { tool: 'crm_upsert', args: { company: 'شركة أساس البناء (تجريبي)', stage: 'proposal', value: q.total, next_action: ar ? 'متابعة عرض السعر' : 'Follow up on quotation', next_date: '2026-11-17' } },
        { tool: 'draft_message', args: { channel: 'email', company: 'شركة أساس البناء (تجريبي)', to: 'procurement@example.com', subject: ar ? 'عرض سعر تجهيز مقركم الجديد في الملقا' : 'Quotation for your new Al Malqa office', body: ar ? `م. خالد، مساء الخير\n\nكما اتفقنا في اتصالنا، أرفقنا عرض السعر لتجهيز المقر الجديد: 40 مكتب عمل و40 كرسياً مريحاً ومكتبين للمدراء وطاولة اجتماعات، مع التركيب قبل 25 يناير.\nالإجمالي ${sar(q.total)} شامل الضريبة وبخصم ${q.discount_pct}% للكمية.\n\nهل يناسبك اتصال قصير يوم الإثنين لمراجعة العرض؟\n\n${demoCompany.signature}` : `Dear Eng. Khalid,\n\nAs discussed on our call, please find the quotation for your new office: 40 workstations, 40 ergonomic chairs, two manager desks and a meeting table, installed before 25 January.\nTotal ${sar(q.total)} incl. VAT, with a ${q.discount_pct}% volume discount.\n\nWould a short call on Monday work to review it?\n\nRukn Office Sales` } },
      ]
    },
  },
]
