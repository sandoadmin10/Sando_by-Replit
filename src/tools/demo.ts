// Demo Mode logic: deterministic sample data, templates and agent replies. Nothing here calls an AI
// model, and every output produced from this file is labelled "Demo Mode" in the interface.
import { l, fmtMoney, fmtNum, type L, type Lang } from '../lib/i18n'
import type { ProfId } from '../lib/professions'

export type AgentReply = { message: string; patch?: Record<string, unknown>; next?: string }
export type DemoExecutor = (intent: string, state: any, lang: Lang) => AgentReply
const pick = (lang: Lang, ar: string, en: string) => (lang === 'ar' ? ar : en)

// ---------- Quotation ----------
export const sampleQuote = (lang: Lang) => ({
  client: pick(lang, 'نورة العتيبي', 'Noura Al-Otaibi'), company: pick(lang, 'شركة أفق الرياض للتجارة', 'Ofuq Riyadh Trading Co.'),
  discount: 5, tax: 15, notes: '',
  items: [
    { id: 'a', name: pick(lang, 'تصميم هوية بصرية', 'Brand identity design'), description: pick(lang, 'شعار وألوان', 'Logo and colors'), qty: 1, price: 8500 },
    { id: 'b', name: pick(lang, 'تطوير موقع إلكتروني', 'Website development'), description: pick(lang, 'موقع تعريفي', 'Company website'), qty: 1, price: 14000 },
    { id: 'c', name: pick(lang, 'إدارة حسابات التواصل', 'Social media management'), description: pick(lang, 'شهرياً', 'Monthly'), qty: 3, price: 2800 },
  ],
})
export const improveDescription = (name: string, lang: Lang) => {
  const n = name.trim() || pick(lang, 'الخدمة', 'the service')
  return pick(lang,
    `تنفيذ ${n} وفق أفضل الممارسات المهنية، يشمل التخطيط والتنفيذ وجولتَي مراجعة، مع تسليم نهائي موثّق وجاهز للاستخدام.`,
    `Delivery of ${n} to a professional standard, covering planning, execution and two review rounds, with a documented, ready-to-use final handover.`)
}
const quoteTerms = (lang: Lang) => pick(lang,
  'العرض صالح لمدة 30 يوماً من تاريخه. الدفع: 50% عند الاعتماد و50% عند التسليم. الأسعار بالريال السعودي وتشمل ضريبة القيمة المضافة الموضّحة أعلاه.',
  'This quotation is valid for 30 days from its date. Payment: 50% on approval and 50% on delivery. Prices are in Saudi Riyals and include the VAT shown above.')

// ---------- Content Studio ----------
export const sampleContentInput = (lang: Lang) => ({
  product: pick(lang, 'باقة قهوة مختصة للاشتراك الشهري', 'Monthly specialty coffee subscription box'), audience: pick(lang, 'موظفون شباب في الرياض يحبون القهوة', 'Young professionals in Riyadh who love coffee'),
  platform: 'Instagram', tone: 'friendly', goal: pick(lang, 'زيادة الاشتراكات الجديدة', 'Grow new subscriptions'),
})
export function demoContent(i: { product: string; audience: string; platform: string; tone: string; goal: string }, lang: Lang) {
  const p = i.product || pick(lang, 'منتجك', 'your product'), a = i.audience || pick(lang, 'جمهورك', 'your audience'), g = i.goal || pick(lang, 'تحقيق هدف الحملة', 'reaching the campaign goal')
  return lang === 'ar' ? {
    concept: `حملة «جرّبها أسبوعاً»: نقدّم ${p} كعادة يومية صغيرة تُحدث فرقاً، ونخاطب ${a} بقصص واقعية قصيرة بدل الوعود العامة. الهدف: ${g}.`,
    post: `يومك مزدحم؟ خلّ ${p} أسهل قرار فيه.\n\nصمّمناه لـ${a}: بسيط، واضح، ويوصلك بدون تعقيد.\nجرّبه هذا الأسبوع وشاركنا رأيك. 👇`,
    ad: `${p} — مصمَّم لـ${a}. ابدأ اليوم واحصل على تجربة أولى بلا التزام.`,
    cta: 'اطلبه الآن وجرّب الفرق',
    schedule: `الأحد — منشور تعريفي: ما هو ${p} ولمن؟\nالثلاثاء — قصة عميل قصيرة (${i.platform})\nالخميس — عرض محدود مرتبط بهدف: ${g}\nالسبت — إجابة عن أكثر 3 أسئلة تكراراً`,
  } : {
    concept: `"Try it for a week": position ${p} as a small daily habit that makes a real difference, speaking to ${a} through short true-to-life stories instead of broad promises. Goal: ${g}.`,
    post: `Busy day? Make ${p} the easiest decision in it.\n\nBuilt for ${a}: simple, clear, and no fuss.\nTry it this week and tell us what you think. 👇`,
    ad: `${p} — made for ${a}. Start today with a no-commitment first experience.`,
    cta: 'Order now and feel the difference',
    schedule: `Sunday — Intro post: what ${p} is and who it is for\nTuesday — Short customer story (${i.platform})\nThursday — Limited offer tied to the goal: ${g}\nSaturday — Answers to the 3 most common questions`,
  }
}

