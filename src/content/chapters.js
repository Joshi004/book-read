import { parseFrontmatter } from './frontmatter.js'

// Eagerly pull every chapter's raw Markdown at build time. Dropping a new
// chapters/chapter-NN.md (with `chapter: NN` frontmatter) makes it appear in the
// TOC, routing, search, and prev/next automatically — no code change needed.
const modules = import.meta.glob('../../chapters/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function buildManifest() {
  const list = Object.entries(modules).map(([path, raw]) => {
    const { data, body } = parseFrontmatter(raw)
    const fileSlug = path.split('/').pop().replace(/\.md$/, '') // e.g. "chapter-03"
    const number = data.chapter != null ? Number(data.chapter) : NaN
    return {
      path,
      slug: fileSlug,
      number,
      title: data.title || fileSlug,
      subtitle: data.subtitle || '',
      book: data.book || 'Behavior Ops',
      author: data.author || '',
      body,
    }
  })

  // Sort by chapter number; entries without a numeric chapter sink to the end.
  list.sort((a, b) => {
    const an = Number.isNaN(a.number) ? Infinity : a.number
    const bn = Number.isNaN(b.number) ? Infinity : b.number
    return an - bn
  })

  return list
}

export const chapters = buildManifest()

export function getChapter(number) {
  const n = Number(number)
  return chapters.find((c) => c.number === n) || null
}

export function getNeighbors(number) {
  const idx = chapters.findIndex((c) => c.number === Number(number))
  if (idx === -1) return { prev: null, next: null }
  return {
    prev: idx > 0 ? chapters[idx - 1] : null,
    next: idx < chapters.length - 1 ? chapters[idx + 1] : null,
  }
}
