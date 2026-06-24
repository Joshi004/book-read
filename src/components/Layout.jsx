import { useState } from 'react'
import { Outlet, Link as RouterLink } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Drawer,
  Typography,
  Button,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import Sidebar from './Sidebar.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import SearchDialog from './SearchDialog.jsx'
import ScrollToTop from './ScrollToTop.jsx'
import { SERIF } from '../theme.js'

const DRAWER_WIDTH = 280

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
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
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      {/* Navigation: temporary drawer on mobile, permanent on desktop. */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
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
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ScrollToTop />
    </Box>
  )
}
