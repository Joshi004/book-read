// Node-safe markdown pipeline pieces shared between the browser renderer
// (src/content/markdown.jsx) and the build-time search-index generator
// (scripts/generate-search-index.mjs). No React import here — both a plain
// Node ESM script and the Vite/browser bundle must be able to import this.

export const CALLOUT_NAMES = new Set(['callout', 'definition', 'warning'])

// remark-directive needs the directive name to touch the colons (`:::callout`),
// but the authored/pandoc style uses a space (`::: callout`). Normalize a copy of
// the body so the chapter source can stay in the format the skill emits.
export function normalizeFencedDivs(body) {
  return String(body).replace(/^(:{3,})[ \t]+([A-Za-z][\w-]*)[ \t]*$/gm, '$1$2')
}

// Strip HTML comments before the markdown reaches the renderer.
// react-markdown has no rehype-raw, so <!-- ... --> leaks through as visible text
// instead of being silently discarded. This covers multi-line comment blocks used
// for editor-only content (change logs, citation flags, ASR notes).
export function stripHtmlComments(body) {
  return String(body).replace(/<!--[\s\S]*?-->/g, '')
}

// The leading `# Chapter NN — Title` is replaced by the styled opener (mirrors
// build.py, which dropped the first H1). Shared with the search-index
// generator so indexed block ids match what's actually rendered.
export function stripLeadingH1(body) {
  return String(body).replace(/^\s*#\s+.*(?:\r?\n)+/, '')
}

// Map our container directives (:::callout / :::definition / :::warning) onto
// custom elements that the `components` table renders as <Callout>.
export function remarkCalloutDirectives() {
  const visit = (node) => {
    if (node.type === 'containerDirective' && CALLOUT_NAMES.has(node.name)) {
      const data = node.data || (node.data = {})
      data.hName = node.name
    }
    if (Array.isArray(node.children)) node.children.forEach(visit)
  }
  return (tree) => visit(tree)
}
