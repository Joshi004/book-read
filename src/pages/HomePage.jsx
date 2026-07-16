import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  Stack,
  Divider,
} from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { chapters } from '../content/chapters.js'
import { SERIF, SANS, MONO } from '../theme.js'

// Corner-bracket "framed document" mark — evokes a stamped field-manual cover
// rather than a generic hero. Four L-shaped ticks at the corners of the hero.
const BRACKET = 18
function bracketSx(pos) {
  const edge = { borderColor: 'primary.main', borderStyle: 'solid', borderWidth: 0 }
  const base = { position: 'absolute', width: BRACKET, height: BRACKET, ...edge }
  const byPos = {
    tl: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
    tr: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
    bl: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
    br: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  }
  return { ...base, ...byPos[pos] }
}

export default function HomePage() {
  const author = chapters[0]?.author || 'Charles Huge'
  const first = chapters[0]?.number
  const last = chapters[chapters.length - 1]?.number

  return (
    <Box
      sx={(theme) => {
        const dark = theme.palette.mode === 'dark'
        const grid = dark ? 'rgba(255,255,255,0.045)' : 'rgba(26,26,26,0.05)'
        return {
          minHeight: '100%',
          backgroundImage: `linear-gradient(${grid} 1px, transparent 1px), linear-gradient(90deg, ${grid} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }
      }}
    >
      <Box sx={{ maxWidth: '50rem', mx: 'auto', px: { xs: 2, sm: 4 }, py: { xs: 4, sm: 7 } }}>
        <Box sx={{ position: 'relative', px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
          {['tl', 'tr', 'bl', 'br'].map((pos) => (
            <Box key={pos} sx={bracketSx(pos)} />
          ))}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
            <Typography
              sx={{
                fontFamily: SANS,
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'primary.main',
              }}
            >
              The Field Manual
            </Typography>
            {first != null ? (
              <Box
                sx={{
                  fontFamily: MONO,
                  fontSize: '0.72rem',
                  letterSpacing: '0.06em',
                  color: 'text.secondary',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '3px',
                  px: 0.8,
                  py: 0.15,
                }}
              >
                {`CH. ${String(first).padStart(2, '0')}–${String(last).padStart(2, '0')}`}
              </Box>
            ) : null}
          </Box>

          <Typography
            component="h1"
            sx={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: { xs: '2.6rem', sm: '3.4rem' },
              lineHeight: 1.05,
              mt: 1,
            }}
          >
            Behavior Ops
          </Typography>
          <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.3rem', color: 'text.secondary', mt: 1.5 }}>
            by {author}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 4 }}>
            <Box sx={{ width: 7, height: 7, bgcolor: 'primary.main', flexShrink: 0 }} />
            <Box sx={{ flex: 1, maxWidth: 200, borderTop: '2px dashed', borderColor: 'primary.main', opacity: 0.55 }} />
          </Box>

          <Typography sx={{ fontFamily: SERIF, fontSize: '1.1rem', lineHeight: 1.7, color: 'text.primary', maxWidth: '38rem' }}>
            The tradecraft of influence — how to move human behavior far, and fast.
            Read the book chapter by chapter below. New chapters are added as their
            transcripts are edited.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 6, mb: 2 }}>
          <Typography
            sx={{
              fontFamily: SANS,
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            Contents
          </Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: '0.72rem', letterSpacing: '0.04em', color: 'text.secondary' }}>
            {chapters.length} CHAPTERS
          </Typography>
        </Box>

        {chapters.length === 0 ? (
          <Typography color="text.secondary">No chapters yet.</Typography>
        ) : (
          <Stack spacing={1.5}>
            {chapters.map((c) => (
              <Card
                key={c.number}
                variant="outlined"
                sx={(theme) => {
                  const dark = theme.palette.mode === 'dark'
                  return {
                    borderColor: dark ? 'rgba(255,255,255,0.16)' : theme.palette.book.rule,
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                    overflow: 'hidden',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                      boxShadow: dark
                        ? '0 6px 18px rgba(0,0,0,0.45)'
                        : '0 6px 18px rgba(26,26,26,0.1)',
                    },
                  }
                }}
              >
                <CardActionArea component={RouterLink} to={`/chapter/${c.number}`} sx={{ p: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
                    <Box
                      sx={(theme) => ({
                        width: 68,
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.25,
                        bgcolor: theme.palette.book.accentSoft,
                        borderRight: '1px solid',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.14)' : theme.palette.book.rule,
                      })}
                    >
                      <Typography
                        sx={{
                          fontFamily: MONO,
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          letterSpacing: '0.12em',
                          color: 'primary.main',
                          opacity: 0.75,
                        }}
                      >
                        CH
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: SERIF,
                          fontSize: '1.7rem',
                          fontWeight: 700,
                          lineHeight: 1,
                          color: 'primary.main',
                        }}
                      >
                        {String(c.number).padStart(2, '0')}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, p: 2.25, minWidth: 0 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1.25rem' }}>
                          {c.title}
                        </Typography>
                        {c.subtitle ? (
                          <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                            {c.subtitle}
                          </Typography>
                        ) : null}
                      </Box>
                      <ChevronRightIcon color="action" sx={{ flexShrink: 0 }} />
                    </Box>
                  </Box>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        )}
        <Divider sx={{ mt: 6 }} />
        <Typography sx={{ fontFamily: SANS, fontSize: '0.8rem', color: 'text.secondary', mt: 2 }}>
          Fidelity-edited from the author's transcripts. Each chapter ends with a
          Change Log of every correction made.
        </Typography>
      </Box>
    </Box>
  )
}
