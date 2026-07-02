import { useState, useEffect } from 'react'
import { formatCurrency } from '../utils/currency'

export default function InvoiceManager({ invoices, loading, onNew, onEdit, onDelete, onBulkDelete, error }) {
  const [selected, setSelected] = useState(new Set())
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase()
    return !q ||
      (inv.invoiceNo || '').toLowerCase().includes(q) ||
      (inv.clientName || '').toLowerCase().includes(q)
  })

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(i => i.id)))
  }

  const handleBulkDelete = () => {
    if (selected.size === 0) return
    setConfirmDelete({ type: 'bulk', ids: [...selected] })
  }

  const handleSingleDelete = (id, e) => {
    e.stopPropagation()
    setConfirmDelete({ type: 'single', id })
  }

  const executeDelete = () => {
    if (!confirmDelete) return
    if (confirmDelete.type === 'bulk') {
      onBulkDelete(confirmDelete.ids)
      setSelected(new Set())
    } else {
      onDelete(confirmDelete.id)
      selected.delete(confirmDelete.id)
      setSelected(new Set(selected))
    }
    setConfirmDelete(null)
  }

  return (
    <div className="manager-container">
      {/* Header */}
      <div className="manager-header">
        <div className="manager-brand">
          <div className="editor-brand-icon" style={{ width: 40, height: 40, fontSize: 20 }}>⚡</div>
          <div>
            <h1 className="manager-title">Invoice Manager</h1>
            <p className="manager-sub">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} saved</p>
          </div>
        </div>
        <div className="manager-actions">
          {selected.size > 0 && (
            <button className="btn btn-danger" onClick={handleBulkDelete}>
              🗑 Delete {selected.size} Selected
            </button>
          )}
          <button className="btn btn-primary" onClick={onNew}>
            + New Invoice
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="manager-search">
        <input className="search-input" placeholder="Search by invoice # or client name..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {error && <div className="manager-error">{error}</div>}

      {/* Invoice Grid */}
      {loading ? (
        <div className="manager-loading">
          <div className="loader"></div>
          <p>Loading invoices...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="manager-empty">
          <div className="empty-icon">📋</div>
          <h3>No Invoices Yet</h3>
          <p>Create your first invoice to get started</p>
          <button className="btn btn-primary" onClick={onNew} style={{ marginTop: 16 }}>+ New Invoice</button>
        </div>
      ) : (
        <>
          {filtered.length > 0 && (
            <div className="manager-bulk-bar">
              <label className="toggle-label" style={{ fontSize: 11, color: 'var(--editor-muted)' }}>
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll} />
                Select All ({filtered.length})
              </label>
            </div>
          )}
          <div className="invoice-grid">
            {filtered.map(inv => (
              <div key={inv.id}
                className={`invoice-card ${selected.has(inv.id) ? 'selected' : ''}`}
                onClick={() => onEdit(inv.id)}>
                <div className="card-select" onClick={e => { e.stopPropagation(); toggleSelect(inv.id) }}>
                  <input type="checkbox" checked={selected.has(inv.id)} readOnly />
                </div>
                <div className="card-header">
                  <span className="card-invoice-no">{inv.invoiceNo || 'Draft'}</span>
                  <span className={`status-badge ${inv.status || 'pending'}`}>
                    {inv.status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
                <div className="card-client">{inv.clientName || 'No Client'}</div>
                <div className="card-amount">{formatCurrency(inv.totalAmount || 0, inv.currency || '₹')}</div>
                <div className="card-footer">
                  <span className="card-date">{inv.date || '—'}</span>
                  <button className="card-delete" onClick={e => handleSingleDelete(inv.id, e)} title="Delete">🗑</button>
                </div>
                {inv.installments && inv.installments.length > 0 && (
                  <div className="card-installments">
                    {inv.installments.map((inst, i) => (
                      <span key={i} className="installment-chip">{inst.suffix}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Delete Invoice{confirmDelete.type === 'bulk' ? 's' : ''}?</h3>
            <p>
              {confirmDelete.type === 'bulk'
                ? `Delete ${confirmDelete.ids.length} selected invoice(s)? This cannot be undone.`
                : 'This invoice will be permanently deleted.'}
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={executeDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
