import { useEffect, useMemo, useState } from 'react'
import { Sparkles, Copy, Download, Save, Check, Database } from 'lucide-react'
import { useDict, useI18n, l } from '../lib/i18n'
import { aiRequest } from '../lib/ai'
import { saveOutput, logActivity } from '../lib/store'
import { Button, Card, Field, inputCls, download, copyText, useAiStatus } from '../components/ui'
import { useAgentBridge } from '../components/Agent'
import { SavedList, useOpenSaved, DemoNote, useFlash } from './shared'
import { demoContent, sampleContentInput } from './demo'
import type { ToolProps } from './registry'

type Input = { product: string; audience: string; platform: string; tone: string; goal: string }
type Output = { concept: string; post: string; ad: string; cta: string; schedule: string }
type Doc = { input: Input; out: Output | null; demo: boolean }
const EMPTY: Input = { product: '', audience: '', platform: 'Instagram', tone: 'friendly', goal: '' }
const PLATFORMS = ['Instagram', 'X', 'TikTok', 'Snapchat', 'LinkedIn']

const D = {
  ar: { brief: 'موجز الحملة', product: 'المنتج أو الخدمة', audience: 'الجمهور المستهدف', platform: 'المنصة', tone: 'النبرة', goal: 'هدف الحملة', gen: 'أنشئ المحتوى', regen: 'أنشئ من جديد', working: 'يكتب ساندو…', sample: 'مثال جاهز', result: 'المحتوى — قابل للتحرير', concept: 'فكرة الحملة', post: 'منشور التواصل', ad: 'النص الإعلاني', cta: 'الدعوة لاتخاذ إجراء', schedule: 'جدول المحتوى المقترح', copy: 'نسخ الكل', copied: 'تم النسخ', export: 'تصدير', save: 'حفظ', saved: 'تم الحفظ', empty: 'املأ الموجز ثم اضغط «أنشئ المحتوى». كل النتائج قابلة للتحرير والنسخ والتصدير.', need: 'اكتب المنتج أو الخدمة أولاً.', failed: 'تعذّر الوصول إلى الذكاء الاصطناعي، فعرضنا ناتج وضع العرض.', tones: { friendly: 'ودّية', formal: 'رسمية', bold: 'جريئة', playful: 'مرحة' } },
  en: { brief: 'Campaign brief', product: 'Product or service', audience: 'Target audience', platform: 'Platform', tone: 'Tone', goal: 'Campaign goal', gen: 'Generate content', regen: 'Generate again', working: 'SANDO is writing…', sample: 'Example', result: 'Content — editable', concept: 'Campaign concept', post: 'Social media post', ad: 'Advertising copy', cta: 'Call to action', schedule: 'Suggested content schedule', copy: 'Copy all', copied: 'Copied', export: 'Export', save: 'Save', saved: 'Saved', empty: 'Fill in the brief and press “Generate content”. Every result can be edited, copied and exported.', need: 'Enter the product or service first.', failed: 'The AI could not be reached, so Demo Mode output is shown.', tones: { friendly: 'Friendly', formal: 'Formal', bold: 'Bold', playful: 'Playful' } },
}

