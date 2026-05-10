const puppeteer = require('/tmp/puppeteer-test/node_modules/puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('pageerror', err => console.error('PAGE_ERROR:', err.message));
  page.on('console', msg => {
    if(msg.type() === 'error') console.error('CONSOLE_ERROR:', msg.text());
  });
  
  const routes = ['/admin', '/admin/orders', '/admin/products', '/admin/inventory', '/admin/customers', '/admin/analytics', '/admin/marketing', '/admin/content', '/admin/settings'];
  for (const route of routes) {
    console.log('Testing', route);
    await page.goto('http://localhost:4173' + route, { waitUntil: 'domcontentloaded' }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));
  }
  await browser.close();
})();
