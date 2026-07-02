// ─── Cloudflare R2 API Client ───

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787'

let authToken = localStorage.getItem('invoice-auth-token') || ''

export function setAuthToken(token) {
  authToken = token
  localStorage.setItem('invoice-auth-token', token)
}

export function getAuthToken() {
  return authToken
}

export function clearAuthToken() {
  authToken = ''
  localStorage.removeItem('invoice-auth-token')
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      ...options.headers,
    },
  })

  if (res.status === 401) {
    clearAuthToken()
    throw new Error('Unauthorized — please login again')
  }

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `Request failed: ${res.status}`)
  }

  return res.json()
}

// ─── Auth ───
export async function login(password) {
  const res = await fetch(`${API_BASE}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) throw new Error('Invalid password')
  const data = await res.json()
  setAuthToken(data.token)
  return data
}

// ─── Invoices CRUD ───
export async function listInvoices() {
  return request('/api/invoices')
}

export async function getInvoice(id) {
  return request(`/api/invoices/${id}`)
}

export async function saveInvoice(invoiceData) {
  return request('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(invoiceData),
  })
}

export async function updateInvoice(id, invoiceData) {
  return request(`/api/invoices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(invoiceData),
  })
}

export async function deleteInvoice(id) {
  return request(`/api/invoices/${id}`, {
    method: 'DELETE',
  })
}

export async function bulkDeleteInvoices(ids) {
  return request('/api/invoices/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  })
}

// ─── PDF Upload ───
export async function uploadPDF(id, pdfBlob, filename) {
  const formData = new FormData()
  formData.append('pdf', pdfBlob, filename)

  const res = await fetch(`${API_BASE}/api/invoices/${id}/pdf`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
    body: formData,
  })

  if (!res.ok) throw new Error('PDF upload failed')
  return res.json()
}

export async function getPDFUrl(id) {
  return request(`/api/invoices/${id}/pdf-url`)
}

// ─── Next Invoice Number ───
export async function getNextInvoiceNumber() {
  return request('/api/invoices/next-number')
}
