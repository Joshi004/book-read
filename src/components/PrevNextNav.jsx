import { Box, Button, Typography } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Link as RouterLink } from 'react-router-dom'
import { SANS } from '../theme.js'

function NavCard({ chapter, direction }) {
  const isPrev = direction === 'prev'
  return (
    <Button
      component={RouterLink}
      to={`/chapter/${chapter.number}`}
      variant="outlined"
      startIcon={isPrev ? <ChevronLeftIcon /> : null}
      endIcon={!isPrev ? <ChevronRightIcon /> : null}
      sx={{
        textTransform: 'none',
        textAlign: isPrev ? 'left' : 'right',
        flex: 1,
        justifyContent: isPrev ? 'flex-start' : 'flex-end',
        py: 1.25,
        px: 2,
      }}
    >
      <Box>
        <Typography
          sx={{
            fontFamily: SANS,
            fontSize: '0.7rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'text.secondary',
          }}
        >
          {isPrev ? 'Previous' : 'Next'}
        </Typography>
        <Typography sx={{ fontFamily: SANS, fontWeight: 600 }}>
          {chapter.title}
        </Typography>
      </Box>
    </Button>
  )
}

export default function PrevNextNav({ prev, next }) {
  if (!prev && !next) return null
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        mt: 6,
        pt: 3,
        borderTop: '1px solid',
        borderColor: 'divider',
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
      }}
    >
      {prev ? <NavCard chapter={prev} direction="prev" /> : <Box sx={{ flex: 1 }} />}
      {next ? <NavCard chapter={next} direction="next" /> : <Box sx={{ flex: 1 }} />}
    </Box>
  )
}
