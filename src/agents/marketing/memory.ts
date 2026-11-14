// Marketing Memory — projects, records and saved deliverables in IndexedDB (falls back to memory if
// IndexedDB is unavailable). A tiny change-subscription keeps React views in sync.
import { useEffect, useState } from 'react'
import type { Doc } from './ui/DocView'

export type MemRecord = { id: string; kind: string; title: string; content: string; at: number; source: 'user' | 'agent' | 'demo' }
export type Project = { id: string; name: string; demo?: boolean; records: MemRecord[]; artifacts: Doc[]; runs: { objective: string; at: number; status: string }[]; at: number }

const DB = 'sando-marketer', STORE = 'projects'
let dbp: Promise<IDBDatabase | null> | null = null
const fallback = new Map<string, Project>()
const subs = new Set<() => void>()
function db() {
  dbp ??= new Promise(res => {
    try { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => res(null) } catch { res(null) }
  })
  return dbp
}
async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db()
  if (!d) throw new Error('no-idb')
  return new Promise((res, rej) => { const r = fn(d.transaction(STORE, mode).objectStore(STORE)); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) })
}
export async function listProjects(): Promise<Project[]> {
  try { return ((await tx('readonly', s => s.getAll())) as Project[]).sort((a, b) => b.at - a.at) } catch { return [...fallback.values()].sort((a, b) => b.at - a.at) }
}
export async function putProject(p: Project) {
  const v = { ...p, at: Date.now() }
  try { await tx('readwrite', s => s.put(v)) } catch { fallback.set(v.id, v) }
  subs.forEach(f => f()); return v
}
export async function deleteProject(id: string) {
  try { await tx('readwrite', s => s.delete(id)) } catch { fallback.delete(id) }
  subs.forEach(f => f())
}
export const newId = () => Math.random().toString(36).slice(2, 10)
export function useProjects(): [Project[], () => void] {
  const [list, set] = useState<Project[]>([])
  useEffect(() => { const load = () => { listProjects().then(set) }; load(); subs.add(load); return () => { subs.delete(load) } }, [])
  return [list, () => listProjects().then(set)]
}
