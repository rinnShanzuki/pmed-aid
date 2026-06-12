const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5174/login');
  
  // Fill login
  await page.type('input[name="email"]', 'doctorOne@pmed-aid.com');
  await page.type('input[name="password"]', 'doctor123'); // assuming default password
  await page.click('button[type="submit"]');
  
  // Wait for navigation
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  
  console.log('Current URL after login:', page.url());
  
  const content = await page.content();
  if (content.includes('Access Denied')) {
    console.log('Got Access Denied!');
  } else if (content.includes('Welcome, Dr.')) {
    console.log('Successfully reached Doctor Dashboard');
  } else {
    console.log('Something else happened.');
  }

  await browser.close();
})();
