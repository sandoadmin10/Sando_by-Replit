// Shared attachment intelligence: validates real file types by signature, extracts text/tables in the
// browser (nothing is executed), and keeps one failed file from breaking the rest.
import { parseCsv } from '../../tools/SpreadsheetAnalyzer'

export type Attachment = {
  id: string; name: string; size: number; mime: string
  kind: 'text' | 'table' | 'image'; status: 'reading' | 'ready' | 'failed'
  text?: string; columns?: string[]; rows?: string[][]; mediaType?: string; data?: string; preview?: string
  note?: string; error?: string; pages?: number
}
export const MAX_FILE = 15 * 1024 * 1024, MAX_FILES = 10
export const ACCEPT = '.pdf,.docx,.doc,.txt,.md,.csv,.xlsx,.xls,.pptx,.ppt,.png,.jpg,.jpeg,.webp'

async function sniff(f: File) {
  const b = new Uint8Array(await f.slice(0, 12).arrayBuffer())
  const hex = [...b].map(x => x.toString(16).padStart(2, '0')).join('')
  if (hex.startsWith('25504446')) return 'pdf'
  if (hex.startsWith('89504e47')) return 'png'
  if (hex.startsWith('ffd8ff')) return 'jpg'
  if (hex.startsWith('52494646') && hex.slice(16, 24) === '57454250') return 'webp'
  if (hex.startsWith('504b0304')) return /\.xlsx$/i.test(f.name) ? 'xlsx' : /\.docx$/i.test(f.name) ? 'docx' : /\.pptx$/i.test(f.name) ? 'pptx' : 'zip'
  if (hex.startsWith('d0cf11e0')) return 'legacy'
  return /\.(csv)$/i.test(f.name) ? 'csv' : /\.(txt|md)$/i.test(f.name) ? 'txt' : 'unknown'
}
const clean = (s: string) => s.replace(/\u0000/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()

async function pdfText(f: File) {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise
  const pages: string[] = []
  for (let i = 1; i <= Math.min(doc.numPages, 120); i++) {
    const c = await (await doc.getPage(i)).getTextContent()
    let line = '', out = '', lastY: number | null = null
    for (const it of c.items as { str: string; transform: number[]; hasEOL?: boolean }[]) {
      const y = it.transform?.[5]
      if (lastY != null && y != null && Math.abs(y - lastY) > 2) { out += line.trim() + '\n'; line = '' }
      line += it.str + ' '; lastY = y ?? lastY
    }
    pages.push(`[page ${i}]\n${out}${line.trim()}`)
  }
  return { text: clean(pages.join('\n\n')), pages: doc.numPages }
}
async function docxText(f: File) {
  // @ts-expect-error browser bundle has no types
  const mammoth = (await import('mammoth/mammoth.browser.js')).default
  const r = await mammoth.convertToHtml({ arrayBuffer: await f.arrayBuffer() })
  const html = String(r.value)
    .replace(/<\/(p|h\d|li|tr)>/g, '\n').replace(/<h(\d)>/g, (_: string, n: string) => '#'.repeat(Number(n)) + ' ')
    .replace(/<li>/g, '- ').replace(/<\/t[dh]>/g, ' | ')
  const div = document.createElement('div'); div.innerHTML = html
  return clean(div.textContent || '')
}
async function pptxText(f: File) {
  const { default: JSZip } = await import('jszip')
  const zip = await JSZip.loadAsync(await f.arrayBuffer())
  const slides = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))
  const out: string[] = []
  for (const [i, n] of slides.entries()) {
    const xml = await zip.file(n)!.async('string')
    const paras = [...xml.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g)].map(m => [...m[1].matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map(t => t[1]).join('')).filter(Boolean)
    out.push(`[slide ${i + 1}]\n${paras.join('\n')}`)
  }
  const div = document.createElement('div'); div.innerHTML = out.join('\n\n').replace(/</g, '&lt;')
  return { text: clean(div.textContent || ''), pages: slides.length }
}
async function xlsxTable(f: File) {
  const { default: readXlsx } = await import('read-excel-file/browser')
  const sheets = await readXlsx(f)
  const first = sheets.find(sh => sh.data.length > 1) ?? sheets[0]
  const all = (first?.data ?? []).map(r => r.map(c => (c instanceof Date ? c.toISOString().slice(0, 10) : c == null ? '' : String(c))))
  return { columns: all[0] ?? [], rows: all.slice(1).filter(r => r.some(x => x.trim())), note: sheets.length > 1 ? `sheet: ${first?.sheet}` : undefined }
}
async function shrinkImage(f: File) {
  const bmp = await createImageBitmap(f)
  const s = Math.min(1, 1400 / Math.max(bmp.width, bmp.height))
  const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * s); cv.height = Math.round(bmp.height * s)
  cv.getContext('2d')!.drawImage(bmp, 0, 0, cv.width, cv.height)
  const url = cv.toDataURL('image/jpeg', 0.85)
  return { mediaType: 'image/jpeg', data: url.split(',')[1], preview: url }
}

export async function readAttachment(f: File): Promise<Attachment> {
  const base = { id: Math.random().toString(36).slice(2, 9), name: f.name, size: f.size, mime: f.type }
  try {
    if (f.size > MAX_FILE) throw new Error('too-large')
    const t = await sniff(f)
    if (t === 'pdf') { const { text, pages } = await pdfText(f); return { ...base, kind: 'text', status: 'ready', text, pages, note: text.length < 40 ? 'scanned' : undefined } }
    if (t === 'docx') return { ...base, kind: 'text', status: 'ready', text: await docxText(f) }
    if (t === 'pptx') { const { text, pages } = await pptxText(f); return { ...base, kind: 'text', status: 'ready', text, pages } }
    if (t === 'legacy') throw new Error('legacy')
    if (t === 'xlsx') return { ...base, kind: 'table', status: 'ready', ...(await xlsxTable(f)) }
    if (t === 'csv') { const rows = parseCsv(await f.text()); return { ...base, kind: 'table', status: 'ready', columns: rows[0] ?? [], rows: rows.slice(1) } }
    if (t === 'txt') return { ...base, kind: 'text', status: 'ready', text: clean(await f.text()) }
    if (t === 'png' || t === 'jpg' || t === 'webp') return { ...base, kind: 'image', status: 'ready', ...(await shrinkImage(f)) }
    throw new Error('unsupported')
  } catch (e) {
    return { ...base, kind: 'text', status: 'failed', error: ['too-large', 'unsupported', 'legacy'].includes((e as Error).message) ? (e as Error).message : 'unreadable' }
  }
}
/** What the server receives: extracted content only, never the original file. */
export const toPayload = (a: Attachment) =>
  a.kind === 'table' ? { name: a.name, kind: 'table', columns: a.columns, rows: a.rows }
    : a.kind === 'image' ? { name: a.name, kind: 'image', mediaType: a.mediaType, data: a.data }
      : { name: a.name, kind: 'text', text: a.text, note: a.note === 'scanned' ? 'PDF has almost no extractable text (possibly scanned).' : undefined }
