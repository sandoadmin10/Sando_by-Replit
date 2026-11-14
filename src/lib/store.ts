// Tiny reactive localStorage store. Everything the demo persists goes through here,
// so swapping it for a real backend later means replacing this one file.
import { useSyncExternalStore } from 'react'
import type { L } from './i18n'
import type { ProfId } from './professions'

const mem = new Map<string, string>()
const subs = new Set<() => void>()
const cache = new Map<string, { raw: string | null; val: unknown }>()
const getRaw = (k: string) => { try { return localStorage.getItem(k) } catch { return mem.get(k) ?? null } }

export function read<T>(key: string, fallback: T): T {
  const raw = getRaw(key)
  const c = cache.get(key)
  if (c && c.raw === raw) return c.val as T
  let val: unknown = fallback
  if (raw != null) { try { val = JSON.parse(raw) } catch { val = fallback } }
  cache.set(key, { raw, val })
  return val as T
}
export function write(key: string, val: unknown) {
  const raw = val == null ? null : JSON.stringify(val)
  try { if (raw == null) localStorage.removeItem(key); else localStorage.setItem(key, raw) }
  catch { if (raw == null) mem.delete(key); else mem.set(key, raw) }
  subs.forEach(f => f())
}
const subscribe = (f: () => void) => {
  subs.add(f); window.addEventListener('storage', f)
  return () => { subs.delete(f); window.removeEventListener('storage', f) }
}
export function useStore<T>(key: string, fallback: T): T {
  return useSyncExternalStore(subscribe, () => read(key, fallback))
}

export interface Session { name: string; email: string; demo: boolean }
export interface Profile {
  profession: ProfId; role: string; org: string; tasks: string[]; goal: string; goalText: string
  tools: string[]; reasons: Record<string, L>
}
export interface Saved { id: string; toolId: string; title: string; data: unknown; at: number }
export interface Activity { toolId: string; text: L; at: number }

export const K = { lang: 'sando.lang', theme: 'sando.theme', session: 'sando.session', profile: 'sando.profile', saved: 'sando.saved', activity: 'sando.activity' }
export const NO_SAVED: Saved[] = []
export const NO_ACTIVITY: Activity[] = []

export function saveOutput(toolId: string, title: string, data: unknown, id?: string): string {
  const list = read<Saved[]>(K.saved, NO_SAVED)
  const sid = id ?? Math.random().toString(36).slice(2, 10)
  const entry: Saved = { id: sid, toolId, title, data, at: Date.now() }
  write(K.saved, [entry, ...list.filter(s => s.id !== sid)].slice(0, 30))
  return sid
}
export const removeSaved = (id: string) => write(K.saved, read<Saved[]>(K.saved, NO_SAVED).filter(s => s.id !== id))
export const logActivity = (toolId: string, text: L) =>
  write(K.activity, [{ toolId, text, at: Date.now() }, ...read<Activity[]>(K.activity, NO_ACTIVITY)].slice(0, 12))

/** Clears the demo profile and everything produced in it. Language and theme are kept. */
export function resetDemo() { write(K.profile, null); write(K.saved, null); write(K.activity, null) }

// ---- Demo auth adapter. NOT real authentication: nothing is verified and no password is stored.
// To go live, implement this same interface with Supabase Auth and swap the export.
export interface AuthAdapter {
  signIn(email: string, password: string): Promise<Session>
  signUp(name: string, email: string, password: string): Promise<Session>
  demo(): Promise<Session>
  signOut(): Promise<void>
}
export const DEMO_SESSION: Session = { name: 'Sara', email: 'sara@sando.app', demo: true }
const start = (s: Session) => { write(K.session, s); return Promise.resolve(s) }
export const auth: AuthAdapter = {
  signIn: (email) => start({ name: email.split('@')[0] || 'User', email, demo: true }),
  signUp: (name, email) => start({ name: name || email.split('@')[0] || 'User', email, demo: true }),
  demo: () => start(DEMO_SESSION),
  signOut: () => { write(K.session, null); return Promise.resolve() },
}
