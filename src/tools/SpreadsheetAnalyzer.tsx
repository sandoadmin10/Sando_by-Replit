import { useEffect, useMemo, useRef, useState } from 'react'
import { Upload, Download, Sparkles, Database } from 'lucide-react'
import { useDict, useI18n, fmtNum, l } from '../lib/i18n'
import { read, K, logActivity, type Profile } from '../lib/store'
import { professions } from '../lib/professions'
import { Button, Card, Field, inputCls, download, cn } from '../components/ui'
import { useAgent, useAgentBridge } from '../components/Agent'
import { sampleCsv } from './demo'
import type { ToolProps } from './registry'

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], cur = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++ } else q = false } else cur += c }
    else if (c === '"') q = true
    else if (c === ',' || c === ';' || c === '\t') { row.push(cur); cur = '' }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = '' }
    else if (c !== '\r') cur += c
  }
  if (cur || row.length) { row.push(cur); rows.push(row) }
  return rows.filter(r => r.some(x => x.trim()))
}
const toNum = (s: string | undefined) => { const t = (s ?? '').trim().replace(/[,٬%\s]/g, ''); if (!t) return null; const v = Number(t); return Number.isFinite(v) ? v : null }

const D = {
  ar: { upload: 'ارفع ملف CSV', drop: 'أو اسحب الملف هنا — يُحلَّل داخل متصفحك ولا يُرفع لأي خادم.', sample: 'جرّب ملفاً جاهزاً', preview: 'معاينة البيانات', rows: 'صفوف', cols: 'أعمدة', stats: 'الأعمدة الرقمية', sum: 'المجموع', avg: 'المتوسط', min: 'الأدنى', max: 'الأعلى', chart: 'الرسم البياني', value: 'القيمة', label: 'التسمية', export: 'تصدير الملخص', explain: 'اشرح النتائج مع ساندو', none: 'لم نجد أعمدة رقمية في هذا الملف.', bad: 'تعذّرت قراءة الملف. تأكد أنه CSV بصف عناوين.', first: 'أول {n} صفوف من {t}', demoData: 'بيانات تجريبية' },
  en: { upload: 'Upload a CSV file', drop: 'or drop it here — it is analyzed in your browser and never uploaded to a server.', sample: 'Try an example file', preview: 'Data preview', rows: 'rows', cols: 'columns', stats: 'Numeric columns', sum: 'Sum', avg: 'Average', min: 'Min', max: 'Max', chart: 'Chart', value: 'Value', label: 'Label', export: 'Export summary', explain: 'Explain results with SANDO', none: 'No numeric columns were found in this file.', bad: 'Could not read the file. Make sure it is a CSV with a header row.', first: 'First {n} of {t} rows', demoData: 'Sample data' },
}

