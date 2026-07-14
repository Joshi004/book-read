import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export const FONT_SIZE_RANGE = { min: 0.8, max: 1.5, step: 0.025, default: 1.0625 }
export const LINE_HEIGHT_RANGE = { min: 1.2, max: 2.2, step: 0.05, default: 1.6 }

const STORAGE_KEY = 'behavior-ops-reading-prefs'

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val))
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const fs = Number(parsed.fontSize)
      const lh = Number(parsed.lineHeight)
      return {
        fontSize: isFinite(fs) ? clamp(fs, FONT_SIZE_RANGE.min, FONT_SIZE_RANGE.max) : FONT_SIZE_RANGE.default,
        lineHeight: isFinite(lh) ? clamp(lh, LINE_HEIGHT_RANGE.min, LINE_HEIGHT_RANGE.max) : LINE_HEIGHT_RANGE.default,
      }
    }
  } catch {
    /* ignore */
  }
  return { fontSize: FONT_SIZE_RANGE.default, lineHeight: LINE_HEIGHT_RANGE.default }
}

function applyToDom(fontSize, lineHeight) {
  const root = document.documentElement
  root.style.setProperty('--bops-font-size', `${fontSize}rem`)
  root.style.setProperty('--bops-line-height', `${lineHeight}`)
}

export const ReadingPrefsContext = createContext({
  fontSize: FONT_SIZE_RANGE.default,
  lineHeight: LINE_HEIGHT_RANGE.default,
  setFontSize: () => {},
  setLineHeight: () => {},
})

export const useReadingPrefs = () => useContext(ReadingPrefsContext)

export function ReadingPrefsProvider({ children }) {
  const [prefs, setPrefs] = useState(load)

  useEffect(() => {
    applyToDom(prefs.fontSize, prefs.lineHeight)
  }, [prefs])

  const setFontSize = useCallback((val) => {
    const v = clamp(Number(val), FONT_SIZE_RANGE.min, FONT_SIZE_RANGE.max)
    if (!isFinite(v)) return
    setPrefs((p) => {
      const next = { ...p, fontSize: v }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const setLineHeight = useCallback((val) => {
    const v = clamp(Number(val), LINE_HEIGHT_RANGE.min, LINE_HEIGHT_RANGE.max)
    if (!isFinite(v)) return
    setPrefs((p) => {
      const next = { ...p, lineHeight: v }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  return (
    <ReadingPrefsContext.Provider value={{ ...prefs, setFontSize, setLineHeight }}>
      {children}
    </ReadingPrefsContext.Provider>
  )
}
