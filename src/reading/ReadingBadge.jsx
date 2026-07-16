import { Box, Typography, LinearProgress } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useReadingTrackerContext } from './ReadingTrackerContext.jsx'
import { effectiveStatus, chapterProgress } from './readingStore.js'
import { SANS, MONO } from '../theme.js'

// Reads a chapter's derived reading status from the tracker snapshot and renders
// a compact indicator. `variant` tunes it for where it lives:
//   'card'    — chip + thin progress bar (Home contents cards)
//   'compact' — a small status dot (sidebar list rows)
export default function ReadingBadge({ chapterNumber, variant = 'card' }) {
  const { snapshot } = useReadingTrackerContext()
  const chapter = snapshot.chapters?.[String(chapterNumber)]
  const status = effectiveStatus(chapter)
  const progress = chapterProgress(chapter)

  if (variant === 'compact') {
    const color =
      status === 'read' ? 'success.main' : status === 'reading' ? 'primary.main' : 'transparent'
    const border = status === 'unread' ? '1.5px solid' : 'none'
    return (
      <Box
        aria-label={status}
        title={status === 'read' ? 'Read' : status === 'reading' ? 'In progress' : 'Unread'}
        sx={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          flexShrink: 0,
          bgcolor: color,
          border,
          borderColor: 'divider',
        }}
      />
    )
  }

  // 'card' variant
  if (status === 'read') {
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        <CheckCircleIcon sx={{ fontSize: '1rem', color: 'success.main' }} />
        <Typography
          sx={{ fontFamily: SANS, fontSize: '0.72rem', fontWeight: 700, color: 'success.main', letterSpacing: '0.04em' }}
        >
          READ
        </Typography>
      </Box>
    )
  }

  if (status === 'reading') {
    return (
      <Box sx={{ minWidth: 96 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.4 }}>
          <Typography sx={{ fontFamily: SANS, fontSize: '0.68rem', fontWeight: 700, color: 'primary.main', letterSpacing: '0.06em' }}>
            READING
          </Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: '0.68rem', color: 'text.secondary' }}>
            {Math.round(progress * 100)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.round(progress * 100)}
          sx={{ height: 4, borderRadius: 2 }}
        />
      </Box>
    )
  }

  return (
    <Typography
      sx={{ fontFamily: SANS, fontSize: '0.7rem', fontWeight: 600, color: 'text.disabled', letterSpacing: '0.06em' }}
    >
      UNREAD
    </Typography>
  )
}
