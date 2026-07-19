import { createContext, useContext, useCallback, useMemo, useRef, useState } from 'react'
import {
  loadHighlights,
  saveHighlights,
  newId,
} from './highlightsStore.js'

// Provider for reader highlights + notes. Discrete, low-frequency user actions
// (add/update/remove) — so unlike ReadingTrackerContext there's no throttled
// snapshot/debounced-persist machinery: each mutation commits a fresh snapshot
// and persists immediately, closer to the readingPrefs.jsx pattern.

const HighlightsContext = createContext(null)

export const useHighlights = () => {
  const ctx = useContext(HighlightsContext)
  if (!ctx) throw new Error('useHighlights must be used within HighlightsProvider')
  return ctx
}

export function HighlightsProvider({ children }) {
  const stateRef = useRef(null)
  if (stateRef.current === null) stateRef.current = loadHighlights()

  const [snapshot, setSnapshot] = useState(stateRef.current)

  const commit = useCallback(() => {
    saveHighlights(stateRef.current)
    setSnapshot({ ...stateRef.current, highlights: { ...stateRef.current.highlights } })
  }, [])

  // Accepts a partial highlight (chapterNumber, blockId, kind, offsets, quoted
  // text, snapshot, optional note); fills id/timestamps/defaults. Returns the id.
  const addHighlight = useCallback(
    (partial) => {
      const now = Date.now()
      const id = partial.id || newId()
      stateRef.current.highlights[id] = {
        id,
        chapterNumber: Number(partial.chapterNumber),
        blockId: String(partial.blockId),
        kind: partial.kind === 'element' ? 'element' : 'text',
        startOffset: Number.isFinite(partial.startOffset) ? partial.startOffset : 0,
        endOffset: Number.isFinite(partial.endOffset) ? partial.endOffset : 0,
        quotedText: partial.quotedText || '',
        blockTextSnapshot: partial.blockTextSnapshot || '',
        note: partial.note || '',
        color: partial.color || 'default',
        createdAt: now,
        updatedAt: now,
      }
      commit()
      return id
    },
    [commit],
  )

  const updateNote = useCallback(
    (id, note) => {
      const h = stateRef.current.highlights[id]
      if (!h) return
      h.note = typeof note === 'string' ? note : ''
      h.updatedAt = Date.now()
      commit()
    },
    [commit],
  )

  const removeHighlight = useCallback(
    (id) => {
      if (!stateRef.current.highlights[id]) return
      delete stateRef.current.highlights[id]
      commit()
    },
    [commit],
  )

  const clearAll = useCallback(() => {
    stateRef.current = { version: 1, highlights: {} }
    commit()
  }, [commit])

  const value = useMemo(
    () => ({ snapshot, addHighlight, updateNote, removeHighlight, clearAll }),
    [snapshot, addHighlight, updateNote, removeHighlight, clearAll],
  )

  return <HighlightsContext.Provider value={value}>{children}</HighlightsContext.Provider>
}
