import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  loadState,
  saveState,
  emptyChapter,
  todayKey,
} from './readingStore.js'

// Provider for reading-history state. Mirrors the localStorage + Context pattern
// in src/readingPrefs.jsx, but with one twist: the tracking engine writes many
// times per second, so we keep the authoritative state in a mutable ref and only
// commit a React `snapshot` (and persist to localStorage) at a throttled cadence.
// Discrete user actions (manual override, reset) commit + persist immediately.

const SNAPSHOT_THROTTLE_MS = 1500 // max cadence for engine-driven UI refresh
const PERSIST_DEBOUNCE_MS = 2500 // trailing write after the last mutation

const ReadingTrackerContext = createContext(null)

export const useReadingTrackerContext = () => {
  const ctx = useContext(ReadingTrackerContext)
  if (!ctx) throw new Error('useReadingTrackerContext must be used within ReadingTrackerProvider')
  return ctx
}

export function ReadingTrackerProvider({ children }) {
  const stateRef = useRef(null)
  if (stateRef.current === null) stateRef.current = loadState()

  const [snapshot, setSnapshot] = useState(stateRef.current)
  const lastSnapshotAt = useRef(0)
  const snapshotTimer = useRef(null)
  const persistTimer = useRef(null)

  const persistNow = useCallback(() => {
    if (persistTimer.current) {
      clearTimeout(persistTimer.current)
      persistTimer.current = null
    }
    saveState(stateRef.current)
  }, [])

  const schedulePersist = useCallback(() => {
    if (persistTimer.current) return
    persistTimer.current = setTimeout(() => {
      persistTimer.current = null
      saveState(stateRef.current)
    }, PERSIST_DEBOUNCE_MS)
  }, [])

  // Commit a fresh top-level snapshot so consumers re-render and re-read the
  // (mutated-in-place) chapter/daily records. `immediate` bypasses the throttle
  // for user-initiated actions that expect instant feedback.
  const commitSnapshot = useCallback((immediate) => {
    const doCommit = () => {
      lastSnapshotAt.current = Date.now()
      setSnapshot({ ...stateRef.current })
    }
    if (immediate) {
      if (snapshotTimer.current) {
        clearTimeout(snapshotTimer.current)
        snapshotTimer.current = null
      }
      doCommit()
      return
    }
    if (snapshotTimer.current) return // a commit is already pending
    const elapsed = Date.now() - lastSnapshotAt.current
    const wait = Math.max(0, SNAPSHOT_THROTTLE_MS - elapsed)
    snapshotTimer.current = setTimeout(() => {
      snapshotTimer.current = null
      doCommit()
    }, wait)
  }, [])

  const getChapter = useCallback((num) => {
    const key = String(num)
    const chapters = stateRef.current.chapters
    if (!chapters[key]) chapters[key] = emptyChapter()
    return chapters[key]
  }, [])

  // Called once when a chapter's content has rendered: record its measured
  // totals and first-open time. Idempotent-ish (totals refresh, firstOpenedAt
  // set once).
  const registerChapter = useCallback(
    (num, { totalWords, totalBlocks }) => {
      const ch = getChapter(num)
      ch.totalWords = totalWords
      ch.totalBlocks = totalBlocks
      if (!ch.firstOpenedAt) ch.firstOpenedAt = Date.now()
      commitSnapshot(true)
      schedulePersist()
    },
    [getChapter, commitSnapshot, schedulePersist],
  )

  // The single high-frequency funnel from the tracking engine. Applies a tick's
  // worth of accrued reading to both the chapter and today's daily rollup,
  // deduping newly-read blocks. `newReadBlocks` is an array of {id, words}.
  const applyReadingUpdate = useCallback(
    ({ chapterNumber, addActiveMs = 0, newReadBlocks = [], lastBlockId, lastScrollRatio }) => {
      const ch = getChapter(chapterNumber)
      const now = Date.now()

      let addedWords = 0
      if (newReadBlocks.length) {
        const seen = new Set(ch.readBlockIds)
        for (const b of newReadBlocks) {
          if (seen.has(b.id)) continue
          seen.add(b.id)
          ch.readBlockIds.push(b.id)
          ch.wordsRead += b.words
          addedWords += b.words
        }
      }

      if (addActiveMs > 0) ch.activeMs += addActiveMs
      if (lastBlockId) ch.lastBlockId = lastBlockId
      if (typeof lastScrollRatio === 'number') ch.lastScrollRatio = lastScrollRatio
      if (addActiveMs > 0 || addedWords > 0) ch.lastReadAt = now

      // Daily rollup — a day "counts" (for the streak) whenever activeMs > 0.
      if (addActiveMs > 0 || addedWords > 0) {
        const key = todayKey()
        const daily = stateRef.current.daily
        if (!daily[key]) daily[key] = { activeMs: 0, wordsRead: 0, chapters: [] }
        const rec = daily[key]
        rec.activeMs += addActiveMs
        rec.wordsRead += addedWords
        if (!rec.chapters.includes(chapterNumber)) rec.chapters.push(chapterNumber)
      }

      commitSnapshot(false)
      schedulePersist()
    },
    [getChapter, commitSnapshot, schedulePersist],
  )

  const setManualStatus = useCallback(
    (num, status) => {
      const ch = getChapter(num)
      ch.manualStatus = status === 'read' || status === 'unread' ? status : null
      commitSnapshot(true)
      persistNow()
    },
    [getChapter, commitSnapshot, persistNow],
  )

  const clearOverride = useCallback(
    (num) => {
      const ch = getChapter(num)
      ch.manualStatus = null
      commitSnapshot(true)
      persistNow()
    },
    [getChapter, commitSnapshot, persistNow],
  )

  const resetAll = useCallback(() => {
    stateRef.current = { version: 1, chapters: {}, daily: {} }
    commitSnapshot(true)
    persistNow()
  }, [commitSnapshot, persistNow])

  // Flush to storage when the tab is hidden or the page is being unloaded, so an
  // in-progress reading session isn't lost to the debounce window.
  useEffect(() => {
    const flush = () => persistNow()
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', onVisibility)
      persistNow()
    }
  }, [persistNow])

  const value = useMemo(
    () => ({
      snapshot,
      registerChapter,
      applyReadingUpdate,
      setManualStatus,
      clearOverride,
      resetAll,
    }),
    [snapshot, registerChapter, applyReadingUpdate, setManualStatus, clearOverride, resetAll],
  )

  return <ReadingTrackerContext.Provider value={value}>{children}</ReadingTrackerContext.Provider>
}
