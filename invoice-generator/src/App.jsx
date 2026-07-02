import { useState, useCallback, useEffect, useRef } from 'react'
import html2pdf from 'html2pdf.js'
import EditorPanel from './components/EditorPanel'
import InvoicePreview from './components/InvoicePreview'
import InvoiceManager from './components/InvoiceManager'
import { ToastProvider, useToast } from './components/Toast'
import { defaultInvoice } from './defaults'
import * as api from './utils/api'

// ─── Login Screen ───
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.login(password)
      onLogin()
    } catch (err) {
      setError('Invalid password')
    }
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="editor-brand-icon" style={{ width: 56, height: 56, fontSize: 28, margin: '0 auto 16px' }}>⚡</div>
        <h1 className="login-title">Invoice Generator</h1>
        <p className="login-sub">Enter your password to continue</p>
        <form onSubmit={handleSubmit}>
          <input className="field-input login-input" type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)} autoFocus />
          {error && <div className="login-error">{error}</div>}
          <button className="btn btn-primary login-btn" type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Main App Logic ───
function AppInner() {
  const toast = useToast()
  const [view, setView] = useState('manager') // 'manager' | 'editor'
  const [authed, setAuthed] = useState(!!api.getAuthToken())
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [managerError, setManagerError] = useState('')
  const [data, setData] = useState({ ...defaultInvoice })
  const [splitPreview, setSplitPreview] = useState(null) // null or array of installment views
  const previewRef = useRef(null)

  // Try to use API, fall back to localStorage
  const [useCloud, setUseCloud] = useState(true)

  // ─── Load invoices ───
  const loadInvoices = useCallback(async () => {
    setLoading(true)
    setManagerError('')
    try {
      const result = await api.listInvoices()
      setInvoices(result.invoices || [])
    } catch (err) {
      // Fall back to localStorage
      setUseCloud(false)
      const saved = JSON.parse(localStorage.getItem('invoice-list') || '[]')
      setInvoices(saved)
      if (err.message.includes('Unauthorized')) {
        setAuthed(false)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authed) loadInvoices()
  }, [authed, loadInvoices])

  // ─── Data with auto-save to localStorage ───
  const setDataAndSave = useCallback((updater) => {
    setData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localStorage.setItem('invoice-editor-draft', JSON.stringify(next))
      return next
    })
  }, [])

  // ─── New Invoice ───
  const handleNew = useCallback(async () => {
    let invoiceNo = defaultInvoice.invoiceNo
    try {
      const result = await api.getNextInvoiceNumber()
      invoiceNo = result.invoiceNo
    } catch {
      // auto-increment locally
      const maxNum = invoices.reduce((max, inv) => {
        const match = (inv.invoiceNo || '').match(/INV-\d+-(\d+)/)
        return match ? Math.max(max, parseInt(match[1])) : max
      }, 0)
      invoiceNo = `INV-${new Date().getFullYear()}-${String(maxNum + 1).padStart(3, '0')}`
    }
    setData({ ...defaultInvoice, invoiceNo, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) })
    setEditingId(null)
    setSplitPreview(null)
    setView('editor')
  }, [invoices])

  // ─── Edit Invoice ───
  const handleEdit = useCallback(async (id) => {
    try {
      const result = await api.getInvoice(id)
      setData({ ...defaultInvoice, ...result.data })
      setEditingId(id)
      setSplitPreview(null)
      setView('editor')
    } catch {
      // local fallback
      const inv = invoices.find(i => i.id === id)
      if (inv && inv.data) {
        setData({ ...defaultInvoice, ...inv.data })
        setEditingId(id)
        setSplitPreview(null)
        setView('editor')
      }
    }
  }, [invoices])

  // ─── Save Invoice ───
  const handleSave = useCallback(async () => {
    setSaving(true)
    const subtotal = data.items.reduce((sum, item) => sum + (item.qty * item.rate), 0)
    const discountAmount = data.showDiscount ? Math.round(subtotal * (data.discountPercent || 0) / 100) : 0
    const afterDiscount = subtotal - discountAmount
    const payable = data.showInstallment ? Math.round(afterDiscount * data.installmentPercent / 100) : afterDiscount
    const totalDue = payable + data.tax

    const invoiceRecord = {
      invoiceNo: data.invoiceNo,
      clientName: data.toName,
      totalAmount: totalDue,
      currency: data.currency,
      date: data.date,
      status: data.status,
      data: data,
    }

    try {
      if (editingId) {
        await api.updateInvoice(editingId, invoiceRecord)
        toast.success('Invoice updated!')
      } else {
        const result = await api.saveInvoice(invoiceRecord)
        setEditingId(result.id)
        toast.success('Invoice saved!')
      }
    } catch {
      // Local fallback
      const id = editingId || 'local_' + Date.now()
      const record = { ...invoiceRecord, id, updatedAt: new Date().toISOString() }
      const list = JSON.parse(localStorage.getItem('invoice-list') || '[]')
      const idx = list.findIndex(i => i.id === id)
      if (idx >= 0) list[idx] = record
      else list.push(record)
      localStorage.setItem('invoice-list', JSON.stringify(list))
      setEditingId(id)
      toast.success('Saved locally!')
    }

    await loadInvoices()
    setSaving(false)
  }, [data, editingId, loadInvoices, toast])

  // ─── Delete ───
  const handleDelete = useCallback(async (id) => {
    try {
      await api.deleteInvoice(id)
      toast.success('Invoice deleted')
    } catch {
      const list = JSON.parse(localStorage.getItem('invoice-list') || '[]')
      localStorage.setItem('invoice-list', JSON.stringify(list.filter(i => i.id !== id)))
      toast.success('Deleted locally')
    }
    loadInvoices()
  }, [loadInvoices, toast])

  const handleBulkDelete = useCallback(async (ids) => {
    try {
      await api.bulkDeleteInvoices(ids)
      toast.success(`${ids.length} invoices deleted`)
    } catch {
      const list = JSON.parse(localStorage.getItem('invoice-list') || '[]')
      localStorage.setItem('invoice-list', JSON.stringify(list.filter(i => !ids.includes(i.id))))
      toast.success('Deleted locally')
    }
    loadInvoices()
  }, [loadInvoices, toast])

  // ─── Export PDF ───
  const handleExport = useCallback(async (elementId = 'invoice-sheet', filename = null) => {
    const element = document.getElementById(elementId)
    if (!element) { toast.error('No invoice to export'); return }

    const fn = filename || `${data.invoiceNo || 'invoice'}.pdf`
    toast.info('Generating PDF...')

    try {
      const opt = {
        margin: 0,
        filename: fn,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all'] },
      }

      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob')

      // Download locally
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = fn
      a.click()
      URL.revokeObjectURL(url)

      // Try to upload to R2
      if (editingId) {
        try {
          await api.uploadPDF(editingId, pdfBlob, fn)
        } catch { /* silent fail for cloud upload */ }
      }

      toast.success('PDF exported!')
    } catch (err) {
      toast.error('PDF export failed: ' + err.message)
    }
  }, [data.invoiceNo, editingId, toast])

  // ─── Split into Installments & Export ───
  const handleSplitInstallments = useCallback(async () => {
    const count = data.installmentCount || 2
    const suffixes = 'ABCDEFGH'.split('')
    const percentEach = Math.round(100 / count)

    const installments = Array.from({ length: count }, (_, i) => ({
      suffix: suffixes[i],
      invoiceNo: `${data.invoiceNo}${suffixes[i]}`,
      badge: `Invoice · Installment ${i + 1} of ${count}`,
      subtitle: `${data.subtitle} · Installment ${i + 1}`,
      label: `Installment ${i + 1} (${percentEach}%)`,
      percent: i === count - 1 ? (100 - percentEach * (count - 1)) : percentEach,
      status: i === 0 ? data.status : 'pending',
    }))

    setSplitPreview(installments)
    toast.info(`Split into ${count} installments. Scroll right to see all.`)
  }, [data, toast])

  const handleExportAllInstallments = useCallback(async () => {
    if (!splitPreview) return
    for (const inst of splitPreview) {
      await handleExport(`invoice-sheet-${inst.suffix}`, `${inst.invoiceNo}.pdf`)
      await new Promise(r => setTimeout(r, 500)) // small delay between downloads
    }
  }, [splitPreview, handleExport])

  // ─── Reset ───
  const handleReset = useCallback(() => {
    if (confirm('Reset all fields to default values?')) {
      setData({ ...defaultInvoice })
      setSplitPreview(null)
    }
  }, [])

  // ─── Login check ───
  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />
  }

  // ─── Manager View ───
  if (view === 'manager') {
    return (
      <InvoiceManager
        invoices={invoices}
        loading={loading}
        error={managerError}
        onNew={handleNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
      />
    )
  }

  // ─── Editor View ───
  return (
    <div className="app-layout">
      <EditorPanel
        data={data}
        setData={setDataAndSave}
        onExport={() => handleExport()}
        onReset={handleReset}
        onSave={handleSave}
        onBack={() => { setView('manager'); loadInvoices() }}
        onSplitInstallments={handleSplitInstallments}
        saving={saving}
      />
      <div className="preview-panel" ref={previewRef}>
        {splitPreview ? (
          <div className="split-preview-container">
            <div className="split-header">
              <span>Showing {splitPreview.length} installment previews</span>
              <button className="btn btn-primary btn-sm" onClick={handleExportAllInstallments}>
                📄 Export All PDFs
              </button>
            </div>
            <div className="split-grid">
              {splitPreview.map(inst => (
                <div key={inst.suffix} className="split-sheet-wrapper">
                  <div className="split-label">
                    {inst.invoiceNo}
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => handleExport(`invoice-sheet-${inst.suffix}`, `${inst.invoiceNo}.pdf`)}>
                      📄 Export
                    </button>
                  </div>
                  <InvoicePreview data={data} installmentView={inst} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <InvoicePreview data={data} />
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}
