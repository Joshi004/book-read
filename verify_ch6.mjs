import { chromium } from 'playwright';
const SCRATCHPAD = process.env.SCRATCHPAD;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

await page.goto('http://localhost:5176/#/chapter/6');
await page.waitForTimeout(2500);

await page.screenshot({ path: `${SCRATCHPAD}/ch6_light.png`, fullPage: true });

const h1 = await page.locator('h1').first().textContent().catch(() => 'not found');
console.log('H1:', h1);

const svgImg = await page.locator('img[src*="chapter06_pcp_model"]').count();
console.log('SVG diagram present:', svgImg);

const mermaidSvgs = await page.locator('.mermaid svg, svg.mermaid, [id*="mermaid"] svg').count();
console.log('Mermaid SVG count:', mermaidSvgs);

const h2s = await page.locator('h2').evaluateAll(nodes => nodes.map(n => n.textContent.trim()));
console.log('H2 headings:', JSON.stringify(h2s));

const hasKeyTakeaways = h2s.some(h => h.includes('Key Takeaways'));
console.log('Has Key Takeaways:', hasKeyTakeaways);

// Check the page text for PCP / definition callouts
const pageText = await page.locator('body').textContent();
const hasPerception = pageText.includes('Perception');
const hasContext = pageText.includes('Context');
const hasPermission = pageText.includes('Permission');
console.log('Has Perception:', hasPerception, 'Context:', hasContext, 'Permission:', hasPermission);

// Check TOC
await page.goto('http://localhost:5176/');
await page.waitForTimeout(1500);
const tocText = await page.locator('body').textContent();
const hasCh6InTOC = tocText.includes('PCP') || tocText.includes('Chapter 6');
console.log('Chapter 6 in TOC:', hasCh6InTOC);
await page.screenshot({ path: `${SCRATCHPAD}/ch6_toc.png`, fullPage: false });

// Dark mode check
await page.goto('http://localhost:5176/#/chapter/6');
await page.waitForTimeout(1500);
const darkBtn = await page.locator('button').filter({ hasText: /dark|light|theme|moon|sun/i }).first();
try {
  await darkBtn.click({ timeout: 3000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SCRATCHPAD}/ch6_dark.png`, fullPage: false });
  console.log('Dark mode toggled');
} catch(e) {
  // Try clicking any toggle button visible
  const allBtns = await page.locator('button').count();
  console.log('Dark toggle not found, total buttons:', allBtns);
}

await browser.close();
console.log('DONE');
