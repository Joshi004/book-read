#!/usr/bin/env node
// Build-time search index generator. Runs before `vite dev`/`vite build`
// (see package.json). Parses every chapters/*.md through the SAME remark
// pipeline (including the shared blockIdPlugin and the real rehype-slug
// package) the browser uses to render chapters, so block ids and heading ids
// in the emitted index always match the ids present in the rendered DOM.
//
// Emits two artifacts (both gitignored — regenerated on every build):
//   - src/generated/chapters-manifest.json  (chapter metadata, statically imported by chapters.js)
//   - public/search-index/corpus.json       (per-block search documents, fetched lazily on first search)

import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import { visit } from 'unist-util-visit'
import { toString as hastToString } from 'hast-util-to-string'

import { parseFrontmatter } from '../src/content/frontmatter.js'
import {
  normalizeFencedDivs,
  stripHtmlComments,
  remarkCalloutDirectives,
  stripLeadingH1,
} from '../src/content/markdownPipeline.js'
import { blockIdPlugin } from '../src/content/blockIds.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CHAPTERS_DIR = resolve(ROOT, 'chapters')
const MANIFEST_OUT = resolve(ROOT, 'src/generated/chapters-manifest.json')
const CORPUS_OUT = resolve(ROOT, 'public/search-index/corpus.json')

function buildPipeline() {
  // Mirrors src/content/markdown.jsx's remarkPlugins + rehypePlugins exactly,
  // with remarkParse/remarkRehype added since this runs outside react-markdown.
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkCalloutDirectives)
    .use(blockIdPlugin)
    .use(remarkRehype)
    .use(rehypeSlug)
}

function extractChapter(filename) {
  const raw = readFileSync(resolve(CHAPTERS_DIR, filename), 'utf8')
  const { data, body: rawBody } = parseFrontmatter(raw)
  const body = stripLeadingH1(stripHtmlComments(normalizeFencedDivs(rawBody)))
  const slug = filename.replace(/\.md$/, '')
  const number = data.chapter != null ? Number(data.chapter) : NaN

  const meta = {
    path: `../../chapters/${filename}`,
    slug,
    number,
    title: data.title || slug,
    subtitle: data.subtitle || '',
    book: data.book || 'Behavior Ops',
    author: data.author || '',
  }

  const processor = buildPipeline()
  const tree = processor.runSync(processor.parse(body))

  const docs = []
  let currentHeadingId = null
  let currentHeadingText = null

  visit(tree, 'element', (node) => {
    if (node.tagName === 'h2' || node.tagName === 'h3') {
      currentHeadingId = node.properties?.id || null
      currentHeadingText = hastToString(node).trim()
      return
    }
    const blockId = node.properties?.['data-block-id']
    if (!blockId) return
    // Media/diagram/whole-table blocks now carry a data-block-id purely so
    // reader highlights can anchor to them — they aren't searchable text.
    // (Table cells keep their own ids and are indexed individually below.)
    if (node.tagName === 'img' || node.tagName === 'pre' || node.tagName === 'code' || node.tagName === 'table') return
    const bodyText = hastToString(node).trim().replace(/\s+/g, ' ')
    if (!bodyText) return // e.g. an image-only paragraph — nothing to search
    docs.push({
      id: `${meta.number}:${blockId}`,
      chapterNumber: meta.number,
      blockId,
      headingId: currentHeadingId,
      headingText: currentHeadingText,
      title: meta.title,
      bodyText,
    })
  })

  return { meta, docs }
}

function main() {
  const files = readdirSync(CHAPTERS_DIR).filter((f) => f.endsWith('.md'))
  if (files.length === 0) {
    console.warn('generate-search-index: no chapters/*.md files found')
  }

  const chapters = files.map((filename) => {
    try {
      return extractChapter(filename)
    } catch (err) {
      console.error(`generate-search-index: failed to parse ${filename}:`, err)
      throw err
    }
  })

  chapters.sort((a, b) => {
    const an = Number.isNaN(a.meta.number) ? Infinity : a.meta.number
    const bn = Number.isNaN(b.meta.number) ? Infinity : b.meta.number
    return an - bn
  })

  const manifest = chapters.map((c) => c.meta)
  const corpus = chapters.flatMap((c) => c.docs)

  mkdirSync(dirname(MANIFEST_OUT), { recursive: true })
  mkdirSync(dirname(CORPUS_OUT), { recursive: true })
  writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2))
  writeFileSync(CORPUS_OUT, JSON.stringify(corpus))

  console.log(
    `generate-search-index: ${chapters.length} chapters, ${corpus.length} indexed blocks -> ${CORPUS_OUT}`
  )
}

main()