export default function SpreadsheetAnalyzer({ autoSample }: ToolProps) {
  const d = useDict(D), { lang } = useI18n(), agent = useAgent()
  const [file, setFile] = useState<{ name: string; rows: string[][]; sample?: boolean } | null>(null)
  const [err, setErr] = useState(''), [valueCol, setValueCol] = useState(''), [labelCol, setLabelCol] = useState('')
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const profession = read<Profile | null>(K.profile, null)?.profession ?? 'sales'

  const load = (name: string, text: string, sample = false) => {
    const rows = parseCsv(text)
    if (rows.length < 2) { setErr(d.bad); return }
    setErr(''); setFile({ name, rows, sample }); setValueCol(''); setLabelCol('')
    logActivity('spreadsheet-analyzer', l(`تحليل الملف ${name}`, `Analyzed ${name}`))
  }
  const loadSample = () => load(sampleCsv[profession].name, sampleCsv[profession].csv, true)
  const readFile = (f?: File | null) => { if (f) f.text().then(t => load(f.name, t)).catch(() => setErr(d.bad)) }
  useEffect(() => { if (autoSample) loadSample() }, [autoSample]) // eslint-disable-line

  const a = useMemo(() => {
    if (!file) return null
    const [head, ...body] = file.rows
    const numeric: number[] = [], text: number[] = []
    head.forEach((_, i) => {
      const vals = body.map(r => r[i]).filter(v => (v ?? '').trim() !== '')
      const ok = vals.filter(v => toNum(v) != null).length
      if (vals.length && ok / vals.length >= 0.8) numeric.push(i); else text.push(i)
    })
    const stats = numeric.map(i => {
      const v = body.map(r => toNum(r[i])).filter((x): x is number => x != null)
      const sum = v.reduce((s, x) => s + x, 0)
      return { i, col: head[i], sum, avg: v.length ? sum / v.length : 0, min: Math.min(...v), max: Math.max(...v) }
    })
    return { head, body, stats, text }
  }, [file])

  const vi = a?.stats.find(s => s.col === valueCol)?.i ?? a?.stats[0]?.i
  const li = a ? (a.head.indexOf(labelCol) >= 0 ? a.head.indexOf(labelCol) : a.text[0] ?? 0) : 0
  const bars = useMemo(() => (a && vi != null ? a.body.slice(0, 12).map(r => ({ label: r[li] ?? '', value: toNum(r[vi]) ?? 0 })) : []), [a, vi, li])
  const maxBar = Math.max(1, ...bars.map(b => Math.abs(b.value)))
  const top = bars.length ? bars.reduce((m, b) => (b.value > m.value ? b : m)) : null

  const state = useMemo(() => ({ fileName: file?.name, rows: a?.body.length ?? 0, stats: a?.stats.map(({ col, sum, avg, min, max }) => ({ col, sum, avg, min, max })) ?? [], valueCol: vi != null ? a?.head[vi] : undefined, top: top?.label, heroTool: professions[profession].heroTool === 'spreadsheet-analyzer' ? undefined : professions[profession].heroTool }), [file, a, vi, top, profession])
  useAgentBridge('spreadsheet-analyzer', state)

  const exportSummary = () => a && download('sando-summary.csv', [`Column,${d.sum},${d.avg},${d.min},${d.max}`, ...a.stats.map(s => [JSON.stringify(s.col), s.sum, s.avg.toFixed(2), s.min, s.max].join(','))].join('\n'), 'text/csv')

  return (
    <div className="space-y-5">
      <Card className={cn('border-dashed p-5 transition sm:p-6', over && 'border-violet-400 bg-violet-500/5')}>
        <div onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={e => { e.preventDefault(); setOver(false); readFile(e.dataTransfer.files[0]) }} className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-start">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 brand-text"><Upload size={20} /></span>
          <div className="min-w-0 flex-1"><div className="text-sm font-medium">{file ? file.name : d.upload}</div><p className="mt-0.5 text-xs text-muted">{d.drop}</p></div>
          <input ref={input} type="file" accept=".csv,text/csv,.tsv,.txt" hidden onChange={e => { readFile(e.target.files?.[0]); e.target.value = '' }} />
          <div className="flex flex-wrap justify-center gap-2"><Button size="sm" onClick={() => input.current?.click()}><Upload size={14} />{d.upload}</Button><Button size="sm" variant="outline" onClick={loadSample}><Database size={14} />{d.sample}</Button></div>
        </div>
        {err && <p className="mt-3 text-xs text-amber-400">{err}</p>}
      </Card>

      {a && (<>
        {!a.stats.length ? <Card className="p-5 text-sm text-muted">{d.none}</Card> : (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-sm font-semibold">{d.stats}</h2>
              <div className="flex flex-wrap gap-2"><Button size="sm" variant="soft" onClick={() => agent.ask('explain', d.explain)}><Sparkles size={14} className="brand-text" />{d.explain}</Button><Button size="sm" variant="outline" onClick={exportSummary}><Download size={14} />{d.export}</Button></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {a.stats.map(s => (
                <Card key={s.col} className="p-4">
                  <div className="truncate text-xs text-muted">{s.col}</div>
                  <div className="mt-1 font-display text-2xl font-semibold" dir="ltr" data-testid={`sum-${s.col}`}>{fmtNum(s.sum, lang)}</div>
                  <div className="mt-2 grid grid-cols-3 gap-1 text-[11px] text-muted">{[[d.avg, s.avg], [d.min, s.min], [d.max, s.max]].map(([k, v]) => <div key={k as string}><div>{k}</div><div className="font-medium text-fg" dir="ltr">{fmtNum(v as number, lang)}</div></div>)}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-2">
          {vi != null && (
            <Card className="p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-display text-sm font-semibold">{d.chart}</h2>
                <div className="flex gap-2">
                  <Field label={d.value}><select className={inputCls + ' py-1.5'} value={a.head[vi]} onChange={e => setValueCol(e.target.value)}>{a.stats.map(s => <option key={s.col}>{s.col}</option>)}</select></Field>
                  <Field label={d.label}><select className={inputCls + ' py-1.5'} value={a.head[li]} onChange={e => setLabelCol(e.target.value)}>{a.head.map(h => <option key={h}>{h}</option>)}</select></Field>
                </div>
              </div>
              <div className="space-y-2">
                {bars.map((b, i) => (
                  <div key={i} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] items-center gap-3 text-xs">
                    <span className="truncate text-muted" title={b.label}>{b.label}</span>
                    <div className="h-5 rounded-md bg-fg/5"><div className="h-full rounded-md bg-violet-500 transition-all duration-500" style={{ width: `${(Math.abs(b.value) / maxBar) * 100}%`, opacity: b === top ? 1 : 0.55 }} /></div>
                    <span className="w-16 text-end font-medium tabular-nums" dir="ltr">{fmtNum(b.value, lang)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          <Card className="min-w-0 p-4 sm:p-5">
            <div className="mb-3 flex items-baseline justify-between gap-2"><h2 className="font-display text-sm font-semibold">{d.preview}</h2><span className="text-xs text-muted">{a.body.length} {d.rows} · {a.head.length} {d.cols}</span></div>
            <div className="thin-scroll overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-xs">
                <thead><tr className="bg-fg/5">{a.head.map((h, i) => <th key={i} className="p-2.5 text-start font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>{a.body.slice(0, 8).map((r, i) => <tr key={i} className="border-t border-line">{a.head.map((_, j) => <td key={j} className="p-2.5 whitespace-nowrap text-fg/85">{r[j]}</td>)}</tr>)}</tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-muted">{d.first.replace('{n}', String(Math.min(8, a.body.length))).replace('{t}', String(a.body.length))}</p>
          </Card>
        </div>
      </>)}
    </div>
  )
}
