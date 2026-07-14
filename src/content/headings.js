// Search-snippet helper. Operates on already-plain-text block content (the
// search index's bodyText is extracted via hast-util-to-string at build time,
// so there's no markdown syntax left to strip here).

import { findOccurrences } from './textMatch.js'

/**
 * Build a context snippet around the Nth occurrence of `term` in `text`.
 * Returns null when that occurrence doesn't exist.
 * @returns {{ before: string, match: string, after: string } | null}
 */
export function makeSnippet(text, term, occurrence = 1, radius = 90) {
  const plain = String(text ?? '')
  const target = findOccurrences(plain, term)[Math.max(1, occurrence) - 1]
  if (!target) return null

  const start = Math.max(0, target.start - radius)
  const end = Math.min(plain.length, target.end + radius)
  return {
    before: (start > 0 ? '… ' : '') + plain.slice(start, target.start),
    match: plain.slice(target.start, target.end),
    after: plain.slice(target.end, end) + (end < plain.length ? ' …' : ''),
  }
}