export default function ContentStudio({ autoSample }: ToolProps) {
  const d = useDict(D), { lang } = useI18n(), ai = useAiStatus()
  const [doc, setDoc] = useState<Doc>({ input: EMPTY, out: null, demo: false })
  const [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const [savedId, setSavedId] = useState<string | null>(null)
  const [copied, flashCopy] = useFlash(), [saved, flashSave] = useFlash()
  const { input, out } = doc
  useEffect(() => { if (autoSample) setDoc({ input: sampleContentInput(lang), out: null, demo: false }) }, [autoSample]) // eslint-disable-line
  useOpenSaved<Doc>('campaign-studio', (data, id) => { setDoc(data); setSavedId(id) })

  const state = useMemo(() => ({ ...(out ?? {}), input }), [out, input])
  useAgentBridge('campaign-studio', state, p => setDoc(c => (c.out ? { ...c, out: { ...c.out, ...Object.fromEntries(['concept', 'post', 'ad', 'cta'].filter(k => typeof p[k] === 'string').map(k => [k, p[k]])) } } : c)))

  const setIn = (k: keyof Input, v: string) => setDoc(c => ({ ...c, input: { ...c.input, [k]: v } }))
  const setOut = (k: keyof Output, v: string) => setDoc(c => (c.out ? { ...c, out: { ...c.out, [k]: v } } : c))
  async function generate() {
    if (!input.product.trim()) return setErr(d.need)
    setErr('')
    let result: Output | null = null, demo = true
    if (ai.live) {
      setBusy(true)
      try {
        const r = await aiRequest<Omit<Output, 'schedule'> & { schedule: { day: string; idea: string }[] }>('content', lang, input)
        result = { ...r, schedule: r.schedule.map(s => `${s.day} — ${s.idea}`).join('\n') }; demo = false
      } catch { setErr(d.failed) }
      setBusy(false)
    }
    setDoc(c => ({ ...c, out: result ?? demoContent(input, lang), demo }))
    logActivity('campaign-studio', l(`إنشاء محتوى حملة: ${input.product}`, `Generated campaign content: ${input.product}`))
  }
  const fields: [keyof Output, string, number][] = [['concept', d.concept, 3], ['post', d.post, 5], ['ad', d.ad, 2], ['cta', d.cta, 1], ['schedule', d.schedule, 4]]
  const asText = () => fields.map(([k, label]) => `## ${label}\n${out?.[k] ?? ''}`).join('\n\n')

  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <div className="space-y-5">
        <Card className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between"><h2 className="font-display text-sm font-semibold">{d.brief}</h2><Button size="sm" variant="ghost" onClick={() => setDoc(c => ({ ...c, input: sampleContentInput(lang) }))}><Database size={14} />{d.sample}</Button></div>
          <Field label={d.product}><input className={inputCls} value={input.product} onChange={e => setIn('product', e.target.value)} /></Field>
          <Field label={d.audience}><input className={inputCls} value={input.audience} onChange={e => setIn('audience', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={d.platform}><select className={inputCls} value={input.platform} onChange={e => setIn('platform', e.target.value)}>{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select></Field>
            <Field label={d.tone}><select className={inputCls} value={input.tone} onChange={e => setIn('tone', e.target.value)}>{Object.entries(d.tones).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          </div>
          <Field label={d.goal}><input className={inputCls} value={input.goal} onChange={e => setIn('goal', e.target.value)} /></Field>
          {err && <p className="text-xs text-amber-400">{err}</p>}
          <Button className="w-full" onClick={generate} disabled={busy}><Sparkles size={16} />{busy ? d.working : out ? d.regen : d.gen}</Button>
        </Card>
        <Card className="p-4 sm:p-5"><SavedList<Doc> toolId="campaign-studio" activeId={savedId} onOpen={(data, id) => { setDoc(data); setSavedId(id) }} /></Card>
      </div>

      <Card className="p-4 sm:p-5">
        {!out ? <p className="flex min-h-56 items-center justify-center px-6 text-center text-sm leading-relaxed text-muted">{d.empty}</p> : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-sm font-semibold">{d.result}</h2>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={async () => { if (await copyText(asText())) flashCopy() }}>{copied ? <Check size={14} className="ok-text" /> : <Copy size={14} />}{copied ? d.copied : d.copy}</Button>
                <Button size="sm" variant="outline" onClick={() => download('sando-campaign.md', asText(), 'text/markdown')}><Download size={14} />{d.export}</Button>
                <Button size="sm" onClick={() => { setSavedId(saveOutput('campaign-studio', input.product, doc, savedId ?? undefined)); flashSave() }}>{saved ? <Check size={14} /> : <Save size={14} />}{saved ? d.saved : d.save}</Button>
              </div>
            </div>
            {doc.demo && <DemoNote />}
            {fields.map(([k, label, rows]) => <Field key={k} label={label}><textarea rows={rows} className={inputCls + ' leading-relaxed'} value={out[k]} onChange={e => setOut(k, e.target.value)} /></Field>)}
          </div>
        )}
      </Card>
    </div>
  )
}
