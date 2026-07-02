import { formatCurrency, amountInWords } from '../utils/currency'

export default function InvoicePreview({ data, installmentView = null }) {
  const subtotal = data.items.reduce((sum, item) => sum + (item.qty * item.rate), 0)
  const sym = data.currency || '₹'

  // Discount
  const discountAmount = data.showDiscount
    ? Math.round(subtotal * (data.discountPercent || 0) / 100)
    : 0
  const afterDiscount = subtotal - discountAmount

  // Installment
  let payableAmount
  let installLabel = ''
  if (installmentView) {
    // Rendering a specific installment (A, B, C...)
    payableAmount = Math.round(afterDiscount * installmentView.percent / 100)
    installLabel = installmentView.label
  } else if (data.showInstallment) {
    payableAmount = Math.round(afterDiscount * data.installmentPercent / 100)
    installLabel = data.installmentLabel
  } else {
    payableAmount = afterDiscount
  }

  const totalDue = payableAmount + data.tax
  const words = amountInWords(totalDue, sym)

  const invoiceNo = installmentView ? installmentView.invoiceNo : data.invoiceNo
  const badge = installmentView ? installmentView.badge : data.badge
  const subtitle = installmentView ? (installmentView.subtitle || data.subtitle) : data.subtitle
  const footerLine = data.footerText || `Invoice ${invoiceNo} · ${data.toName || 'Client'} × ${data.fromWebsite} · ${data.date}`

  return (
    <div className="sheet" id={installmentView ? `invoice-sheet-${installmentView.suffix}` : 'invoice-sheet'}>

      {/* HEADER */}
      <header className="doc-header">
        <div className="brand">
          <div className="doc-badge">{badge}</div>
          <div className="doc-title">{data.title || 'Invoice'}</div>
          <div className="doc-sub">{subtitle}</div>
        </div>
        <div className="doc-meta">
          <div className="meta-label">Invoice No.</div>
          <div className="meta-value">{invoiceNo}</div>
          <div className="meta-sep"></div>
          <div className="meta-label">Date</div>
          <div className="meta-value">{data.date}</div>
        </div>
      </header>

      {/* DUE DATE BAR */}
      {data.showDueBar && (
        <div className="due-highlight">
          <div>
            <div className="due-label">Payment Due</div>
            <div className="due-value">{data.dueText}</div>
          </div>
          <div className="due-status">
            <span className={`status-badge ${installmentView?.status || data.status}`}>
              {(installmentView?.status || data.status) === 'paid' ? 'Paid' : 'Pending'}
            </span>
          </div>
        </div>
      )}

      {/* PARTIES */}
      <div className="inv-section">
        <div className="section-header">
          <span className="section-num">01</span>
          <span className="section-title">Bill From / Bill To</span>
          <span className="section-line"></span>
        </div>
        <div className="parties-grid">
          <div className="party-card from">
            <div className="party-role">From</div>
            <div className="party-name">{data.fromName}</div>
            <div className="party-detail">
              {data.fromPhone}<br />
              {data.fromEmail}<br />
              {data.fromWebsite}
            </div>
          </div>
          <div className="party-divider"></div>
          <div className="party-card to">
            <div className="party-role">Bill To</div>
            <div className="party-name">
              {data.toName}
              {data.toContact && <><br />{data.toContact}</>}
            </div>
            <div className="party-detail">
              {data.toPhone && <>{data.toPhone}<br /></>}
              {data.toEmail}
            </div>
          </div>
        </div>
      </div>

      {/* REFERENCE */}
      {data.showReference && data.reference && (
        <div className="inv-section">
          <div className="section-header">
            <span className="section-num">02</span>
            <span className="section-title">Reference</span>
            <span className="section-line"></span>
          </div>
          <div className="notes-box">
            {data.reference}
            {data.referenceNote && <><br /><strong>{data.referenceNote}</strong></>}
          </div>
        </div>
      )}

      {/* ITEMISED SERVICES */}
      <div className="inv-section">
        <div className="section-header">
          <span className="section-num">{data.showReference && data.reference ? '03' : '02'}</span>
          <span className="section-title">Itemised Services</span>
          <span className="section-line"></span>
        </div>
        <table className="invoice-table">
          <thead>
            <tr>
              <th style={{ width: '6%' }}>#</th>
              <th style={{ width: '54%' }}>Description</th>
              <th style={{ width: '12%' }}>Qty</th>
              <th style={{ width: '14%' }}>Rate</th>
              <th style={{ width: '14%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>
                  {item.name || '—'}
                  {item.desc && <div className="item-desc">{item.desc}</div>}
                </td>
                <td>{item.qty}</td>
                <td>{formatCurrency(item.rate, sym)}</td>
                <td>{formatCurrency(item.qty * item.rate, sym)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS + BANK DETAILS */}
        <div className="totals-wrapper">
          {/* Left: Bank Details */}
          {data.showBankDetails && (
            <div className="payment-info-card" style={{ margin: 0, alignSelf: 'stretch' }}>
              <div className="payment-info-title">Bank Transfer Details</div>
              <div className="bank-detail">
                <span className="bank-label">Account Name</span> {data.accountName}<br />
                <span className="bank-label">Bank Name</span> {data.bankName}<br />
                <span className="bank-label">Account No.</span> {data.accountNo}<br />
                <span className="bank-label">IFSC Code</span> {data.ifsc}<br />
                <span className="bank-label">Branch Code</span> {data.branchCode}
              </div>
            </div>
          )}

          {/* Right: Totals */}
          <div className="totals-box" style={!data.showBankDetails ? { marginLeft: 'auto' } : {}}>
            <div className="totals-row">
              <span className="label">Project Total</span>
              <span className="value">{formatCurrency(subtotal, sym)}</span>
            </div>
            {data.showDiscount && discountAmount > 0 && (
              <div className="totals-row">
                <span className="label" style={{ color: '#2a7d4f', fontWeight: 600 }}>
                  {data.discountLabel || 'Discount'} ({data.discountPercent}%)
                </span>
                <span className="value" style={{ color: '#2a7d4f', fontWeight: 600 }}>
                  -{formatCurrency(discountAmount, sym)}
                </span>
              </div>
            )}
            {(installmentView || data.showInstallment) && (
              <div className="totals-row">
                <span className="label" style={{ color: 'var(--gold)', fontWeight: 600 }}>
                  {installLabel}
                </span>
                <span className="value" style={{ color: 'var(--gold)', fontWeight: 600 }}>
                  {formatCurrency(payableAmount, sym)}
                </span>
              </div>
            )}
            <div className="totals-row">
              <span className="label">{data.taxLabel || 'Tax'}</span>
              <span className="value">{formatCurrency(data.tax, sym)}</span>
            </div>
            <div className="totals-row grand">
              <span className="label">Amount Payable Now</span>
              <span className="value">{formatCurrency(totalDue, sym)}</span>
            </div>
          </div>
        </div>
        <div className="amount-words">{words}</div>
      </div>

      {/* NOTES & TERMS */}
      {data.showNotes && data.notes && (
        <div className="inv-section">
          <div className="section-header">
            <span className="section-num">04</span>
            <span className="section-title">Notes & Terms</span>
            <span className="section-line"></span>
          </div>
          <div className="notes-box">
            <strong style={{
              fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '.1em',
              color: 'var(--ink2)', display: 'block', marginBottom: '5pt'
            }}>Terms</strong>
            {data.notes}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="doc-footer">
        <span className="footer-text">{footerLine}</span>
        <span className="footer-mark">Page 1 of 1</span>
      </div>
    </div>
  )
}
