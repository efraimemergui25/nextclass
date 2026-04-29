import { chromium } from 'playwright';
import path from 'path';

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();

    console.log('Navigating...');
    await page.goto('http://localhost:5174/catalog/display-pro-75-uhd', { waitUntil: 'networkidle' });

    console.log('Scrolling to text...');
    // Find the text
    const textLocator = page.locator('text="חיבור מיידי, ללא כבלים"');
    await textLocator.waitFor({ state: 'visible' });
    await textLocator.scrollIntoViewIfNeeded();

    // Wait a moment for any smooth scrolling/lazy rendering to finish
    await page.waitForTimeout(1000);

    const dest = '/Users/efraimmac/.gemini/antigravity/brain/f01a3d9a-3512-4416-a584-2185bafa64d1/specific_proof.png';
    await page.screenshot({ path: dest });
    console.log(`Saved screenshot to ${dest}`);

    await browser.close();
})();
