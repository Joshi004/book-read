// Helpers for full-text search snippets. The on-this-page nav reads heading ids
// straight from the rendered DOM (so anchors always match rehype-slug), so this
// module only needs to support search.

/** Strip the most common Markdown syntax so search snippets read as plain prose. */
export function stripMarkdown(text) {
  return String(text)
    .replace(/^---[\s\S]*?---/, '') // frontmatter (defensive; body is already split)
    .replace(/```[\s\S]*?```/g, ' ') // fenced code / mermaid blocks
    .replace(/^:::.*$/gm, ' ') // fenced-div markers
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → link text
    .replace(/[#>*_`|]/g, ' ') // residual markdown punctuation
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Build a context snippet around the first case-insensitive match of `query`.
 * Returns null when there's no match.
 * @returns {{ before: string, match: string, after: string } | null}
 */
export function makeSnippet(body, query, radius = 90) {
  const plain = stripMarkdown(body)
  const haystack = plain.toLowerCase()
  const needle = query.trim().toLowerCase()
  if (!needle) return null
  const idx = haystack.indexOf(needle)
  if (idx === -1) return null

  const start = Math.max(0, idx - radius)
  const end = Math.min(plain.length, idx + needle.length + radius)
  return {
    before: (start > 0 ? '… ' : '') + plain.slice(start, idx),
    match: plain.slice(idx, idx + needle.length),
    after: plain.slice(idx + needle.length, end) + (end < plain.length ? ' …' : ''),
  }
}
