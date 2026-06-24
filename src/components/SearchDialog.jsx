import { useMemo, useState } from 'react'
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
import { chapters } from '../content/chapters.js'
import { makeSnippet } from '../content/headings.js'
import { SANS } from '../theme.js'

export default function SearchDialog({ open, onClose }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const results = useMemo(() => {
    const q = query.trim()
    if (q.length < 2) return []
    return chapters
      .map((c) => {
        const snippet = makeSnippet(c.body, q)
        const titleMatch = c.title.toLowerCase().includes(q.toLowerCase())
        if (!snippet && !titleMatch) return null
        return { chapter: c, snippet, titleMatch }
      })
      .filter(Boolean)
  }, [query])

  const close = () => {
    setQuery('')
    onClose()
  }

  const open_ = (number) => {
    navigate(`/chapter/${number}`)
    close()
  }

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
            if (e.key === 'Enter' && results[0]) open_(results[0].chapter.number)
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
      {query.trim().length >= 2 && (
        <List dense sx={{ maxHeight: '60vh', overflow: 'auto', pt: 0 }}>
          {results.length === 0 && (
            <Box sx={{ px: 3, pb: 2 }}>
              <Typography color="text.secondary">No matches.</Typography>
            </Box>
          )}
          {results.map(({ chapter, snippet }) => (
            <ListItemButton
              key={chapter.number}
              onClick={() => open_(chapter.number)}
              alignItems="flex-start"
            >
              <ListItemText
                primary={`Chapter ${chapter.number} — ${chapter.title}`}
                primaryTypographyProps={{ fontFamily: SANS, fontWeight: 600 }}
                secondary={
                  snippet ? (
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                    >
                      {snippet.before}
                      <Box
                        component="mark"
                        sx={{ bgcolor: 'primary.main', color: '#fff', px: 0.3 }}
                      >
                        {snippet.match}
                      </Box>
                      {snippet.after}
                    </Typography>
                  ) : (
                    'Title match'
                  )
                }
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </Dialog>
  )
}
