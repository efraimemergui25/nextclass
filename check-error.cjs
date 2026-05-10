const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('pageerror', error => {
    console.error('PAGE_ERROR:', error.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('CONSOLE_ERROR:', msg.text());
    }
  });
  await page.goto('http://localhost:5176/admin', { waitUntil: 'networkidle0' }).catch(e => console.error('GOTO_ERROR:', e.message));
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
