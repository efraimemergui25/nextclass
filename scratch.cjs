const puppeteer = require('/tmp/puppeteer-test/node_modules/puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('pageerror', err => console.error('PAGE_ERROR:', err.message));
  page.on('console', msg => {
    if(msg.type() === 'error') console.error('CONSOLE_ERROR:', msg.text());
  });
  await page.goto('http://localhost:5176/admin', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
