import { Box, Fade, Paper, Stack, Typography } from '@mui/material'
import { SANS, MONO } from '../../theme.js'

const RELATION_LABEL = {
  confirming: 'Confirms',
  amplifying: 'Amplifies',
  conflicting: 'Conflicts with',
}

// A hovered cell's related entries can be scrolled far off-screen — this
// fixed-position panel surfaces them as text regardless of where they sit in
// the grid, so the reader never has to spot a glow to know what it connects
// to. onMouseEnter/onMouseLeave let ElementsPage's hover-clear grace period
// keep this open while the pointer crosses from the grid into the panel.
export default function RelationshipPanel({ hoveredEntry, relations, onSelect, onMouseEnter, onMouseLeave }) {
  const open = Boolean(hoveredEntry && relations.length > 0)

  return (
    <Fade in={open} unmountOnExit>
      <Paper
        elevation={6}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 300,
          maxWidth: 'calc(100vw - 40px)',
          maxHeight: '46vh',
          overflowY: 'auto',
          p: 1.5,
          borderRadius: 2,
          zIndex: (theme) => theme.zIndex.modal - 1,
        }}
      >
        {hoveredEntry && (
          <>
            <Typography sx={{ fontFamily: SANS, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary', mb: 1 }}>
              Related to {hoveredEntry.symbol} — {hoveredEntry.name}
            </Typography>
            <Stack spacing={0.5}>
              {relations.map(({ type, entry }) => (
                <Box
                  key={entry.id}
                  component="button"
                  type="button"
                  onClick={(e) => onSelect(entry, e.currentTarget)}
                  sx={(theme) => ({
                    all: 'unset',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    p: 0.6,
                    borderRadius: 1,
                    '&:hover': { bgcolor: theme.palette.action.hover },
                    '&:focus-visible': { outline: `2px solid ${theme.palette.book.accent}` },
                  })}
                >
                  <Box
                    sx={(theme) => ({
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      flexShrink: 0,
                      bgcolor: theme.palette.book.relation[type],
                    })}
                  />
                  <Typography sx={{ fontFamily: SANS, fontSize: '0.72rem', color: 'text.secondary', flexShrink: 0 }}>
                    {RELATION_LABEL[type]}
                  </Typography>
                  <Typography sx={{ fontFamily: MONO, fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}>
                    {entry.symbol}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: SANS,
                      fontSize: '0.78rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.name}
                  </Typography>
                  <Box
                    sx={(theme) => ({
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      flexShrink: 0,
                      ml: 'auto',
                      bgcolor: theme.palette.book.bte[entry.colorBand],
                    })}
                  />
                </Box>
              ))}
            </Stack>
          </>
        )}
      </Paper>
    </Fade>
  )
}
