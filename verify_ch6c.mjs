import { chromium } from 'playwright';
const SCRATCHPAD = process.env.SCRATCHPAD;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

await page.goto('http://localhost:5176/#/chapter/6');
await page.waitForTimeout(2500);

// Dark mode toggle
await page.locator('button[aria-label="Toggle color mode"]').click();
await page.waitForTimeout(1000);
await page.screenshot({ path: `${SCRATCHPAD}/ch6_dark_top.png` });

// Scroll to see diagrams in dark mode
await page.evaluate(() => window.scrollTo(0, 1400));
await page.waitForTimeout(500);
await page.screenshot({ path: `${SCRATCHPAD}/ch6_dark_diagrams.png` });

await browser.close();
console.log('DONE');
