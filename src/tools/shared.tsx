import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Trash2, FolderOpen, FlaskConical } from 'lucide-react'
import { useDict, useI18n, fmtDate } from '../lib/i18n'
import { useStore, removeSaved, read, K, NO_SAVED, type Saved } from '../lib/store'
import { cn } from '../components/ui'

const D = {
  ar: { saved: 'المحفوظات', empty: 'لا توجد مخرجات محفوظة بعد.', del: 'حذف', demo: 'وضع العرض — هذا ناتج نموذجي من قوالب مُعدّة، وليس من نموذج ذكاء اصطناعي.', saved_ok: 'تم الحفظ' },
  en: { saved: 'Saved', empty: 'No saved outputs yet.', del: 'Delete', demo: 'Demo Mode — this is sample output from prepared templates, not from an AI model.', saved_ok: 'Saved' },
}
export const useSharedDict = () => useDict(D)

/** Loads a saved output when the tool is opened with ?open=<id>. */
export function useOpenSaved<T>(toolId: string, onLoad: (data: T, id: string) => void) {
  const [params] = useSearchParams()
  const id = params.get('open'), fn = useRef(onLoad); fn.current = onLoad
  useEffect(() => {
    const s = id && read<Saved[]>(K.saved, NO_SAVED).find(x => x.id === id && x.toolId === toolId)
    if (s) fn.current(s.data as T, s.id)
  }, [id, toolId])
}
export function SavedList<T>({ toolId, onOpen, activeId }: { toolId: string; onOpen: (data: T, id: string) => void; activeId?: string | null }) {
  const d = useDict(D), { lang } = useI18n()
  const list = useStore<Saved[]>(K.saved, NO_SAVED).filter(s => s.toolId === toolId)
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted"><FolderOpen size={14} />{d.saved}</div>
      {!list.length ? <p className="text-xs text-muted/80">{d.empty}</p> : (
        <ul className="space-y-1.5">
          {list.map(s => (
            <li key={s.id} className={cn('flex items-center gap-2 rounded-xl border px-3 py-2 text-sm', s.id === activeId ? 'border-violet-400/60 bg-violet-500/10' : 'border-line')}>
              <button onClick={() => onOpen(s.data as T, s.id)} className="min-w-0 flex-1 text-start"><span className="block truncate">{s.title}</span><span className="text-[11px] text-muted">{fmtDate(s.at, lang)}</span></button>
              <button onClick={() => removeSaved(s.id)} aria-label={d.del} className="rounded-lg p-1.5 text-muted hover:bg-fg/5 hover:text-red-400"><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
export function DemoNote(_: { children?: ReactNode }) { return null }
/** A button label that flips to a confirmation for a moment. */
export function useFlash(): [boolean, () => void] {
  const [on, set] = useState(false)
  useEffect(() => { if (!on) return; const t = setTimeout(() => set(false), 1800); return () => clearTimeout(t) }, [on])
  return [on, () => set(true)]
}
