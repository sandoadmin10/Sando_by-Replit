import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode, type CSSProperties } from 'react'
import { Languages, Sun, Moon } from 'lucide-react'
import { useI18n, useDict } from '../lib/i18n'
import { useStore, write, K } from '../lib/store'
import { getStatus, type AiStatus } from '../lib/ai'

export const cn = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')

const V = {
  primary: 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-[0_10px_30px_-10px_rgba(124,92,255,.7)] hover:brightness-110',
  outline: 'border border-line text-fg hover:bg-fg/5',
  soft: 'bg-fg/[0.07] text-fg hover:bg-fg/[0.12]',
  ghost: 'text-muted hover:text-fg hover:bg-fg/5',
}
const S = { sm: 'h-9 px-3 text-[13px] gap-1.5', md: 'h-11 px-4 text-sm gap-2', lg: 'h-13 px-7 text-base gap-2.5' }
export function Button({ variant = 'primary', size = 'md', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof V; size?: keyof typeof S }) {
  return <button {...p} className={cn('inline-flex shrink-0 items-center justify-center rounded-xl font-medium transition active:scale-[.98] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400', V[variant], S[size], className)} />
}
export const inputCls = 'w-full rounded-xl border border-line bg-raised/60 px-3 py-2.5 text-sm text-fg placeholder:text-muted/60 outline-none transition focus:border-violet-400'
export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <label className={cn('block', className)}><span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>{children}</label>
}
export function Card({ className, children, style }: { className?: string; children: ReactNode; style?: CSSProperties }) {
  return <div style={style} className={cn('rounded-2xl border border-line bg-surface', className)}>{children}</div>
}

export function LangSwitch({ className }: { className?: string }) {
  const { lang, toggle } = useI18n()
  return (
    <button onClick={toggle} aria-label="Switch language" className={cn('inline-flex h-9 items-center gap-1.5 rounded-xl border border-line px-3 text-[13px] text-fg/90 transition hover:bg-fg/5', className)}>
      <Languages size={15} />{lang === 'ar' ? 'English' : 'العربية'}
    </button>
  )
}
export function ThemeToggle() {
  const theme = useStore<string>(K.theme, 'dark')
  return (
    <button onClick={() => write(K.theme, theme === 'light' ? 'dark' : 'light')} aria-label="Toggle theme" className="inline-flex size-9 items-center justify-center rounded-xl border border-line text-fg/90 transition hover:bg-fg/5">
      {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
    </button>
  )
}

export function useAiStatus(): AiStatus {
  const [s, set] = useState<AiStatus>({ live: false })
  useEffect(() => { let on = true; getStatus().then(v => on && set(v)); return () => { on = false } }, [])
  return s
}
const MODE = { ar: { live: 'ذكاء اصطناعي مباشر', demo: 'وضع العرض' }, en: { live: 'Live AI', demo: 'Demo Mode' } }
export function ModeBadge(_: { className?: string }) { return null }

export function download(name: string, text: string, type = 'text/plain') {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: type + ';charset=utf-8' }))
  a.download = name; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
/** PDF export through the browser's own print engine: perfect Arabic shaping, no heavy PDF library. */
export function printNode(el: HTMLElement) {
  const root = document.createElement('div')
  root.id = 'print-root'; root.dir = document.documentElement.dir
  root.appendChild(el.cloneNode(true)); document.body.appendChild(root)
  const done = () => { root.remove(); window.removeEventListener('afterprint', done) }
  window.addEventListener('afterprint', done)
  window.print()
}
export async function copyText(t: string) { try { await navigator.clipboard.writeText(t); return true } catch { return false } }
