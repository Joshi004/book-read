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
    const parent = mark.parentNode
    if (!parent) return
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
    parent.removeChild(mark)
    parent.normalize()
  })
}
