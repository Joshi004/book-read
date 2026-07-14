import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Box,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { loadSearchIndex } from '../content/searchIndex.js'
import { SANS } from '../theme.js'

const MAX_HITS_PER_HEADING = 3

// Groups flat hits (chapter+block+occurrence granularity) into
// chapter → heading → hits, sorted by best-scoring group first, for the
// grouped result rendering below.
function groupHits(hits) {
  const chapters = new Map()
  for (const hit of hits) {
    let chapter = chapters.get(hit.chapterNumber)
    if (!chapter) {
      chapter = { chapterNumber: hit.chapterNumber, chapterTitle: hit.chapterTitle, bestScore: 0, headings: new Map() }
      chapters.set(hit.chapterNumber, chapter)
    }
    chapter.bestScore = Math.max(chapter.bestScore, hit.score)

    const headingKey = hit.headingId || ''
    let heading = chapter.headings.get(headingKey)
    if (!heading) {
      heading = { headingId: hit.headingId, headingText: hit.headingText, hits: [] }
      chapter.headings.set(headingKey, heading)
    }
    heading.hits.push(hit)
  }

  return Array.from(chapters.values())
    .sort((a, b) => b.bestScore - a.bestScore)
    .map((chapter) => ({
      ...chapter,
      headingGroups: Array.from(chapter.headings.values()),
    }))
}

export default function SearchDialog({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [engine, setEngine] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    let alive = true
    loadSearchIndex().then((loaded) => {
      if (alive) setEngine(loaded)
    })
    return () => {
      alive = false
    }
  }, [open])

  const trimmedQuery = query.trim()
  const hits = useMemo(() => {
    if (!engine || trimmedQuery.length < 2) return []
    return engine.search(trimmedQuery)
  }, [engine, trimmedQuery])

  const chapterGroups = useMemo(() => groupHits(hits), [hits])

  const close = () => {
    setQuery('')
    onClose()
  }

  const openHit = (hit) => {
    const params = new URLSearchParams({
      block: hit.blockId,
      term: hit.matchedTerm,
      occ: String(hit.occurrenceInBlock),
    })
    navigate(`/chapter/${hit.chapterNumber}?${params}`, {
      state: { blockId: hit.blockId, matchedTerm: hit.matchedTerm, occurrenceInBlock: hit.occurrenceInBlock },
    })
    close()
  }

  const showLoading = trimmedQuery.length >= 2 && !engine
  const showNoMatches = trimmedQuery.length >= 2 && !!engine && hits.length === 0

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { position: 'fixed', top: 64, m: 0 } }}
    >
      <Box sx={{ p: 2 }}>
        <TextField
          autoFocus
          fullWidth
          placeholder="Search the book…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && hits[0]) openHit(hits[0])
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      {trimmedQuery.length >= 2 && (
        <List dense sx={{ maxHeight: '60vh', overflow: 'auto', pt: 0 }}>
          {showLoading && (
            <Box sx={{ px: 3, pb: 2 }}>
              <Typography color="text.secondary">Loading search index…</Typography>
            </Box>
          )}
          {showNoMatches && (
            <Box sx={{ px: 3, pb: 2 }}>
              <Typography color="text.secondary">No matches.</Typography>
            </Box>
          )}
          {chapterGroups.map((chapter) => (
            <Box key={chapter.chapterNumber} sx={{ mb: 1 }}>
              <Typography
                sx={{
                  fontFamily: SANS,
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  px: 2,
                  py: 0.5,
                }}
              >
                Chapter {chapter.chapterNumber} — {chapter.chapterTitle}
              </Typography>
              {chapter.headingGroups.map((heading) => (
                <Box key={heading.headingId || 'intro'}>
                  {heading.headingText && (
                    <Typography
                      sx={{
                        fontFamily: SANS,
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'primary.main',
                        px: 3,
                        pt: 0.25,
                      }}
                    >
                      {heading.headingText}
                    </Typography>
                  )}
                  {heading.hits.slice(0, MAX_HITS_PER_HEADING).map((hit) => (
                    <ListItemButton
                      key={`${hit.blockId}:${hit.occurrenceInBlock}`}
                      data-testid="search-hit"
                      onClick={() => openHit(hit)}
                      alignItems="flex-start"
                      sx={{ pl: 3 }}
                    >
                      <ListItemText
                        secondary={
                          <Typography component="span" variant="body2" color="text.secondary">
                            {hit.snippet.before}
                            <Box
                              component="mark"
                              sx={{ bgcolor: 'primary.main', color: '#fff', px: 0.3 }}
                            >
                              {hit.snippet.match}
                            </Box>
                            {hit.snippet.after}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  ))}
                  {heading.hits.length > MAX_HITS_PER_HEADING && (
                    <Typography sx={{ px: 3, pb: 0.5, fontSize: '0.72rem', color: 'text.secondary' }}>
                      +{heading.hits.length - MAX_HITS_PER_HEADING} more in this section
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          ))}
        </List>
      )}
    </Dialog>
  )
}
