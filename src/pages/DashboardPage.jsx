import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Typography,
  Stack,
  Button,
  Chip,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import { chapters } from '../content/chapters.js'
import { SERIF, SANS, MONO } from '../theme.js'
import { useReadingTrackerContext } from '../reading/ReadingTrackerContext.jsx'
import {
  aggregateStats,
  computeStreak,
  dailySeries,
  evaluateBadges,
  effectiveStatus,
  chapterProgress,
  formatDuration,
  dayKey,
} from '../reading/readingStore.js'

// ---------------------------------------------------------------------------
// Small shared bits
// ---------------------------------------------------------------------------

const SECTION_LABEL = {
  fontFamily: SANS,
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'text.secondary',
}

function SectionHeading({ children, right }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 5, mb: 1.5 }}>
      <Typography sx={SECTION_LABEL}>{children}</Typography>
      {right}
    </Box>
  )
}

function StatTile({ label, value, unit, accent }) {
  return (
    <Box
      sx={(theme) => ({
        flex: '1 1 130px',
        minWidth: 130,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        p: 2,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : theme.palette.book.paper,
      })}
    >
      <Typography sx={{ ...SECTION_LABEL, fontSize: '0.64rem', mb: 0.75 }}>{label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
        <Typography
          sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1.9rem', lineHeight: 1, color: accent ? 'primary.main' : 'text.primary' }}
        >
          {value}
        </Typography>
        {unit ? (
          <Typography sx={{ fontFamily: MONO, fontSize: '0.72rem', color: 'text.secondary' }}>{unit}</Typography>
        ) : null}
      </Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Charts (hand-rolled SVG; single-series, sequential/magnitude, theme-driven)
// ---------------------------------------------------------------------------

// path for a rect rounded only on its top (data end), anchored to a baseline.
function topRoundedRect(x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h)
  if (h <= 0) return ''
  return `M${x},${y + h} L${x},${y + rad} Q${x},${y} ${x + rad},${y} L${x + w - rad},${y} Q${x + w},${y} ${x + w},${y + rad} L${x + w},${y + h} Z`
}

function ActivityHeatmap({ snapshot, theme }) {
  const WEEKS = 13
  const CELL = 13
  const GAP = 3
  const accent = theme.palette.primary.main
  const empty = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(26,26,26,0.06)'

  const today = new Date()
  const todayWeekday = today.getDay() // 0 = Sun
  const start = new Date(today)
  start.setDate(start.getDate() - ((WEEKS - 1) * 7 + todayWeekday)) // first Sunday shown

  // Peak daily minutes normalises the sequential ramp.
  const daily = snapshot.daily || {}
  let maxMs = 0
  for (const k of Object.keys(daily)) maxMs = Math.max(maxMs, daily[k].activeMs || 0)

  const level = (ms) => {
    if (ms <= 0) return 0
    if (maxMs <= 0) return 1
    const r = ms / maxMs
    if (r > 0.66) return 4
    if (r > 0.33) return 3
    if (r > 0.12) return 2
    return 1
  }
  const opacityFor = [0, 0.3, 0.52, 0.74, 1]

  const cells = []
  const monthLabels = []
  let lastMonth = -1
  for (let col = 0; col < WEEKS; col++) {
    for (let row = 0; row < 7; row++) {
      const date = new Date(start)
      date.setDate(date.getDate() + col * 7 + row)
      if (date > today) continue // future
      const key = dayKey(date)
      const rec = daily[key]
      const ms = rec ? rec.activeMs || 0 : 0
      const lv = level(ms)
      const x = col * (CELL + GAP)
      const y = row * (CELL + GAP)
      const min = Math.round(ms / 60000)
      cells.push(
        <rect key={key} x={x} y={y} width={CELL} height={CELL} rx={2.5} fill={lv === 0 ? empty : accent} fillOpacity={lv === 0 ? 1 : opacityFor[lv]}>
          <title>{`${key}: ${min} min read`}</title>
        </rect>,
      )
      // Month label at the first row of a column when the month changes.
      if (row === 0 && date.getMonth() !== lastMonth) {
        lastMonth = date.getMonth()
        monthLabels.push(
          <text key={`m-${key}`} x={x} y={-4} fill={theme.palette.text.secondary} fontFamily={MONO} fontSize={9}>
            {date.toLocaleString(undefined, { month: 'short' })}
          </text>,
        )
      }
    }
  }

  const width = WEEKS * (CELL + GAP)
  const height = 7 * (CELL + GAP)
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <svg
        viewBox={`0 -14 ${width} ${height + 14}`}
        width={width}
        style={{ maxWidth: '100%', height: 'auto' }}
        role="img"
        aria-label="Daily reading activity over the last 13 weeks"
      >
        {monthLabels}
        {cells}
      </svg>
      {/* Legend: less → more */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: '0.62rem', color: 'text.secondary' }}>Less</Typography>
        {opacityFor.map((op, i) => (
          <Box
            key={i}
            sx={{ width: 11, height: 11, borderRadius: '2.5px', bgcolor: i === 0 ? empty : accent, opacity: i === 0 ? 1 : op }}
          />
        ))}
        <Typography sx={{ fontFamily: MONO, fontSize: '0.62rem', color: 'text.secondary' }}>More</Typography>
      </Box>
    </Box>
  )
}

