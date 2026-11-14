// SANDO Professional Sales Employee — skill catalog (shared by the browser UI and the Node agent).
// Same contract as the marketing skills: summary (always visible to the model), guidance (loaded on
// demand with load_skill), fields (one-click form), tools, deliverable. Order matches the product UI.

const L = (ar, en) => ({ ar, en })

export const skills = [
  {
    id: 'lead-generation', icon: 'Users',
    label: L('توليد العملاء المحتملين', 'Lead Generation'),
    short: L('يبني ملف العميل المثالي ويكتشف عملاء محتملين من البحث على الويب (إن كان مفعّلاً) أو من مستنداتك.', 'Builds your ideal customer profile and finds prospects from web search (when enabled) or your documents.'),
    summary: 'Find potential customer companies by industry, location, size and activity; collect public company info and public contact channels; build a prioritized prospect table ready for Excel.',
    examples: [L('30 شركة مقاولات في الرياض قد تحتاج أثاثاً مكتبياً', '30 construction firms in Riyadh that may need office furniture'), L('ابنِ ملف العميل المثالي لمنتجاتنا', 'Build an ideal customer profile for our products')],
    inputs: [L('القطاع والمدينة', 'Industry and city'), L('حجم الشركة', 'Company size'), L('ملف الشركة', 'Company profile')],
    outputs: [L('ملف العميل المثالي', 'Ideal customer profile'), L('قائمة عملاء محتملين', 'Prospect list'), L('تصدير Excel', 'Excel export')],
    fields: [
      { id: 'industry', type: 'text', label: L('القطاع المستهدف', 'Target industry'), required: true },
      { id: 'city', type: 'text', label: L('المدينة أو المنطقة', 'City or region') },
      { id: 'size', type: 'select', label: L('حجم الشركة', 'Company size'), options: [L('صغيرة (1–49)', 'Small (1–49)'), L('متوسطة (50–249)', 'Medium (50–249)'), L('كبيرة (250+)', 'Large (250+)')] },
      { id: 'count', type: 'text', label: L('عدد العملاء المطلوب', 'How many prospects') },
    ],
    tools: ['get_company_profile', 'search_web', 'fetch_public_page', 'crm_upsert', 'create_deliverable'], deliverable: 'workbook',
    guidance: `Start with get_company_profile to understand what is sold and to whom. Write a short ideal customer profile (industry, size, signals of need, decision maker role).
If search_web is available, run several specific queries (industry + city + signals), then fetch_public_page on the most promising company sites to confirm activity and find PUBLIC contact channels (website contact page, general email/phone). Never guess personal emails or phone numbers.
If search is not configured, say so plainly and build the list from attachments the user provided, or ask the user for a source list.
Deliverable kind "workbook": a prospects table (company | city | activity | size signal | why a fit | public contact | source URL | priority), plus the ideal customer profile. Offer to add the top prospects to the CRM with crm_upsert (stage "new").`,
  },
  {
    id: 'lead-import', icon: 'FileUp',
    label: L('استيراد العملاء من ملف', 'Import Leads from a File'),
    short: L('يستورد العملاء من جداول Excel/CSV/Word المرفوعة إلى الـ CRM مع منع التكرار، ثم يقيّمهم.', 'Imports leads from uploaded Excel/CSV/Word into the CRM without duplicates, then scores them.'),
    summary: 'Read an uploaded customer list (spreadsheet or document), clean and normalize it, de-duplicate against the existing CRM, add records with crm_upsert, and report what was imported.',
    examples: [L('استورد قائمة العملاء المرفقة', 'Import the attached customer list'), L('نظّف هذا الملف وأزل المكرر', 'Clean this file and remove duplicates')],
    inputs: [L('ملف Excel أو CSV أو Word', 'Excel, CSV or Word file')], outputs: [L('عملاء في الـ CRM', 'CRM records'), L('تقرير الاستيراد', 'Import report')],
    fields: [{ id: 'note', type: 'textarea', label: L('ملاحظات عن الملف (اختياري)', 'Notes about the file (optional)') }],
    tools: ['analyze_table', 'read_attachment', 'crm_list', 'crm_upsert', 'create_deliverable'], deliverable: 'report',
    guidance: `Profile the file with analyze_table (or read_attachment for documents). Map its columns to: company, contact, email, phone, city, industry, value, notes. Call crm_list first to avoid duplicates (match by company name, case-insensitive).
Add each new company with crm_upsert (stage "new", source = file name). Update existing ones only with genuinely new information.
Report: rows read, imported, skipped as duplicates, rows with missing essential data (table), and suggested next step.`,
  },
  {
    id: 'lead-qualification', icon: 'Target',
    label: L('تحليل وتأهيل العملاء', 'Lead Analysis & Qualification'),
    short: L('يقيّم العملاء بنقاط شفافة (الملاءمة، التواصل، المرحلة، الحداثة) ويرتّب الأولويات مع توصية لكل عميل.', 'Scores leads transparently (fit, engagement, stage, recency) and prioritizes them with a recommendation each.'),
    summary: 'Evaluate leads or a CRM list: fit with the company offering, observable engagement, deal stage and recency; give a transparent score, priority class (A/B/C), likely needs, and the recommended approach for each, with evidence.',
    examples: [L('قيّم عملائي ورتّبهم حسب الأولوية', 'Score my leads and rank them'), L('من أفضل 5 عملاء أتواصل معهم هذا الأسبوع؟', 'Which 5 leads should I contact this week?')],
    inputs: [L('الـ CRM أو ملف عملاء', 'CRM or lead file'), L('ملف الشركة', 'Company profile')], outputs: [L('جدول أولويات', 'Priority table'), L('تحديث تقييمات الـ CRM', 'CRM score updates')],
    fields: [{ id: 'criteria', type: 'textarea', label: L('معايير إضافية (اختياري)', 'Extra criteria (optional)') }],
    tools: ['crm_list', 'analyze_table', 'search_in_attachments', 'fetch_public_page', 'crm_upsert', 'create_deliverable'], deliverable: 'workbook',
    guidance: `Use a transparent 100-point score: Fit 40 (industry/size/need vs. company profile), Engagement 25 (replies, meetings, requests seen in data), Stage 20, Recency 15. Show the sub-scores, never a black-box number.
Only use evidence present in CRM records, attachments or fetched pages; when a factor is unknown, score it 0 and say "unknown".
Deliverable: a ranked table (company | fit | engagement | stage | recency | total | class A/B/C | likely need | recommended approach | evidence), a short summary of the top opportunities, and update each lead's score in the CRM with crm_upsert.`,
  },
  {
    id: 'account-research', icon: 'Building2',
    label: L('بحث حساب عميل', 'Account Research'),
    short: L('يعدّ ملخصاً عن شركة عميل: نشاطها، احتياجاتها المحتملة، صنّاع القرار، ونقاط الحديث، من البحث والمستندات وسجل الـ CRM.', 'Prepares an account brief: activity, likely needs, decision roles and talking points, from research, documents and CRM history.'),
    summary: 'Research one customer company in depth: what they do, products, recent public signals, likely needs relevant to our offering, decision-making roles (generic roles unless public), risks, and talking points for the next meeting.',
    examples: [L('جهّز لي ملخصاً عن هذه الشركة قبل الاجتماع', 'Brief me on this company before the meeting')],
    inputs: [L('اسم الشركة أو موقعها', 'Company name or website')], outputs: [L('ملخص الحساب (Word/PDF)', 'Account brief (Word/PDF)')],
    fields: [{ id: 'company', type: 'text', label: L('اسم الشركة', 'Company name'), required: true }, { id: 'url', type: 'url', label: L('موقع الشركة', 'Company website') }],
    tools: ['fetch_public_page', 'search_web', 'crm_list', 'get_company_profile', 'create_deliverable'], deliverable: 'brief',
    guidance: `Fetch the company's homepage and about/products pages. Check crm_list for prior history. Separate clearly: verified facts (with URL), user-provided info, and your inferences (labelled).
Deliverable "brief": snapshot (what they do, size signals, locations), likely needs mapped to our products, buying roles to approach (generic titles unless publicly named), risks/objections to expect, 5 talking points, and a recommended next step. Include a sources block.`,
  },
  {
    id: 'outreach', icon: 'Mail',
    label: L('التواصل مع العملاء', 'Sales Outreach'),
    short: L('يكتب رسائل تواصل مخصصة لكل عميل (بريد، لينكدإن، واتساب، أو نص مكالمة) بنبرة شركتك وتوقيعها.', 'Writes personalized outreach per lead (email, LinkedIn, WhatsApp or call script) in your company tone and signature.'),
    summary: 'Write personalized first-touch and follow-up messages per lead and channel (email, LinkedIn, WhatsApp, call script), in the company tone, with 2–3 variants; queue each ready message for the user’s approval with draft_message.',
    examples: [L('اكتب بريد تعريف لأفضل 3 عملاء', 'Write intro emails for my top 3 leads'), L('نص مكالمة أولى مع شركة مقاولات', 'A first-call script for a construction firm')],
    inputs: [L('العملاء', 'Leads'), L('القناة', 'Channel'), L('هدف الرسالة', 'Message goal')], outputs: [L('رسائل جاهزة للإرسال أو النسخ', 'Messages ready to send or copy')],
    fields: [
      { id: 'who', type: 'textarea', label: L('لمن؟ (أسماء العملاء أو "أفضل العملاء في الـ CRM")', 'To whom? (lead names or "top CRM leads")'), required: true },
      { id: 'channel', type: 'chips', label: L('القناة', 'Channel'), options: [L('بريد', 'Email'), L('لينكدإن', 'LinkedIn'), L('واتساب', 'WhatsApp'), L('مكالمة', 'Call')] },
      { id: 'goal', type: 'text', label: L('هدف الرسالة', 'Goal of the message') },
    ],
    tools: ['crm_list', 'get_company_profile', 'draft_message', 'create_deliverable'], deliverable: 'copy',
    guidance: `Personalize every message with one specific, true detail about the lead (from CRM, research or files) and one clear, low-friction ask. Short: emails under 120 words, LinkedIn under 300 characters, WhatsApp under 60 words. Use the company tone and signature from the profile.
Write 2 variants for the first lead to let the user choose a style, then apply it to the rest. For every message the user could send, call draft_message (one per recipient) — you cannot send; the user approves.
Deliverable "copy": table of messages (lead | channel | subject | message) plus the call script if asked.`,
  },
  {
    id: 'follow-up', icon: 'CalendarClock',
    label: L('إدارة المتابعات', 'Follow-up Assistant'),
    short: L('يحسب مواعيد المتابعة لكل عميل حسب مرحلته وآخر تواصل، ويحدد المتأخر، ويجهّز الرسائل.', 'Plans follow-up dates per lead from stage and last contact, flags overdue ones, and drafts messages.'),
    summary: 'Find leads and deals needing follow-up (overdue next dates, unanswered quotations, inactive deals), recommend timing by stage, schedule next actions in the CRM, and draft personalized follow-up messages.',
    examples: [L('من يحتاج متابعة اليوم؟', 'Who needs a follow-up today?'), L('عروض الأسعار التي لم يُرد عليها', 'Quotations with no reply')],
    inputs: [L('الـ CRM', 'CRM'), L('سجل المراسلات', 'Communication history')], outputs: [L('جدول متابعات (Excel)', 'Follow-up schedule (Excel)'), L('رسائل', 'Messages')],
    fields: [{ id: 'window', type: 'select', label: L('النطاق', 'Scope'), options: [L('المتأخرة فقط', 'Overdue only'), L('هذا الأسبوع', 'This week'), L('كل العملاء النشطين', 'All active leads')] }],
    tools: ['crm_list', 'crm_upsert', 'draft_message', 'create_deliverable'], deliverable: 'workbook',
    guidance: `Today's date is given. Overdue = next_date before today. Suggested cadence: new lead 2 days, after first reply 3 days, quotation sent 3 then 7 days, negotiation 2 days, inactive >21 days = re-engagement.
Update next_action/next_date with crm_upsert, draft follow-ups with draft_message (approval required), and deliver a schedule table (company | stage | last contact | days idle | next action | date | message ready?).`,
  },
  {
    id: 'conversation-intel', icon: 'MessageSquareText',
    label: L('ذكاء المحادثات', 'Conversation Intelligence'),
    short: L('يحلل محضر مكالمة أو محادثة أو بريد: المشاعر، الاعتراضات، إشارات الشراء، وأفضل خطوة تالية.', 'Analyzes a call transcript, chat or email thread: needs, objections, buying signals and next best action.'),
    summary: 'Analyze uploaded conversations or email threads: needs and requirements, objections and questions, budget and timeline if mentioned, interest signals (observable only), summary, recommended reply and next best action; update the CRM.',
    examples: [L('حلل محضر الاجتماع المرفق', 'Analyze the attached meeting notes'), L('ما اعتراضات العميل في هذه المحادثة؟', 'What objections did the customer raise?')],
    inputs: [L('محضر أو محادثة أو بريد', 'Transcript, chat or email')], outputs: [L('تقرير تحليل المحادثة', 'Conversation analysis report')],
    fields: [{ id: 'paste', type: 'textarea', label: L('الصق المحادثة هنا أو أرفق ملفاً', 'Paste the conversation or attach a file') }, { id: 'company', type: 'text', label: L('العميل', 'Customer') }],
    tools: ['read_attachment', 'search_in_attachments', 'crm_upsert', 'draft_message', 'create_deliverable'], deliverable: 'report',
    guidance: `Quote the customer's exact words for every need, objection and buying signal (with line reference). Budget and timeline only if explicitly stated. Interest level must cite observable indicators, not guesses.
Deliverable: summary, needs table, objections & questions with suggested answers, buying signals, risks, next best action; draft the reply with draft_message; log the conversation outcome and next step in the CRM.`,
  },
  {
    id: 'quotation', icon: 'Receipt', approval: true,
    label: L('منشئ عروض الأسعار', 'Quotation Builder'),
    short: L('يبني عرض سعر دقيقاً من الكتالوج المعتمد مع الضريبة وسياسة الخصم، ويصدّره PDF وExcel وWord.', 'Builds an exact quotation from the approved catalog with tax and discount policy; exports PDF, Excel and Word.'),
    summary: 'Generate a professional quotation: items from the approved catalog (or user-supplied prices), quantities, descriptions, discount within policy, tax, totals computed by build_quotation, customer and company details and branding, optional alternative options.',
    examples: [L('عرض سعر لـ 20 مكتباً و20 كرسياً', 'Quote 20 desks and 20 chairs'), L('حوّل طلب العميل المرفق إلى عرض سعر', 'Turn the attached customer request into a quotation')],
    inputs: [L('العميل', 'Customer'), L('البنود والكميات', 'Items and quantities'), L('الخصم', 'Discount')], outputs: [L('عرض سعر (PDF/Excel/Word)', 'Quotation (PDF/Excel/Word)')],
    fields: [
      { id: 'customer', type: 'text', label: L('العميل', 'Customer'), required: true },
      { id: 'items', type: 'textarea', label: L('البنود والكميات (أو أرفق طلب العميل)', 'Items and quantities (or attach the request)'), required: true },
      { id: 'discount', type: 'text', label: L('الخصم المطلوب %', 'Requested discount %') },
    ],
    tools: ['get_company_profile', 'read_attachment', 'build_quotation', 'crm_upsert', 'create_deliverable'], deliverable: 'proposal',
    guidance: `Always call get_company_profile, then build_quotation — it is the ONLY source of prices and totals. Use catalog prices; for items not in the catalog, use a price only if the user stated it, otherwise ask_user. If the requested discount exceeds policy, build within policy and explain that a higher discount needs manager approval.
Deliverable "proposal" titled as a quotation: customer & company details, quote number and date, items table (item | description | qty | unit price | total), metrics block (subtotal, discount, VAT, grand total — copied exactly from build_quotation), validity and payment terms from the profile, and an optional alternative option if useful. Update the CRM deal value and stage "proposal".`,
  },
  {
    id: 'technical-proposal', icon: 'FileText',
    label: L('منشئ العروض الفنية', 'Sales Proposal Builder'),
    short: L('يكتب عرضاً فنياً وتجارياً كاملاً (Word) أو عرضاً تقديمياً (PowerPoint) مبنياً على احتياج العميل.', 'Writes a complete technical and commercial proposal (Word) or a presentation (PowerPoint) built on the customer need.'),
    summary: 'Build a customized commercial/technical proposal: understanding of the customer need, recommended solution from our products, benefits and value, implementation plan and timeline, pricing table from build_quotation, terms; formatted for Word, PDF and PowerPoint.',
    examples: [L('عرض فني لتجهيز مكتب 50 موظفاً', 'A technical proposal to furnish a 50-person office'), L('عرض تقديمي للاجتماع مع العميل', 'A presentation for the client meeting')],
    inputs: [L('احتياج العميل', 'Customer need'), L('ملف الشركة والكتالوج', 'Company profile and catalog')], outputs: [L('عرض فني (Word/PDF/PowerPoint)', 'Proposal (Word/PDF/PowerPoint)')],
    fields: [{ id: 'customer', type: 'text', label: L('العميل', 'Customer'), required: true }, { id: 'need', type: 'textarea', label: L('احتياج العميل', 'Customer need'), required: true }],
    tools: ['get_company_profile', 'crm_list', 'read_attachment', 'build_quotation', 'create_deliverable'], deliverable: 'proposal',
    guidance: `Open with the customer's situation in their words, then the recommended solution mapped need → product → benefit. Include an implementation plan table (phase | scope | duration), a pricing table from build_quotation, assumptions, terms from the profile, and next steps. Never invent case studies, clients or certifications. Use headings so each section becomes a clean slide in PowerPoint.`,
  },
  {
    id: 'negotiation', icon: 'Handshake',
    label: L('مساعد التفاوض', 'Negotiation Assistant'),
    short: L('يبني استراتيجية تفاوض: الهدف، البدائل، سلّم التنازلات ضمن سياسة الخصم، وردود على الاعتراضات.', 'Builds a negotiation strategy: goal, alternatives, a concession ladder within discount policy, and objection responses.'),
    summary: 'Prepare a negotiation: objectives, walk-away point, the customer’s likely position, concession ladder strictly within the company discount policy, value-based responses to objections, alternative packages, and suggested wording.',
    examples: [L('العميل يطلب خصم 25%، كيف أرد؟', 'The customer wants 25% off — how do I respond?')],
    inputs: [L('الصفقة', 'Deal'), L('اعتراضات العميل', 'Customer objections')], outputs: [L('خطة تفاوض', 'Negotiation plan')],
    fields: [{ id: 'deal', type: 'text', label: L('الصفقة أو العميل', 'Deal or customer'), required: true }, { id: 'objection', type: 'textarea', label: L('ما يطلبه العميل أو يعترض عليه', 'What the customer asks or objects to'), required: true }],
    tools: ['get_company_profile', 'crm_list', 'build_quotation', 'create_deliverable'], deliverable: 'strategy',
    guidance: `Never exceed the profile's max discount; anything beyond needs manager approval — say so. Prefer trading concessions (volume, payment terms, contract length, scope) over price cuts. Use build_quotation to show the exact numbers of each alternative package.
Deliverable "strategy": situation, our goal and walk-away, concession ladder table (step | we give | we ask in return | resulting total), objection → response table, and 2–3 ready-to-say phrasings.`,
  },
  {
    id: 'deal-closing', icon: 'BadgeCheck', approval: true,
    label: L('إغلاق الصفقات', 'Deal Closing Assistant'),
    short: L('يجهّز خطة الإغلاق وقائمة التحقق ومسودة خطاب تأكيد الطلب، ويطلب موافقتك قبل أي إرسال.', 'Prepares the closing plan, checklist and an order-confirmation letter, and asks for your approval before sending.'),
    summary: 'Analyze where a deal stands, identify blockers and missing information, recommend the next best action, prepare the closing checklist, order confirmation/acceptance letter and closing message (queued for approval).',
    examples: [L('ما الذي يمنع إغلاق صفقة شركة البناء؟', 'What is blocking the construction company deal?')],
    inputs: [L('الصفقة', 'Deal')], outputs: [L('حزمة الإغلاق', 'Closing package')],
    fields: [{ id: 'deal', type: 'text', label: L('الصفقة أو العميل', 'Deal or customer'), required: true }],
    tools: ['crm_list', 'get_company_profile', 'draft_message', 'crm_upsert', 'create_deliverable'], deliverable: 'brief',
    guidance: `Read the deal in the CRM. List blockers with evidence, missing information (decision maker, budget approval, PO, delivery date…), and the single next best action. Prepare: closing checklist table, order confirmation letter (as a deliverable section), and a closing message via draft_message. Never claim a deal is won; only the user can mark it won.`,
  },
  {
    id: 'crm-pipeline', icon: 'SquareKanban',
    label: L('إدارة الـ CRM والمسار', 'CRM & Pipeline Management'),
    short: L('يضيف عملاء ويحدّث بياناتهم ومراحلهم، ويرصد الصفقات المتأخرة، ويعرض المسار حسب المرحلة.', 'Adds and updates customers and stages, spots stalled deals, and shows the pipeline by stage.'),
    summary: 'Create and update CRM records (company, contact, stage, value, next action/date, notes and activity), identify delayed/inactive deals, and summarize the pipeline by stage with values.',
    examples: [L('حدّث مرحلة صفقة نماء إلى تفاوض', 'Move the Namaa deal to negotiation'), L('لخّص المسار الحالي', 'Summarize the current pipeline')],
    inputs: [L('الـ CRM', 'CRM')], outputs: [L('تحديثات الـ CRM', 'CRM updates'), L('ملخص المسار', 'Pipeline summary')],
    fields: [{ id: 'request', type: 'textarea', label: L('ماذا تريد في الـ CRM؟', 'What should change in the CRM?'), required: true }],
    tools: ['crm_list', 'crm_upsert', 'create_deliverable'], deliverable: 'dashboard',
    guidance: `Stages: new, qualified, contacted, proposal, negotiation, won, lost. Apply requested changes with crm_upsert and confirm each one. For pipeline summaries, compute counts and values only from crm_list output (list your arithmetic inputs in the table) and flag deals idle for more than 14 days or with overdue next dates.`,
  },
  {
    id: 'sales-analytics', icon: 'ChartColumn',
    label: L('تحليلات المبيعات والأداء', 'Sales Analytics & Performance'),
    short: L('يحسب الإيرادات ونسب الإغلاق وأداء المندوبين والمنتجات من ملفاتك، ويبني لوحة أداء وتقريراً.', 'Computes revenue, win rates, rep and product performance from your files, and builds a dashboard and report.'),
    summary: 'Analyze sales exports: revenue, deals, average deal, win/loss rate, by rep/product/customer/period, period comparisons, targets, lost-deal patterns; numbers only from calculate_sales_metrics; dashboards and reports.',
    examples: [L('كيف كان أداء المندوبين هذا الربع؟', 'How did the reps perform this quarter?'), L('أي المنتجات الأقل مبيعاً؟', 'Which products sell least?')],
    inputs: [L('تقارير المبيعات (Excel/CSV)', 'Sales exports (Excel/CSV)'), L('المستهدفات', 'Targets')], outputs: [L('لوحة أداء', 'Dashboard'), L('تقرير (PDF/Excel)', 'Report (PDF/Excel)')],
    fields: [{ id: 'question', type: 'textarea', label: L('ماذا تريد أن تعرف؟', 'What do you want to know?') }, { id: 'groupBy', type: 'text', label: L('التجميع حسب (المندوب، المنتج…)', 'Group by (rep, product…)') }],
    tools: ['analyze_table', 'calculate_sales_metrics', 'create_deliverable'], deliverable: 'dashboard',
    guidance: `Call analyze_table, then calculate_sales_metrics (group_by the dimension asked; it also returns monthly figures when a date column exists). Every number must come from tool output. Forecasts only as clearly labelled simple projections from the monthly trend, with the method stated. Distinguish correlation from causation.
Deliverable "dashboard": metrics (revenue, deals, win rate, average deal), a chart by the key dimension, a full table, findings, and recommended actions.`,
  },
  {
    id: 'competitor-intel', icon: 'Swords',
    label: L('ذكاء المنافسين', 'Competitor Intelligence'),
    short: L('يقارن منتجاتك وعروضك بالمنافسين من مواقعهم وعروضهم المرفقة، ويحدد نقاط تميّزك.', 'Compares your products and offers with competitors from their sites and attached quotes, and finds your edge.'),
    summary: 'Research competitors (public sites, attached competitor quotations): products, public prices and offers, strengths and weaknesses, comparison with our solutions, competitive advantages and battle-card talking points.',
    examples: [L('قارن عرضنا بعرض المنافس المرفق', 'Compare our offer with the attached competitor quote')],
    inputs: [L('روابط أو عروض المنافسين', 'Competitor links or quotes')], outputs: [L('تقرير مقارنة', 'Comparison report'), L('بطاقة مواجهة للمندوب', 'Sales battle card')],
    fields: [{ id: 'competitors', type: 'textarea', label: L('روابط أو أسماء المنافسين', 'Competitor links or names'), required: true }],
    tools: ['fetch_public_page', 'search_web', 'read_attachment', 'get_company_profile', 'create_deliverable'], deliverable: 'matrix',
    guidance: `Compare on consistent dimensions with sources. Only public or user-provided prices. Deliverable: comparison matrix, where we win / where we lose, and a battle card (objection "competitor X is cheaper" → response).`,
  },
]

export const skillById = id => skills.find(s => s.id === id)
