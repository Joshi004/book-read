import { Popper, Paper, Button, Fade } from '@mui/material'
import BorderColorIcon from '@mui/icons-material/BorderColor'
import NoteAddIcon from '@mui/icons-material/NoteAdd'
import { SANS } from '../theme.js'

// The little floating toolbar that appears over a fresh text selection, offering
// to turn it into a highlight (optionally with a note). Purely presentational —
// positioned at a virtual anchor (the selection's bounding rect) supplied by the
// parent layer.
export default function HighlightToolbar({ anchorEl, onHighlight, onHighlightWithNote }) {
  const open = Boolean(anchorEl)
  return (
    <Popper open={open} anchorEl={anchorEl} placement="top" transition sx={{ zIndex: 1300 }}>
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={120}>
          <Paper elevation={6} sx={{ display: 'flex', gap: 0.5, p: 0.5, borderRadius: 2, mb: 0.5 }}>
            <Button
              size="small"
              startIcon={<BorderColorIcon fontSize="small" />}
              onMouseDown={(e) => e.preventDefault()} // keep the selection alive
              onClick={onHighlight}
              sx={{ textTransform: 'none', fontFamily: SANS }}
            >
              Highlight
            </Button>
            <Button
              size="small"
              color="inherit"
              startIcon={<NoteAddIcon fontSize="small" />}
              onMouseDown={(e) => e.preventDefault()}
              onClick={onHighlightWithNote}
              sx={{ textTransform: 'none', fontFamily: SANS }}
            >
              Note
            </Button>
          </Paper>
        </Fade>
      )}
    </Popper>
  )
}
