import { createContext, useContext, useState, useCallback, useMemo } from 'react'

// Reader-controlled auto-scroll speed. Mirrors the localStorage + Context shape
// of src/readingPrefs.jsx. The speed is set MANUALLY by the reader via the Auto
// Read slider — this module deliberately does not measure or calibrate the
// reader's pace. Only `wpm` is persisted; the mode/play state is per-session.

export const WPM_RANGE = { min: 100, max: 700, step: 10, default: 300 }
const STORAGE_KEY = 'behavior-ops-autoscroll'

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

function loadWpm() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const w = Number(parsed.wpm)
      if (isFinite(w)) return clamp(w, WPM_RANGE.min, WPM_RANGE.max)
    }
  } catch {
    /* ignore corrupt/absent storage */
  }
  return WPM_RANGE.default
}

const ReadingSpeedContext = createContext(null)

export const useReadingSpeed = () => {
  const ctx = useContext(ReadingSpeedContext)
  if (!ctx) throw new Error('useReadingSpeed must be used within ReadingSpeedProvider')
  return ctx
}

export function ReadingSpeedProvider({ children }) {
  const [wpm, setWpmState] = useState(loadWpm)
  const [autoRead, setAutoRead] = useState(false) // Auto Read mode armed (controls visible)
  const [playing, setPlaying] = useState(false) // scrolling vs. paused within the mode
  const [etaSec, setEtaSec] = useState(null) // remaining reading time, reported by the engine

  const setWpm = useCallback((val) => {
    const v = clamp(Number(val), WPM_RANGE.min, WPM_RANGE.max)
    if (!isFinite(v)) return
    setWpmState(v)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ wpm: v }))
    } catch {
      /* ignore quota / disabled storage */
    }
  }, [])

  const start = useCallback(() => {
    setAutoRead(true)
    setPlaying(true)
  }, [])

  const stop = useCallback(() => {
    setAutoRead(false)
    setPlaying(false)
    setEtaSec(null)
  }, [])

  const togglePlaying = useCallback(() => setPlaying((p) => !p), [])

  const value = useMemo(
    () => ({
      wpm,
      setWpm,
      autoRead,
      playing,
      active: autoRead && playing, // the engine scrolls only when both are true
      etaSec,
      setEtaSec,
      start,
      stop,
      setPlaying,
      togglePlaying,
    }),
    [wpm, setWpm, autoRead, playing, etaSec, start, stop, togglePlaying],
  )

  return <ReadingSpeedContext.Provider value={value}>{children}</ReadingSpeedContext.Provider>
}
