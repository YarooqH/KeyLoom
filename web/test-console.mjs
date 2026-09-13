import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Browser Error: ${msg.text()}`);
    } else {
      console.log(`Browser log: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    console.error(`Browser Page Error: ${error.message}`);
  });

  console.log('Navigating to http://localhost:5173/#singularity...');
  await page.goto('http://localhost:5173/#singularity', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // Give canvas rendering loop slightly longer to start
  await page.screenshot({ path: 'screenshot.png' });
  console.log('Screenshot saved to screenshot.png');
  await browser.close();
})();
