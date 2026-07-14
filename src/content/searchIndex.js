import MiniSearch from 'minisearch'
import { makeSnippet } from './headings.js'
import { findOccurrences } from './textMatch.js'

const INDEX_OPTIONS = {
  idField: 'id',
  fields: ['title', 'headingText', 'bodyText'],
  storeFields: ['chapterNumber', 'headingId', 'headingText', 'blockId', 'title'],
  searchOptions: {
    boost: { title: 4, headingText: 2, bodyText: 1 },
    fuzzy: 0.2,
    prefix: true,
    combineWith: 'AND',
  },
}

// Cap how many occurrences of a matched term inside one block become
// separate hits (a very common word could otherwise flood one result), and
// how many hits render in the dialog overall.
const MAX_OCCURRENCES_PER_BLOCK = 3
const MAX_RESULTS = 60

let enginePromise = null

// Fetched once, the first time the search dialog opens — not on initial page
// load. Loads a PLAIN document array (not a pre-serialized MiniSearch index):
// the client always builds its own index with its own bundled MiniSearch
// version, so a PWA-cached corpus.json from a different deploy than the
// current JS bundle can never hit a serializationVersion mismatch.
export function loadSearchIndex() {
  if (!enginePromise) {
    enginePromise = fetch(`${import.meta.env.BASE_URL}search-index/corpus.json`)
      .then((r) => r.json())
      .then((docs) => {
        const mini = new MiniSearch(INDEX_OPTIONS)
        mini.addAll(docs)
        const docsById = new Map(docs.map((d) => [d.id, d]))
        return { search: (query) => runSearch(mini, docsById, query) }
      })
  }
  return enginePromise
}

function runSearch(mini, docsById, query) {
  const q = String(query || '').trim()
  if (q.length < 2) return []

  const hits = []
  for (const result of mini.search(q)) {
    const doc = docsById.get(result.id)
    if (!doc) continue

    // The actual matched DOCUMENT term post fuzzy/prefix expansion — e.g.
    // typing "perceptoin" fuzzy-matches the term "perception" in the text.
    // Highlighting must target this, not the raw query, or it finds nothing.
    const matchedTerm = Object.keys(result.match).sort((a, b) => b.length - a.length)[0]
    if (!matchedTerm) continue

    const occurrences = findOccurrences(doc.bodyText, matchedTerm).slice(0, MAX_OCCURRENCES_PER_BLOCK)
    occurrences.forEach((_, i) => {
      const occurrenceInBlock = i + 1
      const snippet = makeSnippet(doc.bodyText, matchedTerm, occurrenceInBlock)
      if (!snippet) return
      hits.push({
        chapterNumber: doc.chapterNumber,
        chapterTitle: doc.title,
        headingId: doc.headingId,
        headingText: doc.headingText,
        blockId: doc.blockId,
        matchedTerm,
        occurrenceInBlock,
        snippet,
        score: result.score,
      })
    })
  }

  hits.sort((a, b) => b.score - a.score)
  return hits.slice(0, MAX_RESULTS)
}
