#!/usr/bin/env node
// Build-time data generator for the interactive Behavior Elements page.
// Parses chapters/chapter-26.md (the BTE field guide) through the SAME remark
// pipeline the browser uses to render chapters, so heading ids in the emitted
// dataset always match the ids rehype-slug assigns in the rendered DOM — that's
// what lets the Elements page deep-link straight into a chapter-26 heading.
//
// Emits src/generated/bte-data.json (gitignored, regenerated every build).
//
// Extraction is heuristic where the source is prose rather than structured
// data (relations, red/blue lettering, color band) — see inline notes. Gaps
// are logged to the console rather than silently dropped.

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import { visit } from 'unist-util-visit'

import { parseFrontmatter } from '../src/content/frontmatter.js'
import {
  normalizeFencedDivs,
  stripHtmlComments,
  remarkCalloutDirectives,
  stripLeadingH1,
} from '../src/content/markdownPipeline.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CHAPTER_PATH = resolve(ROOT, 'chapters/chapter-26.md')
const OUT_PATH = resolve(ROOT, 'src/generated/bte-data.json')

// The 5 body-region groups, in table order — also the chapter's own H2
// section titles. Anything outside these (intro material, Change Log) is
// ignored rather than mis-parsed as an entry.
const CATEGORIES = [
  'Arm Cross, Head, Face & Neck',
  'Arms, Hands & Shoulders',
  'Torso, Pelvis & Legs',
  'Object Interaction',
  'Direct Verbal Behavior',
]

// The seven basic-emotion facial expressions the chapter names explicitly as
// its own "facial expressions and microexpressions" (turquoise) category.
const BASIC_EMOTION_SYMBOLS = new Set(['HA', 'SA', 'DG', 'FR', 'CO', 'AG', 'SP'])

function buildHastPipeline() {
  // Mirrors src/content/markdown.jsx's remarkPlugins + rehypePlugins exactly
  // (see scripts/generate-search-index.mjs) so heading ids match the live DOM.
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkCalloutDirectives)
    .use(remarkRehype)
    .use(rehypeSlug)
}

// --- heading walk --------------------------------------------------------

function collectHeadings(body) {
  const processor = buildHastPipeline()
  const tree = processor.runSync(processor.parse(body))
  const headings = []
  visit(tree, 'element', (node) => {
    if (node.tagName !== 'h2' && node.tagName !== 'h3') return
    if (!node.position) return
    headings.push({
      level: node.tagName,
      id: node.properties?.id || null,
      startOffset: node.position.start.offset,
      endOffset: node.position.end.offset,
    })
  })
  headings.sort((a, b) => a.startOffset - b.startOffset)
  return headings
}

// --- quick-reference index tables (cross-check source) -------------------

