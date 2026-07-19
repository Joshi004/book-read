// verify_highlights.mjs — Playwright end-to-end checks for reader highlights.
// Run against a `vite preview` server:
//   npm run build && npm run preview -- --port 4173 &
//   node verify_highlights.mjs
import { chromium } from 'playwright'

const BASE = 'http://localhost:4173/'
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()
page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message))

function assert(cond, msg) {
  if (!cond) throw new Error('FAIL: ' + msg)
  console.log('ok -', msg)
}

// --- Open a chapter with prose + a diagram ---------------------------------
await page.goto(BASE + '#/chapter/3')
await page.waitForSelector('.book-prose p[data-block-id]', { timeout: 10000 })
await page.waitForTimeout(400)

// --- 1. Select text in the first prose paragraph, create a highlight -------
const para = page.locator('.book-prose p[data-block-id]').first()
const paraBlockId = await para.getAttribute('data-block-id')
await para.evaluate((el) => {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let textNode = null
  let n
  while ((n = walker.nextNode())) {
    if (n.nodeValue && n.nodeValue.trim().length >= 20) {
      textNode = n
      break
    }
  }
  if (!textNode) throw new Error('no suitable text node in paragraph')
  const range = document.createRange()
  range.setStart(textNode, 0)
  range.setEnd(textNode, 18)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
  document.dispatchEvent(new Event('selectionchange'))
})
await page.waitForTimeout(400)
await page.getByRole('button', { name: 'Highlight', exact: true }).click()
await page.waitForTimeout(300)
const markCount = await page.locator('mark.reader-highlight').count()
assert(markCount >= 1, 'a persistent <mark.reader-highlight> was created for text selection')

// --- 2. Persists across reload (localStorage) ------------------------------
await page.reload()
await page.waitForSelector('.book-prose p[data-block-id]', { timeout: 10000 })
await page.waitForTimeout(600)
const markAfterReload = await page.locator('mark.reader-highlight').count()
assert(markAfterReload >= 1, 'highlight persists after reload')

// --- 3. Click the highlight → popover → add a note -------------------------
await page.locator('mark.reader-highlight').first().click()
await page.waitForTimeout(200)
await page.getByRole('button', { name: 'Add note' }).click()
await page.getByPlaceholder('Add a note…').fill('my test note')
await page.getByRole('button', { name: 'Save' }).click()
await page.waitForTimeout(300)
const noted = await page.locator('mark.reader-highlight--noted').count()
assert(noted >= 1, 'note attached — highlight shows the noted treatment')

// --- 4. Element highlight: hover a diagram figure, click the affordance -----
const figure = page.locator('.book-prose figure.figure-diagram[data-block-id]').first()
const hasFigure = (await figure.count()) > 0
if (hasFigure) {
  await figure.scrollIntoViewIfNeeded()
  await page.mouse.move(0, 0) // reset pointer so the next hover fires a fresh mouseover
  await page.waitForTimeout(100)
  await figure.hover()
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Highlight this' }).click()
  await page.waitForTimeout(300)
  const elHi = await page.locator('.book-prose .reader-highlight-element').count()
  assert(elHi >= 1, 'diagram/figure element highlight created')
} else {
  console.log('note - no diagram figure in chapter 3; skipping element-highlight check')
}

// --- 5. Highlights page lists them and links back --------------------------
await page.goto(BASE + '#/highlights')
await page.waitForTimeout(500)
const cardText = await page.locator('body').innerText()
assert(/my test note/.test(cardText), 'note appears on the Highlights page')
assert(/Highlights/.test(cardText), 'Highlights page renders')

// Click "Go to passage" on the first card → lands on chapter with hl param
await page.getByRole('link', { name: /Go to passage/ }).first().click()
await page.waitForTimeout(800)
const url = page.url()
assert(/#\/chapter\/\d+\?block=.+&hl=.+/.test(url), 'deep link carries block + hl params: ' + url)
await page.waitForTimeout(400)
const flashSeen = await page.locator('mark.reader-highlight, .reader-highlight-element').count()
assert(flashSeen >= 1, 'target highlight present after navigating from Highlights page')

// --- 6. Remove a highlight from the popover --------------------------------
await page.locator('mark.reader-highlight').first().click()
await page.waitForTimeout(200)
await page.getByRole('button', { name: 'Remove' }).click()
await page.waitForTimeout(300)
console.log('ok - remove action executed without error')

// --- 7. Search still works (regression on shared block-id system) ----------
await page.goto(BASE + '#/chapter/3')
await page.waitForTimeout(300)
await page.getByRole('button', { name: 'Search', exact: true }).click()
await page.getByPlaceholder('Search the book…').fill('behavior')
await page.waitForTimeout(400)
const hits = await page.locator('[data-testid="search-hit"]').count()
assert(hits >= 1, 'search still returns hits (block-id system intact)')

console.log('\nALL HIGHLIGHT CHECKS PASSED')
await browser.close()
