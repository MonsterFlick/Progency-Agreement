import { useCallback } from 'react'
import { formatCurrency, CURRENCIES } from '../utils/currency'
import { PAYMENT_TERMS } from '../defaults'

export default function EditorPanel({ data, setData, onExport, onReset, onSave, onBack, onSplitInstallments, saving }) {
  const update = useCallback((key, val) => {
    setData(prev => ({ ...prev, [key]: val }))
  }, [setData])

  const updateItem = useCallback((index, key, val) => {
    setData(prev => {
      const items = [...prev.items]
      items[index] = { ...items[index], [key]: val }
      return { ...prev, items }
    })
  }, [setData])

  const addItem = useCallback(() => {
    setData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', desc: '', qty: 1, rate: 0 }]
    }))
  }, [setData])

  const removeItem = useCallback((index) => {
    setData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }, [setData])

  const sym = data.currency || '₹'

  return (
    <div className="editor-panel">
      {/* Header */}
      <div className="editor-header">
        <div className="editor-brand">
          {onBack && (
            <button className="back-btn" onClick={onBack} title="Back to Manager">←</button>
          )}
          <div className="editor-brand-icon">⚡</div>
          <h1>Invoice Generator</h1>
        </div>
        <div className="editor-brand-sub">Edit fields below · Preview updates live</div>
      </div>

      {/* Actions */}
      <div className="editor-actions">
        <button className="btn btn-primary" onClick={onExport}>📄 Export PDF</button>
        {onSave && (
          <button className="btn btn-save" onClick={onSave} disabled={saving}>
            {saving ? '⏳ Saving...' : '☁ Save'}
          </button>
        )}
        <button className="btn btn-secondary" onClick={onReset}>↺</button>
      </div>

      {/* Scrollable Form */}
      <div className="editor-scroll">

        {/* ─── Invoice Meta ─── */}
        <div className="editor-section">
          <div className="editor-section-title">Invoice Details</div>
          <div className="field-row triple">
            <div className="field-group">
              <label className="field-label">Invoice No.</label>
              <input className="field-input" value={data.invoiceNo} onChange={e => update('invoiceNo', e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Date</label>
              <input className="field-input" value={data.date} onChange={e => update('date', e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Currency</label>
              <select className="field-input" value={data.currency} onChange={e => update('currency', e.target.value)}>
                {Object.entries(CURRENCIES).map(([sym, c]) => (
                  <option key={sym} value={sym}>{sym} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="field-row single">
            <div className="field-group">
              <label className="field-label">Badge Text</label>
              <input className="field-input" value={data.badge} onChange={e => update('badge', e.target.value)} placeholder="e.g. Invoice · Installment 1 of 2" />
            </div>
          </div>
          <div className="field-row single">
            <div className="field-group">
              <label className="field-label">Subtitle</label>
              <input className="field-input" value={data.subtitle} onChange={e => update('subtitle', e.target.value)} placeholder="Project description" />
            </div>
          </div>

          {/* Due bar toggle */}
          <div className="field-row">
            <div className="field-group">
              <label className="field-label toggle-label">
                <input type="checkbox" checked={data.showDueBar} onChange={e => update('showDueBar', e.target.checked)} />
                Show Due Date Bar
              </label>
            </div>
            <div className="field-group">
              <label className="field-label">Status</label>
              <select className="field-input" value={data.status} onChange={e => update('status', e.target.value)}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
          {data.showDueBar && (
            <div className="field-row single">
              <div className="field-group">
                <label className="field-label">Payment Due Text</label>
                <select className="field-input" value={PAYMENT_TERMS.includes(data.dueText) ? data.dueText : 'Custom'}
                  onChange={e => {
                    if (e.target.value !== 'Custom') update('dueText', e.target.value)
                  }}>
                  {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {!PAYMENT_TERMS.includes(data.dueText) && (
                  <input className="field-input" style={{ marginTop: 4 }} value={data.dueText}
                    onChange={e => update('dueText', e.target.value)} placeholder="Custom due text" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── From ─── */}
        <div className="editor-section">
          <div className="editor-section-title">Bill From</div>
          <div className="field-row single">
            <div className="field-group">
              <label className="field-label">Name</label>
              <input className="field-input" value={data.fromName} onChange={e => update('fromName', e.target.value)} />
            </div>
          </div>
          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Phone</label>
              <input className="field-input" value={data.fromPhone} onChange={e => update('fromPhone', e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Email</label>
              <input className="field-input" value={data.fromEmail} onChange={e => update('fromEmail', e.target.value)} />
            </div>
          </div>
          <div className="field-row single">
            <div className="field-group">
              <label className="field-label">Website</label>
              <input className="field-input" value={data.fromWebsite} onChange={e => update('fromWebsite', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ─── To ─── */}
        <div className="editor-section">
          <div className="editor-section-title">Bill To</div>
          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Company / Name</label>
              <input className="field-input" value={data.toName} onChange={e => update('toName', e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Contact Person</label>
              <input className="field-input" value={data.toContact} onChange={e => update('toContact', e.target.value)} />
            </div>
          </div>
          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Phone</label>
              <input className="field-input" value={data.toPhone} onChange={e => update('toPhone', e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Email</label>
              <input className="field-input" value={data.toEmail} onChange={e => update('toEmail', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ─── Reference ─── */}
        <div className="editor-section">
          <div className="editor-section-title">Reference</div>
          <div className="field-row single">
            <div className="field-group">
              <label className="field-label toggle-label">
                <input type="checkbox" checked={data.showReference} onChange={e => update('showReference', e.target.checked)} />
                Show Reference Section
              </label>
            </div>
          </div>
          {data.showReference && (
            <>
              <div className="field-row single">
                <div className="field-group">
                  <label className="field-label">Reference Text</label>
                  <textarea className="field-input" value={data.reference} onChange={e => update('reference', e.target.value)}
                    placeholder="e.g. As per Agreement dated..." />
                </div>
              </div>
              <div className="field-row single">
                <div className="field-group">
                  <label className="field-label">Note (bold)</label>
                  <input className="field-input" value={data.referenceNote} onChange={e => update('referenceNote', e.target.value)} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─── Line Items ─── */}
        <div className="editor-section">
          <div className="editor-section-title">Line Items</div>
          <div className="line-items-list">
            {data.items.map((item, i) => (
              <div key={i} className="line-item-card">
                <div className="line-item-num">{i + 1}</div>
                {data.items.length > 1 && (
                  <button className="line-item-remove" onClick={() => removeItem(i)}>×</button>
                )}
                <div className="line-item-fields">
                  <div className="line-item-row1">
                    <input className="line-item-input" placeholder="Service name" value={item.name}
                      onChange={e => updateItem(i, 'name', e.target.value)} />
                    <input className="line-item-input desc-input" placeholder="Description (optional)" value={item.desc}
                      onChange={e => updateItem(i, 'desc', e.target.value)} />
                  </div>
                  <div className="line-item-row2">
                    <div className="field-group">
                      <label className="field-label">Qty</label>
                      <input className="line-item-input" type="number" min="1" value={item.qty}
                        onChange={e => updateItem(i, 'qty', parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Rate ({sym})</label>
                      <input className="line-item-input" type="number" min="0" value={item.rate}
                        onChange={e => updateItem(i, 'rate', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Amount</label>
                      <input className="line-item-input" readOnly value={formatCurrency(item.qty * item.rate, sym)}
                        style={{ color: 'var(--gold)', fontWeight: 600 }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button className="add-item-btn" onClick={addItem}>+ Add Line Item</button>
          </div>
        </div>

        {/* ─── Totals Config ─── */}
        <div className="editor-section">
          <div className="editor-section-title">Totals & Pricing</div>

          {/* Discount */}
          <div className="field-row">
            <div className="field-group">
              <label className="field-label toggle-label">
                <input type="checkbox" checked={data.showDiscount} onChange={e => update('showDiscount', e.target.checked)} />
                Show Discount
              </label>
            </div>
            {data.showDiscount && (
              <div className="field-group">
                <label className="field-label">Discount %</label>
                <input className="field-input" type="number" min="0" max="100" value={data.discountPercent}
                  onChange={e => update('discountPercent', parseInt(e.target.value) || 0)} />
              </div>
            )}
          </div>

          {/* Tax */}
          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Tax Label</label>
              <input className="field-input" value={data.taxLabel} onChange={e => update('taxLabel', e.target.value)} placeholder="Tax / GST / CGST" />
            </div>
            <div className="field-group">
              <label className="field-label">Tax Amount ({sym})</label>
              <input className="field-input" type="number" min="0" value={data.tax}
                onChange={e => update('tax', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          {/* Installment */}
          <div className="field-row">
            <div className="field-group">
              <label className="field-label toggle-label">
                <input type="checkbox" checked={data.showInstallment} onChange={e => update('showInstallment', e.target.checked)} />
                Show Installment Split
              </label>
            </div>
          </div>
          {data.showInstallment && (
            <>
              <div className="field-row">
                <div className="field-group">
                  <label className="field-label">Label</label>
                  <input className="field-input" value={data.installmentLabel} onChange={e => update('installmentLabel', e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="field-label">Percentage %</label>
                  <input className="field-input" type="number" min="1" max="100" value={data.installmentPercent}
                    onChange={e => update('installmentPercent', parseInt(e.target.value) || 50)} />
                </div>
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label className="field-label">Total Installments</label>
                  <select className="field-input" value={data.installmentCount || 2}
                    onChange={e => update('installmentCount', parseInt(e.target.value))}>
                    <option value={2}>2 Installments</option>
                    <option value={3}>3 Installments</option>
                    <option value={4}>4 Installments</option>
                  </select>
                </div>
                <div className="field-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  {onSplitInstallments && (
                    <button className="btn btn-split" onClick={onSplitInstallments}>
                      ✂ Split & Export All
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─── Bank Details ─── */}
        <div className="editor-section">
          <div className="editor-section-title">Bank Details</div>
          <div className="field-row single">
            <div className="field-group">
              <label className="field-label toggle-label">
                <input type="checkbox" checked={data.showBankDetails} onChange={e => update('showBankDetails', e.target.checked)} />
                Show Bank Details on Invoice
              </label>
            </div>
          </div>
          {data.showBankDetails && (
            <>
              <div className="field-row single">
                <div className="field-group">
                  <label className="field-label">Account Name</label>
                  <input className="field-input" value={data.accountName} onChange={e => update('accountName', e.target.value)} />
                </div>
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label className="field-label">Bank Name</label>
                  <input className="field-input" value={data.bankName} onChange={e => update('bankName', e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="field-label">Account No.</label>
                  <input className="field-input" value={data.accountNo} onChange={e => update('accountNo', e.target.value)} />
                </div>
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label className="field-label">IFSC Code</label>
                  <input className="field-input" value={data.ifsc} onChange={e => update('ifsc', e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="field-label">Branch Code</label>
                  <input className="field-input" value={data.branchCode} onChange={e => update('branchCode', e.target.value)} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─── Notes ─── */}
        <div className="editor-section">
          <div className="editor-section-title">Notes & Terms</div>
          <div className="field-row single">
            <div className="field-group">
              <label className="field-label toggle-label">
                <input type="checkbox" checked={data.showNotes} onChange={e => update('showNotes', e.target.checked)} />
                Show Notes Section
              </label>
            </div>
          </div>
          {data.showNotes && (
            <div className="field-row single">
              <div className="field-group">
                <label className="field-label">Terms Text</label>
                <textarea className="field-input" rows={4} value={data.notes} onChange={e => update('notes', e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="editor-section">
          <div className="editor-section-title">Footer</div>
          <div className="field-row single">
            <div className="field-group">
              <label className="field-label">Custom Footer Text (leave empty for auto)</label>
              <input className="field-input" value={data.footerText} onChange={e => update('footerText', e.target.value)}
                placeholder="Auto-generated if empty" />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
