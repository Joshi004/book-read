import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Typography,
  Stack,
  Button,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import InsertPhotoOutlinedIcon from '@mui/icons-material/InsertPhotoOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { chapters, getChapter, loadChapterBody } from '../content/chapters.js'
import { SERIF, SANS, MONO } from '../theme.js'
import { useHighlights } from '../reading/HighlightsContext.jsx'
import { allHighlightsGrouped } from '../reading/highlightsStore.js'

const SECTION_LABEL = {
  fontFamily: SANS,
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'text.secondary',
}

// Loose normalization for the orphan check: drop emphasis punctuation and
// collapse whitespace so a plain-text quote can be found in raw markdown. Errs
// toward NOT flagging (only a genuine removal makes the quote disappear).
function normalizeForSearch(s) {
  return String(s || '')
    .replace(/[*_`~[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function formatDate(ms) {
  try {
    return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

function KindIcon({ kind, quotedText }) {
  if (kind === 'element') {
    return quotedText === 'Table' ? (
      <TableChartOutlinedIcon fontSize="small" color="primary" />
    ) : (
      <InsertPhotoOutlinedIcon fontSize="small" color="primary" />
    )
  }
  return <FormatQuoteIcon fontSize="small" color="primary" />
}

function HighlightCard({ highlight, orphaned, onRemove }) {
  const isElement = highlight.kind === 'element'
  const search = new URLSearchParams({ block: highlight.blockId, hl: highlight.id }).toString()

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        p: { xs: 1.5, sm: 2 },
        display: 'flex',
        gap: 1.5,
      }}
    >
      <Box sx={{ pt: 0.25, flexShrink: 0 }}>
        <KindIcon kind={highlight.kind} quotedText={highlight.quotedText} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {isElement ? (
          <Typography sx={{ fontFamily: SANS, fontSize: '0.95rem', fontWeight: 600 }}>
            {highlight.quotedText || 'Diagram'}
          </Typography>
        ) : (
          <Typography
            sx={{
              fontFamily: SERIF,
              fontSize: '1rem',
              lineHeight: 1.5,
              '&::before': { content: '"\\201C"' },
              '&::after': { content: '"\\201D"' },
            }}
          >
            {highlight.quotedText}
          </Typography>
        )}

        {highlight.note ? (
          <Box
            sx={(t) => ({
              mt: 1,
              pl: 1.25,
              borderLeft: `3px solid ${t.palette.primary.main}`,
              color: 'text.secondary',
            })}
          >
            <Typography sx={{ fontFamily: SANS, fontSize: '0.86rem', whiteSpace: 'pre-wrap' }}>
              {highlight.note}
            </Typography>
          </Box>
        ) : null}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontFamily: MONO, fontSize: '0.7rem', color: 'text.secondary' }}>
            {formatDate(highlight.createdAt)}
          </Typography>
          {orphaned ? (
            <Tooltip title="This passage is no longer in the chapter" arrow>
              <Chip size="small" variant="outlined" color="warning" label="Not found" />
            </Tooltip>
          ) : null}
          <Button
            size="small"
            endIcon={<ArrowForwardIcon fontSize="small" />}
            component={RouterLink}
            to={{ pathname: `/chapter/${highlight.chapterNumber}`, search: `?${search}` }}
            state={{ blockId: highlight.blockId, flashId: highlight.id }}
            sx={{ textTransform: 'none', ml: 'auto' }}
          >
            Go to passage
          </Button>
        </Box>
      </Box>

      <Box sx={{ flexShrink: 0 }}>
        <Tooltip title="Remove highlight" arrow>
          <IconButton size="small" onClick={() => onRemove(highlight.id)} color="inherit">
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}

export default function HighlightsPage() {
  const { snapshot, removeHighlight } = useHighlights()
  const chapterOrder = useMemo(() => chapters.map((c) => c.number), [])
  const groups = useMemo(() => allHighlightsGrouped(snapshot, chapterOrder), [snapshot, chapterOrder])

  // Lightweight orphan detection: load each involved chapter's body once and
  // flag text highlights whose quoted text no longer appears. Element highlights
  // aren't flagged (their block presence is only knowable in the rendered DOM).
  const [orphanIds, setOrphanIds] = useState(() => new Set())
  useEffect(() => {
    let alive = true
    const involved = groups.map((g) => g.chapterNumber)
    Promise.all(
      involved.map((num) => loadChapterBody(num).then((body) => ({ num, body: body || '' }))),
    ).then((bodies) => {
      if (!alive) return
      const bodyByNum = new Map(bodies.map((b) => [b.num, normalizeForSearch(b.body)]))
      const orphans = new Set()
      for (const g of groups) {
        const hay = bodyByNum.get(g.chapterNumber) || ''
        for (const h of g.highlights) {
          if (h.kind === 'text' && h.quotedText) {
            const needle = normalizeForSearch(h.quotedText)
            if (needle && !hay.includes(needle)) orphans.add(h.id)
          }
        }
      }
      setOrphanIds(orphans)
    })
    return () => {
      alive = false
    }
  }, [groups])

  const total = groups.reduce((n, g) => n + g.highlights.length, 0)

  return (
    <Box sx={{ maxWidth: '54rem', mx: 'auto', px: { xs: 2, sm: 4 }, py: { xs: 3, sm: 5 } }}>
      <Typography sx={{ ...SECTION_LABEL, color: 'primary.main' }}>Your reading</Typography>
      <Typography
        component="h1"
        sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: { xs: '2rem', sm: '2.6rem' }, lineHeight: 1.1, mt: 0.5 }}
      >
        Highlights
      </Typography>
      <Typography sx={{ fontFamily: SANS, color: 'text.secondary', mt: 1 }}>
        {total > 0
          ? `${total} highlight${total === 1 ? '' : 's'} across the book. Select text or a diagram in any chapter to add more.`
          : 'Passages and diagrams you mark while reading collect here.'}
      </Typography>

      {total === 0 ? (
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
          <Typography sx={{ fontFamily: SERIF, fontSize: '1.3rem', fontWeight: 700 }}>No highlights yet</Typography>
          <Typography sx={{ fontFamily: SANS, color: 'text.secondary', mt: 1, mb: 2.5 }}>
            Open a chapter, select a sentence (or hover a diagram or table), and choose “Highlight”.
          </Typography>
          <Button variant="contained" component={RouterLink} to={`/chapter/${chapters[0]?.number ?? 1}`} sx={{ textTransform: 'none' }}>
            Start reading
          </Button>
        </Box>
      ) : (
        groups.map((g) => {
          const chapter = getChapter(g.chapterNumber)
          return (
            <Box key={g.chapterNumber} sx={{ mt: 4 }}>
              <Typography sx={{ ...SECTION_LABEL, mb: 1.5 }}>
                Chapter {g.chapterNumber}
                {chapter ? ` — ${chapter.title}` : ''}
              </Typography>
              <Stack spacing={1.25}>
                {g.highlights.map((h) => (
                  <HighlightCard key={h.id} highlight={h} orphaned={orphanIds.has(h.id)} onRemove={removeHighlight} />
                ))}
              </Stack>
            </Box>
          )
        })
      )}
    </Box>
  )
}
