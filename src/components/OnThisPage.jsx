import { useEffect, useState } from 'react'
import { Box, List, ListItemButton, ListItemText, Typography } from '@mui/material'
import { SANS } from '../theme.js'

// In-chapter "On this page" nav. Uses scrollIntoView (not href="#id") so it never
// collides with HashRouter, and an IntersectionObserver to highlight the section
// currently in view.
export default function OnThisPage({ headings }) {
  const [active, setActive] = useState(null)

  useEffect(() => {
    if (!headings?.length) return undefined
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean)
    if (!els.length) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-84px 0px -70% 0px', threshold: 0 }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [headings])

  if (!headings?.length) return null

  const jump = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActive(id)
    }
  }

  return (
    <Box
      component="nav"
      aria-label="On this page"
      sx={{ position: 'sticky', top: 88 }}
    >
      <Typography
        sx={{
          fontFamily: SANS,
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'text.secondary',
          mb: 1,
          pl: 1.5,
        }}
      >
        On this page
      </Typography>
      <List dense disablePadding>
        {headings.map((h) => (
          <ListItemButton
            key={h.id}
            onClick={() => jump(h.id)}
            selected={active === h.id}
            sx={{
              borderLeft: '2px solid',
              borderColor: active === h.id ? 'primary.main' : 'divider',
              py: 0.25,
              pl: h.level === 3 ? 3 : 1.5,
            }}
          >
            <ListItemText
              primary={h.text}
              primaryTypographyProps={{
                fontFamily: SANS,
                fontSize: '0.8rem',
                color: active === h.id ? 'primary.main' : 'text.secondary',
                fontWeight: active === h.id ? 600 : 400,
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
}
