import { Box, Typography } from '@mui/material'
// Typography defaults to theme.palette.text.primary regardless of an
// ancestor's `color` — every label here must opt into inheriting the fill's
// validated on-color (see theme.js TOKENS.*.bteOnFill) via color="inherit".
import { SANS, MONO } from '../../theme.js'

// Touch devices can synthesize a "sticky hover" on first tap that never
// clears — the cross-highlight effect below is a desktop-only affordance
// (tap opens the detail popover directly on touch, see ElementsPage).
const CAN_HOVER =
  typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches

export default function ElementCell({ entry, dimmed, related, onHover, onSelect }) {
  const hoverHandlers = CAN_HOVER
    ? {
        onMouseEnter: () => onHover(entry.id),
        onMouseLeave: () => onHover(null),
      }
    : {}

  return (
    <Box
      component="button"
      type="button"
      onClick={(e) => onSelect(entry, e.currentTarget)}
      {...hoverHandlers}
      sx={(theme) => ({
        all: 'unset',
        cursor: 'pointer',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: 86,
        height: 72,
        p: 0.75,
        borderRadius: 1,
        bgcolor: theme.palette.book.bte[entry.colorBand],
        color: theme.palette.book.bteOnFill,
        opacity: dimmed ? 0.28 : 1,
        outline: related ? `2px solid ${theme.palette.book.ink}` : '2px solid transparent',
        outlineOffset: 1,
        transition: 'opacity 120ms ease, outline-color 120ms ease, transform 80ms ease',
        '&:hover': CAN_HOVER ? { transform: 'scale(1.04)' } : undefined,
        '&:focus-visible': { outline: `2px solid ${theme.palette.book.accent}` },
      })}
      aria-label={`${entry.name} (${entry.symbol})`}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography color="inherit" sx={{ fontFamily: SANS, fontWeight: 700, fontSize: '1.05rem', lineHeight: 1 }}>
          {entry.symbol}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.4, mt: 0.15 }}>
          {entry.redLetter && (
            <Box
              sx={(theme) => ({
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: theme.palette.book.warn,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.25)',
              })}
              title="Red-lettered: paired with another 4.0 behavior, this becomes a 4.0 too"
            />
          )}
          {entry.blueLetter && (
            <Box
              sx={(theme) => ({
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: theme.palette.book.accent,
                boxShadow: '0 0 0 1px rgba(0,0,0,0.25)',
              })}
              title="Blue-lettered: temperature increases how often this shows up"
            />
          )}
        </Box>
      </Box>
      <Typography
        color="inherit"
        sx={{
          fontFamily: SANS,
          fontSize: '0.62rem',
          lineHeight: 1.15,
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {entry.name}
      </Typography>
      <Typography color="inherit" sx={{ fontFamily: MONO, fontSize: '0.6rem', fontWeight: 700, alignSelf: 'flex-end', opacity: 0.85 }}>
        {entry.drsRaw ?? '—'}
      </Typography>
    </Box>
  )
}
