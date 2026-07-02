# Single Continuous Page HTML to PDF Conversion

This README documents the exact method used to export an HTML document as a perfectly-sized, single continuous page PDF (like a seamless scroll document) using headless browsers, without breaking the CSS borders or leaving trailing whitespace.

## Overview of the Challenge

When converting HTML to PDF via browser print functionality (like Edge/Chrome's `--print-to-pdf`), you face three main issues:
1. **Page Breaks**: Browsers default to A4 (or similar), chopping the content into multiple pages.
2. **Broken Borders**: Using CSS `outline` can cause artifacts where the border overlaps text, and standard `height: 100%` borders fail if the page spans multiple standard lengths.
3. **Trailing Whitespace**: Setting an arbitrarily large `@page` size (like `99999mm`) removes page breaks but leaves a massive amount of empty white space at the bottom of the PDF.

## The Solution

Here are the step-by-step instructions (which you can give to an AI assistant or DevOps engineer) to achieve a perfect continuous-page PDF export:

### Step 1: Format the CSS Container Properly
Instead of putting borders on `body` or using CSS `outline` which cuts through text, wrap your entire document in a `.sheet` container and use absolutely positioned pseudoelements relative to that container. In `@media print`, keep the padding!

```css
/* Container holding the document content */
.sheet {
  width: 210mm;               /* Standard width (e.g., A4) */
  margin: 0 auto;
  padding: 18mm 18mm 20mm;    /* Keep padding to prevent text overlap */
  position: relative;         /* Crucial for the absolute borders below */
}

@media print {
  html, body { background: white; margin: 0; }
  .sheet {
    width: 100%;
    margin: 0;
    padding: 18mm 18mm 20mm;  /* MUST keep padding in print mode */
    box-shadow: none;
  }
}

/* Outer Border spanning the exact dynamic height */
.sheet::before {
  content: '';
  position: absolute;
  top: 10mm;
  left: 10mm;
  right: 10mm;
  bottom: 10mm;
  border: 0.5pt solid #d9dbe6;
  pointer-events: none;
}
```

### Step 2: Dynamically Measure Content Height
Before exporting the PDF, measure the exact pixel height of the document so you can generate a custom-sized page that perfectly fits the content without whitespace.

Use Node.js with `puppeteer-core` (or any equivalent headless browser automation tool) to measure the height:
```javascript
// measure.js
const puppeteer = require('puppeteer-core');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
    const browser = await puppeteer.launch({ executablePath: edgePath, headless: true });
    const page = await browser.newPage();
    await page.goto('file:///path/to/your/file.html', { waitUntil: 'networkidle0' });
    
    // Get total scroll height
    const heightPx = await page.evaluate(() => document.documentElement.scrollHeight);
    console.log(heightPx);
    
    await browser.close();
})();
```

### Step 3: Inject Custom `@page` Size and Print to PDF
Once you have the pixel height (e.g., `1691px`), convert it to millimeters (`height_px * 25.4 / 96`). 
For a 1691px height, the calculation is `1691 * (25.4 / 96) = ~447.4mm`. Add ~1mm for safety (e.g., `448mm`).

Temporarily inject the required custom `@page` size into the HTML and use Edge/Chrome headless to export:

```powershell
# PowerShell syntax example
$html = Get-Content "document.html" -Raw

# Inject the exact measured size into the print stylesheets
$customCss = @"
<style>
  @page { size: 210mm 448mm; margin: 0; }
  @media print { html, body { margin: 0; } }
</style>
"@
$html = $html -replace "</head>", "$customCss</head>"
$html | Out-File "document_temp.html"

# Run headless Edge to render the PDF
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" `
    --headless `
    --disable-gpu `
    --no-pdf-header-footer `
    --print-to-pdf="final.pdf" `
    --print-to-pdf-no-header `
    "file:///$(Convert-Path document_temp.html)"
```

## AI Prompt Summary
If you need an AI to replicate this later, you can give them this prompt:
*"I need to convert this HTML into a single long-page PDF. First, ensure the main container uses `position: relative` with `padding`, and apply borders using `position: absolute` with `top`/`bottom` properties rather than `outline`. Then, write a script using puppeteer-core to measure the exact `scrollHeight` in pixels. Convert that height to mm, inject an `@page { size: 210mm EXACT_HEIGHT_MM; margin: 0; }` style into the HTML, and finally export it using Chrome/Edge headless `--print-to-pdf`."*
