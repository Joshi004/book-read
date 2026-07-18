// Reading-history persistence + derivations. Pure module (no React) so it can be
// unit-reasoned and reused from the Context, the tracking engine, and the
// dashboard. Mirrors the localStorage + try/catch discipline of
// src/readingPrefs.jsx. All totals (streaks, aggregate stats, badges) are DERIVED
// from the raw `chapters`/`daily` maps here — never stored denormalized — so the
// persisted blob stays small and can't drift out of sync.

export const STORAGE_KEY = 'behavior-ops-reading'
const VERSION = 1

// A chapter is auto-"read" once this fraction of its block-ids have been read
// (or the reader reaches the final block). Also used by chapterProgress().
export const COMPLETE_FRACTION = 0.9

// ---------------------------------------------------------------------------
// Shape helpers
// ---------------------------------------------------------------------------

export function emptyChapter() {
  return {
    manualStatus: null, // null | 'read' | 'unread' — override wins over auto
    totalWords: 0,
    totalBlocks: 0, // live block count captured by the engine when rendered
    activeMs: 0,
    readBlockIds: [], // stored as array; treated as a set
    lastBlockId: null,
    lastScrollRatio: 0,
    firstOpenedAt: null,
    lastReadAt: null,
  }
}

function emptyState() {
  return { version: VERSION, chapters: {}, daily: {} }
}

// Merge a loaded chapter over the default so older/partial blobs gain new fields.
function normalizeChapter(raw) {
  const base = emptyChapter()
  if (!raw || typeof raw !== 'object') return base
  return {
    ...base,
    ...raw,
    readBlockIds: Array.isArray(raw.readBlockIds) ? raw.readBlockIds : [],
    manualStatus:
      raw.manualStatus === 'read' || raw.manualStatus === 'unread' ? raw.manualStatus : null,
  }
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const chapters = {}
      const src = parsed && parsed.chapters && typeof parsed.chapters === 'object' ? parsed.chapters : {}
      for (const key of Object.keys(src)) chapters[key] = normalizeChapter(src[key])
      const daily = parsed && parsed.daily && typeof parsed.daily === 'object' ? parsed.daily : {}
      return { version: VERSION, chapters, daily }
    }
  } catch {
    /* ignore corrupt/absent storage */
  }
  return emptyState()
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore quota / disabled storage */
  }
}

// ---------------------------------------------------------------------------
// Date helpers — local calendar day, so a reader's "day" matches their clock.
// (Date.now()/new Date() are freely available in app code.)
// ---------------------------------------------------------------------------

export function dayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayKey() {
  return dayKey(new Date())
}

function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// ---------------------------------------------------------------------------
// Derivations
// ---------------------------------------------------------------------------

// Auto status from the raw counters, ignoring any manual override.
export function autoStatus(chapter) {
  if (!chapter) return 'unread'
  const readCount = chapter.readBlockIds ? chapter.readBlockIds.length : 0
  if (readCount === 0) return 'unread'
  const total = blockTarget(chapter)
  if (total > 0 && readCount / total >= COMPLETE_FRACTION) return 'read'
  return 'reading'
}

// We only know word totals, not block totals, in the persisted blob — but the
// engine records readBlockIds against a live count. `totalBlocks` is stashed on
// the chapter by the engine when available; fall back to a words-based estimate.
function blockTarget(chapter) {
  if (chapter.totalBlocks > 0) return chapter.totalBlocks
  // Fallback: assume ~55 words/block if we never captured a live block count.
  return Math.max(chapter.readBlockIds.length, Math.round((chapter.totalWords || 0) / 55) || 1)
}

// Manual override wins; otherwise the auto status.
export function effectiveStatus(chapter) {
  if (chapter && chapter.manualStatus) return chapter.manualStatus
  return autoStatus(chapter)
}

// 0..1 completion for the progress bar. A manual 'read' shows full; manual
// 'unread' shows empty; otherwise blocks-read / blocks-total.
export function chapterProgress(chapter) {
  if (!chapter) return 0
  if (chapter.manualStatus === 'read') return 1
  if (chapter.manualStatus === 'unread') return 0
  const readCount = chapter.readBlockIds ? chapter.readBlockIds.length : 0
  if (readCount === 0) return 0
  const total = blockTarget(chapter)
  return Math.min(1, readCount / total)
}

