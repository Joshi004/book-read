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

// --- grid position (the "real" printed layout) -----------------------------
// Row letters A-G run top to bottom for body region (per Chapter 25's own
// account of the axes); Object Interaction and Direct Verbal Behavior are
// unlettered single rows below the main grid. Columns 1-18 run left to right
// for stress/deception likelihood, mirroring the real printed table (see
// public/assets/diagrams/The-Behavioral-Table-of-Elements-2018.pdf) --
// hand-extracted from that PDF's embedded text coordinates, cross-checked
// against every symbol's category with zero collisions, since no per-cell
// grid position exists in the chapter 26 prose itself. Keyed by symbol; BC
// (Barrier Cr. vs Carelessness) collides on symbol alone so it's keyed by
// `SYMBOL::category` instead.
const GRID_POSITION_BY_SYMBOL = {
  4: { row: 'F', col: 2 },
  AA: { row: 'C', col: 18 },
  ACC: { row: 'A', col: 2 },
  AG: { row: 'D', col: 14 },
  AGG: { row: 'G', col: 3 },
  AH: { row: 'E', col: 11 },
  AM: { row: 'DV', col: 13 },
  BAR: { row: 'F', col: 14 },
  BB: { row: 'E', col: 13 },
  'BC::Torso, Pelvis & Legs': { row: 'F', col: 15 },
  'BC::Object Interaction': { row: 'OI', col: 7 },
  BG: { row: 'D', col: 2 },
  BH: { row: 'E', col: 10 },
  BI: { row: 'G', col: 9 },
  BN: { row: 'C', col: 16 },
  BON: { row: 'F', col: 11 },
  BR: { row: 'D', col: 6 },
  BRE: { row: 'G', col: 4 },
  BS: { row: 'OI', col: 14 },
  CA: { row: 'OI', col: 12 },
  CC: { row: 'OI', col: 10 },
  CG: { row: 'B', col: 18 },
  CHR: { row: 'DV', col: 18 },
  CL: { row: 'OI', col: 18 },
  CO: { row: 'D', col: 13 },
  CR: { row: 'E', col: 14 },
  CS: { row: 'E', col: 3 },
  CT: { row: 'A', col: 18 },
  DC: { row: 'F', col: 7 },
  DE: { row: 'E', col: 1 },
  DF: { row: 'G', col: 8 },
  DG: { row: 'D', col: 11 },
  EC: { row: 'D', col: 17 },
  EF: { row: 'B', col: 1 },
  EO: { row: 'E', col: 5 },
  ER: { row: 'G', col: 15 },
  EXC: { row: 'DV', col: 17 },
  FC: { row: 'G', col: 5 },
  FF: { row: 'F', col: 4 },
  FI: { row: 'F', col: 9 },
  FL: { row: 'C', col: 12 },
  FNS: { row: 'G', col: 18 },
  FR: { row: 'D', col: 12 },
  FT: { row: 'E', col: 17 },
  FTB: { row: 'OI', col: 15 },
  FW: { row: 'G', col: 17 },
  FZ: { row: 'E', col: 16 },
  GA: { row: 'A', col: 17 },
  GE: { row: 'G', col: 1 },
  GG: { row: 'D', col: 1 },
  GM: { row: 'G', col: 11 },
  GPR: { row: 'F', col: 17 },
  GRS: { row: 'F', col: 10 },
  GS: { row: 'OI', col: 13 },
  HA: { row: 'C', col: 2 },
  HB: { row: 'C', col: 13 },
  HD: { row: 'B', col: 2 },
  HES: { row: 'DV', col: 4 },
  HS: { row: 'D', col: 4 },
  HT: { row: 'A', col: 1 },
  HU: { row: 'F', col: 18 },
  IA: { row: 'F', col: 1 },
  IP: { row: 'G', col: 14 },
  JB: { row: 'OI', col: 9 },
  JC: { row: 'B', col: 16 },
  JP: { row: 'OI', col: 17 },
  KC: { row: 'G', col: 16 },
  KH: { row: 'G', col: 7 },
  LA: { row: 'G', col: 10 },
  LC: { row: 'B', col: 12 },
  LF: { row: 'E', col: 8 },
  LG: { row: 'G', col: 2 },
  LP: { row: 'F', col: 12 },
  LR: { row: 'C', col: 14 },
  MC: { row: 'DV', col: 16 },
  NA: { row: 'DV', col: 8 },
  NC: { row: 'DV', col: 11 },
  NO: { row: 'E', col: 7 },
  OA: { row: 'DV', col: 15 },
  OB: { row: 'OI', col: 11 },
  OC: { row: 'OI', col: 16 },
  OI: { row: 'OI', col: 5 },
  OM: { row: 'B', col: 15 },
  OPI: { row: 'OI', col: 4 },
  OT: { row: 'C', col: 15 },
  PC: { row: 'E', col: 4 },
  PD: { row: 'D', col: 7 },
  PDN: { row: 'F', col: 16 },
  PE: { row: 'E', col: 2 },
  PO: { row: 'F', col: 5 },
  POL: { row: 'DV', col: 14 },
  PR: { row: 'D', col: 15 },
  PRN: { row: 'DV', col: 9 },
  PS: { row: 'E', col: 6 },
  PSD: { row: 'DV', col: 5 },
  PT: { row: 'G', col: 6 },
  QR: { row: 'DV', col: 12 },
  RES: { row: 'DV', col: 10 },
  RIP: { row: 'DV', col: 6 },
  SA: { row: 'D', col: 10 },
  SH: { row: 'D', col: 9 },
  SHG: { row: 'E', col: 12 },
  SP: { row: 'D', col: 5 },
  SPD: { row: 'DV', col: 7 },
  SQ: { row: 'D', col: 8 },
  SR: { row: 'OI', col: 6 },
  SS: { row: 'D', col: 18 },
  ST: { row: 'E', col: 9 },
  SW: { row: 'D', col: 16 },
  TCH: { row: 'F', col: 6 },
  THC: { row: 'G', col: 12 },
  TLT: { row: 'F', col: 3 },
  TP: { row: 'F', col: 8 },
  TS: { row: 'B', col: 13 },
  TTC: { row: 'E', col: 18 },
  TU: { row: 'B', col: 14 },
  VH: { row: 'C', col: 17 },
  WC: { row: 'OI', col: 8 },
  WD: { row: 'B', col: 17 },
  WF: { row: 'F', col: 13 },
  WP: { row: 'E', col: 15 },
  WT: { row: 'G', col: 13 },
  YE: { row: 'D', col: 3 },
  YN: { row: 'C', col: 1 },
}

