// DEMO DATA — a fictional Saudi coffee brand ("Harra Coffee") preparing a cold brew launch.
// Every name, review and number here is invented for demonstration and is labelled as such in the UI.
// The demo script below is used only when no AI provider is configured: its steps are fixed, but each
// tool call really runs on these sample files, and numbers in the performance report come from those runs.

const L = (ar, en) => ({ ar, en })
const table = csv => { const [h, ...rows] = csv.trim().split('\n').map(r => r.split(';').map(x => x.trim())); return { columns: h, rows } }

export const DEMO_OBJECTIVE = L('حلّل علامة «حَرّة للقهوة» وجهّز حملة لإطلاق منتج الكولد برو الجديد.', 'Analyze the Harra Coffee brand and prepare a campaign for its new cold brew product.')

export const demoProject = {
  name: L('حَرّة للقهوة — إطلاق الكولد برو (تجريبي)', 'Harra Coffee — Cold Brew launch (demo)'),
  records: [
    { kind: 'brand', title: 'Brand voice (demo)', content: 'Warm, confident, proudly local. Short sentences. Avoid luxury clichés. Colors: sand, deep brown, citrus accent.' },
    { kind: 'result', title: 'Ramadan 2026 campaign (demo)', content: 'Snapchat stories outperformed Instagram on cost per purchase; delivery-time messaging lifted conversion.' },
  ],
  attachments: [
    { name: 'brand-brief.txt', kind: 'text', text: `[بيانات تجريبية] حَرّة للقهوة — محمصة سعودية مختصة في الرياض منذ 2019، ثلاثة فروع ومتجر إلكتروني.
المنتج الجديد: كولد برو حَرّة — منقوع 18 ساعة من بن إثيوبي، عبوة 330 مل، بدون سكر مضاف، يُباع في الفروع والمتجر وبالاشتراك الأسبوعي.
الجمهور: موظفون 22–35 سنة في الرياض وجدة يشربون القهوة يومياً، ويطلبون التوصيل كثيراً.
الهدف: 4,000 عبوة في أول 30 يوماً وبناء قاعدة اشتراكات.
القيود: الميزانية الإعلانية محدودة؛ لا نريد خطاب الفخامة المبالغ فيه.` },
    { name: 'customer-reviews.csv', kind: 'table', ...table(`Rating;Channel;Review
5;App;القهوة ممتازة ونظيفة بس ودي يكون فيه حجم أكبر
4;Google;طعمها رائع لكن السعر غالي شوي مقارنة بالمقاهي الثانية
5;App;أحب إنها بدون سكر، أخيراً قهوة باردة مو حلا
2;Google;التوصيل تأخر ساعة ووصلت القهوة دافية
5;Instagram;أفضل قهوة مختصة جربتها في الرياض
3;App;حلوة بس ما أعرف وش الفرق بينها وبين الآيس لاتيه
4;Google;الموظفين لطيفين والطعم ثابت كل مرة
5;App;صرت أطلبها كل يوم قبل الدوام، تصحصح بدون ما تتعب المعدة
2;Google;غالية على الكمية، 330 مل قليلة
4;App;ودي باشتراك أسبوعي يوصلني للمكتب
5;Instagram;الطعم فيه نكهة فواكه خفيفة، مختلف عن أي قهوة باردة
3;Google;التغليف حلو بس يتسرب أحياناً في التوصيل
5;App;نظيفة وبدون سكر، مناسبة للدايت
4;Google;أطلب منهم دايم لكن أوقات الذروة التوصيل بطيء
5;App;القهوة الوحيدة اللي أشربها سادة بدون حليب
1;Google;وصلت الطلبية ناقصة ولا أحد رد علي
4;Instagram;أتمنى عروض للكميات للمكتب
5;App;مركّزة ومنعشة، أحسن من الكافيين المعلب
3;App;الطعم قوي شوي علي، ودي خيار أخف
5;Google;خدمة سريعة في الفرع والقهوة ممتازة
4;App;السعر مرتفع بس الجودة تستاهل
2;App;التطبيق يعلق وقت الدفع
5;Instagram;أعطيتها لزملائي في الشغل وكلهم طلبوا
4;Google;أبي أعرف كم فيها كافيين بالضبط`) },
    { name: 'competitors-notes.txt', kind: 'text', text: `[بيانات تجريبية — منافسون وهميون لأغراض العرض]
بن لين (Bunn Lane): سلسلة كبيرة، كولد برو بـ 19 ريال، رسالة "انتعاش طول اليوم"، حملات مؤثرين كثيفة، لا يذكر المصدر ولا مدة النقع.
قهوة لاب (Qahwa Lab): مختص، 24 ريال، يركّز على الحرفة وأسماء المزارع، تواجد قوي في إنستغرام، توصيل محدود بالرياض فقط.
مسافة روسترز (Masafa Roasters): اشتراكات شهرية للبن، لا يبيع قهوة باردة جاهزة، رسائل عن "طقوس الصباح".
ملاحظة: لم يتحدث أي منافس عن "بدون سكر مضاف" أو عن الاشتراك الأسبوعي للمكاتب.` },
    { name: 'past-campaigns.csv', kind: 'table', ...table(`Campaign;Channel;Impressions;Clicks;Spend;Purchases;Revenue
Ramadan Nights;Snapchat;410000;6150;9200;246;8610
Ramadan Nights;Instagram;355000;4260;9800;168;5880
Office Mornings;Snapchat;188000;3010;4100;121;4235
Office Mornings;TikTok;402000;3620;5200;72;2520
Summer Iced;Instagram;290000;3190;6100;117;4095
Summer Iced;TikTok;515000;5670;7300;96;3360
Founders Day;X;140000;980;2600;14;490
Founders Day;Instagram;160000;2080;3000;83;2905`) },
  ],
}

