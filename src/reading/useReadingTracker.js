import { useEffect, useRef } from 'react'
import { useReadingTrackerContext } from './ReadingTrackerContext.jsx'

// --- Tunable heuristic constants (see plan / README notes) ---------------------
const ASSUMED_WPM = 230 // baseline used to derive a block's "expected" read time
const READ_FRACTION = 0.5 // dwell needed, vs expected time, to mark a block read
const MIN_BLOCK_READ_MS = 600 // floor so tiny blocks aren't marked the instant seen
const FAST_SCROLL_PX_S = 1200 // above this scroll speed, we're skimming, not reading
const FAST_SCROLL_COOLDOWN_MS = 500 // suppress crediting briefly after a fast fling
const IDLE_MS = 20000 // no interaction for this long → reader has stepped away
const TICK_MS = 1000 // accrual cadence
const MAX_TICK_CREDIT_MS = 1500 // cap per tick → no background catch-up spikes
// Central viewport band where the eyes rest; only blocks overlapping it accrue.
const READING_BAND = '-20% 0px -40% 0px'

function countWords(text) {
  const t = (text || '').trim()
  if (!t) return 0
  return t.split(/\s+/).length
}

function expectedMs(words) {
  return Math.max(MIN_BLOCK_READ_MS, (words / ASSUMED_WPM) * 60000)
}

// Drives the reading-detection engine for one mounted chapter. `containerRef`
// points at the BookProse element; `ready` flips true once the markdown body is
// in the DOM (so block ids and text exist to measure).
export function useReadingTracker(chapterNumber, containerRef, ready) {
  const { registerChapter, applyReadingUpdate } = useReadingTrackerContext()

  // Keep the latest action refs so the long-lived tick/observer closures don't
  // capture stale ones (the context recreates them only on rare state changes).
  const registerRef = useRef(registerChapter)
  const applyRef = useRef(applyReadingUpdate)
  registerRef.current = registerChapter
  applyRef.current = applyReadingUpdate

  useEffect(() => {
    const container = containerRef.current
    if (!ready || !container) return

    // ---- Measure blocks --------------------------------------------------
    const nodes = container.querySelectorAll('[data-block-id]')
    const blocks = new Map() // id -> { el, words, index }
    let totalWords = 0
    Array.from(nodes).forEach((el, index) => {
      const id = el.getAttribute('data-block-id')
      if (!id || blocks.has(id)) return
      const words = countWords(el.textContent)
      blocks.set(id, { el, words, index })
      totalWords += words
    })
    if (blocks.size === 0) return

    registerRef.current(chapterNumber, { totalWords, totalBlocks: blocks.size })

    // ---- Mutable engine state -------------------------------------------
    const visible = new Set() // block ids currently overlapping the reading band
    const dwell = new Map() // id -> accrued in-band ms
    const readLocally = new Set() // ids we've already reported as read
    let maxIndex = -1 // furthest block reached, for the resume position
    let maxIndexId = null

    let lastActivity = Date.now()
    let fastUntil = 0 // suppress crediting until this timestamp (post fast-scroll)
    let lastScrollY = window.scrollY
    let lastScrollT = Date.now()
    let lastTick = Date.now()

    const markActivity = () => {
      lastActivity = Date.now()
    }

    const onScroll = () => {
      const now = Date.now()
      const y = window.scrollY
      const dt = now - lastScrollT
      if (dt > 0) {
        const velocity = (Math.abs(y - lastScrollY) / dt) * 1000 // px/s
        if (velocity > FAST_SCROLL_PX_S) fastUntil = now + FAST_SCROLL_COOLDOWN_MS
      }
      lastScrollY = y
      lastScrollT = now
      lastActivity = now
    }

    // ---- Observe which blocks sit in the reading band -------------------
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute('data-block-id')
          if (!id) continue
          if (entry.isIntersecting) {
            visible.add(id)
            const b = blocks.get(id)
            if (b && b.index > maxIndex) {
              maxIndex = b.index
              maxIndexId = id
            }
          } else {
            visible.delete(id)
          }
        }
      },
      { root: null, rootMargin: READING_BAND, threshold: 0 },
    )
    for (const { el } of blocks.values()) observer.observe(el)

    // ---- Accrual tick ---------------------------------------------------
    const scrollRatio = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max <= 0) return 0
      return Math.min(1, Math.max(0, window.scrollY / max))
    }

    const tick = () => {
      const now = Date.now()
      const rawDelta = now - lastTick
      lastTick = now // advance always, so idle gaps are never credited later

      const idle = now - lastActivity > IDLE_MS
      const hidden = document.visibilityState === 'hidden'
      const fast = now < fastUntil
      const reading = !idle && !hidden && !fast && visible.size > 0
      if (!reading) return

      const delta = Math.min(rawDelta, MAX_TICK_CREDIT_MS)
      const newReadBlocks = []
      for (const id of visible) {
        const b = blocks.get(id)
        if (!b) continue
        const accrued = (dwell.get(id) || 0) + delta
        dwell.set(id, accrued)
        if (!readLocally.has(id) && accrued >= expectedMs(b.words) * READ_FRACTION) {
          readLocally.add(id)
          newReadBlocks.push(id)
        }
      }

      applyRef.current({
        chapterNumber,
        addActiveMs: delta,
        newReadBlocks,
        lastBlockId: maxIndexId,
        lastScrollRatio: scrollRatio(),
      })
    }

    const intervalId = setInterval(tick, TICK_MS)

    const activityEvents = ['mousemove', 'keydown', 'touchstart', 'wheel', 'pointerdown']
    activityEvents.forEach((ev) => window.addEventListener(ev, markActivity, { passive: true }))
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      clearInterval(intervalId)
      observer.disconnect()
      activityEvents.forEach((ev) => window.removeEventListener(ev, markActivity))
      window.removeEventListener('scroll', onScroll)
    }
  }, [chapterNumber, ready, containerRef])
}
