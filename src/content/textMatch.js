// Shared word-boundary, case-insensitive term matching. Used both when
// counting/capping occurrences of a matched search term inside a block's
// plain text (searchIndex.js, headings.js::makeSnippet) and when locating the
// same occurrence inside the live rendered DOM to highlight it
// (highlightBlock.js) — using one implementation keeps "the Nth occurrence"
// consistent between search time and highlight time.

export function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** @returns {{start:number, end:number}[]} */
export function findOccurrences(text, term) {
  const t = String(term ?? '').trim()
  if (!t) return []
  const re = new RegExp(`\\b${escapeRegExp(t)}\\b`, 'gi')
  const matches = []
  let m
  while ((m = re.exec(text))) {
    matches.push({ start: m.index, end: m.index + m[0].length })
    if (m[0].length === 0) re.lastIndex++
  }
  return matches
}
