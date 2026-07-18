import { useState, useEffect, useRef } from 'react'
import { Box, Button, Paper, Slider, IconButton, Typography, Fade } from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import CloseIcon from '@mui/icons-material/Close'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import { SANS, MONO } from '../theme.js'
import { useReadingSpeed, WPM_RANGE } from '../reading/readingSpeed.jsx'

// The Auto Read control cluster. Rendered ONLY inside full-screen focus mode
// (see Layout.jsx) — Auto Read is a deliberate mode, not a loose preference.
// Before it's started, a single "Auto Read" pill; once started, a video-player-
// style cluster (play/pause · speed slider · ETA · exit) that auto-hides while
// scrolling and reappears on any interaction.

function fmtEta(sec) {
  if (sec == null) return ''
  if (sec <= 0) return 'done'
  if (sec < 60) return `${sec}s left`
  return `${Math.round(sec / 60)} min left`
}

export default function AutoReadControls() {
  const { wpm, setWpm, autoRead, playing, etaSec, start, stop, togglePlaying } = useReadingSpeed()
  const [idleHidden, setIdleHidden] = useState(false)
  const hideTimer = useRef(null)

  // Auto-hide the cluster after inactivity, but only while actively scrolling;
  // when paused, keep it visible so the reader can adjust or resume.
  useEffect(() => {
    if (!autoRead) return
    const reveal = () => {
      setIdleHidden(false)
      clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => setIdleHidden(true), 3500)
    }
    reveal()
    window.addEventListener('mousemove', reveal, { passive: true })
    window.addEventListener('touchstart', reveal, { passive: true })
    return () => {
      clearTimeout(hideTimer.current)
      window.removeEventListener('mousemove', reveal)
      window.removeEventListener('touchstart', reveal)
    }
  }, [autoRead])

  // Space toggles play/pause while in Auto Read (arrows/scroll already pause via
  // the engine). Ignore it when a form field is focused.
  useEffect(() => {
    if (!autoRead) return
    const onKey = (e) => {
      if (e.code !== 'Space') return
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      e.preventDefault()
      togglePlaying()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [autoRead, togglePlaying])

  if (!autoRead) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 1300,
          pointerEvents: 'none',
        }}
      >
        <Button
          onClick={start}
          startIcon={<AutoStoriesIcon />}
          variant="contained"
          sx={{
            pointerEvents: 'auto',
            borderRadius: 999,
            textTransform: 'none',
            fontFamily: SANS,
            fontWeight: 600,
            boxShadow: 4,
            px: 2.5,
          }}
        >
          Auto Read
        </Button>
      </Box>
    )
  }

  const visible = !playing || !idleHidden

  return (
    <Fade in={visible}>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1.5,
          py: 1,
          borderRadius: 999,
          width: 360,
          maxWidth: '92vw',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        <IconButton onClick={togglePlaying} aria-label={playing ? 'Pause' : 'Resume'} size="small">
          {playing ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>

        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <Slider
            value={wpm}
            min={WPM_RANGE.min}
            max={WPM_RANGE.max}
            step={WPM_RANGE.step}
            onChange={(_, v) => setWpm(v)}
            size="small"
            aria-label="Reading speed (words per minute)"
            sx={{ py: 0.5 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontFamily: MONO, fontSize: '0.68rem', color: 'text.secondary' }}>
              {wpm} WPM
            </Typography>
            <Typography sx={{ fontFamily: MONO, fontSize: '0.68rem', color: 'text.secondary' }}>
              {fmtEta(etaSec)}
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={stop} aria-label="Exit Auto Read" size="small">
          <CloseIcon />
        </IconButton>
      </Paper>
    </Fade>
  )
}
