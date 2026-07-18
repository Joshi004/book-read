import { useEffect, useRef } from 'react'

// Density-aware auto-scroll engine ("word clock"). Instead of a fixed
// pixels/second, we hold *words crossing the reader's focal line per minute*
// constant at the slider's WPM, and let pixel velocity vary with local content
// density. Dense prose scrolls slowly; whitespace and figures are paced by an
// implied word cost so one speed governs everything. See AUTO_SCROLL_READING_SPEED.md.
//
// The chapter column ([data-block-id] blocks + figures/tables/code) is a
// gap-free vertical stack of the BookProse container's DIRECT children, so we
// walk those as "flow units". Word counts are measured once; heights are read
// LIVE each frame (one getBoundingClientRect on the current unit) so late image
// loads, font-size changes, and resizes never desync the pace.

const FOCAL_FRACTION = 0.42 // focal line as a fraction of viewport height
const MIN_UNIT_DWELL_MS = 300 // floor so tiny units (hr, short heading) aren't skipped
const MAX_VELOCITY_PX_S = 1000 // safety cap so a model misfire can't fly through content
const MAX_FRAME_MS = 50 // clamp long frames (backgrounded tab / jank) — no catch-up jump
const MANUAL_DRIFT_PX = 10 // scroll diverging from what we commanded ⇒ the reader took over
const END_EPSILON_PX = 2

// Implied word cost for word-sparse visual blocks, so the slider paces them too.
const MEDIA_MIN_WORDS = 40 // a figure / diagram is worth ~this much dwell
const CODE_WORD_MULT = 1.6 // code reads slower per word
const TABLE_WORD_MULT = 1.3

function countWords(text) {
  const t = (text || '').trim()
  if (!t) return 0
  return t.split(/\s+/).length
}

// How many "words" of dwell a flow unit is worth.
function unitWords(el) {
  const base = countWords(el.textContent)
  const tag = el.tagName
  if (tag === 'FIGURE') return Math.max(base, MEDIA_MIN_WORDS)
  if (tag === 'PRE') return Math.max(Math.round(base * CODE_WORD_MULT), Math.round(MEDIA_MIN_WORDS / 2))
  if (tag === 'HR') return 3
  if (el.querySelector) {
    if (el.querySelector('table')) return Math.max(Math.round(base * TABLE_WORD_MULT), MEDIA_MIN_WORDS)
    if (el.querySelector('svg')) return Math.max(base, MEDIA_MIN_WORDS) // Mermaid / inline SVG diagrams
  }
  return base
}

// Drives auto-scroll for one mounted chapter while `active` is true.
//   containerRef → the BookProse element; `ready` → prose is in the DOM.
//   opts.wpm updates live (read via ref) so slider changes take effect smoothly.
//   opts.onManualPause / onReachedEnd / onProgress are called back by the loop.
export function useAutoScroll(chapterNumber, containerRef, ready, opts) {
  const { active, wpm, onManualPause, onReachedEnd, onProgress } = opts

  // Latest-value refs so the long-lived rAF closure never captures stale props.
  const wpmRef = useRef(wpm)
  const pauseRef = useRef(onManualPause)
  const endRef = useRef(onReachedEnd)
  const progressRef = useRef(onProgress)
  wpmRef.current = wpm
  pauseRef.current = onManualPause
  endRef.current = onReachedEnd
  progressRef.current = onProgress

  useEffect(() => {
    if (!active || !ready) return
    const container = containerRef.current
    if (!container) return

    // ---- Build flow units from the container's direct children ----------
    const units = Array.from(container.children)
      .filter((el) => el.offsetHeight > 0)
      .map((el) => ({ el, words: Math.max(1, unitWords(el)), measuredH: el.offsetHeight }))
    if (units.length === 0) return

    // Suffix word sums → remaining reading time (ETA) from any unit onward.
    const suffix = new Array(units.length + 1).fill(0)
    for (let i = units.length - 1; i >= 0; i--) suffix[i] = suffix[i + 1] + units[i].words

    const focalOffset = () => window.innerHeight * FOCAL_FRACTION
    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    const pageTop = (el) => el.getBoundingClientRect().top + window.scrollY

    if (maxScroll() <= 0) {
      endRef.current?.()
      return
    }

    let idx = 0
    let targetY = window.scrollY // fractional accumulator for sub-pixel smoothness
    let lastCommandedY = window.scrollY
    let lastTs = null
    let lastProgressTs = 0
    let rafId = 0
    let stopped = false

    // Advance/retreat idx to the unit whose vertical span contains focalY.
    const syncIdx = (focalY) => {
      while (idx < units.length - 1 && pageTop(units[idx + 1].el) <= focalY) idx++
      while (idx > 0 && pageTop(units[idx].el) > focalY) idx--
    }

    const halt = (reason) => {
      if (stopped) return
      stopped = true
      cancelAnimationFrame(rafId)
      if (reason === 'end') endRef.current?.()
      else pauseRef.current?.()
    }

    const frame = (ts) => {
      if (stopped) return
      if (lastTs == null) lastTs = ts
      let dt = ts - lastTs
      lastTs = ts
      if (dt <= 0) {
        rafId = requestAnimationFrame(frame)
        return
      }
      dt = Math.min(dt, MAX_FRAME_MS)

      // The reader grabbed the scrollbar (or momentum from a fling): pause.
      const actualY = window.scrollY
      if (Math.abs(actualY - lastCommandedY) > MANUAL_DRIFT_PX) {
        halt('manual')
        return
      }

      const focalY = actualY + focalOffset()
      syncIdx(focalY)
      const unit = units[idx]
      const h = Math.max(1, unit.el.getBoundingClientRect().height) // live height
      // Re-derive the word cost when a unit's height has changed since we last
      // measured it — a Mermaid/SVG diagram, lazy image, or table that rendered
      // AFTER Auto Read started would otherwise read as ~1 word and get raced
      // through at the velocity cap. Cheap: only fires when layout actually shifts.
      if (Math.abs(h - unit.measuredH) > 4) {
        unit.words = Math.max(1, unitWords(unit.el))
        unit.measuredH = h
      }
      const speed = Math.max(1, wpmRef.current)
      const dwellMs = Math.max(MIN_UNIT_DWELL_MS, (unit.words / speed) * 60000)
      const v = Math.min(MAX_VELOCITY_PX_S, (h / dwellMs) * 1000) // px/s

      targetY += (v * dt) / 1000

      const max = maxScroll()
      if (targetY >= max - END_EPSILON_PX) {
        window.scrollTo(0, max)
        progressRef.current?.({ etaSec: 0 })
        halt('end')
        return
      }

      window.scrollTo(0, targetY)
      lastCommandedY = window.scrollY

      if (ts - lastProgressTs > 1000) {
        lastProgressTs = ts
        progressRef.current?.({ etaSec: Math.round((suffix[idx] / speed) * 60) })
      }
      rafId = requestAnimationFrame(frame)
    }

    // Explicit user input is the primary "reader took over" signal; the drift
    // check above is the backstop for scrollbar drags we can't hear.
    const onWheel = () => halt('manual')
    const onTouchMove = () => halt('manual')
    const onKey = (e) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
        halt('manual')
      }
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('keydown', onKey)

    syncIdx(window.scrollY + focalOffset())
    rafId = requestAnimationFrame(frame)

    return () => {
      stopped = true
      cancelAnimationFrame(rafId)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
    }
    // wpm intentionally excluded — it's read live via wpmRef, not a restart trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterNumber, ready, active, containerRef])
}
