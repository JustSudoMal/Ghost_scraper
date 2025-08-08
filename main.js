const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const LOGIN_URL = '<replaceme>'; 
const PAYLOADS_FILE = path.resolve(__dirname, 'payloads.txt');
const OUTPUT_FILE = path.resolve(__dirname, 'results.csv');

// Replace with valid staging credentials
const USER_EMAIL = 'your-email@example.com';
const USER_PASSWORD = 'your-password';

// Adjust selectors after inspecting <domain>
const EMAIL_SELECTOR = 'input[name="email"]';
const PASSWORD_SELECTOR = 'input[name="password"]';
const LOGIN_BUTTON_SELECTOR = 'button[type="submit"]';

// After login, target input selector (example: search input)
const TARGET_INPUT_SELECTOR = 'input[placeholder="Search"]'; 

const BLOCK_KEYWORDS = [
  'access denied',
  'forbidden',
  'waf detected',
  'request blocked',
  'error',
  'not allowed',
  'denied',
  'blocked',
  'too many requests',
  'captcha'
];

(async () => {
  // Prepare output file
  fs.writeFileSync(OUTPUT_FILE, 'payload,status,block_status,response_url\n');

  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // Intercept responses to analyze
  page.on('response', async (response) => {
    try {
      const url = response.url();
      const status = response.status();
      if (status >= 400) {
        console.log(`Warning: Response status ${status} from ${url}`);
      }
    } catch (e) {
      // ignore
    }
  });

  // Login flow
  console.log('Navigating to login page...');
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

  console.log('Filling login form...');
  await page.waitForSelector(EMAIL_SELECTOR, { timeout: 15000 });
  await page.type(EMAIL_SELECTOR, USER_EMAIL, { delay: 50 });
  await page.type(PASSWORD_SELECTOR, USER_PASSWORD, { delay: 50 });

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click(LOGIN_BUTTON_SELECTOR)
  ]);
  console.log('Logged in successfully.');

  // Wait for main app to load
  await page.waitForSelector(TARGET_INPUT_SELECTOR, { timeout: 20000 });

  // Read payloads
  const fileStream = fs.createReadStream(PAYLOADS_FILE);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const payload of rl) {
    try {
      console.log(`Testing payload: ${payload}`);

      // Clear input and type payload
      await page.focus(TARGET_INPUT_SELECTOR);
      await page.click(TARGET_INPUT_SELECTOR, { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.type(TARGET_INPUT_SELECTOR, payload, { delay: 30 });

      // Submit input (press Enter)
      await page.keyboard.press('Enter');

      // Wait for network idle or a short delay to catch responses
      await page.waitForTimeout(5000);

      // Analyze page content for block keywords
      const content = await page.evaluate(() => document.body.innerText.toLowerCase());
      const blocked = BLOCK_KEYWORDS.some(keyword => content.includes(keyword));

      // Log result
      const status = blocked ? 'BLOCKED' : 'OK';
      console.log(`Payload result: ${status}`);

      fs.appendFileSync(OUTPUT_FILE, `"${payload.replace(/"/g, '""')}",${status},${blocked}\n`);

      // Optional: screenshot for manual review
      // await page.screenshot({ path: `screenshots/${encodeURIComponent(payload)}.png` });

    } catch (err) {
      console.error(`Error testing payload "${payload}":`, err);
      fs.appendFileSync(OUTPUT_FILE, `"${payload.replace(/"/g, '""')}",ERROR,ERROR\n`);
    }
  }

  await browser.close();
  console.log('Fuzzing complete.');
})();
