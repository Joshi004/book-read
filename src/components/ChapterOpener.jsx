import { Box, Typography } from '@mui/material'
import { SERIF, SANS } from '../theme.js'

// The styled chapter opener (eyebrow · title · subtitle · accent rule), ported
// from the .chapter-opener block that build.py used to generate.
export default function ChapterOpener({ book, number, title, subtitle }) {
  return (
    <Box component="header" sx={{ mt: 1, mb: 4 }}>
      <Typography
        component="div"
        sx={{
          fontFamily: SANS,
          fontSize: '0.8rem',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'primary.main',
          mb: 1.5,
        }}
      >
        {book} · Chapter {number}
      </Typography>
      <Typography
        component="h1"
        sx={{
          fontFamily: SERIF,
          fontSize: { xs: '2rem', sm: '2.6rem' },
          lineHeight: 1.08,
          fontWeight: 700,
          color: 'text.primary',
          m: 0,
        }}
      >
        {title}
      </Typography>
      {subtitle ? (
        <Typography
          sx={{
            fontStyle: 'italic',
            fontSize: '1.2rem',
            color: 'text.secondary',
            mt: 1,
          }}
        >
          {subtitle}
        </Typography>
      ) : null}
      <Box
        sx={{ height: '3px', width: '64px', bgcolor: 'primary.main', mt: 3, mb: 1 }}
      />
    </Box>
  )
}
