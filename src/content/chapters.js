import manifest from '../generated/chapters-manifest.json'
import { parseFrontmatter } from './frontmatter.js'

// Chapter metadata (title, subtitle, number, ...) is a small, static, eagerly
// imported manifest generated at build time (scripts/generate-search-index.mjs)
// from the same chapters/*.md frontmatter this module used to parse itself.
// Dropping a new chapters/chapter-NN.md still makes it appear everywhere
// automatically — the manifest just gets regenerated on the next build.
//
// The chapter BODY (the actual markdown prose) is loaded lazily, per chapter,
// on route visit — not bundled eagerly into every page's JS like before.
const bodyLoaders = import.meta.glob('../../chapters/*.md', {
  query: '?raw',
  import: 'default',
})

const bodyCache = new Map()

export const chapters = manifest

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

export function loadChapterBody(number) {
  const chapter = getChapter(number)
  if (!chapter) return Promise.resolve(null)
  if (!bodyCache.has(chapter.number)) {
    const loader = bodyLoaders[chapter.path]
    const promise = loader
      ? loader().then((raw) => parseFrontmatter(raw).body)
      : Promise.resolve('')
    bodyCache.set(chapter.number, promise)
  }
  return bodyCache.get(chapter.number)
}
