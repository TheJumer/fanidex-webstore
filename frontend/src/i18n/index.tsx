import React, { createContext, useContext, useEffect, useState } from 'react'
import { Dict, Lang, dictionaries } from './dictionary'
import { Category, Product } from '../types'

interface I18nState {
  lang: Lang
  setLang: (l: Lang) => void
  t: Dict
  // Resolve a localized category name/description with fallback to defaults.
  catName: (c: Pick<Category, 'name' | 'name_uk'>) => string
  catDesc: (c: Pick<Category, 'description' | 'description_uk'>) => string
  // Resolve a localized product name/description with fallback to defaults.
  prodName: (p: Pick<Product, 'name' | 'name_uk'>) => string
  prodDesc: (p: Pick<Product, 'description' | 'description_uk'>) => string
}

const I18nCtx = createContext<I18nState | null>(null)

const STORAGE_KEY = 'lang'

function initialLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'en' || saved === 'ua') return saved
  // Default to Ukrainian for uk-* browsers, else English.
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('uk')) return 'ua'
  return 'en'
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang === 'ua' ? 'uk' : 'en'
  }, [lang])

  const setLang = (l: Lang) => setLangState(l)
  const t = dictionaries[lang]

  const catName = (c: Pick<Category, 'name' | 'name_uk'>) =>
    lang === 'ua' && c.name_uk ? c.name_uk : c.name
  const catDesc = (c: Pick<Category, 'description' | 'description_uk'>) =>
    lang === 'ua' && c.description_uk ? c.description_uk : c.description
  const prodName = (p: Pick<Product, 'name' | 'name_uk'>) =>
    lang === 'ua' && p.name_uk ? p.name_uk : p.name
  const prodDesc = (p: Pick<Product, 'description' | 'description_uk'>) =>
    lang === 'ua' && p.description_uk ? p.description_uk : p.description

  return (
    <I18nCtx.Provider value={{ lang, setLang, t, catName, catDesc, prodName, prodDesc }}>
      {children}
    </I18nCtx.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nCtx)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