function gridPositionFor(entry) {
  return GRID_POSITION_BY_SYMBOL[`${entry.symbol}::${entry.category}`] || GRID_POSITION_BY_SYMBOL[entry.symbol] || null
}

// Row order top to bottom, as printed on the real table -- letter is null for
// the two unlettered category rows below the main A-G body-region grid.
const GRID_ROWS = [
  { key: 'A', letter: 'A', category: 'Arm Cross, Head, Face & Neck' },
  { key: 'B', letter: 'B', category: 'Arm Cross, Head, Face & Neck' },
  { key: 'C', letter: 'C', category: 'Arm Cross, Head, Face & Neck' },
  { key: 'D', letter: 'D', category: 'Arms, Hands & Shoulders' },
  { key: 'E', letter: 'E', category: 'Arms, Hands & Shoulders' },
  { key: 'F', letter: 'F', category: 'Torso, Pelvis & Legs' },
  { key: 'G', letter: 'G', category: 'Torso, Pelvis & Legs' },
  { key: 'OI', letter: null, category: 'Object Interaction' },
  { key: 'DV', letter: null, category: 'Direct Verbal Behavior' },
]
const GRID_COLUMNS = 18

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
    const gridPosition = gridPositionFor(entry)
    if (gridPosition) {
      entry.row = gridPosition.row
      entry.col = gridPosition.col
    } else {
      entry.row = null
      entry.col = null
      warnings.push(`No grid position for ${entry.symbol} (${entry.name}) — omitted from the classic table view`)
    }
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

  const output = { categories: CATEGORIES, entries, gridRows: GRID_ROWS, gridColumns: GRID_COLUMNS }

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