function parseQuickRefTables(body, headings) {
  const qrHeading = headings.find(
    (h) => h.level === 'h3' && body.slice(h.startOffset, h.endOffset).replace(/^#+\s*/, '').trim() === 'Quick-Reference Index'
  )
  if (!qrHeading) {
    console.warn('generate-bte-data: could not find "Quick-Reference Index" section')
    return []
  }
  const next = headings.find((h) => h.startOffset > qrHeading.startOffset)
  const section = body.slice(qrHeading.endOffset, next ? next.startOffset : body.length)

  const rows = []
  let category = null
  for (const line of section.split(/\r?\n/)) {
    const boldLabel = line.match(/^\*\*([^*]+)\*\*\s*$/)
    if (boldLabel) {
      category = boldLabel[1].trim()
      continue
    }
    const row = line.match(/^\|\s*\*\*([^*]+)\*\*\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/)
    if (row) {
      rows.push({
        category,
        symbol: row[1].trim().toUpperCase(),
        name: row[2].trim(),
        gestureType: row[3].trim(),
        drsRaw: row[4].trim(),
      })
    }
  }
  return rows
}

// --- DRS / variable parsing ------------------------------------------------

function parseDrs(raw) {
  if (!raw) return { drsRaw: null, drsValue: null, isVariable: false }
  const trimmed = raw.trim()
  const isVariable = /variable/i.test(trimmed) || /^V-/i.test(trimmed) || trimmed === '—' /* em dash */
  const m = trimmed.match(/(\d+(?:\.\d+)?)/)
  return { drsRaw: trimmed === '—' ? null : trimmed, drsValue: m ? Number(m[1]) : null, isVariable }
}

// --- variations list extraction ------------------------------------------
// A bullet list only counts as "Variations" if a "Variations:" label
// immediately precedes it, or most of its items look like `TAG — text` /
// `**TAG** — text`. Other bullet lists (e.g. Shoulder Shrug's plain
// explanatory list) are left in place as ordinary prose.

const VARIATION_ITEM_RE = /^-\s*\*{0,2}([A-Za-z]{1,4}[0-9]{0,2}[+\-]?)\*{0,2}\s*[—:-]\s*(.+)$/

function extractVariations(text) {
  const lines = text.split(/\r?\n/)
  const remainingLines = []
  const variations = []
  let i = 0
  while (i < lines.length) {
    const isLabel = /^Variations?:?\s*$/i.test(lines[i].trim())
    const listStart = isLabel ? i + 1 : i
    if (lines[listStart] && /^-\s+\S/.test(lines[listStart])) {
      const block = []
      let j = listStart
      while (j < lines.length && /^-\s+\S/.test(lines[j])) {
        block.push(lines[j])
        j++
      }
      const tagged = block.filter((l) => VARIATION_ITEM_RE.test(l))
      if (isLabel || tagged.length >= Math.ceil(block.length / 2)) {
        for (const item of block) {
          const m = item.match(VARIATION_ITEM_RE)
          if (m) variations.push({ tag: m[1], text: m[2].trim() })
          else variations.push({ tag: null, text: item.replace(/^-\s*/, '').trim() })
        }
        i = j
        continue
      }
    }
    remainingLines.push(lines[i])
    i++
  }
  return { descriptionMd: remainingLines.join('\n').trim(), variations }
}

// --- relation extraction (explicit mentions only) -------------------------

const RELATION_KEYWORDS = [
  ['conflicting', /conflicting/i],
  ['confirming', /confirming/i],
  ['amplifying', /amplif\w*/i],
]

function extractRelations(text, ownSymbol, validSymbols, warnings, entryLabel) {
  const relations = []
  const seen = new Set()

  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    for (const [type, kwRe] of RELATION_KEYWORDS) {
      if (!kwRe.test(sentence)) continue
      // The chapter glosses symbols both ways ("WD (Wing Dilation)" and
      // "Nostril Wing Dilation (WD)"), so just take every bare 1-4 letter
      // all-caps token in the sentence and keep the ones that are real BTE
      // symbols — position relative to parens/keyword isn't reliable.
      const candidates = [...sentence.matchAll(/\b[A-Z]{1,4}\b/g)]
        .map((m) => m[0])
        .filter((sym) => sym !== ownSymbol && validSymbols.has(sym))
      if (candidates.length === 0) {
        warnings.push(`${entryLabel}: found "${type}" keyword but no symbol resolved — "${sentence.trim().slice(0, 120)}"`)
        continue
      }
      for (const sym of candidates) {
        const key = `${type}:${sym}`
        if (seen.has(key)) continue
        seen.add(key)
        relations.push({ type, symbol: sym })
      }
    }
  }
  return relations
}

// --- red/blue letter extraction (explicit mentions only) ------------------

function extractLetterFlags(text) {
  return {
    redLetter: /red (?:lettering|letters?|color code)/i.test(text),
    blueLetter: /\b(temperature|colder|warmer)\b/i.test(text),
  }
}

// --- color band classification --------------------------------------------
// Grounded in the chapter's own "Reading the Colors" legend: grey is stated
// verbatim as "rated 4.0"; blue is stated verbatim as "variable cells";
// turquoise is stated verbatim as "facial expressions and microexpressions".
// The green/tan/yellow split within the remaining 1.0-3.5 range is this
// script's approximation of relative stress tier, not a pixel match against
// Figure 26.1 (no per-cell coordinates exist in the source text at all).
// Override individual cells here if a specific one looks wrong once rendered.
const COLOR_OVERRIDES = {}

function classifyColorBand(entry) {
  if (COLOR_OVERRIDES[entry.id]) return COLOR_OVERRIDES[entry.id]
  if (BASIC_EMOTION_SYMBOLS.has(entry.symbol)) return 'turquoise'
  if (entry.isVariable || entry.gestureType === 'Variable') return 'blue'
  if (entry.drsValue === 4.0) return 'grey'
  if (entry.drsRaw === 'DNL' || entry.drsValue == null || entry.drsValue <= 1.5) return 'green'
  if (entry.drsValue <= 2.5) return 'tan'
  return 'yellow'
}

// --- entry parsing ----------------------------------------------------------

function parseSummaryLine(text) {
  const m = text.match(/^\s*\*([^*]+)\*\s*(?:\n|$)/)
  if (!m) return { rest: text, fields: {} }
  const fields = {}
  for (const segment of m[1].split('·')) {
    const colon = segment.indexOf(':')
    if (colon === -1) continue
    fields[segment.slice(0, colon).trim()] = segment.slice(colon + 1).trim()
  }
  return { rest: text.slice(m[0].length), fields }
}