// ---------- Spreadsheet samples (one per profession) ----------
export const sampleCsv: Record<ProfId, { name: string; csv: string }> = {
  marketing: { name: 'campaigns-q3.csv', csv: 'Campaign,Channel,Spend,Clicks,Leads\nAutumn Launch,Instagram,12000,8400,310\nBack to School,Snapchat,9000,6100,180\nCoffee Week,TikTok,7500,9800,265\nLoyalty Push,Email,2000,1900,140\nNational Day,Instagram,15000,12300,420\nWeekend Offer,Google Ads,6400,3100,95' },
  sales: { name: 'sales-q3.csv', csv: 'Rep,Region,Deals,Revenue,Avg Deal\nSara,Riyadh,14,186000,13286\nFahad,Jeddah,11,142500,12955\nLama,Dammam,9,98000,10889\nOmar,Riyadh,16,231000,14438\nReem,Makkah,7,64500,9214\nYousef,Jeddah,12,157000,13083' },
  admin: { name: 'expenses-october.csv', csv: 'Department,Category,Budget,Spent,Requests\nHR,Training,40000,36500,12\nIT,Licenses,85000,91200,9\nOperations,Maintenance,60000,48700,21\nFinance,Audit,30000,29800,4\nFacilities,Supplies,22000,25400,33\nLegal,Consulting,45000,31000,5' },
  education: { name: 'trainee-scores.csv', csv: 'Trainee,Course,Attendance,Quiz Score,Final Score\nAhmed,Cybersecurity Basics,92,78,84\nMaha,Cybersecurity Basics,100,91,95\nKhalid,Data Analysis,75,62,68\nHind,Data Analysis,88,85,87\nTurki,Project Management,96,74,80\nJoud,Project Management,83,88,90' },
}

