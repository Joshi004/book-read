import { useState, useEffect } from 'react'
import { Outlet, Link as RouterLink } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Drawer,
  Typography,
  Button,
  Snackbar,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong'
import Sidebar from './Sidebar.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import SearchDialog from './SearchDialog.jsx'
import ScrollToTop from './ScrollToTop.jsx'
import { SERIF } from '../theme.js'

const DRAWER_WIDTH = 280

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)

  const enterFocus = () => {
    setFocusMode(true)
    setToastOpen(true)
  }

  useEffect(() => {
    if (!focusMode) return
    const onKey = (e) => { if (e.key === 'Escape') setFocusMode(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusMode])

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          display: focusMode ? 'none' : 'flex',
          zIndex: (t) => t.zIndex.drawer + 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen((v) => !v)}
            sx={{ mr: 1, display: { md: 'none' } }}
            aria-label="Open navigation"
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component={RouterLink}
            to="/"
            sx={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: '1.15rem',
              color: 'text.primary',
              textDecoration: 'none',
              flexGrow: 1,
            }}
          >
            Behavior&nbsp;Ops
          </Typography>
          <Button
            onClick={() => setSearchOpen(true)}
            startIcon={<SearchIcon />}
            color="inherit"
            sx={{ textTransform: 'none', mr: 0.5, display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Search
          </Button>
          <IconButton
            onClick={() => setSearchOpen(true)}
            color="inherit"
            sx={{ display: { sm: 'none' } }}
            aria-label="Search"
          >
            <SearchIcon />
          </IconButton>
          <IconButton
            onClick={enterFocus}
            color="inherit"
            aria-label="Enter focus mode"
            title="Focus mode (Esc to exit)"
          >
            <CenterFocusStrongIcon />
          </IconButton>
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      {/* Navigation: temporary drawer on mobile, permanent on desktop. */}
      <Box
        component="nav"
        sx={{
          display: focusMode ? 'none' : undefined,
          width: { md: DRAWER_WIDTH },
          flexShrink: { md: 0 },
        }}
        aria-label="Chapters"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={closeMobile}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          <Toolbar />
          <Sidebar onNavigate={closeMobile} />
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          <Toolbar />
          <Sidebar />
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: focusMode ? '100%' : { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          transition: 'width 0.25s ease',
        }}
      >
        <Toolbar sx={{ display: focusMode ? 'none' : undefined }} />
        <Outlet context={{ focusMode, setFocusMode }} />
      </Box>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ScrollToTop />
      <Snackbar
        open={toastOpen}
        autoHideDuration={2500}
        onClose={() => setToastOpen(false)}
        message="Press Esc to exit focus mode"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
