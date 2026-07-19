import { useEffect, useState } from 'react'
import mermaid from 'mermaid'
import { useTheme } from '@mui/material/styles'
import { Box } from '@mui/material'
import { SANS } from '../theme.js'

let counter = 0

// Renders a ```mermaid block live in the browser. Replaces the old build-time
// mmdc/headless-Chrome PNG pre-render. Re-renders when the color mode changes so
// diagrams follow light/dark theming. Theme variables port mermaid-config.json.
export default function Mermaid({ chart, blockId }) {
  const theme = useTheme()
  const b = theme.palette.book
  const [svg, setSvg] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const id = `mmd-${(counter += 1)}`
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose', // allow <br/> / htmlLabels in node labels
      theme: 'base',
      fontFamily: SANS,
      themeVariables: {
        fontFamily: SANS,
        fontSize: '15px',
        primaryColor: b.accentSoft,
        primaryTextColor: b.ink,
        primaryBorderColor: b.accent,
        lineColor: b.accent,
        secondaryColor: b.paper,
        tertiaryColor: b.surface,
        mainBkg: b.accentSoft,
        clusterBkg: b.paper,
        clusterBorder: b.rule,
        textColor: b.ink,
        actorBkg: b.accentSoft,
        actorBorder: b.accent,
        actorTextColor: b.ink,
        noteBkgColor: b.paper,
        noteBorderColor: b.rule,
        noteTextColor: b.ink,
      },
    })
    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (!cancelled) {
          setSvg(svg)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
    return () => {
      cancelled = true
    }
  }, [chart, theme.palette.mode]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <Box
        component="pre"
        data-block-id={blockId}
        sx={{
          overflow: 'auto',
          p: 1.5,
          borderRadius: 1,
          bgcolor: 'action.hover',
          fontSize: '0.8rem',
          color: 'text.secondary',
        }}
      >
        {chart}
      </Box>
    )
  }

  return (
    <Box
      component="figure"
      className="figure-diagram"
      data-block-id={blockId}
      sx={{ '& svg': { maxWidth: '100%', height: 'auto' } }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
