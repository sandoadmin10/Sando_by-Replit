// Lightweight i18n: every module keeps a structured { ar, en } dictionary and reads it with useDict().
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useStore, write, K } from './store'

export type Lang = 'ar' | 'en'
export type L = { ar: string; en: string }
export const l = (ar: string, en: string): L => ({ ar, en })

type Ctx = { lang: Lang; dir: 'rtl' | 'ltr'; setLang: (l: Lang) => void; toggle: () => void; tr: (s: L) => string }
const I18n = createContext<Ctx>(null as never)

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang: Lang = useStore<string>(K.lang, 'ar') === 'en' ? 'en' : 'ar'
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = dir }, [lang, dir])
  const theme = useStore<string>(K.theme, 'dark')
  useEffect(() => { document.documentElement.classList.toggle('light', theme === 'light') }, [theme])
  const v = useMemo<Ctx>(() => ({
    lang, dir, setLang: x => write(K.lang, x), toggle: () => write(K.lang, lang === 'ar' ? 'en' : 'ar'), tr: s => s[lang],
  }), [lang, dir])
  return <I18n.Provider value={v}>{children}</I18n.Provider>
}
export const useI18n = () => useContext(I18n)
export function useDict<T>(d: { ar: T; en: T }): T { return d[useI18n().lang] }

// Latin digits in both languages keep prices and mixed Arabic/English text unambiguous.
export const fmtNum = (n: number, lang: Lang, digits = 2) =>
  new Intl.NumberFormat(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', { maximumFractionDigits: digits }).format(n)
export const fmtMoney = (n: number, lang: Lang) => {
  const v = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
  return lang === 'ar' ? `${v} ر.س` : `SAR ${v}`
}
export const fmtDate = (t: number, lang: Lang) =>
  new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(t)
