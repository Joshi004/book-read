import { createTheme } from '@mui/material/styles'

// macOS system stacks first (so Mac readers see the intended faces), then the
// Google Fonts loaded in index.html as fallbacks for everyone else.
export const SERIF =
  '"Iowan Old Style", "Palatino Linotype", "Palatino", "Gentium Book Plus", "Georgia", serif'
export const SANS = '"Avenir Next", "Helvetica Neue", "Inter", Arial, sans-serif'
export const MONO =
  '"SF Mono", "IBM Plex Mono", Menlo, ui-monospace, "Courier New", monospace'

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
    // Behavior Elements page — the 6 color bands from chapter 26's "Reading
    // the Colors" legend. Chosen and validated with the dataviz skill
    // (scripts/validate_palette.js) for lightness band, CVD-safe pairwise
    // separation, and contrast; `bteOnFill` is the text color for symbols
    // printed on top of these fills (deliberately not `ink` — these are
    // mid-toned swatches, not pale tints, so white text reads better than
    // dark ink here even in light mode). One documented exception: `grey`
    // sits below the strict chroma floor the validator wants — reading as
    // genuinely desaturated is the whole point of that band (the chapter's
    // own "highest-stress, rated 4.0" color), mitigated by every cell always
    // showing its symbol/name/DRS as text, never color alone.
    bte: {
      green: '#1F8F5E',
      tan: '#B8631F',
      yellow: '#B8890A',
      grey: '#7A5F3E',
      turquoise: '#0A9186',
      blue: '#3E5CA8',
    },
    bteOnFill: '#FFFFFF',
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
    // See TOKENS.light.bte for the derivation/validation notes. Same 6 bands,
    // stepped for the dark surface (OKLCH L 0.48-0.67) — `bteOnFill` flips to
    // near-black here since these fills stay mid-bright even in dark mode.
    bte: {
      green: '#4CA46E',
      tan: '#B85A18',
      yellow: '#B08A1E',
      grey: '#8C7550',
      turquoise: '#2EA398',
      blue: '#4A78B0',
    },
    bteOnFill: '#141310',
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