// ---------- Quiz (fixed sample material) ----------
export const sampleQuiz = (lang: Lang) => lang === 'ar' ? {
  topic: 'التصيّد الإلكتروني',
  text: 'التصيّد الإلكتروني هو محاولة خداع المستخدم ليكشف معلومات حساسة مثل كلمات المرور أو بيانات البطاقات، غالباً عبر رسائل بريد أو روابط تنتحل صفة جهة موثوقة. من علاماته: الاستعجال والتهديد، عنوان مرسل لا يطابق الجهة الرسمية، روابط تختلف وجهتها الفعلية عن النص الظاهر، ومرفقات غير متوقعة. للحماية: تحقّق من عنوان المرسل، مرّر المؤشر فوق الرابط قبل النقر، فعّل التحقق الثنائي، ولا تُدخل بياناتك إلا في الموقع الرسمي. وعند الشك، بلّغ فريق أمن المعلومات ولا تتفاعل مع الرسالة.',
  questions: [
    { q: 'ما الهدف الأساسي من هجمات التصيّد الإلكتروني؟', options: ['تسريع الإنترنت', 'خداع المستخدم لكشف معلومات حساسة', 'تحديث النظام', 'حذف الرسائل القديمة'], answer: 1, explanation: 'التصيّد يهدف إلى سرقة بيانات مثل كلمات المرور وبيانات البطاقات عبر الخداع.' },
    { q: 'أي مما يلي علامة شائعة على رسالة تصيّد؟', options: ['لغة هادئة بلا طلبات', 'الاستعجال والتهديد بإغلاق الحساب', 'وصولها في وقت الدوام', 'احتواؤها على توقيع'], answer: 1, explanation: 'المهاجمون يستخدمون الاستعجال والتهديد لدفع الضحية إلى التصرف بلا تفكير.' },
    { q: 'ما الإجراء الأفضل قبل النقر على رابط في رسالة؟', options: ['النقر فوراً', 'إعادة توجيه الرسالة للزملاء', 'تمرير المؤشر فوق الرابط للتحقق من وجهته', 'الرد على المرسل ببياناتك'], answer: 2, explanation: 'تمرير المؤشر يكشف الوجهة الفعلية للرابط قبل فتحه.' },
    { q: 'ما الذي يضيف طبقة حماية حتى لو سُرقت كلمة المرور؟', options: ['التحقق الثنائي', 'تغيير الخلفية', 'حذف المتصفح', 'إيقاف التحديثات'], answer: 0, explanation: 'التحقق الثنائي يتطلب عاملاً إضافياً لا يملكه المهاجم.' },
    { q: 'ماذا تفعل عند الشك في رسالة؟', options: ['تفتح المرفق للتأكد', 'تبلّغ فريق أمن المعلومات ولا تتفاعل معها', 'تتجاهل الأمر تماماً', 'تدخل بياناتك ثم تغيّرها'], answer: 1, explanation: 'التبليغ يحميك ويحمي زملاءك من الرسالة نفسها.' },
  ],
} : {
  topic: 'Phishing awareness',
  text: 'Phishing is an attempt to trick a user into revealing sensitive information such as passwords or card details, usually through emails or links that impersonate a trusted organization. Warning signs include urgency and threats, a sender address that does not match the official organization, links whose real destination differs from the visible text, and unexpected attachments. To stay safe: check the sender address, hover over a link before clicking, enable two-factor authentication, and only enter your details on the official website. When in doubt, report the message to the security team and do not interact with it.',
  questions: [
    { q: 'What is the main goal of a phishing attack?', options: ['Speeding up the internet', 'Tricking users into revealing sensitive information', 'Updating the system', 'Deleting old emails'], answer: 1, explanation: 'Phishing aims to steal data such as passwords and card details through deception.' },
    { q: 'Which of these is a common sign of a phishing message?', options: ['Calm language with no requests', 'Urgency and threats to close your account', 'Arriving during work hours', 'Containing a signature'], answer: 1, explanation: 'Attackers use urgency and threats to push victims into acting without thinking.' },
    { q: 'What is the best step before clicking a link in a message?', options: ['Click immediately', 'Forward it to colleagues', 'Hover over the link to check its destination', 'Reply with your details'], answer: 2, explanation: 'Hovering reveals the real destination before you open it.' },
    { q: 'What adds protection even if your password is stolen?', options: ['Two-factor authentication', 'Changing your wallpaper', 'Deleting the browser', 'Pausing updates'], answer: 0, explanation: 'Two-factor authentication requires an extra factor the attacker does not have.' },
    { q: 'What should you do when you suspect a message?', options: ['Open the attachment to check', 'Report it to the security team and do not interact', 'Ignore it completely', 'Enter your details, then change them'], answer: 1, explanation: 'Reporting protects you and your colleagues from the same message.' },
  ],
}

/** Builds fill-in-the-blank questions straight from the user's own text — no AI needed. */
export function localQuiz(text: string, count: number, lang: Lang) {
  const sents = text.split(/(?<=[.!?؟])\s+|\n+/).map(s => s.trim()).filter(s => s.split(/\s+/).length >= 6)
  const words = (s: string) => s.split(/\s+/).map(w => w.replace(/[^\p{L}\p{N}-]/gu, '')).filter(w => w.length >= 5)
  const pool = [...new Set(sents.flatMap(words))]
  const out: { q: string; options: string[]; answer: number; explanation: string }[] = []
  sents.forEach((s, i) => {
    const ans = words(s).sort((a, b) => b.length - a.length)[0]
    const others = pool.filter(w => w !== ans && !s.includes(w))
    if (!ans || others.length < 3 || out.length >= count) return
    const start = (i * 5) % others.length, pos = i % 4
    const options = [0, 1, 2].map(k => others[(start + k) % others.length])
    options.splice(pos, 0, ans)
    out.push({ q: pick(lang, 'أكمل الفراغ: ', 'Fill in the blank: ') + s.replace(ans, 'ــــــــ'), options, answer: pos, explanation: s })
  })
  return out
}

