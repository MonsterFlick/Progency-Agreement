const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const candidateBrowserPaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
];

function findBrowserExecutable() {
    const execPath = candidateBrowserPaths.find(p => fs.existsSync(p));
    if (!execPath) {
        throw new Error('No Chromium-based browser (Edge, Chrome, or Brave) found on system.');
    }
    return execPath;
}

/**
 * Recursively find all HTML files inside a directory matching a pattern or inside /html/ folders
 */
function findHtmlFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            if (item.name === 'bkp' || item.name === 'node_modules' || item.name === '.git') {
                continue; // Skip backups, node_modules, and git
            }
            findHtmlFiles(fullPath, fileList);
        } else if (item.isFile() && item.name.endsWith('.html')) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

/**
 * Converts a single HTML file into a continuous-page PDF
 */
async function convertHtmlToPdf(browser, htmlFilePath, pdfFilePath) {
    const startTime = Date.now();
    const page = await browser.newPage();

    try {
        const resolvedHtml = path.resolve(htmlFilePath);
        const resolvedPdf = path.resolve(pdfFilePath);

        // Ensure target directory exists
        fs.mkdirSync(path.dirname(resolvedPdf), { recursive: true });

        const fileUri = 'file:///' + resolvedHtml.replace(/\\/g, '/');
        await page.goto(fileUri, { waitUntil: 'networkidle0', timeout: 30000 });

        // Inject print-reset styles to ensure accurate measurement and single-page continuous output
        await page.addStyleTag({
            content: `
                @page { margin: 0 !important; size: auto; }
                body { margin: 0 !important; padding: 0 !important; height: auto !important; }
                .sheet { margin: 0 !important; box-shadow: none !important; }
            `
        });

        // Small delay to ensure all web fonts and layout styles apply
        await new Promise(r => setTimeout(r, 400));

        // Measure actual content container height
        const contentHeight = await page.evaluate(() => {
            const sheet = document.querySelector('.sheet');
            if (!sheet) return document.documentElement.scrollHeight;

            const style = window.getComputedStyle(sheet);
            const marginTop = parseFloat(style.marginTop) || 0;
            const marginBottom = parseFloat(style.marginBottom) || 0;
            return Math.ceil(sheet.offsetHeight + marginTop + marginBottom);
        });

        await page.pdf({
            path: resolvedPdf,
            width: '210mm',
            height: (contentHeight + 2) + 'px', // 2px buffer to prevent rounding overflow
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            printBackground: true,
            preferCSSPageSize: false,
            displayHeaderFooter: false
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        const stats = fs.statSync(resolvedPdf);
        const sizeKb = (stats.size / 1024).toFixed(1);

        console.log(`  ✓ Generated: ${path.relative(process.cwd(), resolvedPdf)} (${sizeKb} KB, ${contentHeight}px height, ${elapsed}s)`);
    } finally {
        await page.close();
    }
}

(async () => {
    let browser;
    try {
        const args = process.argv.slice(2);
        const isAll = args.includes('--all') || args.includes('-a');

        const execPath = findBrowserExecutable();
        console.log(`\nUsing browser engine: ${execPath}`);

        browser = await puppeteer.launch({
            executablePath: execPath,
            headless: true
        });

        if (isAll) {
            console.log('\nScanning "clients" directory for active HTML documents...');
            const clientsDir = path.resolve('clients');
            const htmlFiles = findHtmlFiles(clientsDir);

            if (htmlFiles.length === 0) {
                console.log('No HTML files found in clients directory.');
                return;
            }

            console.log(`Found ${htmlFiles.length} document(s) to process:\n`);

            for (const htmlPath of htmlFiles) {
                // If file is inside an "html" folder, place PDF in sibling "pdf" folder
                let pdfPath;
                const dirName = path.basename(path.dirname(htmlPath));
                if (dirName.toLowerCase() === 'html') {
                    const parentDir = path.dirname(path.dirname(htmlPath));
                    const baseName = path.basename(htmlPath, '.html');
                    pdfPath = path.join(parentDir, 'pdf', `${baseName}.pdf`);
                } else {
                    const dir = path.dirname(htmlPath);
                    const baseName = path.basename(htmlPath, '.html');
                    pdfPath = path.join(dir, `${baseName}.pdf`);
                }

                console.log(`Processing: ${path.relative(process.cwd(), htmlPath)}`);
                await convertHtmlToPdf(browser, htmlPath, pdfPath);
            }

            console.log('\n✨ All PDFs generated successfully!\n');
        } else {
            const inputHtml = args[0];
            if (!inputHtml) {
                console.log(`
Usage:
  node scripts/generate-pdf.js <input.html> [output.pdf]
  node scripts/generate-pdf.js --all

Examples:
  node scripts/generate-pdf.js clients/FertiSure-HSIL/html/agreement.html
  node scripts/generate-pdf.js clients/CREA-HR-Advisory/html/commercial-quotation.html clients/CREA-HR-Advisory/pdf/commercial-quotation.pdf
  node scripts/generate-pdf.js --all
                `);
                process.exit(0);
            }

            let outputPdf = args[1];
            if (!outputPdf) {
                const dirName = path.basename(path.dirname(inputHtml));
                if (dirName.toLowerCase() === 'html') {
                    const parentDir = path.dirname(path.dirname(inputHtml));
                    const baseName = path.basename(inputHtml, '.html');
                    outputPdf = path.join(parentDir, 'pdf', `${baseName}.pdf`);
                } else {
                    outputPdf = inputHtml.replace(/\.html$/i, '.pdf');
                }
            }

            console.log(`\nProcessing single file: ${inputHtml}`);
            await convertHtmlToPdf(browser, inputHtml, outputPdf);
            console.log('\n✨ Done!\n');
        }
    } catch (err) {
        console.error('\n❌ PDF Generation Error:', err.message);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
    }
})();
