import { chromium } from 'playwright';
const SCRATCHPAD = process.env.SCRATCHPAD;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

await page.goto('http://localhost:5176/#/chapter/6');
await page.waitForTimeout(3000);

// Check Mermaid rendered SVGs (they render inside .figure-diagram via dangerouslySetInnerHTML)
const mermaidSvgs = await page.locator('figure.figure-diagram svg').count();
console.log('Mermaid SVG count (figure.figure-diagram svg):', mermaidSvgs);

// Check for fallback <pre> (indicates mermaid error)
const mermaidErrors = await page.locator('pre').evaluateAll(nodes => 
  nodes.filter(n => n.textContent.includes('flowchart')).length
);
console.log('Mermaid error fallbacks (pre with flowchart):', mermaidErrors);

// Check callout boxes rendered (Callout component)
const calloutDivs = await page.locator('[class*="callout"], [class*="Callout"]').count();
console.log('Callout div count:', calloutDivs);

// Scroll through the page for screenshots of key sections
// Screenshot: Mermaid diagram area
await page.evaluate(() => window.scrollTo(0, 2000));
await page.waitForTimeout(500);
await page.screenshot({ path: `${process.env.SCRATCHPAD}/ch6_context_section.png` });

await page.evaluate(() => window.scrollTo(0, 3500));
await page.waitForTimeout(500);
await page.screenshot({ path: `${process.env.SCRATCHPAD}/ch6_permission_section.png` });

// Check dark mode button - try by position (usually top right)
const btns = await page.locator('button').evaluateAll(nodes => 
  nodes.map(n => ({ text: n.textContent?.trim(), aria: n.getAttribute('aria-label'), cls: n.className }))
);
console.log('Buttons:', JSON.stringify(btns, null, 2));

await browser.close();
console.log('DONE');
