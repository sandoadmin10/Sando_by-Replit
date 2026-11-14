import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2, Save, Printer, Sparkles, FilePlus2, Check, Database } from 'lucide-react'
import { useDict, useI18n, fmtMoney } from '../lib/i18n'
import { saveOutput, logActivity } from '../lib/store'
import { l } from '../lib/i18n'
import { Button, Card, Field, inputCls, printNode } from '../components/ui'
import { Logo } from '../components/Brand'
import { useAgent, useAgentBridge } from '../components/Agent'
import { SavedList, useOpenSaved, useFlash } from './shared'
import { sampleQuote } from './demo'
import type { ToolProps } from './registry'

type Item = { id: string; name: string; description: string; qty: number; price: number }
type Quote = { number: string; date: string; client: string; company: string; items: Item[]; discount: number; tax: number; notes: string }

// All money math is plain deterministic JavaScript, rounded to halalas. AI never touches these numbers.
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
export function calcQuote(q: Pick<Quote, 'items' | 'discount' | 'tax'>) {
  const subtotal = r2(q.items.reduce((s, it) => s + it.qty * it.price, 0))
  const discount = r2(subtotal * Math.min(100, Math.max(0, q.discount)) / 100)
  const taxable = r2(subtotal - discount)
  const tax = r2(taxable * Math.max(0, q.tax) / 100)
  return { subtotal, discount, taxable, tax, total: r2(taxable + tax) }
}
const uid = () => Math.random().toString(36).slice(2, 8)
const blank = (): Quote => ({ number: 'Q-' + String(Date.now()).slice(-5), date: new Date().toISOString().slice(0, 10), client: '', company: '', items: [{ id: uid(), name: '', description: '', qty: 1, price: 0 }], discount: 0, tax: 15, notes: '' })
const num = (v: string) => Math.max(0, Number(v) || 0)

const D = {
  ar: { details: 'بيانات العرض', client: 'اسم العميل', company: 'الشركة', number: 'رقم العرض', date: 'التاريخ', items: 'البنود', name: 'المنتج أو الخدمة', desc: 'الوصف', qty: 'الكمية', price: 'سعر الوحدة', add: 'إضافة بند', discount: 'الخصم %', tax: 'الضريبة %', notes: 'الشروط والملاحظات', improve: 'حسّن الأوصاف مع ساندو', save: 'حفظ', saved: 'تم الحفظ', pdf: 'تصدير PDF', fresh: 'عرض جديد', sample: 'مثال جاهز', preview: 'معاينة العرض', quote: 'عرض سعر', to: 'مقدَّم إلى', item: 'البند', total: 'الإجمالي', subtotal: 'المجموع الفرعي', disc: 'الخصم', vat: 'ضريبة القيمة المضافة', grand: 'الإجمالي النهائي', untitled: 'عرض بلا اسم', remove: 'حذف البند', from: 'صادر عن', demoCo: 'شركتك', pdfHint: 'يفتح نافذة الطباعة — اختر «حفظ كـ PDF».' },
  en: { details: 'Quotation details', client: 'Client name', company: 'Company', number: 'Quote no.', date: 'Date', items: 'Line items', name: 'Product or service', desc: 'Description', qty: 'Qty', price: 'Unit price', add: 'Add item', discount: 'Discount %', tax: 'Tax %', notes: 'Terms and notes', improve: 'Improve descriptions with SANDO', save: 'Save', saved: 'Saved', pdf: 'Export PDF', fresh: 'New quote', sample: 'Example', preview: 'Quotation preview', quote: 'Quotation', to: 'Prepared for', item: 'Item', total: 'Total', subtotal: 'Subtotal', disc: 'Discount', vat: 'VAT', grand: 'Grand total', untitled: 'Untitled quote', remove: 'Remove item', from: 'Issued by', demoCo: 'Your company', pdfHint: 'Opens the print dialog — choose “Save as PDF”.' },
}

