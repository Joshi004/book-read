import { findOccurrences } from '../content/textMatch.js'

// Wraps the Nth occurrence of `term` inside `root` (a single already-rendered
// block element, e.g. the paragraph a search hit landed on) in a
// <mark class="search-hit-highlight">. Offsets are computed against
// `root.textContent` (which flattens inline formatting like <em>/<strong>/<a>,
// same as hast-util-to-string does when the search index was built) and then
// mapped back to the real DOM text node.
//
// Known accepted limitation: if the match itself is split mid-word across two
// text nodes (e.g. `un**believ**able`), it spans two DOM text nodes and this
// silently skips highlighting rather than throwing — rare enough to accept.
export function highlightOccurrence(root, term, occurrence) {
  clearHighlight(root)
  if (!root || !term) return

  const text = root.textContent || ''
  const target = findOccurrences(text, term)[Math.max(1, occurrence || 1) - 1]
  if (!target) return

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node
  let pos = 0
  while ((node = walker.nextNode())) {
    const nodeStart = pos
    const nodeEnd = pos + node.nodeValue.length
    if (target.start >= nodeStart && target.end <= nodeEnd) {
      const range = document.createRange()
      range.setStart(node, target.start - nodeStart)
      range.setEnd(node, target.end - nodeStart)
      const mark = document.createElement('mark')
      mark.className = 'search-hit-highlight'
      range.surroundContents(mark)
      return
    }
    pos = nodeEnd
  }
}

export function clearHighlight(root) {
  root?.querySelectorAll('mark.search-hit-highlight').forEach((mark) => {
    unwrapMark(mark)
  })
}

// ---------------------------------------------------------------------------
// Persistent reader highlights — a distinct treatment from the ephemeral
// search-hit flash above. These wrap a stored character range (not a
// word-boundary search term) inside a block, survive across renders, and carry
// their highlight id so a specific one can be located, flashed, or removed.
// ---------------------------------------------------------------------------

function unwrapMark(mark) {
  const parent = mark.parentNode
  if (!parent) return
  while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
  parent.removeChild(mark)
  parent.normalize()
}

// Map a DOM point (container + offset, as produced by a Selection Range) to a
// character offset within `root`'s flattened text. Robust to element-node
// endpoints (selection can start/end on an element boundary) by measuring the
// text length preceding the point with a Range.
function pointToOffset(root, container, offset) {
  const r = document.createRange()
  r.selectNodeContents(root)
  try {
    r.setEnd(container, offset)
  } catch {
    return 0
  }
  return r.toString().length
}

// Character offsets of a selection Range within a block. Returns null if the
// selection isn't usefully contained (caller then declines to offer a highlight).
export function selectionOffsets(root, range) {
  if (!root || !range) return null
  const start = pointToOffset(root, range.startContainer, range.startOffset)
  const end = pointToOffset(root, range.endContainer, range.endOffset)
  const lo = Math.min(start, end)
  const hi = Math.max(start, end)
  if (hi <= lo) return null
  return { start: lo, end: hi }
}

// Wrap the [startOffset, endOffset) character range of `root` in one or more
// <mark class="reader-highlight" data-highlight-id="…"> — one per text node the
// range crosses, so it works even when the range spans inline <em>/<strong>/<a>.
// Idempotent-friendly: call removePersistentHighlight / removeAllReaderHighlights
// before re-applying to avoid double-wrapping.
export function applyPersistentHighlight(root, { id, startOffset, endOffset, noted = false }) {
  if (!root || !(endOffset > startOffset)) return false

  // First pass: collect the sub-range of each text node that falls inside
  // [start, end). Collected before mutating so surroundContents-driven text-node
  // splits don't disturb the walk.
  const targets = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node
  let pos = 0
  while ((node = walker.nextNode())) {
    const len = node.nodeValue.length
    const nodeStart = pos
    const nodeEnd = pos + len
    const from = Math.max(startOffset, nodeStart)
    const to = Math.min(endOffset, nodeEnd)
    if (to > from) targets.push({ node, from: from - nodeStart, to: to - nodeStart })
    pos = nodeEnd
  }
  if (!targets.length) return false

  const created = []
  for (const t of targets) {
    const range = document.createRange()
    range.setStart(t.node, t.from)
    range.setEnd(t.node, t.to)
    const mark = document.createElement('mark')
    mark.className = noted ? 'reader-highlight reader-highlight--noted' : 'reader-highlight'
    mark.dataset.highlightId = id
    try {
      range.surroundContents(mark)
      created.push(mark)
    } catch {
      /* a fragment we can't cleanly wrap — skip it, keep the rest */
    }
  }
  // The note marker (a small superscript indicator) hangs off the final segment
  // only, so a multi-segment highlight shows one marker, not one per node.
  if (noted && created.length) {
    created[created.length - 1].classList.add('reader-highlight--note-end')
  }
  return created.length > 0
}

export function removePersistentHighlight(root, id) {
  if (!root || !id) return
  root
    .querySelectorAll(`mark.reader-highlight[data-highlight-id="${CSS.escape(id)}"]`)
    .forEach((mark) => unwrapMark(mark))
}

// Strip every persistent reader highlight from `root` (used before re-applying
// the current set on a re-render).
export function removeAllReaderHighlights(root) {
  root?.querySelectorAll('mark.reader-highlight').forEach((mark) => unwrapMark(mark))
}
