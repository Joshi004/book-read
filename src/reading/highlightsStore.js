// Reader highlights persistence + derivations. Pure module (no React), mirroring
// the localStorage + try/catch discipline of src/reading/readingStore.js and
// src/readingPrefs.jsx. A highlight anchors to a chapter's stable content-hashed
// `data-block-id` (see src/content/blockIds.js): text highlights also carry a
// character range within that block; element highlights (diagrams, images, whole
// tables) cover the block as a whole.
//
// All groupings/derivations (per-chapter lists, the grouped Highlights page view)
// are computed from the raw `highlights` map here — never stored denormalized —
// so the persisted blob stays small and can't drift out of sync.

export const STORAGE_KEY = 'behavior-ops-highlights'
const VERSION = 1

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function emptyState() {
  return { version: VERSION, highlights: {} }
}

// Keep only well-formed records; tolerate older/partial blobs.
function normalizeHighlight(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (!raw.id || raw.chapterNumber == null || !raw.blockId) return null
  const kind = raw.kind === 'element' ? 'element' : 'text'
  return {
    id: String(raw.id),
    chapterNumber: Number(raw.chapterNumber),
    blockId: String(raw.blockId),
    kind,
    startOffset: Number.isFinite(raw.startOffset) ? raw.startOffset : 0,
    endOffset: Number.isFinite(raw.endOffset) ? raw.endOffset : 0,
    quotedText: typeof raw.quotedText === 'string' ? raw.quotedText : '',
    blockTextSnapshot: typeof raw.blockTextSnapshot === 'string' ? raw.blockTextSnapshot : '',
    note: typeof raw.note === 'string' ? raw.note : '',
    color: typeof raw.color === 'string' ? raw.color : 'default',
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
    updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : Date.now(),
  }
}

export function loadHighlights() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const src = parsed && parsed.highlights && typeof parsed.highlights === 'object' ? parsed.highlights : {}
      const highlights = {}
      for (const key of Object.keys(src)) {
        const h = normalizeHighlight(src[key])
        if (h) highlights[h.id] = h
      }
      return { version: VERSION, highlights }
    }
  } catch {
    /* ignore corrupt/absent storage */
  }
  return emptyState()
}

export function saveHighlights(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore quota / disabled storage */
  }
}

// ---------------------------------------------------------------------------
// Ids — random, collision-resistant enough for a per-device local store.
// (crypto.randomUUID where available; Math.random is fine in app code.)
// ---------------------------------------------------------------------------

export function newId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return `hl_${crypto.randomUUID()}`
  } catch {
    /* fall through */
  }
  return `hl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

// ---------------------------------------------------------------------------
// Derivations
// ---------------------------------------------------------------------------

// All highlights for one chapter, newest first.
export function highlightsForChapter(state, chapterNumber) {
  const num = Number(chapterNumber)
  return Object.values(state.highlights || {})
    .filter((h) => h.chapterNumber === num)
    .sort((a, b) => b.createdAt - a.createdAt)
}

export function totalCount(state) {
  return Object.keys(state.highlights || {}).length
}

// Grouped for the Highlights page: chapters in book order, newest highlight
// first within each chapter. `chapterOrder` is the list of chapter numbers in
// reading order (from content/chapters.js) so groups sort the same as the book.
export function allHighlightsGrouped(state, chapterOrder = []) {
  const byChapter = new Map()
  for (const h of Object.values(state.highlights || {})) {
    if (!byChapter.has(h.chapterNumber)) byChapter.set(h.chapterNumber, [])
    byChapter.get(h.chapterNumber).push(h)
  }
  const orderIndex = new Map(chapterOrder.map((n, i) => [Number(n), i]))
  return Array.from(byChapter.entries())
    .sort((a, b) => {
      const ai = orderIndex.has(a[0]) ? orderIndex.get(a[0]) : Infinity
      const bi = orderIndex.has(b[0]) ? orderIndex.get(b[0]) : Infinity
      return ai - bi || a[0] - b[0]
    })
    .map(([chapterNumber, items]) => ({
      chapterNumber,
      highlights: items.sort((a, b) => b.createdAt - a.createdAt),
    }))
}
