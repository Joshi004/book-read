import { styled } from '@mui/material/styles'

// Ports the .callout / .definition / .warning fenced-div boxes from book.css.
const Box = styled('div', {
  shouldForwardProp: (p) => p !== 'variant',
})(({ theme, variant }) => {
  const b = theme.palette.book
  const map = {
    callout: { bg: b.accentSoft, edge: b.accent, label: b.accent, ring: false },
    definition: { bg: b.definitionBg, edge: b.muted, label: b.ink, ring: true },
    warning: { bg: b.warnSoft, edge: b.warn, label: b.warn, ring: false },
  }
  const v = map[variant] || map.callout
  return {
    background: v.bg,
    borderLeft: `4px solid ${v.edge}`,
    ...(v.ring ? { border: `1px solid ${b.rule}`, borderLeft: `4px solid ${v.edge}` } : {}),
    borderRadius: 4,
    padding: '0.8em 1.05em',
    margin: '1.3em 0',
    lineHeight: 1.5,
    textAlign: 'left',
    '& > :last-child': { marginBottom: 0 },
    '& > :first-of-type': { marginTop: 0 },
    '& strong:first-child': { color: v.label },
  }
})

export default function Callout({ variant = 'callout', children, ...props }) {
  return (
    <Box variant={variant} {...props}>
      {children}
    </Box>
  )
}