// ---------- Agent ----------
export const agentSuggestions: Record<string, { id: string; label: L }[]> = {
  workspace: [{ id: 'recommend', label: l('بماذا أبدأ؟', 'Where should I start?') }, { id: 'what', label: l('ماذا تستطيع أن تفعل؟', 'What can you do?') }],
  'quotation-builder': [{ id: 'improve', label: l('حسّن أوصاف البنود', 'Improve item descriptions') }, { id: 'explain', label: l('اشرح الإجمالي', 'Explain the total') }, { id: 'notes', label: l('أضف شروطاً احترافية', 'Add professional terms') }, { id: 'next', label: l('ما الأداة التالية؟', 'Which tool next?') }],
  'campaign-studio': [{ id: 'shorten', label: l('اختصر المنشور', 'Shorten the post') }, { id: 'cta', label: l('اقترح دعوة أقوى', 'Suggest a stronger CTA') }, { id: 'next', label: l('ما الأداة التالية؟', 'Which tool next?') }],
  'spreadsheet-analyzer': [{ id: 'explain', label: l('اشرح النتائج', 'Explain the results') }, { id: 'next', label: l('ما الأداة التالية؟', 'Which tool next?') }],
  'quiz-generator': [{ id: 'explain', label: l('اشرح نتيجتي', 'Explain my score') }, { id: 'next', label: l('ما الأداة التالية؟', 'Which tool next?') }],
}
const KEYWORDS: [RegExp, string][] = [[/حس[ّ]?ن|improve|rewrite|صياغة/i, 'improve'], [/اشرح|فس[ّ]?ر|explain|why|لماذا/i, 'explain'], [/اختصر|short/i, 'shorten'], [/دعوة|cta/i, 'cta'], [/شروط|terms|notes|ملاحظات/i, 'notes'], [/التالي|next|أداة/i, 'next'], [/ابدأ|start|recommend/i, 'recommend']]
export const intentFromText = (t: string) => KEYWORDS.find(([re]) => re.test(t))?.[1] ?? 'unknown'

export const agentDemo: DemoExecutor & { tools: Record<string, DemoExecutor> } = Object.assign(
  ((intent, state, lang) => ({
    message: intent === 'what'
      ? pick(lang, 'أنا مدمج داخل الأدوات: أقرأ مدخلات الأداة المفتوحة، أقترح تعديلات تُطبَّق بعد موافقتك، أشرح النتائج المحسوبة، وأرشّح الأداة التالية. افتح أي أداة وجرّب الاقتراحات.', 'I live inside the tools: I read the open tool’s inputs, propose edits that apply only after you confirm, explain calculated results, and recommend the next tool. Open any tool and try the suggestions.')
      : (intent === 'recommend' || intent === 'unknown') && state?.firstTool
        ? pick(lang, `بناءً على إجاباتك، ابدأ بأداة «${state.firstToolName}» — هي الأقرب لمهامك المتكررة.`, `Based on your answers, start with “${state.firstToolName}” — it is the closest match to your recurring tasks.`)
        : pick(lang, 'لم ألتقط المطلوب تماماً. جرّب أحد الاقتراحات بالأسفل أو صِف طلبك بتفصيل أكثر.', 'I did not quite catch that. Try one of the suggestions below, or describe your request in more detail.'),
    next: intent !== 'what' ? state?.firstTool : undefined,
  })) as DemoExecutor,
  { tools: {} as Record<string, DemoExecutor> },
)
const fallback: DemoExecutor = (intent, state, lang) => agentDemo(intent === 'what' ? 'what' : 'unknown', state, lang)