function parseEntries(body, headings) {
  let currentCategory = null
  const entries = []

  for (let i = 0; i < headings.length; i++) {
    const h = headings[i]
    const headingText = body
      .slice(h.startOffset, h.endOffset)
      .replace(/^#+\s*/, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (h.level === 'h2') {
      currentCategory = headingText
      continue
    }
    if (!CATEGORIES.includes(currentCategory)) continue // intro / change-log H3s

    const nameSymbol = headingText.match(/^(.*)\s+—\s+(\S+)$/)
    if (!nameSymbol) {
      console.warn(`generate-bte-data: could not split name/symbol from heading "${headingText}"`)
      continue
    }
    const name = nameSymbol[1].trim()
    const symbol = nameSymbol[2].trim().toUpperCase()

    const next = headings[i + 1]
    const sectionText = body.slice(h.endOffset, next ? next.startOffset : body.length).trim()
    const { rest, fields } = parseSummaryLine(sectionText)
    const { descriptionMd, variations } = extractVariations(rest)
    const { drsRaw, drsValue, isVariable } = parseDrs(fields['Deception Rating'])

    entries.push({
      id: h.id || `${currentCategory}-${symbol}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      symbol,
      name,
      category: currentCategory,
      gestureType: fields['Gesture Type'] || null,
      bodyRegion: fields['Body Region'] || null,
      drsRaw,
      drsValue,
      isVariable,
      timeframeRaw: fields['Timeframe'] || null,
      descriptionMd,
      variations,
    })
  }
  return entries
}

// --- main -------------------------------------------------------------------

function main() {
  const raw = readFileSync(CHAPTER_PATH, 'utf8')
  const { body: rawBody } = parseFrontmatter(raw)
  const body = stripLeadingH1(stripHtmlComments(normalizeFencedDivs(rawBody)))

  const headings = collectHeadings(body)
  const quickRef = parseQuickRefTables(body, headings)
  const entries = parseEntries(body, headings)

  const validSymbols = new Set(entries.map((e) => e.symbol))
  const warnings = []

  // Backfill fields the per-entry italic summary line omits (Blink Rate and
  // Breathing Rate give only "*Body Region: X*" — their Gesture Type/DRS only
  // exist in the Quick-Reference table) before classifying color bands.
  const quickRefByKey = new Map(quickRef.map((r) => [`${r.category}::${r.symbol}`, r]))
  for (const entry of entries) {
    const row = quickRefByKey.get(`${entry.category}::${entry.symbol}`)
    if (!row) continue
    if (entry.gestureType == null && row.gestureType !== '—') entry.gestureType = row.gestureType
    if (entry.drsRaw == null && row.drsRaw !== '—') {
      const parsed = parseDrs(row.drsRaw)
      entry.drsRaw = parsed.drsRaw
      entry.drsValue = parsed.drsValue
      entry.isVariable = parsed.isVariable
    }
  }

  for (const entry of entries) {
    const fullText = [entry.descriptionMd, ...entry.variations.map((v) => v.text)].join(' ')
    entry.relations = extractRelations(entry.descriptionMd, entry.symbol, validSymbols, warnings, `${entry.symbol} (${entry.name})`)
    const flags = extractLetterFlags(fullText)
    entry.redLetter = flags.redLetter
    entry.blueLetter = flags.blueLetter
    entry.colorBand = classifyColorBand(entry)
  }

  // Cross-check against the Quick-Reference Index tables.
  const byKey = new Map(entries.map((e) => [`${e.category}::${e.symbol}`, e]))
  for (const row of quickRef) {
    const key = `${row.category}::${row.symbol}`
    if (!byKey.has(key)) {
      warnings.push(`Quick-Reference row with no matching prose entry: ${row.symbol} — ${row.name} (${row.category})`)
      continue
    }
    const entry = byKey.get(key)
    const bothUnrated = row.drsRaw === '—' && entry.drsValue == null
    const tableDrs = parseDrs(row.drsRaw)
    if (!bothUnrated && (tableDrs.drsValue !== entry.drsValue || tableDrs.isVariable !== entry.isVariable)) {
      warnings.push(`DRS mismatch for ${entry.symbol}: table says "${row.drsRaw}", prose says "${entry.drsRaw}"`)
    }
  }
  const qrKeys = new Set(quickRef.map((r) => `${r.category}::${r.symbol}`))
  for (const entry of entries) {
    if (!qrKeys.has(`${entry.category}::${entry.symbol}`)) {
      warnings.push(`Prose entry with no matching Quick-Reference row: ${entry.symbol} — ${entry.name} (${entry.category})`)
    }
  }

  const dupIds = entries.map((e) => e.id).filter((id, i, arr) => arr.indexOf(id) !== i)
  if (dupIds.length) warnings.push(`Duplicate ids (should be impossible — rehype-slug dedupes): ${dupIds.join(', ')}`)

  const output = { categories: CATEGORIES, entries }

  mkdirSync(dirname(OUT_PATH), { recursive: true })
  writeFileSync(OUT_PATH, JSON.stringify(output, null, 2))

  console.log(`generate-bte-data: ${entries.length} entries -> ${OUT_PATH}`)
  const relationCount = entries.reduce((n, e) => n + e.relations.length, 0)
  const redCount = entries.filter((e) => e.redLetter).length
  const blueCount = entries.filter((e) => e.blueLetter).length
  console.log(`generate-bte-data: ${relationCount} relations, ${redCount} red-lettered, ${blueCount} blue-lettered`)
  if (warnings.length) {
    console.warn(`generate-bte-data: ${warnings.length} warnings:`)
    for (const w of warnings) console.warn(`  - ${w}`)
  }
}

main()
