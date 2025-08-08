This script is a web fuzzing automation tool using Puppeteer for browser control. It targets the the page and then fuzzes an input field (like a search bar) with payloads to test for WAF blocks, error responses, or input filtering issues.
 What It Does, Step-by-Step:

    Logs into the site:

        Goes to the web page

        Inputs email/password

        Clicks login and waits for the main page to load

    Reads payloads from payloads.txt, one per line.

    Injects each payload into a specified input field (TARGET_INPUT_SELECTOR).

    Monitors page response:

        Waits for 5 seconds

        Checks the page content for signs of blocks (e.g., "access denied", "captcha", etc.)

    Logs results to results.csv:

        Includes payload, block status, and response URL (optional).

    Takes optional screenshots per payload (disabled by default).

🛠 What It’s Useful For:

    Fuzz testing inputs in a real browser (bypasses JS defenses).

    Detecting WAFs, rate limiting, CAPTCHAs, or error-triggering payloads.

    XSS or injection testing manually via payload injection.

    Web pentests where client-side JS is crucial to trigger logic.

 File Requirements:

    payloads.txt → List of test strings/payloads.

    results.csv → Created/updated automatically.

    screenshots/ folder if you enable screenshot saving.

What to Customize:
Item	Description
USER_EMAIL & USER_PASSWORD	Replace with valid staging credentials.
LOGIN_URL, EMAIL_SELECTOR, etc.	Adjust based on actual site structure.
TARGET_INPUT_SELECTOR	Set the selector of the field you want to fuzz.
BLOCK_KEYWORDS	Expand or change based on block behavior observed.
 Dependencies

Install with:

npm install puppeteer
