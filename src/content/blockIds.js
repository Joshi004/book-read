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

// A paragraph whose sole content is an image renders as a bare <figure> (the
// wrapping <p> is unwrapped by markdown.jsx). The highlightable unit is the
// image itself, so the id goes on the image node, not the throwaway paragraph.
function isImageParagraph(node) {
  return (
    node.type === 'paragraph' &&
    Array.isArray(node.children) &&
    node.children.length === 1 &&
    node.children[0].type === 'image'
  )
}

// Fenced ```mermaid blocks render as a live <figure> diagram. Id the code node
// so the whole diagram is a highlightable unit.
function isMermaidCode(node) {
  return node.type === 'code' && node.lang === 'mermaid'
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

    // Media/code blocks carry no meaningful text, so hash their defining
    // attributes (url/alt, code source) instead — keeps ids stable and unique.
    // Text blocks keep the exact mdastToString hashing they always had, so
    // their ids don't shift when this plugin gains new node types.
    function textForHash(node) {
      if (node.type === 'image') return `image::${node.url || ''}::${node.alt || ''}`
      if (node.type === 'code') return `code::${node.lang || ''}::${node.value || ''}`
      return mdastToString(node).trim().replace(/\s+/g, ' ')
    }

    function assignId(node) {
      const text = textForHash(node)
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
        // Media/diagram blocks are always highlightable units regardless of
        // any suppressing wrapper (they carry no text a wrapper id would cover).
        if (isImageParagraph(child)) {
          assignId(child.children[0]) // the image node itself
          continue
        }
        if (isMermaidCode(child)) {
          assignId(child)
          continue
        }
        if (child.type === 'table') {
          assignId(child) // whole-table highlight unit…
          process(child, false) // …while cells still get their own ids
          continue
        }
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
