// Renders an agent deliverable as an art-directed, editable document, and exports it to PDF / Markdown / CSV.
import { useRef, useState } from 'react'
import { Printer, Download, Copy, Check, PenLine, Table2, Save, FileText, Presentation } from 'lucide-react'
import { toExcel, toWord, toPptx, fileBase } from '../exporters'
import { useDict, useI18n } from '../../../lib/i18n'
import { Button, download, copyText, printNode, cn } from '../../../components/ui'
import { Logo } from '../../../components/Brand'

export type Block =
  | { type: 'heading'; text: string; level?: 2 | 3 } | { type: 'paragraph'; text: string } | { type: 'quote'; text: string; source?: string }
  | { type: 'bullets'; items: string[] } | { type: 'callout'; tone: 'info' | 'warning' | 'success' | 'danger'; title?: string; text: string }
  | { type: 'table'; title?: string; columns: string[]; rows: string[][] } | { type: 'metrics'; items: { label: string; value: string; note?: string }[] }
  | { type: 'chart'; title?: string; unit?: string; labels: string[]; values: number[] } | { type: 'cards'; items: { title: string; text: string; tag?: string }[] }
  | { type: 'sources'; items: { title: string; url: string }[] }
export type Brand = { name: string; logo?: string }
export type Doc = { id: string; kind: string; title: string; subtitle?: string; blocks: Block[]; lang: 'ar' | 'en'; demo?: boolean; at: number }

const D = {
  ar: { word: 'Word', pptx: 'PowerPoint', xlsx: 'Excel', pdf: 'تصدير PDF', md: 'Markdown', csv: 'CSV', copy: 'نسخ', copied: 'نُسخ', edit: 'تحرير', done: 'تم', save: 'حفظ في المشروع', saved: 'محفوظ', sources: 'المصادر', by: 'أُعدّ بواسطة ساندو', demo: 'بيانات تجريبية',
    kinds: { report: 'تقرير', strategy: 'استراتيجية', proposal: 'عرض', brief: 'موجز إبداعي', calendar: 'تقويم', matrix: 'مصفوفة', insights: 'رؤى', dashboard: 'لوحة أداء', copy: 'نصوص إعلانية' } as Record<string, string> },
  en: { word: 'Word', pptx: 'PowerPoint', xlsx: 'Excel', pdf: 'Export PDF', md: 'Markdown', csv: 'CSV', copy: 'Copy', copied: 'Copied', edit: 'Edit', done: 'Done', save: 'Save to project', saved: 'Saved', sources: 'Sources', by: 'Prepared with SANDO', demo: 'Sample data',
    kinds: { report: 'Report', strategy: 'Strategy', proposal: 'Proposal', brief: 'Creative brief', calendar: 'Calendar', matrix: 'Matrix', insights: 'Insights', dashboard: 'Dashboard', copy: 'Ad copy' } as Record<string, string> },
}
const TONE = { info: 'border-indigo-300 bg-indigo-50', warning: 'border-amber-300 bg-amber-50', success: 'border-emerald-300 bg-emerald-50', danger: 'border-rose-300 bg-rose-50' }