function MinutesBarChart({ series, theme }) {
  const W = 560
  const H = 150
  const padL = 4
  const padB = 20
  const accent = theme.palette.primary.main
  const axis = theme.palette.divider
  const maxMin = Math.max(1, ...series.map((d) => d.activeMs / 60000))
  const n = series.length
  const slot = (W - padL) / n
  const barW = Math.min(20, slot * 0.6)
  const plotH = H - padB

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: '100%', height: 'auto' }} role="img" aria-label="Minutes read per day, last 14 days">
        <line x1={padL} y1={plotH} x2={W} y2={plotH} stroke={axis} strokeWidth={1} />
        {series.map((d, i) => {
          const min = d.activeMs / 60000
          const h = min <= 0 ? 0 : (min / maxMin) * (plotH - 6)
          const x = padL + i * slot + (slot - barW) / 2
          const y = plotH - h
          const label = d.date.getDate()
          return (
            <g key={d.key}>
              {h > 0 ? (
                <path d={topRoundedRect(x, y, barW, h, 4)} fill={accent} fillOpacity={0.9}>
                  <title>{`${d.key}: ${Math.round(min)} min`}</title>
                </path>
              ) : null}
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fill={theme.palette.text.secondary} fontFamily={MONO} fontSize={8}>
                {label}
              </text>
            </g>
          )
        })}
      </svg>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Per-chapter row with manual override controls
// ---------------------------------------------------------------------------

