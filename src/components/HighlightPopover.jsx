import { useEffect, useState } from 'react'
import { Popover, Box, Typography, TextField, Button, Stack } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { SANS } from '../theme.js'

// Popover shown when a reader taps an existing highlight (text or element). Shows
// the note if present, and lets the reader add/edit a note or remove the
// highlight. `startInEdit` opens straight into the editor (used right after a
// "Note" creation so the reader can type immediately).
export default function HighlightPopover({
  anchorEl,
  highlight,
  startInEdit = false,
  onSaveNote,
  onRemove,
  onClose,
}) {
  const open = Boolean(anchorEl && highlight)
  const [editing, setEditing] = useState(startInEdit)
  const [draft, setDraft] = useState(highlight?.note || '')

  // Re-sync when the popover opens for a different highlight.
  useEffect(() => {
    if (open) {
      setEditing(startInEdit)
      setDraft(highlight?.note || '')
    }
  }, [open, highlight?.id, startInEdit]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!highlight) return null

  const save = () => {
    onSaveNote(highlight.id, draft.trim())
    setEditing(false)
    onClose()
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      slotProps={{ paper: { sx: { p: 1.75, width: 300, borderRadius: 2 } } }}
    >
      {editing ? (
        <Box>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            maxRows={6}
            size="small"
            placeholder="Add a note…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            sx={{ fontFamily: SANS }}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 1.25, justifyContent: 'flex-end' }}>
            <Button size="small" color="inherit" onClick={onClose} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={save} sx={{ textTransform: 'none' }}>
              Save
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box>
          {highlight.note ? (
            <Typography sx={{ fontFamily: SANS, fontSize: '0.9rem', whiteSpace: 'pre-wrap', mb: 1.25 }}>
              {highlight.note}
            </Typography>
          ) : (
            <Typography sx={{ fontFamily: SANS, fontSize: '0.85rem', color: 'text.secondary', fontStyle: 'italic', mb: 1.25 }}>
              No note yet.
            </Typography>
          )}
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              size="small"
              color="error"
              startIcon={<DeleteOutlineIcon fontSize="small" />}
              onClick={() => onRemove(highlight.id)}
              sx={{ textTransform: 'none' }}
            >
              Remove
            </Button>
            <Button size="small" onClick={() => setEditing(true)} sx={{ textTransform: 'none' }}>
              {highlight.note ? 'Edit note' : 'Add note'}
            </Button>
          </Stack>
        </Box>
      )}
    </Popover>
  )
}
