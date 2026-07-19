import { styled } from '@mui/material/styles'
import { SERIF, SANS } from '../theme.js'

// The chapter reading column. Ports every non-print rule from the original
// build/template/book.css, scoped to this container and wired to theme tokens so
// it follows light/dark mode. Print-only rules (@page, running heads, page
// breaks, 6×9 trim) are intentionally dropped.
const BookProse = styled('div')(({ theme }) => {
  const b = theme.palette.book
  const dark = theme.palette.mode === 'dark'
  const dropCap = {
    fontFamily: SERIF,
    fontSize: '3.1em',
    lineHeight: 0.82,
    fontWeight: 700,
    float: 'left',
    padding: '0.02em 0.12em 0 0',
    color: b.accent,
  }

  return {
    fontFamily: SERIF,
    color: b.ink,
    lineHeight: 'var(--bops-line-height, 1.6)',
    fontSize: 'var(--bops-font-size, 1.0625rem)',
    textAlign: 'justify',
    hyphens: 'auto',
    [theme.breakpoints.down('sm')]: { textAlign: 'left', hyphens: 'manual' },

    '& p': { margin: '0 0 0.9em' },
    '& strong': { fontWeight: 700 },
    '& em': { fontStyle: 'italic' },
    '& a': {
      color: b.accent,
      textDecoration: 'none',
      '&:hover': { textDecoration: 'underline' },
    },
    '& code': {
      fontFamily: '"SF Mono", "Menlo", monospace',
      fontSize: '0.88em',
      background: dark ? 'rgba(255,255,255,0.08)' : '#F2EFE8',
      padding: '0.05em 0.3em',
      borderRadius: 3,
    },

    // --- Headings ---
    '& h2, & h3, & h4': {
      fontFamily: SANS,
      textAlign: 'left',
      scrollMarginTop: '84px', // clear the sticky AppBar on anchored jumps
    },
    '& [data-block-id]': {
      scrollMarginTop: '84px', // same, for search-result jumps to a specific block
    },

    // --- Temporary highlight after landing on a search result ---
    '& mark.search-hit-highlight': {
      background: b.accent,
      color: '#fff',
      padding: '0.05em 0.15em',
      borderRadius: 2,
    },

    // --- Persistent reader highlights (a warm highlighter wash, distinct from
    // the solid-accent search flash above). Text keeps its ink color so it
    // reads like a marker over the prose. Clickable to open its note popover. ---
    '& mark.reader-highlight': {
      background: dark ? 'rgba(255,209,102,0.26)' : 'rgba(255,213,79,0.45)',
      color: 'inherit',
      borderRadius: 2,
      cursor: 'pointer',
      transition: 'background 120ms ease',
      '&:hover': { background: dark ? 'rgba(255,209,102,0.38)' : 'rgba(255,213,79,0.62)' },
    },
    // A highlight that has a note: dotted accent underline signals "more here".
    '& mark.reader-highlight--noted': {
      borderBottom: `2px dotted ${b.accent}`,
    },
    // One small marker at the end of a noted highlight.
    '& mark.reader-highlight--note-end::after': {
      content: '"\\1F5D2\\FE0E"', // 🗒 (text presentation) — a little note glyph
      fontFamily: SANS,
      fontSize: '0.62em',
      verticalAlign: 'super',
      marginLeft: '0.15em',
      color: b.accent,
      cursor: 'pointer',
    },
    // Briefly emphasize a highlight arrived at via a Highlights-page deep link.
    '& mark.reader-highlight.reader-highlight--flash': {
      animation: 'bopsHighlightFlash 1.6s ease',
    },
    '@keyframes bopsHighlightFlash': {
      '0%, 100%': { background: dark ? 'rgba(255,209,102,0.26)' : 'rgba(255,213,79,0.45)' },
      '25%, 60%': { background: dark ? 'rgba(255,209,102,0.7)' : 'rgba(255,199,0,0.85)' },
    },

    // --- Element highlights: a whole diagram / image / table marked as one
    // unit. An accent frame + soft tint, without touching the media itself. ---
    '& figure.figure-diagram.reader-highlight-element, & table.reader-highlight-element': {
      outline: `2px solid ${b.accent}`,
      outlineOffset: '3px',
      borderRadius: 4,
      background: b.accentSoft,
      cursor: 'pointer',
    },
    '& h2': {
      fontSize: '1.4rem',
      fontWeight: 700,
      color: b.accent,
      margin: '1.9em 0 0.5em',
      paddingBottom: '0.25em',
      borderBottom: `1px solid ${b.rule}`,
    },
    '& h3': {
      fontSize: '1.15rem',
      fontWeight: 700,
      color: b.ink,
      margin: '1.5em 0 0.4em',
    },

    // --- Horizontal rules become ornamental dividers ---
    '& hr': {
      border: 'none',
      textAlign: 'center',
      margin: '1.9em 0',
      '&::after': { content: '"\\2766"', color: b.rule, fontSize: '1.3rem' },
    },

    // --- Generic blockquotes (in-body pull quotes) ---
    '& blockquote': {
      margin: '1.2em 0',
      padding: '0.2em 0 0.2em 1em',
      borderLeft: `3px solid ${b.accent}`,
      fontStyle: 'italic',
      color: b.muted,
    },

    // --- Epigraph: the opening pull-quote (first blockquote in the body) ---
    '& > blockquote:first-of-type': {
      border: 'none',
      margin: '0 auto 1.6em',
      padding: 0,
      maxWidth: '34rem',
      fontStyle: 'italic',
      fontSize: '1.3rem',
      lineHeight: 1.45,
      color: b.accent,
      textAlign: 'center',
      '& p': { margin: 0 },
    },
    // Drop cap on the lead paragraph right after the epigraph.
    '& > blockquote:first-of-type + p::first-letter': dropCap,

    // --- Tables ---
    '& table': {
      borderCollapse: 'collapse',
      width: '100%',
      margin: '1.5em 0',
      fontSize: '0.95rem',
    },
    '& thead th': {
      background: b.accent,
      color: '#fff',
      textAlign: 'left',
      fontFamily: SANS,
      fontWeight: 600,
      padding: '0.55em 0.75em',
      fontSize: '0.9rem',
    },
    '& tbody td': {
      padding: '0.5em 0.75em',
      borderBottom: `1px solid ${b.rule}`,
      verticalAlign: 'top',
      textAlign: 'left',
    },
    '& tbody tr:nth-of-type(even)': {
      background: dark ? 'rgba(255,255,255,0.03)' : '#FAF8F3',
    },

    // --- Figures & captions ---
    '& figure': { margin: '1.8em 0', textAlign: 'center' },
    '& figure img, & figure svg': { maxWidth: '100%', height: 'auto' },
    '& figure.figure-diagram img': { maxWidth: '90%' },
    '& figcaption': {
      fontFamily: SANS,
      fontSize: '0.8rem',
      color: b.muted,
      fontStyle: 'italic',
      marginTop: '0.6em',
      textAlign: 'center',
    },
    // Italic caption paragraph immediately after a figure (e.g. "*Figure 3.2 …*").
    '& figure + p': {
      textAlign: 'center',
      fontSize: '0.8rem',
      color: b.muted,
      marginTop: '-0.9em',
      fontFamily: SANS,
    },

    // --- Lists ---
    '& ul, & ol': { margin: '0.7em 0 1em', paddingLeft: '1.4em' },
    '& li': { margin: '0.4em 0' },
    '& ul li::marker': { color: b.accent },
    '& ol li::marker': { color: b.accent, fontWeight: 700 },

    // --- "Key Takeaways" heading + list get a tinted panel ---
    '& h2#key-takeaways + ul': {
      background: b.paper,
      border: `1px solid ${b.rule}`,
      borderRadius: 6,
      padding: '1em 1.2em 1em 2.4em',
    },
  }
})

export default BookProse
