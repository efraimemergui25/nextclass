import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();

    await page.goto('http://localhost:5174/catalog/display-pro-75-uhd', { waitUntil: 'networkidle' });

    await page.waitForTimeout(1000);

    const layout = await page.evaluate(() => {
        // Just find the order-1 and order-2 grid children
        const visualCol = document.querySelector('.order-1.md\\:order-2');
        const textCol = document.querySelector('.order-2.md\\:order-1');
        const imgWrapper = visualCol ? visualCol.querySelector('.bg-\\[\\#EBEBEF\\]') : null;
        const img = visualCol ? visualCol.querySelector('img') : null;

        return {
            textCol: textCol ? textCol.getBoundingClientRect() : null,
            visualCol: visualCol ? visualCol.getBoundingClientRect() : null,
            imgWrapper: imgWrapper ? imgWrapper.getBoundingClientRect() : null,
            img: img ? { box: img.getBoundingClientRect(), src: img.src, display: getComputedStyle(img).display } : null,
            scrollTop: window.scrollY
        };
    });

    console.log(JSON.stringify(layout, null, 2));

    await browser.close();
})();