export function docToMarkdown(d: Doc) {
  const out = [`# ${d.title}`, d.subtitle ? `_${d.subtitle}_` : '']
  for (const b of d.blocks) {
    if (b.type === 'heading') out.push(`${b.level === 3 ? '###' : '##'} ${b.text}`)
    else if (b.type === 'paragraph') out.push(b.text)
    else if (b.type === 'quote') out.push(`> ${b.text}${b.source ? ` — ${b.source}` : ''}`)
    else if (b.type === 'bullets') out.push(b.items.map(x => `- ${x}`).join('\n'))
    else if (b.type === 'callout') out.push(`> **${b.title || ''}** ${b.text}`)
    else if (b.type === 'metrics') out.push(b.items.map(m => `- **${m.label}:** ${m.value}${m.note ? ` (${m.note})` : ''}`).join('\n'))
    else if (b.type === 'cards') out.push(b.items.map(c => `### ${c.title}${c.tag ? ` · ${c.tag}` : ''}\n${c.text}`).join('\n\n'))
    else if (b.type === 'sources') out.push(b.items.map(s => `- [${s.title || s.url}](${s.url})`).join('\n'))
    else if (b.type === 'chart') out.push(`**${b.title || ''}**\n` + b.labels.map((l, i) => `- ${l}: ${b.values[i]}${b.unit || ''}`).join('\n'))
    else if (b.type === 'table') out.push(`${b.title ? `**${b.title}**\n\n` : ''}| ${b.columns.join(' | ')} |\n| ${b.columns.map(() => '---').join(' | ')} |\n${b.rows.map(r => `| ${r.join(' | ')} |`).join('\n')}`)
  }
  return out.filter(Boolean).join('\n\n')
}
const csvOf = (b: Extract<Block, { type: 'table' }>) => [b.columns, ...b.rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')

export function DocView({ doc, onChange, onSave, saved, brand }: { doc: Doc; onChange: (d: Doc) => void; onSave?: () => void; saved?: boolean; brand?: Brand }) {
  const d = useDict(D), { lang } = useI18n()
  const [editing, setEditing] = useState(false), [copied, setCopied] = useState(false)
  const paper = useRef<HTMLDivElement>(null)
  const set = (i: number, b: Block) => onChange({ ...doc, blocks: doc.blocks.map((x, j) => (j === i ? b : x)) })
  const E = ({ v, onV, className, as: Tag = 'span' }: { v: string; onV: (s: string) => void; className?: string; as?: 'span' | 'p' | 'div' | 'h2' | 'h3' }) => (
    <Tag className={cn(className, editing && 'rounded outline-dashed outline-1 outline-indigo-300 focus:outline-indigo-500')} contentEditable={editing} suppressContentEditableWarning onBlur={e => { const t = e.currentTarget.innerText; if (t !== v) onV(t) }}>{v}</Tag>
  )
  const tables = doc.blocks.filter((b): b is Extract<Block, { type: 'table' }> => b.type === 'table')
  const date = new Intl.DateTimeFormat(doc.lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(doc.at)

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => paper.current && printNode(paper.current)}><Printer size={14} />{d.pdf}</Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(e => !e)}>{editing ? <Check size={14} /> : <PenLine size={14} />}{editing ? d.done : d.edit}</Button>
        <Button size="sm" variant="outline" onClick={async () => { if (await copyText(docToMarkdown(doc))) { setCopied(true); setTimeout(() => setCopied(false), 1500) } }}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? d.copied : d.copy}</Button>
        <Button size="sm" variant="ghost" onClick={() => toWord(doc, brand)}><FileText size={14} />{d.word}</Button>
        <Button size="sm" variant="ghost" onClick={() => toPptx(doc, brand)}><Presentation size={14} />{d.pptx}</Button>
        {tables.length > 0 && <Button size="sm" variant="ghost" onClick={() => toExcel(doc)}><Table2 size={14} />{d.xlsx}</Button>}
        {tables.length > 0 && <Button size="sm" variant="ghost" onClick={() => download(`${fileBase(doc)}.csv`, tables.map(csvOf).join('\n\n'), 'text/csv')}><Download size={14} />{d.csv}</Button>}
        <Button size="sm" variant="ghost" onClick={() => download(`${fileBase(doc)}.md`, docToMarkdown(doc), 'text/markdown')}><Download size={14} />{d.md}</Button>
        {onSave && <Button size="sm" variant="ghost" onClick={onSave} disabled={saved}>{saved ? <Check size={14} /> : <Save size={14} />}{saved ? d.saved : d.save}</Button>}
      </div>

      {/* The document is always light and uses its own language direction, independent of the UI. */}
      <div ref={paper} dir={doc.lang === 'ar' ? 'rtl' : 'ltr'} lang={doc.lang} className="sando-doc overflow-hidden rounded-2xl bg-white text-[13.5px] leading-[1.85] text-[#16172e] shadow-xl" style={{ fontFamily: '"Readex Pro", system-ui, sans-serif' }}>
        <div className="doc-cover hidden">
          <div className="flex items-center gap-3">{brand?.logo ? <img src={brand.logo} alt="" className="h-11 max-w-[160px] object-contain" /> : <Logo size={44} />}<span className="text-lg font-bold" style={{ fontFamily: 'Alexandria' }}>{brand?.name || 'SANDO'}</span></div>
          <div>
            <div className="mb-4 inline-block rounded-full bg-[#efeafe] px-3 py-1 text-xs font-medium text-[#5b3fd6]">{d.kinds[doc.kind] ?? doc.kind}</div>
            <h1 className="text-[40px] leading-tight font-bold" style={{ fontFamily: 'Alexandria' }}>{doc.title}</h1>
            {doc.subtitle && <p className="mt-3 text-lg text-[#5d6183]">{doc.subtitle}</p>}
          </div>
          <div className="flex justify-between border-t border-[#e6e4f3] pt-4 text-xs text-[#5d6183]"><span>{date}</span><span>{d.by}</span></div>
        </div>
        <div className="doc-footer hidden"><span>{doc.title}</span><span>SANDO</span></div>

        <header className="relative overflow-hidden bg-gradient-to-br from-[#1b1446] via-[#2a1f6e] to-[#0e4a6b] px-6 py-7 text-white sm:px-10 sm:py-9">
          <div className="absolute -end-10 -top-16 size-56 rounded-full bg-[#8b5cf6]/40 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]"><span className="rounded-full bg-white/15 px-2.5 py-0.5">{d.kinds[doc.kind] ?? doc.kind}</span>{doc.demo && <span className="rounded-full bg-amber-300/90 px-2.5 py-0.5 font-medium text-[#3b2a00]">{d.demo}</span>}<span className="text-white/60">{date}</span></div>
              <E as="h2" v={doc.title} onV={t => onChange({ ...doc, title: t })} className="block text-2xl leading-snug font-bold sm:text-[28px]" />
              {doc.subtitle && <E as="p" v={doc.subtitle} onV={t => onChange({ ...doc, subtitle: t })} className="mt-1.5 block text-sm text-white/75" />}
            </div>
            {brand?.logo ? <img src={brand.logo} alt="" className="h-10 max-w-[120px] shrink-0 rounded bg-white/90 object-contain p-1" /> : brand?.name ? <span className="shrink-0 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold">{brand.name}</span> : <Logo size={38} className="shrink-0" />}
          </div>
        </header>

        <div className="space-y-5 px-6 py-7 sm:px-10 sm:py-9">
          {doc.blocks.map((b, i) => {
            switch (b.type) {
              case 'heading': return <E key={i} as={b.level === 3 ? 'h3' : 'h2'} v={b.text} onV={t => set(i, { ...b, text: t })} className={cn('block font-bold text-[#16172e]', b.level === 3 ? 'pt-1 text-base' : 'border-b border-[#ecebf6] pt-3 pb-2 text-xl')} />
              case 'paragraph': return <E key={i} as="p" v={b.text} onV={t => set(i, { ...b, text: t })} className="block whitespace-pre-wrap text-[#2b2d45]" />
              case 'quote': return <blockquote key={i} className="border-s-4 border-[#8b5cf6] bg-[#f7f5ff] px-4 py-3"><E as="p" v={b.text} onV={t => set(i, { ...b, text: t })} className="block text-base text-[#2b2d45]" />{b.source && <div className="mt-1 text-xs text-[#6b6f8f]">— {b.source}</div>}</blockquote>
              case 'bullets': return <ul key={i} className="space-y-1.5">{b.items.map((x, j) => <li key={j} className="flex gap-2.5"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[#7c5cff]" /><E v={x} onV={t => set(i, { ...b, items: b.items.map((y, k) => (k === j ? t : y)) })} className="block min-w-0 flex-1" /></li>)}</ul>
              case 'callout': return <div key={i} className={cn('rounded-xl border-s-4 px-4 py-3', TONE[b.tone])}>{b.title && <div className="mb-0.5 font-semibold">{b.title}</div>}<E as="p" v={b.text} onV={t => set(i, { ...b, text: t })} className="block whitespace-pre-wrap text-[13px] text-[#34364f]" /></div>
              case 'metrics': return <div key={i} className="grid grid-cols-2 gap-3 sm:grid-cols-4">{b.items.map((m, j) => <div key={j} className="rounded-xl border border-[#ecebf6] bg-[#fafaff] p-3.5"><div className="text-[11px] text-[#6b6f8f]">{m.label}</div><div className="mt-1 text-xl font-bold" dir="ltr" style={{ fontFamily: 'Alexandria' }}>{m.value}</div>{m.note && <div className="mt-0.5 text-[11px] text-[#6b6f8f]">{m.note}</div>}</div>)}</div>
              case 'cards': return <div key={i} className="grid gap-3 sm:grid-cols-2">{b.items.map((c, j) => <div key={j} className="break-inside-avoid rounded-xl border border-[#ecebf6] p-4">{c.tag && <span className="mb-2 inline-block rounded-full bg-[#efeafe] px-2 py-0.5 text-[10px] font-medium text-[#5b3fd6]">{c.tag}</span>}<E as="div" v={c.title} onV={t => set(i, { ...b, items: b.items.map((y, k) => (k === j ? { ...y, title: t } : y)) })} className="block font-semibold" /><E as="p" v={c.text} onV={t => set(i, { ...b, items: b.items.map((y, k) => (k === j ? { ...y, text: t } : y)) })} className="mt-1 block text-[13px] whitespace-pre-wrap text-[#4a4d68]" /></div>)}</div>
              case 'table': return (
                <div key={i} className="break-inside-avoid">
                  {b.title && <div className="mb-2 font-semibold">{b.title}</div>}
                  <div className="overflow-x-auto rounded-xl border border-[#ecebf6]"><table className="w-full border-collapse text-[12.5px]">
                    <thead><tr className="bg-[#1b1446] text-white">{b.columns.map((c, j) => <th key={j} className="px-3 py-2.5 text-start font-medium whitespace-nowrap">{c}</th>)}</tr></thead>
                    <tbody>{b.rows.map((r, ri) => <tr key={ri} className={ri % 2 ? 'bg-[#fafaff]' : ''}>{r.map((cell, ci) => <td key={ci} className="border-t border-[#ecebf6] px-3 py-2 align-top"><E v={cell} onV={t => set(i, { ...b, rows: b.rows.map((rr, k) => (k === ri ? rr.map((cc, m) => (m === ci ? t : cc)) : rr)) })} /></td>)}</tr>)}</tbody>
                  </table></div>
                </div>
              )
              case 'chart': { const max = Math.max(1, ...b.values.map(Math.abs)); return (
                <div key={i} className="break-inside-avoid rounded-xl border border-[#ecebf6] p-4">
                  {b.title && <div className="mb-3 font-semibold">{b.title}</div>}
                  <div className="space-y-2">{b.labels.map((l, j) => <div key={j} className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)_auto] items-center gap-3 text-xs"><span className="truncate text-[#4a4d68]">{l}</span><div className="h-4 rounded bg-[#f1f0f9]"><div className="h-full rounded bg-gradient-to-r from-[#7c5cff] to-[#22c3e6]" style={{ width: `${(Math.abs(b.values[j]) / max) * 100}%` }} /></div><span className="w-14 text-end font-medium tabular-nums" dir="ltr">{b.values[j]}{b.unit}</span></div>)}</div>
                </div>
              ) }
              case 'sources': return <div key={i} className="rounded-xl bg-[#f7f7fb] p-4"><div className="mb-2 text-xs font-semibold text-[#6b6f8f]">{d.sources}</div><ol className="space-y-1 text-xs">{b.items.map((s, j) => <li key={j} className="flex gap-2"><span className="text-[#9a9db8]" dir="ltr">{j + 1}.</span>{s.url ? <a href={s.url} target="_blank" rel="noreferrer noopener" className="break-all text-[#5b3fd6] underline">{s.title || s.url}</a> : <span>{s.title}</span>}</li>)}</ol></div>
            }
          })}
        </div>
      </div>
      <span className="sr-only">{lang}</span>
    </div>
  )
}
