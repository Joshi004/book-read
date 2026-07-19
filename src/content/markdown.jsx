import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import rehypeSlug from 'rehype-slug'
import Callout from '../components/Callout.jsx'
import Mermaid from '../components/Mermaid.jsx'
import { normalizeFencedDivs, stripHtmlComments, remarkCalloutDirectives } from './markdownPipeline.js'
import { blockIdPlugin } from './blockIds.js'

function resolveAsset(src = '') {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) return src
  const i = src.indexOf('assets/')
  const rel = i >= 0 ? src.slice(i) : src.replace(/^\.?\/*/, '')
  return import.meta.env.BASE_URL + rel
}

function mermaidFromPre(node) {
  const code = node?.children?.[0]
  if (!code || code.tagName !== 'code') return null
  const cls = code.properties?.className || []
  if (!(Array.isArray(cls) ? cls : [cls]).includes('language-mermaid')) return null
  return code.children?.map((c) => c.value || '').join('') || ''
}

const components = {
  // Render :::callout / :::definition / :::warning as styled boxes.
  callout: ({ node, ...props }) => <Callout variant="callout" {...props} />,
  definition: ({ node, ...props }) => <Callout variant="definition" {...props} />,
  warning: ({ node, ...props }) => <Callout variant="warning" {...props} />,

  // Fenced ```mermaid blocks → live client-side diagram. The block id (for
  // reader highlights) is assigned by blockIdPlugin onto the inner <code> node.
  pre: ({ node, children, ...props }) => {
    const chart = mermaidFromPre(node)
    if (chart != null) {
      const blockId = node?.children?.[0]?.properties?.['data-block-id']
      return <Mermaid chart={chart} blockId={blockId} />
    }
    return <pre {...props}>{children}</pre>
  },

  // Lone images become <figure> with the alt text as the caption. Unwrap the
  // paragraph react-markdown would otherwise wrap a solitary image in.
  p: ({ node, children, ...props }) => {
    const kids = node?.children || []
    if (kids.length === 1 && kids[0].tagName === 'img') return <>{children}</>
    return <p {...props}>{children}</p>
  },
  img: ({ node, src, alt, ...props }) => {
    // Carry the block id onto the <figure> so a whole diagram is one
    // highlightable unit (blockIdPlugin puts it on the image node).
    const blockId = node?.properties?.['data-block-id']
    return (
      <figure className="figure-diagram" data-block-id={blockId}>
        <img src={resolveAsset(src)} alt={alt || ''} loading="lazy" {...props} />
        {alt ? <figcaption>{alt}</figcaption> : null}
      </figure>
    )
  },

  // Wide tables scroll horizontally instead of overflowing into the sidebar.
  table: ({ node, children, ...props }) => (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table {...props} data-block-id={node?.properties?.['data-block-id']}>{children}</table>
    </div>
  ),

  // External links open in a new tab; same-page hashes are avoided in nav (HashRouter).
  a: ({ node, href = '', children, ...props }) => {
    const external = /^https?:\/\//.test(href)
    return (
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...props}
      >
        {children}
      </a>
    )
  },
}

const remarkPlugins = [remarkGfm, remarkDirective, remarkCalloutDirectives, blockIdPlugin]
const rehypePlugins = [rehypeSlug]

export default function MarkdownContent({ body }) {
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={components}
    >
      {stripHtmlComments(normalizeFencedDivs(body))}
    </ReactMarkdown>
  )
}
