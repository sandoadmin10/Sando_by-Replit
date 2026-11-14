// SANDO Professional Marketer — skill catalog.
// Plain ES module on purpose: the browser (cards, task forms) and the Node agent (discovery + guidance)
// import the same file. To add a skill, append one object here — see ../README.md.
//
// summary   → always shown to the model, so it can decide which skills an objective needs
// guidance  → loaded only when the agent calls load_skill (progressive disclosure)
// fields    → the one-click task form for this skill
// tools     → the tools this skill usually relies on (the agent may use any registered tool)

const L = (ar, en) => ({ ar, en })

/** @type {Array<{id:string, icon:string, label:{ar:string,en:string}, short:{ar:string,en:string}, summary:string, examples:{ar:string,en:string}[], inputs:{ar:string,en:string}[], outputs:{ar:string,en:string}[], fields:Array<{id:string,type:'text'|'url'|'textarea'|'select'|'chips',label:{ar:string,en:string},options?:{ar:string,en:string}[],required?:boolean}>, tools:string[], guidance:string, deliverable:string}>} */
export const skills = [
  {
    id: 'opportunity-detector', icon: 'Radar',
    label: L('كاشف فرص التسويق', 'Marketing Opportunity Detector'),
    short: L('يفحص موقعك ويكشف فرصاً تسويقية مدعومة بالدليل.', 'Audits a website and surfaces evidence-backed opportunities.'),
    summary: 'Audit a company website: messaging, calls to action, product info, conversion paths, forms, missing commercial info. Output a prioritized, evidence-backed opportunity report.',
    examples: [L('افحص موقع متجري وحدد نقاط الضعف', 'Audit my store website for weak spots'), L('لماذا لا يتواصل معنا الزوار؟', 'Why are visitors not contacting us?')],
    inputs: [L('رابط الموقع', 'Website URL'), L('القطاع', 'Industry'), L('لقطات أو مستندات', 'Screenshots or documents')],
    outputs: [L('تقرير تدقيق تسويقي', 'Marketing audit'), L('فرص مرتبة بالأولوية', 'Prioritized opportunities'), L('PDF', 'PDF')],
    fields: [
      { id: 'url', type: 'url', label: L('رابط الموقع', 'Website URL'), required: true },
      { id: 'company', type: 'text', label: L('اسم الشركة', 'Company name') },
      { id: 'industry', type: 'select', label: L('القطاع', 'Industry'), options: [L('تجارة إلكترونية', 'E-commerce'), L('مطاعم ومقاهٍ', 'Food & beverage'), L('خدمات مهنية', 'Professional services'), L('تقنية وبرمجيات', 'Tech & software'), L('تعليم وتدريب', 'Education'), L('أخرى', 'Other')] },
      { id: 'social', type: 'textarea', label: L('روابط التواصل (اختياري)', 'Social links (optional)') },
    ],
    tools: ['fetch_public_page', 'read_attachment', 'view_image', 'create_deliverable'],
    deliverable: 'report',
    guidance: `Fetch the homepage first, then up to 3 key internal pages (product/pricing/contact) found in its links.
For each page note: value proposition clarity in the first screen, primary CTA text and count, product/service description quality, price/shipping/returns/contact visibility, trust signals (reviews, guarantees), forms (fields, friction — never submit), mobile viewport meta, tracking scripts detected.
Every finding must cite the page URL it came from. If a page is blocked or empty, say so and continue with what is available (screenshots, user files).
Score each opportunity by impact (high/medium/low) and effort, and label any impact estimate explicitly as a hypothesis.
Deliverable: an audit report — short executive summary, a "what we checked" sources block, prioritized opportunity cards, a table of quick wins, and next actions.`,
  },
  {
    id: 'voice-of-customer', icon: 'MessagesSquare',
    label: L('محلّل صوت العميل', 'Voice of Customer Analyzer'),
    short: L('يحوّل آراء العملاء إلى رسائل وإعلانات مقنعة.', 'Turns real customer feedback into messaging and hooks.'),
    summary: 'Analyze customer reviews, surveys, comments or interview transcripts: recurring problems, objections, purchase motivations, exact customer language, FAQs, sentiment. Output insights, an objection matrix and evidence-based messaging angles.',
    examples: [L('حلّل تقييمات منتجنا وابنِ رسائل إعلانية', 'Analyze our product reviews and build ad messaging'), L('ما أكثر اعتراضات العملاء؟', 'What objections do customers raise most?')],
    inputs: [L('تقييمات وتعليقات', 'Reviews and comments'), L('استبيانات CSV/Excel', 'Survey CSV/Excel'), L('نصوص مقابلات', 'Interview transcripts')],
    outputs: [L('تقرير رؤى العملاء', 'Customer insight report'), L('مصفوفة الاعتراضات', 'Objection matrix'), L('خطافات إعلانية', 'Ad hooks')],
    fields: [
      { id: 'product', type: 'text', label: L('المنتج أو الخدمة', 'Product or service'), required: true },
      { id: 'feedback', type: 'textarea', label: L('الصق التعليقات هنا أو أرفق ملفاً', 'Paste feedback here or attach a file') },
      { id: 'focus', type: 'chips', label: L('ركّز على', 'Focus on'), options: [L('الاعتراضات', 'Objections'), L('دوافع الشراء', 'Motivations'), L('لغة العميل', 'Customer language'), L('الأسئلة الشائعة', 'FAQ')] },
    ],
    tools: ['analyze_table', 'search_in_attachments', 'read_attachment', 'create_deliverable'],
    deliverable: 'insights',
    guidance: `Use analyze_table on tabular feedback to learn its size, columns and rating distribution; use search_in_attachments to find evidence for each theme you suspect.
Cluster feedback into themes. For every theme give: approximate share (computed from counts you actually observed), sentiment, and 1–2 verbatim quotes with their row/source.
Separate objections (why people hesitate) from motivations (why they buy). Capture the customer's own words — these become hooks.
Never fabricate quotes or testimonials; quote only text that exists in the inputs.
Deliverable: insight report with theme cards, an objection matrix table (objection | evidence | frequency | response), messaging angles, ad hooks in customer language, and an FAQ.`,
  },
  {
    id: 'competitor-radar', icon: 'Crosshair',
    label: L('رادار المنافسين', 'Competitor Radar'),
    short: L('يقارن تموضعك بالمنافسين ويكشف مساحات التميّز.', 'Compares positioning and finds room to stand out.'),
    summary: 'Research competitor websites (or supplied competitor notes): positioning, offers, pricing visibility, messaging, proof. Output a comparison matrix and differentiation opportunities with strategic experiments.',
    examples: [L('قارنّا بثلاثة منافسين', 'Compare us with three competitors'), L('أين نتميّز عن السوق؟', 'Where can we stand out in the market?')],
    inputs: [L('موقع الشركة', 'Company website'), L('روابط المنافسين', 'Competitor URLs'), L('السوق المستهدف', 'Target market')],
    outputs: [L('مصفوفة مقارنة', 'Comparison matrix'), L('فرص التميّز', 'Differentiation opportunities'), L('تجارب مقترحة', 'Suggested experiments')],
    fields: [
      { id: 'own', type: 'url', label: L('موقعك', 'Your website') },
      { id: 'competitors', type: 'textarea', label: L('روابط أو أسماء المنافسين (سطر لكل منافس)', 'Competitor URLs or names (one per line)'), required: true },
      { id: 'market', type: 'text', label: L('السوق المستهدف', 'Target market') },
    ],
    tools: ['fetch_public_page', 'search_web', 'read_attachment', 'create_deliverable'],
    deliverable: 'matrix',
    guidance: `Fetch each competitor homepage (and the user's site if given). If only names are given, use search_web when available; otherwise ask the user for URLs or use attached notes.
Compare on consistent dimensions: core promise, target customer, main offer, price visibility, proof/trust, CTA, tone, channels visible on site.
Do not claim an ad or tactic is profitable just because it is visible. There is no continuous monitoring — this is a point-in-time snapshot; say the date.
Deliverable: a comparison matrix table (rows = dimensions, columns = brands), a positioning map in words, 3–5 differentiation opportunities, and strategic experiments with a success metric each. Cite source URLs.`,
  },
  {
    id: 'experiment-factory', icon: 'FlaskConical',
    label: L('مصنع تجارب الإعلانات', 'Advertising Experiment Factory'),
    short: L('اتجاهات إبداعية ونصوص وسيناريوهات قابلة للاختبار.', 'Creative directions, copy and scripts built to be tested.'),
    summary: 'Create original campaign concepts from hypotheses: differentiated creative directions, hooks, platform-specific copy, video scripts/storyboards, visual direction, creative briefs, A/B test matrix with success metrics.',
    examples: [L('ثلاث أفكار حملة لإطلاق منتج', 'Three campaign ideas for a product launch'), L('سيناريو فيديو تيك توك 20 ثانية', 'A 20-second TikTok video script')],
    inputs: [L('المنتج والجمهور', 'Product and audience'), L('الهدف', 'Objective'), L('هوية العلامة', 'Brand guidelines'), L('رؤى العملاء', 'Customer insights')],
    outputs: [L('استراتيجية الحملة', 'Campaign strategy'), L('اتجاهات إبداعية', 'Creative directions'), L('مصفوفة اختبار', 'Testing matrix')],
    fields: [
      { id: 'product', type: 'text', label: L('المنتج أو الخدمة', 'Product or service'), required: true },
      { id: 'audience', type: 'text', label: L('الجمهور', 'Audience') },
      { id: 'objective', type: 'select', label: L('الهدف', 'Objective'), options: [L('الوعي بالعلامة', 'Awareness'), L('زيارات', 'Traffic'), L('عملاء محتملون', 'Leads'), L('مبيعات', 'Sales'), L('إطلاق منتج', 'Product launch')] },
      { id: 'platforms', type: 'chips', label: L('المنصات', 'Platforms'), options: [L('إنستغرام', 'Instagram'), L('تيك توك', 'TikTok'), L('سناب شات', 'Snapchat'), L('إكس', 'X'), L('يوتيوب', 'YouTube'), L('جوجل', 'Google')] },
      { id: 'brand', type: 'textarea', label: L('ملاحظات الهوية والنبرة', 'Brand and tone notes') },
    ],
    tools: ['retrieve_project_memory', 'read_attachment', 'view_image', 'create_deliverable'],
    deliverable: 'strategy',
    guidance: `Start from evidence: check project memory and attachments for customer insights or competitor findings before inventing angles.
Produce at least three genuinely different creative directions (different insight, tension or format — not three rewrites of one idea). For each: name, core insight, hook lines, platform copy (respect platform norms and length), visual direction, and the hypothesis it tests.
Write like a senior creative strategist: concrete, specific to the product and audience, culturally fluent (Saudi/Gulf when relevant), no clichés or filler superlatives.
For video: a shot-by-shot script table (time | visual | voiceover/on-screen text). If no image generation exists, write precise visual specs instead of pretending images exist.
End with a testing matrix (variant | hypothesis | primary metric | success threshold) and a creative brief.`,
  },
  {
    id: 'proposal-builder', icon: 'FileSignature',
    label: L('مجهّز عروض العملاء', 'Client Proposal Builder'),
    short: L('عرض تجاري مخصّص يبدأ من فهم شركة العميل.', 'A tailored proposal built from research on the client.'),
    summary: 'Research a target client company and write a tailored commercial proposal: executive summary, observed opportunities, selected services, scope and deliverables, pricing table only from provided prices, timeline, and a short outreach message.',
    examples: [L('جهّز عرضاً لهذا العميل بناءً على موقعه', 'Prepare a proposal for this client from their website'), L('رسالة تواصل أولى مختصرة', 'A short first outreach message')],
    inputs: [L('شركة العميل وموقعه', 'Client company and website'), L('خدماتك', 'Your services'), L('الأسعار', 'Pricing'), L('أعمال سابقة', 'Portfolio')],
    outputs: [L('عرض احترافي قابل للتحرير', 'Editable proposal'), L('PDF', 'PDF'), L('رسالة تواصل', 'Outreach message')],
    fields: [
      { id: 'client', type: 'text', label: L('اسم العميل', 'Client name'), required: true },
      { id: 'clientUrl', type: 'url', label: L('موقع العميل', 'Client website') },
      { id: 'services', type: 'textarea', label: L('الخدمات التي تقدّمها', 'Services you offer'), required: true },
      { id: 'pricing', type: 'textarea', label: L('الأسعار (اختياري — لن نخترع أسعاراً)', 'Pricing (optional — we never invent prices)') },
      { id: 'agency', type: 'text', label: L('اسم شركتك', 'Your company name') },
    ],
    tools: ['fetch_public_page', 'retrieve_project_memory', 'create_deliverable'],
    deliverable: 'proposal',
    guidance: `Research the client first (fetch their site) and tie every proposed service to something you observed or the user told you.
Structure it like an art-directed corporate proposal: cover (client, title, date, prepared by), executive summary, "what we noticed" with sources, proposed approach, scope & deliverables table, timeline, pricing table ONLY with prices the user supplied (otherwise a callout saying pricing will follow), why us (only facts the user supplied — never invent case studies, logos or results), next steps.
Also produce a separate short "outreach message" deliverable (under 120 words), written to be sent by the user. You cannot send it.`,
  },
  {
    id: 'prelaunch-inspector', icon: 'ShieldCheck',
    label: L('فاحص الحملة قبل الإطلاق', 'Pre-Launch Campaign Inspector'),
    short: L('يكشف الأخطاء الممكن تجنّبها قبل أن تدفع عليها.', 'Catches preventable problems before you spend on them.'),
    summary: 'Inspect a campaign before launch: landing page messaging vs ad claims, link health, mobile viewport, missing info/disclosures, consistency, tracking scripts visible in page HTML vs the supplied tracking plan. Output a checklist split into confirmed problems and unverified checks with severity.',
    examples: [L('افحص صفحة الهبوط مقابل الإعلان', 'Check the landing page against the ad'), L('هل حملتي جاهزة للإطلاق؟', 'Is my campaign ready to launch?')],
    inputs: [L('رابط صفحة الهبوط', 'Landing page URL'), L('نص الإعلان', 'Ad copy'), L('خطة التتبّع', 'Tracking plan')],
    outputs: [L('قائمة فحص', 'Checklist'), L('مشكلات مؤكدة', 'Confirmed issues'), L('تقرير الجاهزية', 'Readiness report')],
    fields: [
      { id: 'landing', type: 'url', label: L('رابط صفحة الهبوط', 'Landing page URL'), required: true },
      { id: 'ad', type: 'textarea', label: L('نص الإعلان', 'Ad copy'), required: true },
      { id: 'tracking', type: 'textarea', label: L('خطة التتبّع (مثل: GA4، Meta Pixel، Snap Pixel)', 'Tracking plan (e.g. GA4, Meta Pixel, Snap Pixel)') },
      { id: 'audience', type: 'text', label: L('الجمهور', 'Audience') },
    ],
    tools: ['fetch_public_page', 'create_deliverable'],
    deliverable: 'report',
    guidance: `Fetch the landing page. Compare each claim/offer/price in the ad copy with the page text: matched, mismatched, or not found.
Check: page reachable (status), final URL after redirects, viewport meta (mobile), primary CTA present, contact/price/terms info, load-relevant issues visible in HTML.
Tracking: fetch_public_page reports scripts detected in the static HTML. Mark a pixel as "detected in HTML" only if listed; you cannot confirm events fire — put that under unverified checks.
Deliverable: readiness verdict (ready / fix first / blocked), confirmed problems table (issue | evidence | severity | fix), unverified checks list, and a final pre-launch checklist.`,
  },
  {
    id: 'performance-investigator', icon: 'LineChart',
    label: L('محقّق أداء الحملات', 'Campaign Performance Investigator'),
    short: L('أرقام حملاتك محسوبة بدقة، وقرارات واضحة بعدها.', 'Exact campaign metrics, then clear decisions.'),
    summary: 'Analyze campaign performance exports (CSV/Excel): deterministic CTR, CPC, CPM, CPA, ROAS, conversion rate by campaign/channel/period/creative, anomalies, target comparison, optimization experiments. Numbers come only from calculate_marketing_metrics.',
    examples: [L('أي حملة تستنزف الميزانية؟', 'Which campaign is wasting budget?'), L('لخّص أداء الشهر للإدارة', 'Summarize this month for management')],
    inputs: [L('تقارير الحملات CSV/Excel', 'Campaign exports CSV/Excel'), L('المستهدفات', 'Targets')],
    outputs: [L('لوحة أداء', 'Performance dashboard'), L('ملخص تنفيذي', 'Executive summary'), L('تجارب تحسين', 'Optimization experiments')],
    fields: [
      { id: 'question', type: 'textarea', label: L('ما الذي تريد معرفته؟', 'What do you want to know?') },
      { id: 'targets', type: 'text', label: L('المستهدفات (مثل: CPA أقل من 40 ريال)', 'Targets (e.g. CPA under SAR 40)') },
      { id: 'groupBy', type: 'text', label: L('التجميع حسب (اختياري: الحملة، القناة…)', 'Group by (optional: campaign, channel…)') },
    ],
    tools: ['analyze_table', 'calculate_marketing_metrics', 'create_deliverable'],
    deliverable: 'dashboard',
    guidance: `Always call analyze_table first to see columns, then calculate_marketing_metrics (optionally group_by a dimension). Every number in your deliverable must come from tool output — never compute or estimate figures yourself.
Find: best/worst groups by CPA and ROAS, spend concentration, anomalies flagged by the tool, gaps vs the user's targets.
Distinguish correlation from causation explicitly ("associated with", not "caused").
Deliverable: dashboard-style report — metrics block of totals, a chart of the key metric by group, a table of all groups, problems found, and optimization experiments (change | expected effect as hypothesis | metric to watch).`,
  },
  {
    id: 'marketing-memory', icon: 'Brain',
    label: L('ذاكرة التسويق', 'Marketing Memory'),
    short: L('يتذكّر مشاريعك ونتائجك ليبني عليها لاحقاً.', 'Remembers your projects and results to build on later.'),
    summary: 'Store and recall project knowledge: briefs, brand guidelines, customer insights, competitor snapshots, experiments, results, preferences. Retrieve relevant memory before related tasks; save durable findings after them.',
    examples: [L('ماذا تعلّمنا من الحملة السابقة؟', 'What did we learn from the last campaign?'), L('احفظ إرشادات علامتنا', 'Save our brand guidelines')],
    inputs: [L('مشاريع سابقة', 'Past projects'), L('إرشادات العلامة', 'Brand guidelines'), L('نتائج', 'Results')],
    outputs: [L('سياق المشروع', 'Project context'), L('مقارنة التجارب', 'Experiment comparison')],
    fields: [],
    tools: ['retrieve_project_memory', 'save_project_memory'],
    deliverable: 'report',
    guidance: `Call retrieve_project_memory with the key topic before planning. After meaningful work, save only durable knowledge with save_project_memory: brand guidelines, validated insights, competitor snapshots (dated), experiment results, user preferences. Keep each record short and factual, and never save sample/demo data as if it were the user's history.`,
  },
]

export const skillById = id => skills.find(s => s.id === id)
