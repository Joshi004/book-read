import { Box, Chip, TextField, Stack, Typography, Tooltip } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { SANS } from '../../theme.js'

const BAND_INFO = [
  { key: 'green', label: 'Green', hint: 'Least stressful, most open behaviors' },
  { key: 'tan', label: 'Tan', hint: 'Slight discomfort or stress' },
  { key: 'yellow', label: 'Yellow', hint: 'Higher-discomfort behaviors' },
  { key: 'grey', label: 'Grey', hint: 'Highest-stress behaviors, rated 4.0' },
  { key: 'turquoise', label: 'Turquoise', hint: 'Facial expressions and microexpressions' },
  { key: 'blue', label: 'Blue', hint: 'Variable cells — can present at different values' },
]

const GESTURE_TYPES = ['Open', 'Closed', 'Unsure', 'Aggressive']

function FilterChip({ active, onClick, color, label, hint }) {
  return (
    <Tooltip title={hint} arrow>
      <Chip
        size="small"
        onClick={onClick}
        variant={active ? 'filled' : 'outlined'}
        label={label}
        sx={(theme) => ({
          fontFamily: SANS,
          fontWeight: 600,
          ...(color
            ? {
                bgcolor: active ? theme.palette.book.bte[color] : 'transparent',
                color: active ? theme.palette.book.bteOnFill : 'text.primary',
                borderColor: theme.palette.book.bte[color],
              }
            : {}),
        })}
      />
    </Tooltip>
  )
}

export default function ElementsLegend({ activeBands, onToggleBand, activeTypes, onToggleType, search, onSearchChange }) {
  return (
    <Stack spacing={1.25} sx={{ mb: 3 }}>
      <Box>
        <Typography sx={{ fontFamily: SANS, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', mb: 0.75 }}>
          Color bands — click to isolate
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {BAND_INFO.map((b) => (
            <FilterChip
              key={b.key}
              color={b.key}
              label={b.label}
              hint={b.hint}
              active={activeBands.has(b.key)}
              onClick={() => onToggleBand(b.key)}
            />
          ))}
        </Stack>
      </Box>
      <Box>
        <Typography sx={{ fontFamily: SANS, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', mb: 0.75 }}>
          Gesture type
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          {GESTURE_TYPES.map((t) => (
            <FilterChip key={t} label={t} hint={`Show only ${t.toLowerCase()} gestures`} active={activeTypes.has(t)} onClick={() => onToggleType(t)} />
          ))}
        </Stack>
      </Box>
      <TextField
        size="small"
        placeholder="Search by symbol or name…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
        sx={{ maxWidth: 320, fontFamily: SANS }}
      />
    </Stack>
  )
}
