const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
];

const headers = [
    {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
    },
    {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.5',
        'Connection': 'keep-alive',
    },
];

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

async function runPuppeteer(phoneNumber) {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ],
    });

    try {
        const page = await browser.newPage();

        // Set random user-agent
        const userAgent = getRandomItem(userAgents);
        await page.setUserAgent(userAgent);

        // Set random headers
        const selectedHeaders = getRandomItem(headers);
        await page.setExtraHTTPHeaders(selectedHeaders);

        // Handle pop-ups
        page.on('dialog', async dialog => {
            console.log('Dialog detected:', dialog.message());
            await dialog.dismiss();
        });

        // Navigate to the form page
        const formUrl = 'https://seniorplanreview.com/action.php';
        console.log(`Navigating to ${formUrl}`);
        await page.goto(formUrl, {
            waitUntil: 'networkidle2',
            timeout: 60000,
        });

        // Check for form input
        console.log('Waiting for form input');
        await page.waitForSelector('input[name="phone"]', { timeout: 15000 });

        // Wait for Jornaya script (optional)
        try {
            console.log('Waiting for Jornaya script');
            await page.waitForSelector('#LeadiDscript_campaign', { timeout: 15000 });
        } catch (e) {
            console.log('Jornaya script not found or took too long, proceeding anyway:', e.message);
        }

        // Simulate human-like delays
        await page.waitForTimeout(Math.random() * 1000 + 500);

        // Fill phone number
        console.log('Filling phone number');
        await page.type('input[name="phone"]', phoneNumber, { delay: 100 });

        // Check TCPA checkbox
        console.log('Checking TCPA checkbox');
        await page.click('#leadid_tcpa_disclosure');
        await page.waitForTimeout(Math.random() * 500 + 200);

        // Submit form
        console.log('Submitting form');
        await page.click('input[type="submit"][name="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

        // Extract leadid_token from cookies
        console.log('Extracting cookies');
        const cookies = await page.cookies();
        console.log('Cookies:', cookies);
        let leadId = 'Not found';
        const leadIdCookie = cookies.find(cookie => cookie.name === 'leadid_token');
        if (leadIdCookie) {
            leadId = leadIdCookie.value;
        } else {
            console.log('leadid_token cookie not found, checking DOM');
            leadId = await page.evaluate(() => {
                const element = document.querySelector('#leadid_token');
                return element ? element.value : 'Not found in DOM';
            });
        }

        await browser.close();
        return leadId;
    } catch (error) {
        await browser.close();
        throw new Error(`Puppeteer error: ${error.message}`);
    }
}

// Run script with phone number from command line
const phoneNumber = process.argv[2];
if (!phoneNumber) {
    console.error('Phone number is required');
    process.exit(1);
}

runPuppeteer(phoneNumber)
    .then(leadId => {
        console.log('Final Lead ID:', leadId);
        process.exit(0);
    })
    .catch(error => {
        console.error(error.message);
        process.exit(1);
    });