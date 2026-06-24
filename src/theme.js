import { createTheme } from '@mui/material/styles'

// macOS system stacks first (so Mac readers see the intended faces), then the
// Google Fonts loaded in index.html as fallbacks for everyone else.
export const SERIF =
  '"Iowan Old Style", "Palatino Linotype", "Palatino", "Gentium Book Plus", "Georgia", serif'
export const SANS = '"Avenir Next", "Helvetica Neue", "Inter", Arial, sans-serif'

// Editorial palette ported verbatim from build/template/book.css (:root), with a
// dark-mode counterpart derived from the same hues.
const TOKENS = {
  light: {
    ink: '#1A1A1A',
    muted: '#5B5B5B',
    accent: '#2E5A87',
    accentSoft: '#E8EFF6',
    warn: '#B23A48',
    warnSoft: '#F7EAEC',
    good: '#2E7D32',
    paper: '#F4F1EA',
    rule: '#C9C2B2',
    bg: '#FBFAF6',
    surface: '#FFFFFF',
    definitionBg: '#FBFAF7',
  },
  dark: {
    ink: '#E9E4D8',
    muted: '#A39E92',
    accent: '#8FB7E0',
    accentSoft: '#1E2A38',
    warn: '#E58A95',
    warnSoft: '#36242A',
    good: '#86C58A',
    paper: '#24221C',
    rule: '#3C3930',
    bg: '#17160F',
    surface: '#201E18',
    definitionBg: '#23211B',
  },
}

export function getTheme(mode = 'light') {
  const t = TOKENS[mode] || TOKENS.light
  return createTheme({
    palette: {
      mode,
      primary: { main: t.accent },
      error: { main: t.warn },
      success: { main: t.good },
      background: { default: t.bg, paper: t.surface },
      text: { primary: t.ink, secondary: t.muted },
      divider: t.rule,
      // Custom book tokens consumed by BookProse and Mermaid.
      book: t,
    },
    typography: {
      fontFamily: SANS,
      h1: { fontFamily: SERIF },
    },
    shape: { borderRadius: 6 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: t.bg },
        },
      },
    },
  })
}
