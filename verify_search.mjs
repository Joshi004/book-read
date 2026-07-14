// verify_search.mjs — Playwright checks for full-text + fuzzy search and
// exact-position navigation. Run against a `vite preview` server:
//   npm run build && npm run preview -- --port 4173 &
//   node verify_search.mjs
import { chromium } from 'playwright'

const BASE = 'http://localhost:4173/'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()
await page.goto(BASE)
await page.waitForTimeout(500)

// 1. Open search, type a deliberate typo of a term known to exist in chapter 6
// ("perception" appears 24 times) — exercises fuzzy matching, not substring.
await page.getByRole('button', { name: 'Search' }).click()
await page.getByPlaceholder('Search the book…').fill('perceptoin')
await page.waitForTimeout(300)

// 2. Multiple grouped hits should render — regression test against the old
// first-match-only behavior.
const hitCount = await page.locator('[data-testid="search-hit"]').count()
console.log('hit count for fuzzy query "perceptoin":', hitCount)
if (hitCount < 2) throw new Error('expected multiple hits, got ' + hitCount)

// 3. Click the first hit; URL should carry block/term/occ.
await page.locator('[data-testid="search-hit"]').first().click()
await page.waitForTimeout(1000) // settle smooth-scroll
const url = page.url()
console.log('url after click:', url)
if (!/#\/chapter\/6\?block=.+&term=.+&occ=\d+/.test(url)) {
  throw new Error('URL did not carry block/term/occ query params: ' + url)
}

// 4. The target block should be in the viewport.
const blockId = new URL(url.replace('#', '')).searchParams.get('block')
const target = page.locator(`[data-block-id="${blockId}"]`)
const box = await target.boundingBox()
const viewport = page.viewportSize()
console.log('target block box:', box, 'viewport:', viewport)
if (!box || box.y < 0 || box.y > viewport.height) {
  throw new Error('target block is not within the viewport after scroll')
}

// 5. Exactly one highlight mark, and its text is the CORRECTED term
// ("perception"), not the typed typo ("perceptoin") — proves matchedTerm
// (not raw input) drives the highlight.
const marks = page.locator('mark.search-hit-highlight')
const markCount = await marks.count()
const markText = markCount ? await marks.first().textContent() : null
console.log('highlight count:', markCount, 'highlight text:', markText)
if (markCount !== 1) throw new Error('expected exactly one highlight, got ' + markCount)
if (markText.toLowerCase() !== 'perception') {
  throw new Error(`expected highlight text "perception", got "${markText}"`)
}

// 6. Hard refresh: scroll+highlight must still land correctly from the URL
// query string alone (no location.state survives a reload) — the shareable
// link requirement.
await page.reload()
await page.waitForTimeout(1000)
const marksAfterReload = page.locator('mark.search-hit-highlight')
const reloadMarkCount = await marksAfterReload.count()
const reloadMarkText = reloadMarkCount ? await marksAfterReload.first().textContent() : null
console.log('highlight count after reload:', reloadMarkCount, 'text:', reloadMarkText)
if (reloadMarkCount !== 1 || reloadMarkText.toLowerCase() !== 'perception') {
  throw new Error('scroll+highlight did not survive a hard refresh via URL query params')
}

// 7. Regression check: a fresh direct chapter visit still renders body text
// (lazy chapter-content loading didn't break normal reading).
await page.goto(BASE + '#/chapter/9')
await page.waitForTimeout(1000)
const bodyText = await page.locator('article').first().innerText()
console.log('chapter 9 body length after fresh nav:', bodyText.length)
if (bodyText.length < 200) throw new Error('chapter 9 body did not render after direct navigation')

console.log('DONE')
await browser.close()
