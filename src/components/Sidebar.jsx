import { NavLink } from 'react-router-dom'
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import InsightsIcon from '@mui/icons-material/Insights'
import BookmarksIcon from '@mui/icons-material/Bookmarks'
import { chapters } from '../content/chapters.js'
import { SANS, SERIF } from '../theme.js'
import ReadingBadge from '../reading/ReadingBadge.jsx'

const linkSx = {
  '&.active': {
    bgcolor: 'action.selected',
    borderRight: '3px solid',
    borderColor: 'primary.main',
  },
}

export default function Sidebar({ onNavigate }) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
          <MenuBookIcon fontSize="small" />
          <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: '1.25rem' }}>
            Behavior Ops
          </Typography>
        </Box>
        <Typography
          sx={{
            fontFamily: SANS,
            fontSize: '0.72rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'text.secondary',
            mt: 0.5,
          }}
        >
          Charles Huge
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ overflow: 'auto', flex: 1 }}>
        <ListItemButton
          component={NavLink}
          to="/"
          end
          onClick={onNavigate}
          sx={linkSx}
        >
          <ListItemText
            primary="Cover & Contents"
            primaryTypographyProps={{ fontFamily: SANS, fontWeight: 600 }}
          />
        </ListItemButton>
        <ListItemButton
          component={NavLink}
          to="/dashboard"
          onClick={onNavigate}
          sx={linkSx}
        >
          <InsightsIcon fontSize="small" sx={{ mr: 1.25, color: 'text.secondary' }} />
          <ListItemText
            primary="Reading Dashboard"
            primaryTypographyProps={{ fontFamily: SANS, fontWeight: 600 }}
          />
        </ListItemButton>
        <ListItemButton
          component={NavLink}
          to="/highlights"
          onClick={onNavigate}
          sx={linkSx}
        >
          <BookmarksIcon fontSize="small" sx={{ mr: 1.25, color: 'text.secondary' }} />
          <ListItemText
            primary="Highlights"
            primaryTypographyProps={{ fontFamily: SANS, fontWeight: 600 }}
          />
        </ListItemButton>
        <Divider />
        <List disablePadding>
          {chapters.map((c) => (
            <ListItemButton
              key={c.number}
              component={NavLink}
              to={`/chapter/${c.number}`}
              onClick={onNavigate}
              sx={linkSx}
            >
              <ListItemText
                primary={c.title}
                secondary={`Chapter ${c.number}`}
                primaryTypographyProps={{ fontFamily: SANS, fontSize: '0.92rem' }}
                secondaryTypographyProps={{ fontFamily: SANS, fontSize: '0.72rem' }}
              />
              <ReadingBadge chapterNumber={c.number} variant="compact" />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Box>
  )
}
