import { StrictMode, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import App from './App.jsx'
import { getTheme } from './theme.js'
import { ColorModeContext } from './colorMode.js'
import { ReadingPrefsProvider } from './readingPrefs.jsx'
import { ReadingTrackerProvider } from './reading/ReadingTrackerContext.jsx'
import { ReadingSpeedProvider } from './reading/readingSpeed.jsx'
import { HighlightsProvider } from './reading/HighlightsContext.jsx'

// The app manages its own scroll on route change (ScrollToTop.jsx, plus
// ChapterReader's deep-link/resume logic) — the browser's default automatic
// scroll restoration on pushState-based navigation fights that (it was the
// actual cause of the Behavior Elements "Read in Chapter 26" link landing
// thousands of pixels short of its target: the app's scroll would land
// correctly, then the browser would silently restore its own remembered
// position moments later).
if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

const STORAGE_KEY = 'behavior-ops-color-mode'

function getInitialMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* ignore */
  }
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

function Root() {
  const [mode, setMode] = useState(getInitialMode)

  const colorMode = useMemo(
    () => ({
      mode,
      toggle: () =>
        setMode((prev) => {
          const next = prev === 'dark' ? 'light' : 'dark'
          try {
            localStorage.setItem(STORAGE_KEY, next)
          } catch {
            /* ignore */
          }
          return next
        }),
    }),
    [mode]
  )

  const theme = useMemo(() => getTheme(mode), [mode])

  return (
    <ReadingPrefsProvider>
      <ReadingTrackerProvider>
        <ReadingSpeedProvider>
          <HighlightsProvider>
            <ColorModeContext.Provider value={colorMode}>
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <HashRouter>
                  <App />
                </HashRouter>
              </ThemeProvider>
            </ColorModeContext.Provider>
          </HighlightsProvider>
        </ReadingSpeedProvider>
      </ReadingTrackerProvider>
    </ReadingPrefsProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
