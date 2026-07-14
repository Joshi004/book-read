import { Box, Popover, Slider, Typography } from '@mui/material'
import { SANS } from '../theme.js'
import { useReadingPrefs, FONT_SIZE_RANGE, LINE_HEIGHT_RANGE } from '../readingPrefs.jsx'

const SECTION_LABEL = {
  fontFamily: SANS,
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'text.secondary',
  mb: 0.5,
}

const END_LABEL = {
  fontFamily: SANS,
  fontSize: '0.7rem',
  color: 'text.disabled',
  lineHeight: 1,
}

export default function ReadingPrefsPanel({ anchorEl, onClose }) {
  const { fontSize, lineHeight, setFontSize, setLineHeight } = useReadingPrefs()

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{ paper: { sx: { p: 2.5, minWidth: 240 } } }}
    >
      {/* Text size */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={SECTION_LABEL}>Text size</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 0.5 }}>
          <Typography sx={{ ...END_LABEL, fontSize: '0.75rem' }}>A</Typography>
          <Slider
            value={fontSize}
            min={FONT_SIZE_RANGE.min}
            max={FONT_SIZE_RANGE.max}
            step={FONT_SIZE_RANGE.step}
            onChange={(_, v) => setFontSize(v)}
            size="small"
            aria-label="Text size"
            sx={{ flex: 1 }}
          />
          <Typography sx={{ ...END_LABEL, fontSize: '1rem' }}>A</Typography>
        </Box>
        <Typography sx={{ fontFamily: SANS, fontSize: '0.68rem', color: 'text.disabled', textAlign: 'center', mt: 0.25 }}>
          {Math.round(fontSize * 16)}px
        </Typography>
      </Box>

      {/* Line spacing */}
      <Box>
        <Typography sx={SECTION_LABEL}>Line spacing</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 0.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
            <Box sx={{ width: 14, height: 2, bgcolor: 'text.disabled', borderRadius: 1 }} />
            <Box sx={{ width: 14, height: 2, bgcolor: 'text.disabled', borderRadius: 1 }} />
            <Box sx={{ width: 14, height: 2, bgcolor: 'text.disabled', borderRadius: 1 }} />
          </Box>
          <Slider
            value={lineHeight}
            min={LINE_HEIGHT_RANGE.min}
            max={LINE_HEIGHT_RANGE.max}
            step={LINE_HEIGHT_RANGE.step}
            onChange={(_, v) => setLineHeight(v)}
            size="small"
            aria-label="Line spacing"
            sx={{ flex: 1 }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
            <Box sx={{ width: 14, height: 2, bgcolor: 'text.disabled', borderRadius: 1 }} />
            <Box sx={{ width: 14, height: 2, bgcolor: 'text.disabled', borderRadius: 1 }} />
            <Box sx={{ width: 14, height: 2, bgcolor: 'text.disabled', borderRadius: 1 }} />
          </Box>
        </Box>
        <Typography sx={{ fontFamily: SANS, fontSize: '0.68rem', color: 'text.disabled', textAlign: 'center', mt: 0.25 }}>
          {lineHeight.toFixed(2)}×
        </Typography>
      </Box>
    </Popover>
  )
}
