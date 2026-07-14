// Shared remark plugin: assigns a stable `data-block-id` to every block-level
// node (paragraph, list item, blockquote, table cell, callout body), in
// document order. Used identically by the browser renderer
// (src/content/markdown.jsx, via react-markdown's remarkPlugins) and the
// build-time search-index generator (scripts/generate-search-index.mjs, via a
// standalone `unified` pipeline) — because both run the SAME code over the
// SAME parsed tree, block ids always agree between the search index and the
// rendered DOM.
//
// Ids are content hashes (not positional) so they stay stable when earlier
// content in a chapter is edited later — a shared/bookmarked search link keeps
// pointing at the right paragraph across future edits to that chapter.

import { toString as mdastToString } from 'mdast-util-to-string'
import { CALLOUT_NAMES } from './markdownPipeline.js'

function fnv1aHex(str) {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function isLeafBlock(node) {
  return node.type === 'paragraph' || node.type === 'tableCell'
}

function isWrapperBlock(node) {
  return (
    node.type === 'blockquote' ||
    node.type === 'listItem' ||
    (node.type === 'containerDirective' && CALLOUT_NAMES.has(node.name))
  )
}

// A wrapper whose only content is a single paragraph shouldn't get its own id
// distinct from that paragraph's — it would just duplicate the same text
// under two ids. Let the inner paragraph carry the id instead.
function wrapsSingleParagraph(node) {
  return Array.isArray(node.children) && node.children.length === 1 && node.children[0].type === 'paragraph'
}

export function blockIdPlugin() {
  return (tree) => {
    const used = new Set()

    function assignId(node) {
      const text = mdastToString(node).trim().replace(/\s+/g, ' ')
      const base = 'b' + fnv1aHex(text)
      let id = base
      let n = 2
      while (used.has(id)) {
        id = `${base}-${n}`
        n++
      }
      used.add(id)
      node.data = node.data || {}
      node.data.hProperties = { ...(node.data.hProperties || {}), 'data-block-id': id }
    }

    // `suppressLeaf`: true when an ancestor wrapper (blockquote/listItem/
    // callout) just got its own id covering all of its direct text — its
    // direct paragraph/tableCell children shouldn't also get separate,
    // overlapping ids. Deeper nested blocks (e.g. a sublist inside a list
    // item) are unaffected — they get fresh treatment when visited.
    function process(node, suppressLeaf) {
      const children = node.children
      if (!Array.isArray(children)) return
      for (const child of children) {
        if (isLeafBlock(child)) {
          if (!suppressLeaf) assignId(child)
          continue
        }
        if (isWrapperBlock(child)) {
          if (wrapsSingleParagraph(child)) {
            process(child, false)
          } else {
            assignId(child)
            process(child, true)
          }
          continue
        }
        process(child, false)
      }
    }

    process(tree, false)
  }
}
