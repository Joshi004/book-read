import { useEffect, useRef, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Fab, Zoom } from '@mui/material'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'

// Resets scroll on route change and shows a floating "back to top" button.
// `scroller` is the element that actually scrolls (the main content region).
export default function ScrollToTop({ scroller }) {
  const location = useLocation()
  const { pathname } = location
  const [searchParams] = useSearchParams()
  const [show, setShow] = useState(false)
  const mounted = useRef(false)

  const getEl = () => (typeof scroller === 'function' ? scroller() : null)

  // A search result hands a chapter route a specific block to scroll to
  // (ChapterReader.jsx) — don't fight that with an unconditional reset-to-top.
  const hasPendingTarget = Boolean(location.state?.blockId || searchParams.get('block'))

  useEffect(() => {
    // Skip the initial mount — a fresh page load (including a mobile OS
    // reviving a discarded/idle tab on the same URL) should leave the scroll
    // position to ChapterReader's resume logic, not get force-reset to the
    // top. Only real in-session route changes should reset.
    if (!mounted.current) {
      mounted.current = true
      return
    }
    if (hasPendingTarget) return
    const el = getEl()
    if (el) el.scrollTo({ top: 0 })
    else window.scrollTo({ top: 0 })
  }, [pathname, hasPendingTarget]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = getEl() || window
    const target = el === window ? document.documentElement : el
    const onScroll = () => setShow((target.scrollTop || 0) > 400)
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toTop = () => {
    const el = getEl()
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Zoom in={show}>
      <Fab
        size="small"
        color="primary"
        onClick={toTop}
        aria-label="Back to top"
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Zoom>
  )
}