// Whole-book roll-up used by the dashboard stat tiles.
export function aggregateStats(state, totalChapters) {
  const chapters = state.chapters || {}
  let read = 0
  let started = 0
  let activeMs = 0
  for (const key of Object.keys(chapters)) {
    const ch = chapters[key]
    const status = effectiveStatus(ch)
    if (status === 'read') read += 1
    if (status !== 'unread') started += 1
    activeMs += ch.activeMs || 0
  }
  return {
    chaptersRead: read,
    chaptersStarted: started,
    totalChapters: totalChapters ?? Object.keys(chapters).length,
    activeMs,
  }
}

// Streak = consecutive local days (ending today or yesterday) that had ANY
// genuine reading. Per the product decision, any real reading makes a day count.
export function computeStreak(state) {
  const daily = state.daily || {}
  const readDays = new Set(Object.keys(daily).filter((k) => (daily[k].activeMs || 0) > 0))
  if (readDays.size === 0) return { current: 0, longest: 0, activeToday: false }

  // Longest run anywhere.
  let longest = 0
  for (const key of readDays) {
    if (readDays.has(dayKey(addDays(keyToDate(key), -1)))) continue // not a run start
    let len = 1
    let cursor = keyToDate(key)
    while (readDays.has(dayKey(addDays(cursor, 1)))) {
      len += 1
      cursor = addDays(cursor, 1)
    }
    if (len > longest) longest = len
  }

  // Current run: walk back from today (or yesterday if today is idle).
  const today = new Date()
  const activeToday = readDays.has(dayKey(today))
  let current = 0
  let cursor = activeToday ? today : addDays(today, -1)
  while (readDays.has(dayKey(cursor))) {
    current += 1
    cursor = addDays(cursor, -1)
  }
  return { current, longest, activeToday }
}

// Last `days` calendar days as an ordered series for charts/heatmap. Each point
// carries the raw daily record (zeros if the day had no reading).
export function dailySeries(state, days) {
  const daily = state.daily || {}
  const out = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    const key = dayKey(date)
    const rec = daily[key] || { activeMs: 0, chapters: [] }
    out.push({
      key,
      date,
      activeMs: rec.activeMs || 0,
      chapters: rec.chapters || [],
    })
  }
  return out
}

// ---------------------------------------------------------------------------
// Gamification: badge catalog. Each rule is evaluated against derived stats so
// badges never need persisting. `earned` drives the lit/locked treatment.
// ---------------------------------------------------------------------------

export function evaluateBadges(state, totalChapters) {
  const agg = aggregateStats(state, totalChapters)
  const streak = computeStreak(state)
  const maxDailyMs = Object.values(state.daily || {}).reduce(
    (m, r) => Math.max(m, r.activeMs || 0),
    0,
  )
  const defs = [
    { id: 'first-steps', icon: '📖', label: 'First Steps', hint: 'Finish your first chapter', earned: agg.chaptersRead >= 1 },
    { id: 'bookworm', icon: '🐛', label: 'Bookworm', hint: 'Finish 5 chapters', earned: agg.chaptersRead >= 5 },
    {
      id: 'completionist',
      icon: '🏆',
      label: 'Completionist',
      hint: 'Finish every chapter',
      earned: totalChapters > 0 && agg.chaptersRead >= totalChapters,
    },
    { id: 'streak-3', icon: '🔥', label: 'On a Roll', hint: 'Read 3 days in a row', earned: streak.longest >= 3 },
    { id: 'streak-7', icon: '⚡', label: 'Unstoppable', hint: 'Read 7 days in a row', earned: streak.longest >= 7 },
    { id: 'marathon', icon: '⏱️', label: 'Marathon', hint: 'Read 60 min in one day', earned: maxDailyMs >= 60 * 60000 },
  ]
  return defs
}

export function formatDuration(ms) {
  const totalSec = Math.round((ms || 0) / 1000)
  if (totalSec < 60) return `${totalSec}s`
  const totalMin = Math.round(totalSec / 60)
  if (totalMin < 60) return `${totalMin} min`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m ? `${h}h ${m}m` : `${h}h`
}
