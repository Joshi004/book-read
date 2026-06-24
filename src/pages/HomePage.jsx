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
import { SERIF, SANS } from '../theme.js'

export default function HomePage() {
  const author = chapters[0]?.author || 'Charles Huge'
  return (
    <Box sx={{ maxWidth: '50rem', mx: 'auto', px: { xs: 2, sm: 4 }, py: { xs: 4, sm: 7 } }}>
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
      <Box sx={{ height: '3px', width: 72, bgcolor: 'primary.main', my: 4 }} />
      <Typography sx={{ fontFamily: SERIF, fontSize: '1.1rem', lineHeight: 1.7, color: 'text.primary', maxWidth: '38rem' }}>
        The tradecraft of influence — how to move human behavior far, and fast.
        Read the book chapter by chapter below. New chapters are added as their
        transcripts are edited.
      </Typography>

      <Typography
        sx={{
          fontFamily: SANS,
          fontSize: '0.8rem',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'text.secondary',
          mt: 6,
          mb: 2,
        }}
      >
        Contents
      </Typography>

      {chapters.length === 0 ? (
        <Typography color="text.secondary">No chapters yet.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {chapters.map((c) => (
            <Card key={c.number} variant="outlined">
              <CardActionArea component={RouterLink} to={`/chapter/${c.number}`} sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography
                    sx={{
                      fontFamily: SERIF,
                      fontSize: '2rem',
                      fontWeight: 700,
                      color: 'primary.main',
                      minWidth: '2.5rem',
                    }}
                  >
                    {c.number}
                  </Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1.25rem' }}>
                      {c.title}
                    </Typography>
                    {c.subtitle ? (
                      <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        {c.subtitle}
                      </Typography>
                    ) : null}
                  </Box>
                  <ChevronRightIcon color="action" />
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
  )
}
