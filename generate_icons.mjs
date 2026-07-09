// generate_icons.mjs — renders the app's monogram at exact PWA icon sizes using
// Playwright (already a devDependency) instead of adding ImageMagick/sharp/rsvg-convert.
// Run once locally: `node generate_icons.mjs`, then commit the resulting PNGs/SVG.
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1E3D5C"/>
  <text x="256" y="286" text-anchor="middle" dominant-baseline="central"
        font-family="Georgia, 'Iowan Old Style', 'Palatino Linotype', serif"
        font-size="300" font-weight="700" fill="#F4F1EA">B</text>
</svg>`.trim()

const targets = [
  ['public/pwa-192x192.png', 192],
  ['public/pwa-512x512.png', 512],
  ['public/apple-touch-icon.png', 180],
]

const browser = await chromium.launch()
const page = await browser.newPage()
for (const [file, size] of targets) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><body style="margin:0">${svg(size)}</body></html>`)
  await page.screenshot({ path: file })
  console.log('wrote', file)
}
writeFileSync('public/favicon.svg', svg(512))
console.log('wrote public/favicon.svg')
await browser.close()