const pick = (lang, x) => x[lang]
const DEMO_TAG = L('بيانات تجريبية', 'Sample data')

export const demoScript = [
  {
    plan: L('أبدأ بفهم العملاء: أحمّل منهجية تحليل صوت العميل وأقرأ ملف التقييمات.', 'Starting with customers: loading the Voice of Customer method and profiling the reviews file.'),
    actions: () => [{ tool: 'load_skill', args: { id: 'voice-of-customer' } }, { tool: 'analyze_table', args: { file: 'customer-reviews.csv' } }, { tool: 'retrieve_project_memory', args: { query: 'brand voice campaign result' } }],
  },
  {
    plan: L('أبحث عن الأدلة لكل محور متكرر في التعليقات.', 'Searching the feedback for evidence of each recurring theme.'),
    actions: () => [
      { tool: 'search_in_attachments', args: { file: 'customer-reviews.csv', query: 'غالي|غالية|السعر|مرتفع' } },
      { tool: 'search_in_attachments', args: { file: 'customer-reviews.csv', query: 'سكر|حلا|دايت|المعدة' } },
      { tool: 'search_in_attachments', args: { file: 'customer-reviews.csv', query: 'التوصيل|تأخر|بطيء|يتسرب|ناقصة' } },
      { tool: 'search_in_attachments', args: { file: 'customer-reviews.csv', query: 'اشتراك|المكتب|الشغل|الدوام|زملائي' } },
    ],
    after: (res, c) => { c.voc = res.map(r => r.result) },
  },
  {
    plan: L('أقارن موقع حَرّة بالمنافسين لمعرفة المساحة غير المستغلة.', 'Comparing Harra with competitors to find unclaimed positioning.'),
    actions: () => [{ tool: 'load_skill', args: { id: 'competitor-radar' } }, { tool: 'read_attachment', args: { file: 'competitors-notes.txt' } }, { tool: 'read_attachment', args: { file: 'brand-brief.txt' } }],
  },
  {
    plan: L('أحسب أداء الحملات السابقة حسب القناة لاختيار أين ننفق.', 'Calculating past campaign performance by channel to decide where to spend.'),
    actions: () => [{ tool: 'load_skill', args: { id: 'performance-investigator' } }, { tool: 'calculate_marketing_metrics', args: { file: 'past-campaigns.csv', group_by: 'Channel' } }],
    after: (res, c) => { c.metrics = res[1].result },
  },
  {
    plan: L('أكتب تقرير رؤى العملاء ولوحة الأداء من النتائج المحسوبة.', 'Writing the customer insight report and the performance dashboard from the computed results.'),
    actions: (lang, c) => {
      const [price, sugar, delivery, office] = (c.voc || []).map(v => v?.matches ?? 0)
      const total = c.files.find(f => f.name === 'customer-reviews.csv')?.rows.length ?? 0
      const m = c.metrics || { totals: {}, groups: [], anomalies: [] }
      const g = m.groups || []
      const ar = lang === 'ar'
      return [
        { tool: 'create_deliverable', args: { kind: 'insights', title: ar ? 'رؤى العملاء — كولد برو حَرّة' : 'Customer insights — Harra Cold Brew', subtitle: pick(lang, DEMO_TAG), blocks: [
          { type: 'callout', tone: 'info', title: pick(lang, DEMO_TAG), text: ar ? `مبنية على ${total} تقييماً تجريبياً. الأعداد أدناه من بحث فعلي داخل الملف.` : `Based on ${total} sample reviews. Counts below come from actual searches in the file.` },
          { type: 'metrics', items: [{ label: ar ? 'ذكر السعر' : 'Mention price', value: String(price) }, { label: ar ? 'بدون سكر / خفيفة' : 'No sugar / light', value: String(sugar) }, { label: ar ? 'مشاكل التوصيل' : 'Delivery issues', value: String(delivery) }, { label: ar ? 'العمل والمكتب' : 'Work & office', value: String(office) }] },
          { type: 'cards', items: ar ? [
            { title: 'الدافع الأقوى: قهوة نظيفة بلا سكر', text: '«أخيراً قهوة باردة مو حلا» — العملاء يعرّفون المنتج بما ليس فيه.', tag: 'دافع' },
            { title: 'الاعتراض الأول: السعر مقابل الكمية', text: '«غالية على الكمية، 330 مل قليلة» — الاعتراض على القيمة لا على الجودة.', tag: 'اعتراض' },
            { title: 'لحظة الاستهلاك: قبل الدوام', text: '«صرت أطلبها كل يوم قبل الدوام» — عادة يومية مرتبطة بالعمل.', tag: 'سلوك' },
            { title: 'نقطة الألم التشغيلية: التوصيل', text: '«وصلت القهوة دافية» — تهدد وعد المنتج البارد مباشرة.', tag: 'خطر' },
          ] : [
            { title: 'Strongest motivation: clean, no sugar', text: '“Finally a cold coffee that isn’t a dessert” — customers define it by what it leaves out.', tag: 'Motivation' },
            { title: 'Top objection: price vs. size', text: '“Expensive for 330 ml” — the objection is value, not quality.', tag: 'Objection' },
            { title: 'Usage moment: before work', text: '“I order it every day before work” — a daily work habit.', tag: 'Behavior' },
            { title: 'Operational pain: delivery', text: '“It arrived warm” — directly threatens the cold promise.', tag: 'Risk' },
          ] },
          { type: 'table', title: ar ? 'مصفوفة الاعتراضات' : 'Objection matrix', columns: ar ? ['الاعتراض', 'الدليل', 'الرد المقترح'] : ['Objection', 'Evidence', 'Suggested response'], rows: ar ? [
            ['السعر مرتفع للحجم', `${price} تقييمات`, 'إظهار سعر الكوب الواحد في الاشتراك الأسبوعي'],
            ['ما الفرق عن الآيس لاتيه؟', 'تقييم واحد على الأقل', 'شرح 18 ساعة نقع بلا حليب ولا سكر في 5 ثوانٍ'],
            ['تصل دافئة', `${delivery} تقييمات توصيل`, 'تغليف معزول ووعد «يوصلك بارد أو نعوّضك»'],
          ] : [
            ['Too expensive for the size', `${price} reviews`, 'Show per-cup price on the weekly subscription'],
            ['How is it different from iced latte?', 'At least one review', 'Explain 18-hour steep, no milk, no sugar, in 5 seconds'],
            ['Arrives warm', `${delivery} delivery reviews`, 'Insulated packaging and an “arrives cold or it’s on us” promise'],
          ] },
          { type: 'bullets', items: ar ? ['«قهوة باردة مو حلا»', '«تصحصح بدون ما تتعب المعدة»', '«القهوة الوحيدة اللي أشربها سادة»'] : ['“A cold coffee that isn’t a dessert”', '“Wakes you up without upsetting your stomach”', '“The only coffee I drink black”'] },
        ] } },
        { tool: 'create_deliverable', args: { kind: 'dashboard', title: ar ? 'أداء الحملات السابقة حسب القناة' : 'Past campaign performance by channel', subtitle: pick(lang, DEMO_TAG), blocks: [
          { type: 'metrics', items: [{ label: ar ? 'الإنفاق' : 'Spend', value: `SAR ${m.totals.spend ?? '—'}` }, { label: 'ROAS', value: String(m.totals.roas ?? '—') }, { label: 'CPA', value: `SAR ${m.totals.cpa ?? '—'}` }, { label: 'CTR', value: `${m.totals.ctr_pct ?? '—'}%` }] },
          { type: 'chart', title: ar ? 'العائد على الإنفاق الإعلاني حسب القناة' : 'ROAS by channel', labels: g.map(x => x.group), values: g.map(x => x.roas ?? 0), unit: 'x' },
          { type: 'table', columns: ar ? ['القناة', 'الإنفاق', 'المشتريات', 'CPA', 'ROAS', 'CTR %'] : ['Channel', 'Spend', 'Purchases', 'CPA', 'ROAS', 'CTR %'], rows: g.map(x => [x.group, String(x.spend), String(x.conversions), String(x.cpa ?? '—'), String(x.roas ?? '—'), String(x.ctr_pct ?? '—')]) },
          ...(m.anomalies?.length ? [{ type: 'callout', tone: 'warning', title: ar ? 'ملاحظات محسوبة' : 'Computed flags', text: m.anomalies.join('\n') }] : []),
          { type: 'paragraph', text: ar ? 'هذه علاقات مرصودة في بيانات سابقة وليست سبباً مثبتاً؛ نختبرها في خطة الإطلاق.' : 'These are observed associations in past data, not proven causes; the launch plan tests them.' },
        ] } },
      ]
    },
  },
  {
    plan: L('أبني اتجاهات الحملة الإبداعية وأجهّز العرض النهائي للعميل.', 'Building the creative directions and preparing the final client proposal.'),
    actions: lang => {
      const ar = lang === 'ar'
      return [
        { tool: 'load_skill', args: { id: 'experiment-factory' } },
        { tool: 'create_deliverable', args: { kind: 'strategy', title: ar ? 'حملة إطلاق كولد برو حَرّة' : 'Harra Cold Brew launch campaign', subtitle: pick(lang, DEMO_TAG), blocks: [
          { type: 'paragraph', text: ar ? 'الفكرة المحورية: «مو حلا. قهوة.» — نملك المساحة التي لم يتحدث عنها أي منافس: قهوة باردة نظيفة بلا سكر، تصلك باردة قبل الدوام.' : 'Core idea: “Not dessert. Coffee.” — we claim the space no competitor talks about: clean, sugar-free cold coffee that reaches you cold before work.' },
          { type: 'cards', items: ar ? [
            { title: '١. «مو حلا. قهوة.»', text: 'لقطات مقارنة صامتة: كوب مثلج مليء بالكريمة مقابل كولد برو صافٍ. نص على الشاشة بلغة العملاء. يختبر: هل «بدون سكر» دافع شراء كافٍ؟', tag: 'سناب / تيك توك' },
            { title: '٢. «18 ساعة عشان صباحك»', text: 'تايم لابس للنقع من المساء إلى الصباح ينتهي بموظف يفتح العلبة على مكتبه. يختبر: هل قصة الحرفة تبرّر السعر؟', tag: 'إنستغرام ريلز' },
            { title: '٣. «اشتراك المكتب»', text: 'عرض أسبوعي للفرق: سعر الكوب الواحد ظاهر، وتوصيل بارد مضمون. يختبر: هل يحل الاشتراك اعتراض السعر؟', tag: 'سناب / لينكدإن' },
          ] : [
            { title: '1. “Not dessert. Coffee.”', text: 'Silent side-by-side: a cream-loaded iced drink vs. clear cold brew. On-screen text in customers’ words. Tests: is “no sugar” enough to drive purchase?', tag: 'Snap / TikTok' },
            { title: '2. “18 hours for your morning”', text: 'Time-lapse of the steep from evening to morning, ending with someone opening the can at their desk. Tests: does craft justify price?', tag: 'Instagram Reels' },
            { title: '3. “Office subscription”', text: 'Weekly team offer: per-cup price visible, cold delivery guaranteed. Tests: does a subscription resolve the price objection?', tag: 'Snap / LinkedIn' },
          ] },
          { type: 'table', title: ar ? 'سيناريو فيديو 15 ثانية — الاتجاه الأول' : '15-second video script — direction 1', columns: ar ? ['الوقت', 'المشهد', 'النص'] : ['Time', 'Visual', 'Text / VO'], rows: ar ? [['0–3', 'يد تمسك كوباً مثلجاً مليئاً بالكريمة', '«هذي حلا…»'], ['3–7', 'نفس اليد تتركه وتأخذ علبة حَرّة', '«…هذي قهوة.»'], ['7–12', 'لقطة قريبة للقهوة الصافية تُسكب', 'بدون سكر مضاف. منقوعة 18 ساعة.'], ['12–15', 'الشعار + زر الطلب', 'كولد برو حَرّة — يوصلك بارد.']] : [['0–3', 'A hand holds a cream-loaded iced drink', '“This is dessert…”'], ['3–7', 'The hand swaps it for a Harra can', '“…this is coffee.”'], ['7–12', 'Close-up pour of clear cold brew', 'No added sugar. Steeped 18 hours.'], ['12–15', 'Logo + order button', 'Harra Cold Brew — arrives cold.']] },
          { type: 'table', title: ar ? 'مصفوفة الاختبار' : 'Testing matrix', columns: ar ? ['النسخة', 'الفرضية', 'المقياس', 'حد النجاح'] : ['Variant', 'Hypothesis', 'Metric', 'Success'], rows: ar ? [['مو حلا', 'بدون سكر يرفع النقر', 'CTR', 'أعلى من متوسط الحساب'], ['18 ساعة', 'الحرفة تقلّل حساسية السعر', 'معدل التحويل', 'أعلى من النسخة 1'], ['اشتراك المكتب', 'الاشتراك يرفع قيمة الطلب', 'تكلفة الاشتراك', 'أقل من CPA الحالي']] : [['Not dessert', 'No-sugar framing lifts clicks', 'CTR', 'Above account average'], ['18 hours', 'Craft lowers price sensitivity', 'Conversion rate', 'Above variant 1'], ['Office subscription', 'Subscription lifts order value', 'Cost per subscription', 'Below current CPA']] },
          { type: 'callout', tone: 'warning', title: ar ? 'شرط قبل الإطلاق' : 'Before launch', text: ar ? 'التوصيل البارد هو وعد الحملة؛ إن لم يُحل تأخر التوصيل فستعمل الإعلانات ضد العلامة.' : 'Cold delivery is the campaign promise; if delivery delays are not fixed, the ads will work against the brand.' },
        ] } },
        { tool: 'create_deliverable', args: { kind: 'proposal', title: ar ? 'عرض حملة الإطلاق — حَرّة للقهوة' : 'Launch campaign proposal — Harra Coffee', subtitle: pick(lang, DEMO_TAG), blocks: [
          { type: 'heading', text: ar ? 'الملخص التنفيذي' : 'Executive summary' },
          { type: 'paragraph', text: ar ? 'نقترح إطلاق كولد برو حَرّة على فكرة «مو حلا. قهوة.» موجّهة لموظفي الرياض وجدة، مع تركيز الإنفاق على القنوات الأعلى عائداً في الحملات السابقة، واشتراك أسبوعي للمكاتب يعالج اعتراض السعر.' : 'We propose launching Harra Cold Brew on “Not dessert. Coffee.”, aimed at office workers in Riyadh and Jeddah, concentrating spend on the channels with the highest past return, plus a weekly office subscription that answers the price objection.' },
          { type: 'heading', text: ar ? 'نطاق العمل' : 'Scope' },
          { type: 'table', columns: ar ? ['المخرج', 'التفاصيل', 'المدة'] : ['Deliverable', 'Details', 'Timing'], rows: ar ? [['الاستراتيجية الإبداعية', 'ثلاثة اتجاهات واختبار A/B', 'الأسبوع 1'], ['إنتاج المحتوى', '6 فيديوهات قصيرة + 12 تصميماً', 'الأسبوع 2–3'], ['الإطلاق والتحسين', 'إدارة الحملات وتقرير أسبوعي', 'الأسبوع 3–6']] : [['Creative strategy', 'Three directions and A/B tests', 'Week 1'], ['Content production', '6 short videos + 12 designs', 'Weeks 2–3'], ['Launch & optimization', 'Campaign management and weekly report', 'Weeks 3–6']] },
          { type: 'callout', tone: 'info', title: ar ? 'التسعير' : 'Pricing', text: ar ? 'لم تُزوَّد أسعار في هذا السيناريو، لذلك لا يتضمن العرض جدول أسعار.' : 'No prices were supplied in this scenario, so the proposal includes no pricing table.' },
          { type: 'heading', text: ar ? 'الخطوات التالية' : 'Next steps' },
          { type: 'bullets', items: ar ? ['اعتماد الاتجاه الإبداعي', 'تأكيد حل التوصيل البارد', 'تحديد الميزانية وبدء الإنتاج'] : ['Approve the creative direction', 'Confirm the cold-delivery fix', 'Set budget and start production'] },
        ] } },
      ]
    },
  },
]
