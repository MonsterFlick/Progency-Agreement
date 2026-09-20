const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
    let browser;
    try {
        const candidatePaths = [
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
        ];
        
        let execPath = candidatePaths.find(p => fs.existsSync(p));
        if (!execPath) {
            throw new Error('No Chromium-based browser (Edge, Chrome, or Brave) found on system.');
        }

        console.log(`Using browser: ${execPath}`);
        
        browser = await puppeteer.launch({
            executablePath: execPath,
            headless: true
        });
        
        const page = await browser.newPage();
        
        const htmlFile = process.argv[2] || 'invoice.html';
        const outputFile = process.argv[3] || 'invoice.pdf';
        
        const filePath = 'file:///' + path.resolve(htmlFile).replace(/\\/g, '/');
        console.log(`Loading: ${filePath}`);
        
        await page.goto(filePath, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Inject style to force single page and remove all margins/shadows
        await page.addStyleTag({
            content: `
                @page { margin: 0 !important; size: auto; }
                body { margin: 0 !important; padding: 0 !important; height: auto !important; }
                .sheet { margin: 0 !important; box-shadow: none !important; }
            `
        });

        // Small delay to ensure styles apply
        await new Promise(r => setTimeout(r, 500));
        
        // Measure actual content height
        const contentHeight = await page.evaluate(() => {
            const sheet = document.querySelector('.sheet');
            if (!sheet) return document.documentElement.scrollHeight;
            
            // Get the exact height of the content container
            const style = window.getComputedStyle(sheet);
            const marginTop = parseFloat(style.marginTop) || 0;
            const marginBottom = parseFloat(style.marginBottom) || 0;
            
            // We want just the sheet itself since we zeroed out margins
            return Math.ceil(sheet.offsetHeight + marginTop + marginBottom);
        });
        
        console.log(`Measured content height: ${contentHeight}px`);
        
        await page.pdf({
            path: path.resolve(outputFile),
            width: '210mm',
            height: (contentHeight + 2) + 'px', // Add a 2px buffer to avoid rounding errors causing a second page
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            printBackground: true,
            preferCSSPageSize: false,
            displayHeaderFooter: false
        });
        
        console.log(`✓ PDF generated: ${path.resolve(outputFile)}`);
    } catch (e) {
        console.error('Error generating PDF:', e.message);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
    }
})();
