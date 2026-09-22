# Progency Agreements & Quotations System

A centralized repository for client commercial agreements, quotations, itemized invoices, and automated single-page continuous PDF generation.

---

## 📁 Repository Directory Structure

The project is organized by organization/client under `clients/`, separating production HTML templates, rendered PDFs, and historical backups.

```
Progency-Agreement/
├── clients/                               # Client organizations & templates
│   ├── CREA-HR-Advisory/                  # CREA HR Advisory deliverables
│   │   ├── html/                          # Main active HTML documents
│   │   │   └── commercial-quotation.html
│   │   ├── pdf/                           # Rendered continuous-page PDFs
│   │   │   └── commercial-quotation.pdf
│   │   └── bkp/                           # Previous drafts, duplicates & previews
│   │       ├── contract.html
│   │       ├── contract.pdf
│   │       ├── quotation.html
│   │       ├── quotation.pdf
│   │       └── previews/
│   │           ├── contract_preview.png
│   │           ├── contract_preview_final.png
│   │           └── contract_preview_updated.png
│   │
│   ├── FertiSure-HSIL/                    # FertiSure / Hemant Surgical Industries
│   │   ├── html/
│   │   │   ├── agreement.html             # Website Development Agreement
│   │   │   ├── invoice-01.html            # Installment 1 of 2 (INV-2026-001A)
│   │   │   └── invoice-02.html            # Installment 2 of 2 (INV-2026-001B)
│   │   ├── pdf/
│   │   │   ├── agreement.pdf
│   │   │   ├── invoice-01.pdf
│   │   │   └── invoice-02.pdf
│   │   └── bkp/
│   │       ├── agreement (5).html         # Raw browser download backup
│   │       ├── invoice.html               # Initial unsplit invoice draft
│   │       └── invoice.pdf
│   │
│   └── Templates/                         # Reusable document templates
│       ├── html/
│       │   └── quotation-tentative.html   # Tentative proposal template
│       └── pdf/
│           └── quotation-tentative.pdf
│
├── scripts/
│   ├── generate-pdf.js                    # Unified continuous PDF generator CLI
│   └── measure.js                         # Headless scroll height measurement
│
├── invoice-generator/                     # Vite + React interactive invoice app
├── package.json
└── README.md
```

---

## 🚀 PDF Generation Commands

The PDF engine automatically detects installed Chromium browsers (Edge, Chrome, Brave) on Windows, measures the exact container pixel height, and renders a seamless continuous-page PDF without trailing whitespace or page breaks.

### Build All Client PDFs
To compile/refresh all HTML documents across all clients at once:
```bash
npm run build:all
```
or directly:
```bash
node scripts/generate-pdf.js --all
```

### Build a Single Document
To compile a specific HTML document to PDF:
```bash
npm run build:pdf clients/CREA-HR-Advisory/html/commercial-quotation.html
```
*(If the destination output path is omitted, the script automatically places the `.pdf` in the adjacent `pdf/` directory.)*

You can also specify a custom destination:
```bash
node scripts/generate-pdf.js clients/FertiSure-HSIL/html/invoice-01.html clients/FertiSure-HSIL/pdf/invoice-01.pdf
```

---

## 🏷️ Standard Naming & Organization Rules

When adding a new client or document:

1. **Client Folder**: Create a directory in `clients/<Organization-Name>/`.
2. **Three Subfolders**:
   - `html/` — Place the active, canonical version of the HTML document here (e.g., `agreement.html`, `invoice-01.html`).
   - `pdf/` — Generated PDFs live here with the same basename as their HTML counterpart.
   - `bkp/` — Place old versions, raw download copies, superseding drafts, or screenshot previews here.
3. **Document Basename**:
   - Agreements: `agreement.html`
   - Quotations: `commercial-quotation.html` or `quotation.html`
   - Invoices: `invoice-01.html`, `invoice-02.html` (with installment numbering)

---

## 🛠️ Technical Background: Single Continuous Page PDF Conversion

When converting HTML to PDF via browser print functionality (like Edge/Chrome's `--print-to-pdf`), you face three common issues:
1. **Page Breaks**: Browsers default to fixed page sizes (like A4), chopping content across pages.
2. **Broken Borders**: CSS `outline` can cause artifacts, and standard `height: 100%` borders fail when content spans variable lengths.
3. **Trailing Whitespace**: Setting an arbitrarily large `@page` size (like `99999mm`) removes page breaks but leaves massive blank white space.

### The Solution Used Here

#### 1. Format the CSS Container
Wrap your document in a `.sheet` container and use absolutely positioned pseudoelements relative to that container:
```css
.sheet {
  width: 210mm;
  margin: 0 auto;
  padding: 18mm 18mm 20mm;
  position: relative;
}

@media print {
  html, body { background: white; margin: 0; }
  .sheet {
    width: 100%;
    margin: 0;
    padding: 18mm 18mm 20mm;
    box-shadow: none;
  }
}

.sheet::before {
  content: '';
  position: absolute;
  top: 10mm; left: 10mm; right: 10mm; bottom: 10mm;
  border: 0.5pt solid #d9dbe6;
  pointer-events: none;
}
```

#### 2. Headless Measurement & Export
`scripts/generate-pdf.js` launches a headless browser, evaluates `sheet.offsetHeight`, and executes `page.pdf` with the dynamic height plus a 2px buffer to guarantee 100% precision with zero extra pages.
