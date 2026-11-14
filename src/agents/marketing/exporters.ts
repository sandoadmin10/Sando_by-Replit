// Real file exports for agent deliverables: Excel (.xlsx), Word (.doc via Word-compatible HTML) and
// PowerPoint (.pptx). Libraries load only when the user exports.
import type { Doc, Block, Brand } from './ui/DocView'
import { download } from '../../components/ui'

type TableB = Extract<Block, { type: 'table' }>
const esc = (s: string) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const safeName = (s: string) => s.replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 80) || 'sando'
/** Download-safe base name. Some browsers drop non-Latin names (the file arrives as "download" with no extension). */
export const fileBase = (doc: Pick<Doc, 'title' | 'kind' | 'at'>) => { const ascii = doc.title.replace(/[^A-Za-z0-9 ._-]+/g, ' ').replace(/\s+/g, ' ').trim(); return ascii.length >= 6 ? safeName(ascii) : `SANDO-${doc.kind || 'document'}-${new Date(doc.at || Date.now()).toISOString().slice(0, 10)}` }
const num = (v: string) => { const t = String(v).replace(/[,٬\s%]|SAR|ر\.?س/gi, ''); return t && !isNaN(Number(t)) ? Number(t) : null }

export async function toExcel(doc: Doc) {
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const tables = doc.blocks.filter((b): b is TableB => b.type === 'table' && b.columns.length > 0)
  const used = new Set<string>()
  const sheets = tables.map((t, i) => {
    let name = safeName(t.title || `${doc.title} ${i + 1}`).replace(/[[\]]/g, '').slice(0, 28) || `Sheet ${i + 1}`
    while (used.has(name)) name = name.slice(0, 25) + ` ${i + 1}`
    used.add(name)
    return {
      sheet: name, rightToLeft: doc.lang === 'ar', stickyRowsCount: 1,
      columns: t.columns.map((c, ci) => ({ width: Math.min(60, Math.max(12, c.length + 4, ...t.rows.map(r => String(r[ci] ?? '').length + 2))) })),
      data: [t.columns.map(c => ({ value: c, fontWeight: 'bold' as const, backgroundColor: '#1b1446', color: '#ffffff' })),
        ...t.rows.map(r => r.map(c => { const n = num(c); return n != null ? { value: n, type: Number } : { value: String(c ?? ''), wrap: true } }))],
    }
  })
  if (!sheets.length) return false
  const blob = await writeXlsxFile(sheets as never).toBlob()
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${fileBase(doc)}.xlsx`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  return true
}

export function toWord(doc: Doc, brand?: Brand) {
  const rtl = doc.lang === 'ar', dir = rtl ? 'rtl' : 'ltr', align = rtl ? 'right' : 'left'
  const body = doc.blocks.map(b => {
    switch (b.type) {
      case 'heading': return `<h${b.level === 3 ? 3 : 2}>${esc(b.text)}</h${b.level === 3 ? 3 : 2}>`
      case 'paragraph': return `<p>${esc(b.text).replace(/\n/g, '<br>')}</p>`
      case 'quote': return `<p class="q">${esc(b.text)}${b.source ? `<br><small>— ${esc(b.source)}</small>` : ''}</p>`
      case 'bullets': return `<ul>${b.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`
      case 'callout': return `<p class="c">${b.title ? `<b>${esc(b.title)}</b><br>` : ''}${esc(b.text).replace(/\n/g, '<br>')}</p>`
      case 'metrics': return `<table class="m"><tr>${b.items.map(m => `<td><small>${esc(m.label)}</small><br><b>${esc(m.value)}</b></td>`).join('')}</tr></table>`
      case 'cards': return b.items.map(c => `<p class="card"><b>${esc(c.title)}</b>${c.tag ? ` · <small>${esc(c.tag)}</small>` : ''}<br>${esc(c.text)}</p>`).join('')
      case 'chart': return `<p><b>${esc(b.title || '')}</b></p><table>${b.labels.map((l, i) => `<tr><td>${esc(l)}</td><td>${b.values[i]}${esc(b.unit || '')}</td></tr>`).join('')}</table>`
      case 'sources': return `<p><b>${rtl ? 'المصادر' : 'Sources'}</b></p><ol>${b.items.map(s => `<li>${s.url ? `<a href="${esc(s.url)}">${esc(s.title || s.url)}</a>` : esc(s.title)}</li>`).join('')}</ol>`
      case 'table': return `${b.title ? `<p><b>${esc(b.title)}</b></p>` : ''}<table><tr>${b.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr>${b.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`
    }
  }).join('\n')
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(doc.title)}</title>
<style>body{font-family:'Segoe UI',Tahoma,Arial;direction:${dir};text-align:${align};color:#16172e;font-size:11pt;line-height:1.6}
h1{font-size:24pt;color:#1b1446;margin:0}h2{font-size:15pt;color:#1b1446;border-bottom:1px solid #d9d6ef;padding-bottom:3pt;margin-top:16pt}h3{font-size:12pt}
table{border-collapse:collapse;width:100%;margin:6pt 0}th{background:#1b1446;color:#fff;padding:5pt;text-align:${align}}td{border:1px solid #e3e1f2;padding:5pt;vertical-align:top}
.m td{border:1px solid #e3e1f2;background:#fafaff}.c{background:#eef0ff;border-${rtl ? 'right' : 'left'}:3pt solid #7c5cff;padding:6pt}.q{border-${rtl ? 'right' : 'left'}:3pt solid #8b5cf6;padding:4pt 8pt;background:#f7f5ff}.card{border:1px solid #e3e1f2;padding:6pt}
.sub{color:#5d6183;font-size:12pt}.brand{color:#5d6183;font-size:9pt}</style></head>
<body dir="${dir}"><p class="brand">${esc(brand?.name || 'SANDO')}</p><h1>${esc(doc.title)}</h1>${doc.subtitle ? `<p class="sub">${esc(doc.subtitle)}</p>` : ''}${body}</body></html>`
  download(`${fileBase(doc)}.doc`, html, 'application/msword')
}

export async function toPptx(doc: Doc, brand?: Brand) {
  const { default: PptxGenJS } = await import('pptxgenjs')
  const pptx = new PptxGenJS(); pptx.layout = 'LAYOUT_WIDE'
  const rtl = doc.lang === 'ar', align = rtl ? 'right' : 'left'
  const font = rtl ? 'Tahoma' : 'Segoe UI', dark = '1B1446', ink = '16172E', muted = '5D6183'
  const T = (s: { addText: (t: string, o: object) => void }, text: string, o: object) => s.addText(text, { fontFace: font, align, rtlMode: rtl, ...o })
  const cover = pptx.addSlide(); cover.background = { color: dark }
  T(cover, brand?.name || 'SANDO', { x: 0.6, y: 0.5, w: 12, h: 0.5, fontSize: 14, color: 'C4B5FD' })
  T(cover, doc.title, { x: 0.6, y: 2.4, w: 12, h: 1.6, fontSize: 38, bold: true, color: 'FFFFFF' })
  if (doc.subtitle) T(cover, doc.subtitle, { x: 0.6, y: 4.0, w: 12, h: 0.8, fontSize: 18, color: 'D9D6EF' })
  // Group blocks into slides: a heading starts a new slide.
  const groups: { title: string; blocks: Block[] }[] = []
  for (const b of doc.blocks) {
    if (b.type === 'heading' || !groups.length) groups.push({ title: b.type === 'heading' ? b.text : doc.title, blocks: [] })
    if (b.type !== 'heading') groups[groups.length - 1].blocks.push(b)
  }
  for (const g of groups.filter(x => x.blocks.length)) {
    let s = pptx.addSlide(), y = 1.3
    const fresh = (title: string) => { s = pptx.addSlide(); y = 1.3; T(s, title, { x: 0.6, y: 0.4, w: 12, h: 0.7, fontSize: 24, bold: true, color: dark }) }
    T(s, g.title, { x: 0.6, y: 0.4, w: 12, h: 0.7, fontSize: 24, bold: true, color: dark })
    for (const b of g.blocks) {
      if (y > 6.2) fresh(g.title)
      if (b.type === 'table') {
        const rows = b.rows.slice(0, 12), h = 0.4 * (rows.length + 1)
        if (y + h > 7 && y > 1.4) fresh(g.title)
        const cols = rtl ? [...b.columns].reverse() : b.columns
        s.addTable([cols.map(c => ({ text: c, options: { bold: true, color: 'FFFFFF', fill: { color: dark } } })), ...rows.map(r => (rtl ? [...r].reverse() : r).map(c => ({ text: String(c) })))],
          { x: 0.6, y, w: 12.1, fontFace: font, fontSize: 11, color: ink, align, border: { type: 'solid', pt: 0.5, color: 'E3E1F2' }, autoPage: false })
        y += Math.min(h, 5.5) + 0.3
      } else if (b.type === 'metrics' || b.type === 'cards') {
        const items = b.type === 'metrics' ? b.items.map(m => [m.label, m.value]) : b.items.map(c => [c.title, c.text])
        const n = Math.min(4, items.length), w = (12.1 - (n - 1) * 0.2) / n, hh = b.type === 'metrics' ? 1.1 : 1.9
        items.slice(0, 8).forEach(([a, v], i) => {
          if (i && i % n === 0) y += hh + 0.2
          if (y + hh > 7.2) fresh(g.title)
          const col = rtl ? n - 1 - (i % n) : i % n, x = 0.6 + col * (w + 0.2)
          s.addShape('rect', { x, y, w, h: hh, fill: { color: 'F5F3FF' }, line: { color: 'E3E1F2', width: 0.5 } })
          T(s, a, { x: x + 0.1, y: y + 0.05, w: w - 0.2, h: 0.4, fontSize: 11, color: muted, bold: b.type === 'cards' })
          T(s, v, { x: x + 0.1, y: y + 0.45, w: w - 0.2, h: hh - 0.5, fontSize: b.type === 'metrics' ? 20 : 11, bold: b.type === 'metrics', color: ink, valign: 'top' })
        })
        y += hh + 0.3
      } else {
        const text = b.type === 'bullets' ? b.items.map(x => `• ${x}`).join('\n') : b.type === 'chart' ? `${b.title ?? ''}\n` + b.labels.map((l, i) => `${l}: ${b.values[i]}${b.unit ?? ''}`).join('\n')
          : b.type === 'sources' ? b.items.map(x => x.title || x.url).join('\n') : b.type === 'callout' ? `${b.title ? b.title + ' — ' : ''}${b.text}` : b.text
        const lines = Math.min(14, text.split('\n').length + Math.floor(text.length / 140)), h = Math.max(0.5, lines * 0.32)
        if (y + h > 7.2 && y > 1.4) fresh(g.title)
        T(s, text, { x: 0.6, y, w: 12.1, h, fontSize: 14, color: b.type === 'callout' ? dark : ink, valign: 'top', fit: 'shrink' })
        y += h + 0.2
      }
    }
  }
  await pptx.writeFile({ fileName: `${fileBase(doc)}.pptx` })
}
