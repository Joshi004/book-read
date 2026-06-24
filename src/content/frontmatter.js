// Tiny YAML-frontmatter parser — a port of build.py's parse_frontmatter.
// The chapter frontmatter is simple `key: "value"` pairs, so we avoid pulling in
// gray-matter (and its Node Buffer dependency) into the browser bundle.

const FENCE = /^---\s*$/

/**
 * Split a Markdown string into its frontmatter object and the body below it.
 * @param {string} raw
 * @returns {{ data: Record<string, string|number>, body: string }}
 */
export function parseFrontmatter(raw) {
  const text = String(raw).replace(/^﻿/, '') // strip BOM
  const lines = text.split(/\r?\n/)

  if (!FENCE.test(lines[0] ?? '')) {
    return { data: {}, body: text }
  }

  const data = {}
  let i = 1
  for (; i < lines.length; i++) {
    if (FENCE.test(lines[i])) {
      i++ // consume closing fence
      break
    }
    const line = lines[i]
    const colon = line.indexOf(':')
    if (colon === -1) continue
    const key = line.slice(0, colon).trim()
    let value = line.slice(colon + 1).trim()
    // Strip matching surrounding quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key) data[key] = value
  }

  // Skip blank lines immediately after the frontmatter block.
  while (i < lines.length && lines[i].trim() === '') i++

  return { data, body: lines.slice(i).join('\n') }
}