export default function QuotationBuilder({ autoSample }: ToolProps) {
  const d = useDict(D), { lang } = useI18n(), agent = useAgent()
  const [q, setQ] = useState<Quote>(blank)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [flash, doFlash] = useFlash()
  const paper = useRef<HTMLDivElement>(null)
  const totals = useMemo(() => calcQuote(q), [q])
  const loadSample = () => { setQ({ ...blank(), ...sampleQuote(lang) }); setSavedId(null) }
  useEffect(() => { if (autoSample) loadSample() }, [autoSample]) // eslint-disable-line
  useOpenSaved<Quote>('quotation-builder', (data, id) => { setQ(data); setSavedId(id) })

  const state = useMemo(() => ({ ...q, totals }), [q, totals])
  useAgentBridge('quotation-builder', state, p => setQ(c => ({
    ...c, notes: typeof p.notes === 'string' ? p.notes : c.notes,
    items: c.items.map((it, i) => (typeof p.descriptions?.[i] === 'string' ? { ...it, description: p.descriptions[i] } : it)),
  })))

  const set = <K extends keyof Quote>(k: K, v: Quote[K]) => setQ(c => ({ ...c, [k]: v }))
  const setItem = (id: string, patch: Partial<Item>) => setQ(c => ({ ...c, items: c.items.map(it => (it.id === id ? { ...it, ...patch } : it)) }))
  const title = [q.number, q.company || q.client || d.untitled].join(' · ')
  const save = () => { setSavedId(saveOutput('quotation-builder', title, q, savedId ?? undefined)); logActivity('quotation-builder', l(`حفظ عرض السعر ${q.number}`, `Saved quotation ${q.number}`)); doFlash() }
  const exportPdf = () => { if (paper.current) { logActivity('quotation-builder', l(`تصدير العرض ${q.number} إلى PDF`, `Exported quotation ${q.number} to PDF`)); printNode(paper.current) } }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-5">
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-sm font-semibold">{d.details}</h2>
            <div className="flex gap-2"><Button size="sm" variant="ghost" onClick={loadSample}><Database size={14} />{d.sample}</Button><Button size="sm" variant="ghost" onClick={() => { setQ(blank()); setSavedId(null) }}><FilePlus2 size={14} />{d.fresh}</Button></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={d.client}><input className={inputCls} value={q.client} onChange={e => set('client', e.target.value)} /></Field>
            <Field label={d.company}><input className={inputCls} value={q.company} onChange={e => set('company', e.target.value)} /></Field>
            <Field label={d.number}><input className={inputCls} dir="ltr" value={q.number} onChange={e => set('number', e.target.value)} /></Field>
            <Field label={d.date}><input type="date" className={inputCls} value={q.date} onChange={e => set('date', e.target.value)} /></Field>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-sm font-semibold">{d.items}</h2>
            <Button size="sm" variant="soft" onClick={() => agent.ask('improve', d.improve)}><Sparkles size={14} className="brand-text" />{d.improve}</Button>
          </div>
          <div className="space-y-3">
            {q.items.map((it, i) => (
              <div key={it.id} className="rounded-xl border border-line p-3">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[1fr_5rem_7rem_auto]">
                  <Field label={`${d.name} ${i + 1}`} className="col-span-2 sm:col-span-1"><input className={inputCls} value={it.name} onChange={e => setItem(it.id, { name: e.target.value })} /></Field>
                  <Field label={d.qty}><input type="number" min={0} inputMode="decimal" dir="ltr" className={inputCls} value={it.qty} onChange={e => setItem(it.id, { qty: num(e.target.value) })} /></Field>
                  <Field label={d.price}><input type="number" min={0} inputMode="decimal" dir="ltr" className={inputCls} value={it.price} onChange={e => setItem(it.id, { price: num(e.target.value) })} /></Field>
                  <div className="col-span-2 flex items-end justify-between gap-3 sm:col-span-1 sm:block sm:pt-6">
                    <span className="text-sm font-medium sm:hidden" dir="ltr">{fmtMoney(r2(it.qty * it.price), lang)}</span>
                    <button onClick={() => setQ(c => ({ ...c, items: c.items.filter(x => x.id !== it.id) }))} disabled={q.items.length === 1} aria-label={d.remove} className="rounded-lg p-2.5 text-muted hover:bg-fg/5 hover:text-red-400 disabled:opacity-30"><Trash2 size={15} /></button>
                  </div>
                </div>
                <Field label={d.desc} className="mt-2.5"><textarea rows={2} className={inputCls} value={it.description} onChange={e => setItem(it.id, { description: e.target.value })} /></Field>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setQ(c => ({ ...c, items: [...c.items, { id: uid(), name: '', description: '', qty: 1, price: 0 }] }))}><Plus size={14} />{d.add}</Button>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label={d.discount}><input type="number" min={0} max={100} dir="ltr" className={inputCls} value={q.discount} onChange={e => set('discount', Math.min(100, num(e.target.value)))} /></Field>
            <Field label={d.tax}><input type="number" min={0} dir="ltr" className={inputCls} value={q.tax} onChange={e => set('tax', num(e.target.value))} /></Field>
          </div>
          <Field label={d.notes} className="mt-3"><textarea rows={3} className={inputCls} value={q.notes} onChange={e => set('notes', e.target.value)} /></Field>
        </Card>
        <Card className="p-4 sm:p-5"><SavedList<Quote> toolId="quotation-builder" activeId={savedId} onOpen={(data, id) => { setQ(data); setSavedId(id) }} /></Card>
      </div>

      <div className="xl:sticky xl:top-20 xl:self-start">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold">{d.preview}</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={save}>{flash ? <Check size={14} className="ok-text" /> : <Save size={14} />}{flash ? d.saved : d.save}</Button>
            <Button size="sm" onClick={exportPdf} title={d.pdfHint}><Printer size={14} />{d.pdf}</Button>
          </div>
        </div>
        {/* The paper is always light: it is a document, and it is what gets printed. */}
        <div ref={paper} className="rounded-2xl bg-white p-5 text-[13px] leading-relaxed text-[#14152b] shadow-xl sm:p-8" style={{ fontFamily: '"Readex Pro", system-ui, sans-serif' }}>
          <div className="flex items-start justify-between gap-4 border-b border-[#e3e2f0] pb-5">
            <div><div className="text-2xl font-bold" style={{ fontFamily: 'Alexandria, sans-serif' }}>{d.quote}</div><div className="mt-1 text-[#5d6183]" dir="ltr">{q.number} · {q.date}</div></div>
            <div className="flex items-center gap-2 text-end"><div><div className="text-[11px] text-[#5d6183]">{d.from}</div><div className="font-semibold">{d.demoCo}</div></div><Logo size={34} /></div>
          </div>
          <div className="py-4"><div className="text-[11px] text-[#5d6183]">{d.to}</div><div className="text-base font-semibold">{q.client || '—'}</div><div className="text-[#5d6183]">{q.company}</div></div>
          <table className="w-full border-collapse">
            <thead><tr className="bg-[#f1f0fa] text-[11px] text-[#5d6183]"><th className="rounded-s-lg p-2.5 text-start font-medium">{d.item}</th><th className="p-2.5 font-medium">{d.qty}</th><th className="p-2.5 text-end font-medium">{d.price}</th><th className="rounded-e-lg p-2.5 text-end font-medium">{d.total}</th></tr></thead>
            <tbody>
              {q.items.map(it => (
                <tr key={it.id} className="border-b border-[#eeedf6] align-top">
                  <td className="p-2.5"><div className="font-medium">{it.name || '—'}</div>{it.description && <div className="mt-0.5 text-[12px] whitespace-pre-wrap text-[#5d6183]">{it.description}</div>}</td>
                  <td className="p-2.5 text-center" dir="ltr">{it.qty}</td>
                  <td className="p-2.5 text-end whitespace-nowrap" dir="ltr">{fmtMoney(it.price, lang)}</td>
                  <td className="p-2.5 text-end font-medium whitespace-nowrap" dir="ltr">{fmtMoney(r2(it.qty * it.price), lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ms-auto mt-4 w-full max-w-[280px] space-y-1.5">
            {[[d.subtotal, totals.subtotal], [`${d.disc} (${q.discount}%)`, -totals.discount], [`${d.vat} (${q.tax}%)`, totals.tax]].map(([k, v]) => (
              <div key={k as string} className="flex justify-between text-[#5d6183]"><span>{k}</span><span dir="ltr">{fmtMoney(v as number, lang)}</span></div>
            ))}
            <div className="flex justify-between rounded-lg bg-[#14152b] px-3 py-2.5 font-semibold text-white"><span>{d.grand}</span><span dir="ltr" data-testid="grand-total">{fmtMoney(totals.total, lang)}</span></div>
          </div>
          {q.notes && <div className="mt-5 border-t border-[#e3e2f0] pt-4 text-[12px] whitespace-pre-wrap text-[#5d6183]"><div className="mb-1 font-medium text-[#14152b]">{d.notes}</div>{q.notes}</div>}
        </div>
      </div>
    </div>
  )
}