function ChapterRow({ chapter, record, onSetStatus, onClear }) {
  const status = effectiveStatus(record)
  const progress = chapterProgress(record)
  const time = record?.activeMs || 0
  const canContinue = status !== 'read' && record?.lastBlockId

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        p: { xs: 1.5, sm: 2 },
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { sm: 'center' },
        gap: 1.5,
      }}
    >
      <Box
        sx={(theme) => ({
          width: 40,
          height: 40,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 1,
          bgcolor: theme.palette.book.accentSoft,
          fontFamily: SERIF,
          fontWeight: 700,
          color: 'primary.main',
        })}
      >
        {String(chapter.number).padStart(2, '0')}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1.02rem' }} noWrap>
          {chapter.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5, flexWrap: 'wrap' }}>
          {status === 'read' ? (
            <Chip size="small" icon={<CheckCircleIcon />} color="success" variant="outlined" label="Read" />
          ) : status === 'reading' ? (
            <Chip size="small" color="primary" variant="outlined" label={`Reading · ${Math.round(progress * 100)}%`} />
          ) : (
            <Chip size="small" variant="outlined" label="Unread" />
          )}
          <Typography sx={{ fontFamily: MONO, fontSize: '0.7rem', color: 'text.secondary' }}>
            {formatDuration(time)}
          </Typography>
          {record?.manualStatus ? (
            <Typography sx={{ fontFamily: SANS, fontSize: '0.66rem', color: 'text.disabled', fontStyle: 'italic' }}>
              manual
            </Typography>
          ) : null}
        </Box>
        {status === 'reading' ? (
          <LinearProgress variant="determinate" value={Math.round(progress * 100)} sx={{ height: 3, borderRadius: 2, mt: 1, maxWidth: 320 }} />
        ) : null}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, flexWrap: 'wrap' }}>
        {canContinue ? (
          <Button
            size="small"
            startIcon={<PlayArrowIcon />}
            component={RouterLink}
            to={{ pathname: `/chapter/${chapter.number}`, search: `?block=${encodeURIComponent(record.lastBlockId)}` }}
            sx={{ textTransform: 'none' }}
          >
            Continue
          </Button>
        ) : null}
        {status === 'read' ? (
          <Button size="small" onClick={() => onSetStatus(chapter.number, 'unread')} sx={{ textTransform: 'none' }} color="inherit">
            Mark unread
          </Button>
        ) : (
          <Button size="small" onClick={() => onSetStatus(chapter.number, 'read')} sx={{ textTransform: 'none' }}>
            Mark read
          </Button>
        )}
        {record?.manualStatus ? (
          <Button size="small" onClick={() => onClear(chapter.number)} sx={{ textTransform: 'none' }} color="inherit">
            Clear
          </Button>
        ) : null}
      </Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const theme = useTheme()
  const { snapshot, setManualStatus, clearOverride, resetAll } = useReadingTrackerContext()
  const [confirmReset, setConfirmReset] = useState(false)

  const agg = aggregateStats(snapshot, chapters.length)
  const streak = computeStreak(snapshot)
  const badges = evaluateBadges(snapshot, chapters.length)
  const last14 = dailySeries(snapshot, 14)
  const hasReadAny = agg.chaptersStarted > 0 || agg.activeMs > 0

  return (
    <Box sx={{ maxWidth: '54rem', mx: 'auto', px: { xs: 2, sm: 4 }, py: { xs: 3, sm: 5 } }}>
      <Typography sx={{ ...SECTION_LABEL, color: 'primary.main' }}>Your reading</Typography>
      <Typography component="h1" sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: { xs: '2rem', sm: '2.6rem' }, lineHeight: 1.1, mt: 0.5 }}>
        Reading Dashboard
      </Typography>
      <Typography sx={{ fontFamily: SANS, color: 'text.secondary', mt: 1 }}>
        Only genuine reading counts here — fast scrolling and idle time are ignored.
      </Typography>

      {!hasReadAny ? (
        <Box
          sx={{
            mt: 4,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            p: { xs: 3, sm: 5 },
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontFamily: SERIF, fontSize: '1.3rem', fontWeight: 700 }}>No reading tracked yet</Typography>
          <Typography sx={{ fontFamily: SANS, color: 'text.secondary', mt: 1, mb: 2.5 }}>
            Open a chapter and start reading — your progress, time, and streak will appear here.
          </Typography>
          <Button variant="contained" component={RouterLink} to={`/chapter/${chapters[0]?.number ?? 1}`} sx={{ textTransform: 'none' }}>
            Start reading
          </Button>
        </Box>
      ) : null}

      {/* Stat tiles */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 3 }}>
        <StatTile label="Chapters read" value={agg.chaptersRead} unit={`/ ${agg.totalChapters}`} accent />
        <StatTile label="Time reading" value={formatDuration(agg.activeMs)} />
        <StatTile label="Current streak" value={streak.current} unit={streak.current === 1 ? 'day' : 'days'} accent />
      </Box>

      {/* Streak banner */}
      <Box
        sx={(t) => ({
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mt: 2,
          p: 1.75,
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : t.palette.book.accentSoft,
        })}
      >
        <LocalFireDepartmentIcon sx={{ color: streak.current > 0 ? 'warning.main' : 'text.disabled' }} />
        <Typography sx={{ fontFamily: SANS, fontSize: '0.9rem' }}>
          {streak.current > 0 ? (
            <>
              You're on a <b>{streak.current}-day</b> reading streak
              {streak.activeToday ? '' : ' — read today to keep it alive'}.
            </>
          ) : (
            <>Read anything today to start a streak.</>
          )}
        </Typography>
        <Typography sx={{ fontFamily: MONO, fontSize: '0.72rem', color: 'text.secondary', ml: 'auto' }}>
          best {streak.longest}
        </Typography>
      </Box>

      {/* Activity heatmap */}
      <SectionHeading>Activity</SectionHeading>
      <ActivityHeatmap snapshot={snapshot} theme={theme} />

      {/* Minutes per day */}
      <SectionHeading>Minutes read · last 14 days</SectionHeading>
      <MinutesBarChart series={last14} theme={theme} />

      {/* Badges */}
      <SectionHeading>Badges</SectionHeading>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {badges.map((b) => (
          <Tooltip key={b.id} title={b.hint} arrow>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 1,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: b.earned ? 'primary.main' : 'divider',
                opacity: b.earned ? 1 : 0.5,
                filter: b.earned ? 'none' : 'grayscale(1)',
              }}
            >
              <Box component="span" sx={{ fontSize: '1.3rem', lineHeight: 1 }}>
                {b.icon}
              </Box>
              <Box>
                <Typography sx={{ fontFamily: SANS, fontSize: '0.8rem', fontWeight: 700 }}>{b.label}</Typography>
                <Typography sx={{ fontFamily: SANS, fontSize: '0.66rem', color: 'text.secondary' }}>{b.hint}</Typography>
              </Box>
            </Box>
          </Tooltip>
        ))}
      </Box>

      {/* Per-chapter progress */}
      <SectionHeading right={
        <Button size="small" color="inherit" onClick={() => setConfirmReset(true)} sx={{ textTransform: 'none', fontSize: '0.72rem' }}>
          Reset data
        </Button>
      }>
        Chapters
      </SectionHeading>
      <Stack spacing={1.25}>
        {chapters.map((c) => (
          <ChapterRow
            key={c.number}
            chapter={c}
            record={snapshot.chapters?.[String(c.number)]}
            onSetStatus={setManualStatus}
            onClear={clearOverride}
          />
        ))}
      </Stack>

      <Dialog open={confirmReset} onClose={() => setConfirmReset(false)}>
        <DialogTitle>Reset reading data?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This permanently clears all tracked progress, times, streaks, and manual overrides on this device. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmReset(false)} color="inherit" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              resetAll()
              setConfirmReset(false)
            }}
            color="error"
            variant="contained"
            sx={{ textTransform: 'none' }}
          >
            Reset everything
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
