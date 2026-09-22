const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
    let browser;
    try {
        const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
        const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
        const fs = require('fs');
        
        let execPath = fs.existsSync(edgePath) ? edgePath : chromePath;

        browser = await puppeteer.launch({
            executablePath: execPath,
            headless: true
        });
        
        const page = await browser.newPage();
        
        const htmlPath = process.argv[2];
        const filePath = 'file:///' + path.resolve(htmlPath).replace(/\\/g, '/');
        
        await page.goto(filePath, { waitUntil: 'networkidle0' });
        
        const heightPx = await page.evaluate(() => {
            const el = document.querySelector('.sheet');
            if (el) {
                // Return exact bounding box height of .sheet including padding, plus margin if needed
                // But the margin is inside @media print so it might be 0. Let's just get the scrollHeight of body
                return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, el.offsetHeight);
            }
            return document.documentElement.scrollHeight;
        });
        
        console.log(`HEIGHT_PX=${heightPx}`);
    } catch (e) {
        console.error(e);
    } finally {
        if (browser) await browser.close();
    }
})();
