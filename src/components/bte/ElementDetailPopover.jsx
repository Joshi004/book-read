import { useEffect, useState } from 'react'
import { Popover, Box, Typography, Chip, Stack, Button, Divider } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import MarkdownContent from '../../content/markdown.jsx'
import { SANS, MONO } from '../../theme.js'

const RELATION_LABEL = {
  confirming: 'Confirms',
  amplifying: 'Amplifies',
  conflicting: 'Conflicts with',
}

// Modeled on HighlightPopover.jsx's anchorEl-driven open/close pattern, wider
// to hold real chapter-26 prose. Clicking a relation chip swaps which entry
// is displayed rather than re-anchoring — the popover stays put so a reader
// can walk the confirming/amplifying/conflicting graph without it jumping
// around the grid.
//
// "Read in Chapter 26" navigates away from this page entirely, which
// unmounts this Popover — if that navigation fires immediately on click, the
// Popover's own close/unmount bookkeeping (scroll position, focus restore)
// races the new chapter page's own mount and can leave it scrolled to the
// wrong place. Routing through the Popover's real onExited callback lets it
// finish closing first, same as clicking away normally would, before the
// navigation happens.
export default function ElementDetailPopover({ entry, anchorEl, entriesBySymbol, onSelectRelated, onReadInChapter, onClose }) {
  const [displayEntry, setDisplayEntry] = useState(entry)
  const [pendingRead, setPendingRead] = useState(null)
  useEffect(() => {
    if (entry) setDisplayEntry(entry)
  }, [entry])

  const open = Boolean(anchorEl && entry)
  if (!displayEntry) return null

  const requestReadInChapter = () => {
    setPendingRead(displayEntry)
    onClose()
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      disableScrollLock
      TransitionProps={{
        onExited: () => {
          if (pendingRead) {
            onReadInChapter(pendingRead)
            setPendingRead(null)
          }
        },
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      slotProps={{ paper: { sx: { p: 2, width: 380, maxWidth: '90vw', maxHeight: '70vh', overflowY: 'auto', borderRadius: 2 } } }}
    >
      <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 0.25 }}>
        <Typography sx={{ fontFamily: MONO, fontWeight: 700, fontSize: '1.1rem' }}>{displayEntry.symbol}</Typography>
        <Typography sx={{ fontFamily: SANS, fontWeight: 700, fontSize: '1rem' }}>{displayEntry.name}</Typography>
      </Stack>
      <Typography sx={{ fontFamily: SANS, fontSize: '0.75rem', color: 'text.secondary', mb: 1.25 }}>
        {[displayEntry.gestureType, displayEntry.bodyRegion, displayEntry.drsRaw ? `DRS ${displayEntry.drsRaw}` : null, displayEntry.timeframeRaw]
          .filter(Boolean)
          .join(' · ')}
      </Typography>

      <Box sx={{ fontFamily: SANS, fontSize: '0.88rem', '& p': { mt: 0, mb: 1.25 } }}>
        <MarkdownContent body={displayEntry.descriptionMd} />
      </Box>

      {displayEntry.variations.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography sx={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>
            Variations
          </Typography>
          <Stack spacing={0.5}>
            {displayEntry.variations.map((v, i) => (
              <Typography key={i} sx={{ fontFamily: SANS, fontSize: '0.82rem' }}>
                {v.tag ? <b>{v.tag}</b> : null} {v.tag ? '— ' : ''}
                {v.text}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}

      {displayEntry.relations.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography sx={{ fontFamily: SANS, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>
            Related elements
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
            {displayEntry.relations.map((rel, i) => {
              const target = entriesBySymbol.get(rel.symbol)
              return (
                <Chip
                  key={i}
                  size="small"
                  onClick={target ? () => onSelectRelated(target) : undefined}
                  label={`${RELATION_LABEL[rel.type] || rel.type} ${rel.symbol}${target ? ` — ${target.name}` : ''}`}
                  sx={{ fontFamily: SANS, fontSize: '0.72rem' }}
                />
              )
            })}
          </Stack>
        </Box>
      )}

      <Divider sx={{ mb: 1.25 }} />
      <Button
        size="small"
        endIcon={<ArrowForwardIcon fontSize="small" />}
        onClick={requestReadInChapter}
        sx={{ textTransform: 'none', fontFamily: SANS }}
      >
        Read in Chapter 26
      </Button>
    </Popover>
  )
}
