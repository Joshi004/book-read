// verify_pwa.mjs — Playwright checks for the PWA setup (manifest, service worker,
// offline reading, no-prompt-on-fresh-install). Run against a `vite preview` server:
//   npm run build && npm run preview -- --port 4173 &
//   node verify_pwa.mjs
import { chromium } from 'playwright'

const BASE = 'http://localhost:4173/'

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()
await page.goto(BASE)
await page.waitForTimeout(1000)

// 1. Manifest link present + fetches; required fields + all icons resolve 200.
const href = await page.locator('link[rel="manifest"]').getAttribute('href')
const manifestUrl = new URL(href, BASE).toString()
const manifestRes = await page.request.get(manifestUrl)
console.log('manifest status:', manifestRes.status())
const manifest = await manifestRes.json()
console.log('name/short_name/display:', manifest.name, manifest.short_name, manifest.display)
for (const icon of manifest.icons) {
  const r = await page.request.get(new URL(icon.src, manifestUrl).toString())
  console.log('icon', icon.src, icon.purpose, '->', r.status())
}

// 2. Service worker registers and reaches 'activated'.
await page.waitForFunction(
  async () => {
    const reg = await navigator.serviceWorker.getRegistration()
    return !!reg?.active
  },
  { timeout: 15000 },
)
console.log('SW active: true')

// 3. Update prompt must NOT fire on a fresh install.
console.log(
  'Toast visible on first load (expect 0):',
  await page.getByText('New chapters available').count(),
)

// 4. Offline: app shell + a chapter (incl. its diagram image) still render.
await context.setOffline(true)
await page.reload()
await page.waitForTimeout(1500)
console.log('Home renders offline:', await page.locator('h1,[role="heading"]').first().count())

await page.goto(BASE + '#/chapter/6')
await page.waitForTimeout(1500)
const bodyText = await page.locator('body').textContent()
console.log('Chapter 6 text present offline:', bodyText.includes('Perception'))
console.log(
  'Diagram image present offline:',
  await page.locator('img[src*="chapter06_pcp_model"]').count(),
)

await context.setOffline(false)
await browser.close()
console.log('DONE')
