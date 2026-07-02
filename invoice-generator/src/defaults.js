// ─── Default Invoice State ───

export const defaultInvoice = {
  // Meta
  badge: 'Invoice',
  title: 'Invoice',
  subtitle: 'Website Development · Product Catalog & Inquiry Platform',
  invoiceNo: 'INV-2026-001',
  date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
  currency: '₹',

  // Due
  dueText: 'Upon Demo Approval',
  status: 'pending',
  showDueBar: true,

  // From
  fromName: 'Om Bajirao Thakur',
  fromPhone: '+91 77568 98550',
  fromEmail: 'omthakur2366@gmail.com',
  fromWebsite: 'omthakur.in',

  // To
  toName: '',
  toContact: '',
  toPhone: '',
  toEmail: '',

  // Reference
  showReference: true,
  reference: '',
  referenceNote: '',

  // Items
  items: [
    { name: '', desc: '', qty: 1, rate: 0 },
  ],

  // Installment
  showInstallment: false,
  installmentLabel: 'Installment 1 (50%)',
  installmentPercent: 50,
  installmentCount: 2,

  // Tax & Discount
  tax: 0,
  taxLabel: 'Tax',
  showDiscount: false,
  discountPercent: 0,
  discountLabel: 'Discount',

  // Bank
  showBankDetails: true,
  bankName: 'Bank of Baroda',
  accountName: 'Om Bajirao Thakur',
  accountNo: '38700100009185',
  ifsc: 'BARB0SHATHA',
  branchCode: 'SHATHA',

  // Notes
  showNotes: true,
  notes: '',

  // Footer
  footerText: '',
}

export const PAYMENT_TERMS = [
  'Upon Demo Approval',
  'Upon Delivery',
  'Due on Receipt',
  'Net 7',
  'Net 15',
  'Net 30',
  'Net 60',
  'Custom',
]