agentDemo.tools['quotation-builder'] = (intent, s, lang) => {
  const t = s.totals
  if (intent === 'improve') return { message: pick(lang, `أعدت صياغة أوصاف ${s.items.length} بنود بلغة احترافية. راجعها ثم اضغط «تطبيق» لتحديث العرض.`, `I rewrote the descriptions of ${s.items.length} items in professional language. Review them, then press “Apply” to update the quotation.`), patch: { descriptions: s.items.map((it: any) => improveDescription(it.name, lang)) } }
  if (intent === 'notes') return { message: pick(lang, 'هذه صياغة مقترحة لشروط العرض والدفع:', 'Here is a suggested wording for validity and payment terms:'), patch: { notes: quoteTerms(lang) } }
  if (intent === 'explain') return { message: pick(lang,
    `المجموع الفرعي ${fmtMoney(t.subtotal, lang)} من ${s.items.length} بنود. خصم ${fmtNum(s.discount, lang)}% يساوي ${fmtMoney(t.discount, lang)}، فيصبح المبلغ الخاضع للضريبة ${fmtMoney(t.taxable, lang)}. ضريبة ${fmtNum(s.tax, lang)}% تساوي ${fmtMoney(t.tax, lang)}، والإجمالي النهائي ${fmtMoney(t.total, lang)}. هذه الأرقام محسوبة داخل الأداة وليست من تقدير الذكاء الاصطناعي.`,
    `The subtotal is ${fmtMoney(t.subtotal, lang)} across ${s.items.length} items. A ${fmtNum(s.discount, lang)}% discount equals ${fmtMoney(t.discount, lang)}, leaving ${fmtMoney(t.taxable, lang)} taxable. Tax at ${fmtNum(s.tax, lang)}% is ${fmtMoney(t.tax, lang)}, for a final total of ${fmtMoney(t.total, lang)}. These figures are calculated by the tool, not estimated by AI.`) }
  if (intent === 'next') return { message: pick(lang, 'بعد إرسال العرض، حلّل أرقام مبيعاتك لمعرفة أين تتركز الفرص.', 'After sending the quote, analyze your sales numbers to see where the opportunities are.'), next: 'spreadsheet-analyzer' }
  return fallback(intent, s, lang)
}
agentDemo.tools['campaign-studio'] = (intent, s, lang) => {
  if (!s.post) return { message: pick(lang, 'أنشئ المحتوى أولاً، ثم أستطيع تحسينه معك.', 'Generate the content first, then I can refine it with you.') }
  if (intent === 'shorten') return { message: pick(lang, 'نسخة أقصر من المنشور تحافظ على الفكرة:', 'A shorter version of the post that keeps the idea:'), patch: { post: s.post.split('\n').filter((x: string) => x.trim()).slice(0, 2).join('\n') } }
  if (intent === 'cta') return { message: pick(lang, 'دعوة أكثر تحديداً ومرتبطة بوقت:', 'A more specific, time-bound call to action:'), patch: { cta: pick(lang, 'احجز مكانك اليوم — العرض ينتهي الخميس', 'Claim your spot today — offer ends Thursday') } }
  if (intent === 'next') return { message: pick(lang, 'بعد النشر، ارفع نتائج الحملة في محلّل الجداول لقياس الأداء.', 'After publishing, upload the campaign results to the Spreadsheet Analyzer to measure performance.'), next: 'spreadsheet-analyzer' }
  return fallback(intent, s, lang)
}
agentDemo.tools['spreadsheet-analyzer'] = (intent, s, lang) => {
  if (!s.stats?.length) return { message: pick(lang, 'ارفع ملف CSV أو جرّب الملف الجاهز أولاً.', 'Upload a CSV or try the example file first.') }
  if (intent === 'explain') {
    const c = s.stats.find((x: any) => x.col === s.valueCol) ?? s.stats[0]
    return { message: pick(lang,
      `الملف يحتوي ${s.rows} صفوف و${s.stats.length} أعمدة رقمية. في عمود «${c.col}»: المجموع ${fmtNum(c.sum, lang)} والمتوسط ${fmtNum(c.avg, lang)}، وأعلى قيمة ${fmtNum(c.max, lang)}${s.top ? ` (${s.top})` : ''} وأدناها ${fmtNum(c.min, lang)}. الفارق بين الأعلى والأدنى يستحق المراجعة أولاً.`,
      `The file has ${s.rows} rows and ${s.stats.length} numeric columns. In “${c.col}”: the sum is ${fmtNum(c.sum, lang)} and the average ${fmtNum(c.avg, lang)}; the highest value is ${fmtNum(c.max, lang)}${s.top ? ` (${s.top})` : ''} and the lowest ${fmtNum(c.min, lang)}. The gap between highest and lowest is the first thing worth reviewing.`) }
  }
  if (intent === 'next' && s.heroTool) return { message: pick(lang, 'حوّل هذه الأرقام إلى عمل: انتقل إلى أداة مجالك الأساسية.', 'Turn these numbers into action: jump to your main profession tool.'), next: s.heroTool }
  return fallback(intent, s, lang)
}
agentDemo.tools['quiz-generator'] = (intent, s, lang) => {
  if (!s.total) return { message: pick(lang, 'أنشئ الاختبار أولاً ثم جرّب وضع الاختبار التفاعلي.', 'Generate the quiz first, then try the interactive mode.') }
  if (intent === 'explain') return s.score == null
    ? { message: pick(lang, `الاختبار جاهز بـ${s.total} أسئلة. ابدأ وضع الاختبار وسأشرح نتيجتك بعد التسليم.`, `The quiz is ready with ${s.total} questions. Start quiz mode and I will explain your score after you submit.`) }
    : { message: pick(lang, `نتيجتك ${s.score} من ${s.total}. ${s.wrong.length ? `راجع هذه النقاط: ${s.wrong.join(' — ')}` : 'إجابات كاملة، ممتاز.'}`, `You scored ${s.score} of ${s.total}. ${s.wrong.length ? `Review these points: ${s.wrong.join(' — ')}` : 'A perfect run.'}`) }
  if (intent === 'next') return { message: pick(lang, 'حلّل درجات المتدربين لمعرفة من يحتاج دعماً إضافياً.', 'Analyze trainee scores to see who needs extra support.'), next: 'spreadsheet-analyzer' }
  return fallback(intent, s, lang)
}
