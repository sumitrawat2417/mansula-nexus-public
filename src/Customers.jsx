import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getCustomers, getCustomerById, saveCustomer, deleteCustomer,
  getUdhaarByCustomer, saveUdhaarEntry, deleteUdhaarEntry,
  recalcUdhaarBalance, exportCustomersBackup, restoreCustomersBackup, clearAllCustomerData
} from './db.js'
import { useAlert } from './AlertDialog.jsx'
import { useBackButton } from './useBackButton.js'

// ── Helpers ──
const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const fmtCur = (n) => `₹${fmt(n)}`
const uid = () => `cust-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
const fmtDate = (ts) => ts ? new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtDateTime = (ts) => ts ? new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const fmtRelative = (ts) => {
  if (!ts) return 'Never'
  const diff = Date.now() - ts
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

// Generate avatar color from name
const avatarColor = (name) => {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#0891b2', '#0d9488',
    '#059669', '#d97706', '#dc2626', '#7c3aed', '#2563eb'
  ]
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}
const initials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const TAGS = ['VIP', 'Regular', 'Wholesale', 'Credit', 'Loyal']

// ── Icons ──
const Ic = {
  Close: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  Phone: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 11.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 .77l3-.01a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.45a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 15z" /></svg>,
  WhatsApp: () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>,
  ChevR: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  Receipt: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /></svg>,
  Ledger: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>,
  Copy: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>,
  User: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  Note: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  X: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
  DB: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>,
  Download: ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  Upload: ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
  Export: ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  Star: () => <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  Info: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
  Bell: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  ChevDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
}

// ── Add/Edit Customer Modal ──
function AddEditCustomerModal({ customer, onSave, onClose }) {
  useBackButton(onClose)
  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
    tags: customer?.tags || [],
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleTag = (tag) => {
    set('tags', form.tags.includes(tag)
      ? form.tags.filter(t => t !== tag)
      : [...form.tags, tag])
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const record = {
      ...(customer || {}),
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
    }
    const saved = await saveCustomer(record)
    setSaving(false)
    if (saved) onSave(saved)
  }

  return (
    <div className="cust-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cust-modal">
        <div className="cust-modal-handle" />
        <div className="cust-modal-header">
          <h3 className="cust-modal-title">{customer ? 'Edit Customer' : 'Add Customer'}</h3>
          <button className="cust-modal-close" onClick={onClose}><Ic.Close /></button>
        </div>
        <div className="cust-modal-body">
          <div className="cust-form-group">
            <label className="cust-label">Full Name *</label>
            <input className="cust-input" placeholder="e.g. Ramesh Kumar" value={form.name}
              onChange={e => set('name', e.target.value)} autoFocus />
          </div>
          <div className="cust-form-group">
            <label className="cust-label">Phone Number</label>
            <input className="cust-input" placeholder="e.g. 9876543210" value={form.phone}
              onChange={e => set('phone', e.target.value)} type="tel" />
          </div>
          <div className="cust-form-group">
            <label className="cust-label">Email</label>
            <input className="cust-input" placeholder="email@example.com" value={form.email}
              onChange={e => set('email', e.target.value)} type="email" />
          </div>
          <div className="cust-form-group">
            <label className="cust-label">Address</label>
            <textarea className="cust-input cust-textarea" placeholder="Street, Area, City..." value={form.address}
              onChange={e => set('address', e.target.value)} rows={2} />
          </div>
          <div className="cust-form-group">
            <label className="cust-label">Tags</label>
            <div className="cust-tags-row">
              {TAGS.map(tag => (
                <button key={tag} className={`cust-tag-btn ${form.tags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}>
                  {tag === 'VIP' && <span className="cust-tag-star"><Ic.Star /></span>}
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="cust-modal-footer">
          <button className="cust-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="cust-btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? 'Saving…' : (customer ? 'Save Changes' : 'Add Customer')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add Udhaar Entry Modal ──
function UdhaarEntryModal({ customerId, customerName, onSave, onClose }) {
  useBackButton(onClose)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    setSaving(true)
    const entry = await saveUdhaarEntry({
      customerId,
      amount: amt,
      reason: reason.trim(),
      dueDate: dueDate ? new Date(dueDate).getTime() : null,
    })
    if (entry) await recalcUdhaarBalance(customerId)
    setSaving(false)
    if (entry) onSave()
  }

  return (
    <div className="cust-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cust-modal" style={{ maxWidth: 440 }}>
        <div className="cust-modal-handle" />
        <div className="cust-modal-header">
          <h3 className="cust-modal-title">Add Udhaar Entry</h3>
          <button className="cust-modal-close" onClick={onClose}><Ic.Close /></button>
        </div>
        <div className="cust-modal-body">
          <div className="cust-udh-customer-banner">
            <div className="cust-udh-avatar" style={{ background: avatarColor(customerName) }}>
              {initials(customerName)}
            </div>
            <span>{customerName}</span>
          </div>
          <div className="cust-form-group">
            <label className="cust-label">Amount (₹) *</label>
            <input className="cust-input cust-input-amount" placeholder="0.00" value={amount}
              onChange={e => setAmount(e.target.value)} type="number" min="0" autoFocus />
          </div>
          <div className="cust-form-group">
            <label className="cust-label">Items / Description</label>
            <textarea className="cust-input cust-textarea" rows={2}
              placeholder="e.g. Dal Makhani x2, Roti x4, Tea..."
              value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          <div className="cust-form-group">
            <label className="cust-label">Due Date (optional)</label>
            <input className="cust-input" type="date" value={dueDate}
              onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>
        <div className="cust-modal-footer">
          <button className="cust-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="cust-btn-danger" onClick={handleSave} disabled={saving || !amount || parseFloat(amount) <= 0}>
            {saving ? 'Adding…' : `Add ₹${amount || 0} Due`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Mark Paid Modal ──
function MarkPaidModal({ entry, onSave, onClose }) {
  useBackButton(onClose)
  const [paidAmt, setPaidAmt] = useState(String(entry.amount - (entry.paidAmt || 0)))
  const [payMode, setPayMode] = useState('cash')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const remaining = entry.amount - (entry.paidAmt || 0)

  const MODES = [
    { key: 'cash', label: 'Cash', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg> },
    { key: 'upi', label: 'UPI', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg> },
    { key: 'card', label: 'Card', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg> },
    { key: 'bank', label: 'Bank', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 20 7 4 7" /></svg> },
  ]

  const handleSave = async () => {
    const amt = Math.min(parseFloat(paidAmt) || 0, remaining)
    if (amt <= 0) return
    setSaving(true)
    const newPaid = (entry.paidAmt || 0) + amt
    const payment = { amount: amt, mode: payMode, paidAt: Date.now(), note: note.trim() }
    const updated = {
      ...entry,
      paidAmt: newPaid,
      paidAt: newPaid >= entry.amount ? Date.now() : null,
      paymentMode: payMode,
      payments: [...(entry.payments || []), payment],
    }
    await saveUdhaarEntry(updated)
    await recalcUdhaarBalance(entry.customerId)
    setSaving(false)
    onSave()
  }

  return (
    <div className="cust-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cust-modal" style={{ maxWidth: 420 }}>
        <div className="cust-modal-handle" />
        <div className="cust-modal-header">
          <h3 className="cust-modal-title">Record Payment</h3>
          <button className="cust-modal-close" onClick={onClose}><Ic.Close /></button>
        </div>
        <div className="cust-modal-body">
          <div className="cust-udh-info-box">
            <div className="cust-udh-info-row"><span>Total Due</span><strong>{fmtCur(entry.amount)}</strong></div>
            <div className="cust-udh-info-row"><span>Already Paid</span><strong>{fmtCur(entry.paidAmt || 0)}</strong></div>
            <div className="cust-udh-info-row cust-udh-info-row--highlight"><span>Remaining</span><strong>{fmtCur(remaining)}</strong></div>
          </div>
          <div className="cust-form-group" style={{ marginTop: 14 }}>
            <label className="cust-label">Payment Amount (₹)</label>
            <input className="cust-input cust-input-amount" value={paidAmt}
              onChange={e => setPaidAmt(e.target.value)} type="number" min="0" max={remaining} autoFocus />
          </div>
          <div className="cust-form-group">
            <label className="cust-label">Payment Mode</label>
            <div className="udh-pay-mode-row">
              {MODES.map(m => (
                <button key={m.key}
                  className={`udh-pay-mode-btn ${payMode === m.key ? 'active' : ''}`}
                  onClick={() => setPayMode(m.key)}>
                  <span className="udh-pay-mode-icon">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="cust-form-group">
            <label className="cust-label">Note (optional)</label>
            <input className="cust-input" placeholder="e.g. Partial payment, rest next week..." value={note}
              onChange={e => setNote(e.target.value)} />
          </div>
          {entry.reason && <p className="cust-udh-reason-note">For: <em>{entry.reason}</em></p>}
        </div>
        <div className="cust-modal-footer">
          <button className="cust-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="cust-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Udhaar Ledger Modal ──
function UdhaarLedgerModal({ entry: initialEntry, customer, onClose, onRefresh, onDelete, onNavigate }) {
  useBackButton(onClose)
  const [entry, setEntry] = useState(initialEntry)
  const [showPayModal, setShowPayModal] = useState(false)
  const [showAllItems, setShowAllItems] = useState(false)
  const { confirm } = useAlert()

  const remaining = entry.amount - (entry.paidAmt || 0)
  const isPaid = remaining <= 0
  const progress = entry.amount > 0 ? Math.min(100, ((entry.paidAmt || 0) / entry.amount) * 100) : 0

  const PAYMENT_MODES = {
    cash: { label: 'Cash', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" /></svg> },
    upi: { label: 'UPI', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg> },
    card: { label: 'Card', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg> },
    bank: { label: 'Bank Transfer', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 20 7 4 7" /></svg> },
  }

  const waMsg = `Hi ${customer.name}, we noticed you have an outstanding due of ₹${fmt(remaining)} with us. Kindly clear the payment at your earliest convenience. Thank you!`
  const waLink = customer.phone
    ? `https://wa.me/91${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(waMsg)}`
    : null

  const handleDelete = async () => {
    const ok = await confirm(`Delete this entry of ${fmtCur(entry.amount)}?`, { title: 'Delete Entry', type: 'danger', confirmText: 'Delete' })
    if (!ok) return
    await deleteUdhaarEntry(entry.udhaarId)
    await recalcUdhaarBalance(entry.customerId)
    onDelete()
  }

  const statusInfo = isPaid
    ? { label: 'Cleared', cls: 'paid' }
    : remaining < entry.amount
      ? { label: 'Partial', cls: 'partial' }
      : { label: 'Due', cls: 'due' }

  return (
    <div className="cust-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cust-modal cust-modal-wide udh-lm-sheet">
        <div className="cust-modal-handle" />

        {/* ── Hero Banner ── */}
        <div className="udh-lm-hero" style={{ background: `linear-gradient(140deg, ${avatarColor(customer.name)} 0%, ${avatarColor(customer.name)}cc 100%)` }}>
          {/* Decorative circles */}
          <div className="udh-lm-hero-circle udh-lm-hero-circle--1" />
          <div className="udh-lm-hero-circle udh-lm-hero-circle--2" />

          <div className="udh-lm-hero-inner">
            {/* Top row: avatar + name + status badge */}
            <div className="udh-lm-hero-toprow">
              <div className="udh-lm-ava-wrap">
                <div className="udh-lm-ava">{initials(customer.name)}</div>
                <div className="udh-lm-ava-info">
                  <div className="udh-lm-cust-nm">{customer.name}</div>
                  {customer.phone && (
                    <div className="udh-lm-cust-ph">
                      <span className="udh-lm-ph-icon"><Ic.Phone /></span>
                      {customer.phone}
                    </div>
                  )}
                </div>
              </div>
              <span className={`udh-lm-badge udh-lm-badge--${statusInfo.cls}`}>
                {isPaid
                  ? <><span className="udh-lm-badge-icon"><Ic.Check /></span>Cleared</>
                  : remaining < entry.amount
                    ? <><span className="udh-lm-badge-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg></span>Partial</>
                    : <><span className="udh-lm-badge-icon"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5" /></svg></span>Due</>
                }
              </span>
            </div>

            {/* Amount row */}
            <div className="udh-lm-hero-amount-row">
              <div className="udh-lm-hero-amt">{fmtCur(entry.amount)}</div>
            </div>

            {/* Date & Order ID */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              {entry.orderId && (
                <div
                  style={{ fontWeight: 700, fontSize: '0.9rem', opacity: 0.95, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => {
                    localStorage.setItem('mn-open-order', entry.orderId);
                    if (onNavigate) onNavigate('records');
                  }}
                >
                  <Ic.Receipt s={14} /> Order #{entry.orderId}
                </div>
              )}
              <div className="udh-lm-hero-date" style={{ marginTop: 0 }}>
                <span className="udh-lm-hero-date-icon"><Ic.Clock /></span>
                Added {fmtDateTime(entry.createdAt)}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="udh-lm-body">

          {/* Progress Card */}
          <div className="udh-lm-prog-card">
            <div className="udh-lm-prog-hd">
              <div className="udh-lm-prog-hd-left">
                <span className="udh-lm-prog-hd-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg></span>
                <span>Payment Progress</span>
              </div>
              <span className="udh-lm-prog-pct" style={{ color: isPaid ? 'var(--brand-accent)' : 'var(--text-primary)' }}>{Math.round(progress)}%</span>
            </div>
            <div className="udh-lm-prog-track">
              <div className="udh-lm-prog-fill" style={{ width: `${progress}%`, background: isPaid ? 'var(--brand-accent)' : 'var(--brand-primary)' }} />
            </div>
            <div className="udh-lm-prog-stats">
              <div className="udh-lm-ps">
                <span className="udh-lm-ps-l">Paid</span>
                <span className="udh-lm-ps-v" style={{ color: 'var(--brand-accent)' }}>{fmtCur(entry.paidAmt || 0)}</span>
              </div>
              <div className="udh-lm-ps udh-lm-ps--c">
                <span className="udh-lm-ps-l">Remaining</span>
                <span className="udh-lm-ps-v" style={{ color: isPaid ? 'var(--brand-accent)' : 'var(--brand-danger)' }}>{fmtCur(remaining)}</span>
              </div>
              <div className="udh-lm-ps udh-lm-ps--r">
                <span className="udh-lm-ps-l">Total</span>
                <span className="udh-lm-ps-v">{fmtCur(entry.amount)}</span>
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="udh-lm-section">
            <div className="udh-lm-sec-hd">
              <span className="udh-lm-sec-hd-icon"><Ic.Ledger /></span>
              Details
            </div>
            <div className="udh-lm-det-card">
              <div className="udh-lm-dr udh-lm-items-dr">
                <span className="udh-lm-drl">Items / Description</span>
                <div className="udh-lm-items-list">
                  <div className="udh-lm-items-header">
                    <div className="udh-lm-col-item">ITEM</div>
                    <div className="udh-lm-col-qty">QTY</div>
                    <div className="udh-lm-col-price">PRICE</div>
                    <div className="udh-lm-col-total">TOTAL</div>
                  </div>
                  {(() => {
                    if (!entry.reason) return null;
                    const allItems = entry.reason.split(',').map(s => s.trim()).filter(Boolean);
                    if (allItems.length === 0) return null;
                    const visibleItems = showAllItems ? allItems : allItems.slice(0, 3);
                    const hiddenCount = allItems.length - 3;
                    
                    return (
                      <>
                        {visibleItems.map((itemStr, idx) => {
                          let qty = ''
                          let name = itemStr
                          let price = ''
                          let total = ''

                          const match = itemStr.match(/^(\d+x|\d+\s*x)\s*(.*?)(?:\s*@\s*([\d.]+))?$/i)
                          if (match) {
                            qty = match[1].toLowerCase().replace('x', '').trim()
                            name = match[2]
                            const pStr = match[3]
                            if (pStr) {
                              const pNum = parseFloat(pStr)
                              const qNum = parseInt(qty, 10)
                              price = `₹${pNum}`
                              total = `₹${qNum * pNum}`
                            }
                          }

                          return (
                            <div key={idx} className="udh-lm-item-row">
                              <div className="udh-lm-col-item">{name}</div>
                              <div className="udh-lm-col-qty">{qty || '—'}</div>
                              <div className="udh-lm-col-price">{price || '—'}</div>
                              <div className="udh-lm-col-total">{total || '—'}</div>
                            </div>
                          )
                        })}
                        {hiddenCount > 0 && !showAllItems && (
                          <div 
                            className="udh-lm-item-row" 
                            style={{ justifyContent: 'center', cursor: 'pointer', padding: '8px', color: 'var(--primary)', fontWeight: 600, borderTop: '1px dashed var(--border-color)', marginTop: '4px' }}
                            onClick={() => setShowAllItems(true)}
                          >
                            + {hiddenCount} more items
                          </div>
                        )}
                        {showAllItems && hiddenCount > 0 && (
                          <div 
                            className="udh-lm-item-row" 
                            style={{ justifyContent: 'center', cursor: 'pointer', padding: '8px', color: 'var(--text-muted)', fontWeight: 600, borderTop: '1px dashed var(--border-color)', marginTop: '4px' }}
                            onClick={() => setShowAllItems(false)}
                          >
                            Show less
                          </div>
                        )}
                      </>
                    )
                  })()}
                  {!entry.reason && (
                    <div className="udh-lm-item-row">
                      <div className="udh-lm-col-item">—</div>
                      <div className="udh-lm-col-qty"></div>
                      <div className="udh-lm-col-price"></div>
                      <div className="udh-lm-col-total"></div>
                    </div>
                  )}
                </div>
              </div>
              {entry.dueDate && (
                <div className="udh-lm-dr">
                  <span className="udh-lm-drl">Due Date</span>
                  <span className={`udh-lm-drv ${!isPaid && entry.dueDate < Date.now() ? 'udh-c-danger' : ''}`}>
                    {fmtDate(entry.dueDate)}
                    {!isPaid && entry.dueDate < Date.now() && (
                      <span className="udh-lm-overdue-tag">
                        <span style={{ width: 12, height: 12, display: 'flex' }}><Ic.Bell /></span>
                        Overdue
                      </span>
                    )}
                  </span>
                </div>
              )}
              {entry.paymentMode && (
                <div className="udh-lm-dr">
                  <span className="udh-lm-drl">Last Payment</span>
                  <span className="udh-lm-drv udh-lm-mode-chip">
                    <span className="udh-lm-mode-icon">{PAYMENT_MODES[entry.paymentMode]?.icon}</span>
                    {PAYMENT_MODES[entry.paymentMode]?.label || entry.paymentMode}
                  </span>
                </div>
              )}
              {isPaid && entry.paidAt && (
                <div className="udh-lm-dr">
                  <span className="udh-lm-drl">Cleared On</span>
                  <span className="udh-lm-drv udh-c-success">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 14, height: 14, display: 'inline-flex' }}><Ic.Check /></span>
                      {fmtDateTime(entry.paidAt)}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment History */}
          {(entry.payments || []).length > 0 && (
            <div className="udh-lm-section">
              <div className="udh-lm-sec-hd">
                <span className="udh-lm-sec-hd-icon"><Ic.Clock /></span>
                Payment History
                <span className="udh-lm-sec-badge">{(entry.payments || []).length}</span>
              </div>
              <div className="udh-lm-timeline">
                {[...(entry.payments || [])].reverse().map((p, i) => (
                  <div key={i} className="udh-lm-tl-item">
                    <div className="udh-lm-tl-dot-wrap">
                      <div className="udh-lm-tl-dot" />
                      {i < (entry.payments || []).length - 1 && <div className="udh-lm-tl-line" />}
                    </div>
                    <div className="udh-lm-tl-body">
                      <div className="udh-lm-tl-top">
                        <span className="udh-lm-tl-amt">{fmtCur(p.amount)}</span>
                        {p.mode && (
                          <span className="udh-lm-tl-mode">
                            <span className="udh-lm-tl-mode-icon">{PAYMENT_MODES[p.mode]?.icon}</span>
                            {PAYMENT_MODES[p.mode]?.label || p.mode}
                          </span>
                        )}
                      </div>
                      <div className="udh-lm-tl-date">
                        <span style={{ width: 12, height: 12, display: 'inline-flex', marginRight: 4, opacity: 0.6 }}><Ic.Clock /></span>
                        {fmtDateTime(p.paidAt)}
                      </div>
                      {p.note && <div className="udh-lm-tl-note">"{p.note}"</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="udh-lm-bottom-actions">
            {!isPaid && (
              <div className="udh-lm-actions">
                <button className="udh-lm-pay-btn" onClick={() => setShowPayModal(true)}>
                  <span className="udh-lm-btn-icon"><Ic.Check /></span>
                  Record Payment
                </button>
                {waLink && (
                  <a className="udh-lm-wa-btn" href={waLink} target="_blank" rel="noreferrer">
                    <span className="udh-lm-btn-icon"><Ic.WhatsApp /></span>
                    Remind
                  </a>
                )}
              </div>
            )}

            {/* Delete */}
            <button className="udh-lm-delete-bar" onClick={handleDelete}>
              <span className="udh-lm-btn-icon"><Ic.Trash /></span>
              Delete Entry
            </button>
          </div>

        </div>
      </div>

      {showPayModal && (
        <MarkPaidModal
          entry={entry}
          onSave={async () => {
            const entries = await getUdhaarByCustomer(entry.customerId)
            const refreshed = entries.find(e => e.udhaarId === entry.udhaarId)
            if (refreshed) setEntry(refreshed)
            setShowPayModal(false)
            onRefresh()
          }}
          onClose={() => setShowPayModal(false)}
        />
      )}
    </div>
  )
}

// ── Customer Detail Modal ──
function CustomerDetailModal({ customer, onClose, onUpdate, onDelete, onNavigate }) {
  useBackButton(onClose)
  const [tab, setTab] = useState('profile')
  const [udhaar, setUdhaar] = useState([])
  const [loadingUdh, setLoadingUdh] = useState(true)
  const [showAddUdh, setShowAddUdh] = useState(false)
  const [ledgerEntry, setLedgerEntry] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [cust, setCust] = useState(customer)
  const { confirm } = useAlert()

  const loadUdhaar = useCallback(async () => {
    setLoadingUdh(true)
    const entries = await getUdhaarByCustomer(cust.customerId)
    const sorted = entries.sort((a, b) => b.createdAt - a.createdAt)
    setUdhaar(sorted)

    const openUdhId = localStorage.getItem('mn-open-udhaar')
    if (openUdhId) {
      const u = sorted.find(x => x.udhaarId === openUdhId || x.id === openUdhId)
      if (u) {
        setTab('udhaar')
        setLedgerEntry(u)
      }
      localStorage.removeItem('mn-open-udhaar')
    }

    setLoadingUdh(false)
  }, [cust.customerId])

  useEffect(() => { loadUdhaar() }, [loadUdhaar])

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    const updated = { ...cust, notes: [{ ts: Date.now(), text: noteText.trim() }, ...(cust.notes || [])] }
    const saved = await saveCustomer(updated)
    if (saved) { setCust(saved); setNoteText(''); onUpdate(saved) }
  }

  const handleDeleteNote = async (idx) => {
    const notes = (cust.notes || []).filter((_, i) => i !== idx)
    const saved = await saveCustomer({ ...cust, notes })
    if (saved) { setCust(saved); onUpdate(saved) }
  }

  const handleDeleteUdh = async (entry) => {
    const ok = await confirm(`Delete this due entry of ${fmtCur(entry.amount)}?`, { title: 'Delete Entry', type: 'danger', confirmText: 'Delete' })
    if (!ok) return
    await deleteUdhaarEntry(entry.udhaarId)
    const newBal = await recalcUdhaarBalance(cust.customerId)
    const updated = { ...cust, udhaarBalance: newBal }
    setCust(updated); onUpdate(updated); loadUdhaar()
  }

  const handleDeleteCust = async () => {
    const ok = await confirm(`Delete "${cust.name}" and all their data?`, { title: 'Delete Customer', type: 'danger', confirmText: 'Delete', confirmWord: 'DELETE' })
    if (!ok) return
    await deleteCustomer(cust.customerId)
    if (onDelete) onDelete(cust.customerId)
  }

  const handleCopyPhone = () => {
    if (!cust.phone) return
    navigator.clipboard.writeText(cust.phone)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const unpaidTotal = udhaar.filter(u => !u.paidAt).reduce((s, u) => s + (u.amount - (u.paidAmt || 0)), 0)
  const tabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'udhaar', label: `Udhaar${unpaidTotal > 0 ? ` • ${fmtCur(unpaidTotal)}` : ''}` },
    { key: 'notes', label: `Notes${(cust.notes || []).length > 0 ? ` (${(cust.notes || []).length})` : ''}` },
  ]

  return (
    <div className="cust-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cust-modal cust-modal-wide">
        <div className="cust-modal-handle" />
        {/* Header */}
        <div className="cust-detail-header">
          <div className="cust-detail-avatar" style={{ background: avatarColor(cust.name) }}>
            {initials(cust.name)}
          </div>
          <div className="cust-detail-meta">
            <h2 className="cust-detail-name">
              {cust.name}
              {cust.tags?.includes('VIP') && <span className="cust-vip-star"><Ic.Star /></span>}
            </h2>
            {cust.phone && (
              <div className="cust-detail-phone-wrap">
                <a className="cust-detail-phone" href={`tel:${cust.phone}`}>{cust.phone}</a>
                <button className="cust-copy-btn" onClick={handleCopyPhone} title="Copy Phone">
                  {copied ? <Ic.Check /> : <Ic.Copy />}
                </button>
              </div>
            )}
          </div>
          <div className="cust-detail-actions">
            {cust.phone && (
              <a className="cust-action-btn cust-whatsapp-btn"
                href={`https://wa.me/91${cust.phone.replace(/\D/g, '')}${unpaidTotal > 0 ? `?text=${encodeURIComponent(`Hi ${cust.name}, you have an outstanding due of ${fmtCur(unpaidTotal)}. Please clear at your earliest.`)}` : ''}`}
                target="_blank" rel="noreferrer" title="WhatsApp">
                <Ic.WhatsApp />
              </a>
            )}
            <button className="cust-action-btn" onClick={() => setEditMode(true)} title="Edit">
              <Ic.Edit />
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="cust-detail-stats">
          <div className="cust-stat-item">
            <div className="cust-stat-value">{fmtCur(cust.totalSpent)}</div>
            <div className="cust-stat-label">Total Spent</div>
          </div>
          <div className="cust-stat-divider" />
          <div className="cust-stat-item">
            <div className={`cust-stat-value ${unpaidTotal > 0 ? 'cust-danger' : 'cust-success'}`}>
              {fmtCur(unpaidTotal)}
            </div>
            <div className="cust-stat-label">Udhaar</div>
          </div>
          <div className="cust-stat-divider" />
          <div className="cust-stat-item">
            <div className="cust-stat-value">{fmtRelative(cust.lastVisitAt)}</div>
            <div className="cust-stat-label">Last Visit</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="cust-tabs">
          {tabs.map(t => (
            <button key={t.key} className={`cust-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>

        <div className="cust-modal-body cust-tab-body">

          {/* ── Profile Tab ── */}
          {tab === 'profile' && (
            <div className="cust-profile-grid">
              {cust.email && <div className="cust-profile-row"><span className="cust-profile-label">Email</span><span>{cust.email}</span></div>}
              {cust.address && <div className="cust-profile-row"><span className="cust-profile-label">Address</span><span>{cust.address}</span></div>}
              <div className="cust-profile-row"><span className="cust-profile-label">Customer Since</span><span>{fmtDate(cust.createdAt)}</span></div>
              {(cust.tags || []).length > 0 && (
                <div className="cust-profile-row">
                  <span className="cust-profile-label">Tags</span>
                  <div className="cust-tags-display">
                    {cust.tags.map(t => <span key={t} className={`cust-tag-pill ${t === 'VIP' ? 'vip' : ''}`}>{t}</span>)}
                  </div>
                </div>
              )}

              <button className="cust-btn-danger cust-delete-bar" onClick={handleDeleteCust}>
                <span style={{ width: 18, height: 18, display: 'flex' }}><Ic.Trash /></span>
                Delete Customer
              </button>
            </div>
          )}

          {/* ── Udhaar Tab ── */}
          {tab === 'udhaar' && (
            <div className="cust-udh-section">
              <button className="cust-btn-primary cust-udh-add-btn" onClick={() => setShowAddUdh(true)}>
                <span style={{ width: 16, height: 16, display: 'flex' }}><Ic.Plus /></span>
                Add Due Entry
              </button>
              {loadingUdh ? (
                <div className="cust-empty-state"><div className="cust-loader" /></div>
              ) : udhaar.length === 0 ? (
                <div className="cust-empty-state">
                  <div className="cust-empty-icon"><Ic.Ledger /></div>
                  <p>No udhaar entries yet</p>
                  <span>This customer has a clean slate!</span>
                </div>
              ) : (
                <div className="cust-udh-list">
                  {(() => {
                    const active = udhaar.filter(e => (e.amount - (e.paidAmt || 0)) > 0)
                    const cleared = udhaar.filter(e => (e.amount - (e.paidAmt || 0)) <= 0)

                    const renderEntry = (entry) => {
                      const remaining = entry.amount - (entry.paidAmt || 0)
                      const isPaid = remaining <= 0
                      const progress = entry.amount > 0 ? Math.min(100, ((entry.paidAmt || 0) / entry.amount) * 100) : 0

                      const items = entry.reason ? entry.reason.split(',').map(s => s.trim()).filter(Boolean) : []
                      let reasonDisplay = 'No description'
                      let moreCount = 0
                      if (items.length > 0) {
                        if (items.length > 2) {
                          reasonDisplay = items.slice(0, 2).join(', ')
                          moreCount = items.length - 2
                        } else {
                          reasonDisplay = items.join(', ')
                        }
                      }

                      return (
                        <div key={entry.udhaarId} className={`cust-udh-entry ${isPaid ? 'paid faded' : ''}`}
                          onClick={() => setLedgerEntry(entry)} style={{ cursor: 'pointer' }}>
                          <div className="cust-udh-entry-left">
                            <div className={`cust-udh-status-dot ${isPaid ? 'paid' : ''}`} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="cust-udh-entry-reason">
                                <span className="cust-udh-reason-text">{reasonDisplay}</span>
                                {moreCount > 0 && (
                                  <span className="cust-udh-more-badge">+{moreCount} more items</span>
                                )}
                              </div>
                              <div className="cust-udh-entry-date">
                                {entry.orderId && (
                                  <span style={{ fontWeight: 700, fontSize: '0.7rem', color: 'var(--primary)', marginRight: 6 }}>
                                    Order #{entry.orderId} •
                                  </span>
                                )}
                                {fmtDateTime(entry.createdAt)}
                              </div>
                              {!isPaid && (entry.paidAmt || 0) > 0 && (
                                <div className="cust-udh-mini-bar">
                                  <div className="cust-udh-mini-fill" style={{ width: `${progress}%` }} />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="cust-udh-entry-right">
                            <div className={`cust-udh-amount ${isPaid ? 'paid' : 'due'}`}>
                              {isPaid ? '✓ Cleared' : fmtCur(remaining)}
                            </div>
                            {!isPaid && (entry.paidAmt || 0) > 0 && (
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{fmtCur(entry.paidAmt)} paid</div>
                            )}
                            <span style={{ color: 'var(--text-muted)', display: 'flex', width: 14, height: 14, flexShrink: 0 }}><Ic.ChevR /></span>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <>
                        {active.map(renderEntry)}
                        {cleared.length > 0 && (
                          <>
                            <div className="cust-udh-section-divider">
                              <span>SETTLED HISTORY</span>
                            </div>
                            {cleared.map(renderEntry)}
                          </>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ── Notes Tab ── */}
          {tab === 'notes' && (
            <div className="cust-notes-section">
              <div className="cust-note-input-row">
                <textarea className="cust-input cust-textarea" placeholder="Add a note, interaction or reminder..."
                  value={noteText} onChange={e => setNoteText(e.target.value)} rows={2} />
                <button className="cust-btn-primary" onClick={handleAddNote} disabled={!noteText.trim()}>Add</button>
              </div>
              {(cust.notes || []).length === 0 ? (
                <div className="cust-empty-state">
                  <div className="cust-empty-icon"><Ic.Note /></div>
                  <p>No notes yet</p>
                  <span>Log interactions, reminders, or preferences</span>
                </div>
              ) : (
                <div className="cust-notes-list">
                  {(cust.notes || []).map((note, idx) => (
                    <div key={idx} className="cust-note-item">
                      <div className="cust-note-text">{note.text}</div>
                      <div className="cust-note-footer">
                        <span className="cust-note-date">{fmtDateTime(note.ts)}</span>
                        <button className="cust-note-del" onClick={() => handleDeleteNote(idx)}><Ic.Trash /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sub-modals */}
      {showAddUdh && (
        <UdhaarEntryModal
          customerId={cust.customerId}
          customerName={cust.name}
          onSave={async () => {
            const fresh = await getCustomerById(cust.customerId)
            if (fresh) { setCust(fresh); onUpdate(fresh) }
            loadUdhaar(); setShowAddUdh(false)
          }}
          onClose={() => setShowAddUdh(false)}
        />
      )}
      {ledgerEntry && (
        <UdhaarLedgerModal
          entry={ledgerEntry}
          customer={cust}
          onClose={() => setLedgerEntry(null)}
          onNavigate={onNavigate}
          onRefresh={async () => {
            const bal = await recalcUdhaarBalance(cust.customerId)
            const fresh = { ...cust, udhaarBalance: bal }
            setCust(fresh); onUpdate(fresh); loadUdhaar()
          }}
          onDelete={async () => {
            const bal = await recalcUdhaarBalance(cust.customerId)
            const fresh = { ...cust, udhaarBalance: bal }
            setCust(fresh); onUpdate(fresh); loadUdhaar()
            setLedgerEntry(null)
          }}
        />
      )}
      {editMode && (
        <AddEditCustomerModal
          customer={cust}
          onSave={(saved) => { setCust(saved); onUpdate(saved); setEditMode(false) }}
          onClose={() => setEditMode(false)}
        />
      )}
    </div>
  )
}

// ── Export to CSV ──
function exportCustomersCSV(customers) {
  const headers = ['Name', 'Phone', 'Email', 'Address', 'Tags', 'Total Spent', 'Udhaar Balance', 'Last Visit', 'Since']
  const rows = customers.map(c => [
    c.name, c.phone, c.email, c.address,
    (c.tags || []).join('; '),
    c.totalSpent, c.udhaarBalance,
    fmtDate(c.lastVisitAt), fmtDate(c.createdAt)
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

// ── Customer Data Export Modal ──
function CustomerDataExportModal({ onClose, onExportCSV, onBackup, onRestoreRef, onClearAll }) {
  useBackButton(onClose)
  const cardStyle = { padding: '12px 14px', gap: '10px' };
  const iconStyle = { width: 36, height: 36, flexShrink: 0 };

  return (
    <div className="or-modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="or-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450, padding: 0 }}>
        <div className="or-modal-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Data & Export</div>
          <button className="or-modal-close" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Ic.X s={20} /></button>
        </div>
        
        <div className="or-modal-body" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          
          <div className="bp-backup-card bp-backup-export" style={cardStyle}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div className="bp-backup-card-icon" style={{ ...iconStyle, background: 'rgba(100,116,139,0.12)', color: '#64748b' }}><Ic.Receipt s={18} /></div>
              <div className="bp-backup-card-info">
                <div className="bp-backup-card-title" style={{ fontSize: '0.85rem', marginBottom: 2 }}>Export CSV</div>
                <div className="bp-backup-card-desc" style={{ fontSize: '0.72rem', lineHeight: 1.3 }}>Download a spreadsheet of your customers.</div>
              </div>
            </div>
            <button className="bp-btn-primary" style={{ background: '#64748b', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }} onClick={onExportCSV}>
              <Ic.Export s={14} /> Download CSV
            </button>
          </div>

          <div className="bp-backup-card bp-backup-export" style={cardStyle}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div className="bp-backup-card-icon" style={iconStyle}><Ic.Download s={18} /></div>
              <div className="bp-backup-card-info">
                <div className="bp-backup-card-title" style={{ fontSize: '0.85rem', marginBottom: 2 }}>Save Backup to Device</div>
                <div className="bp-backup-card-desc" style={{ fontSize: '0.72rem', lineHeight: 1.3 }}>Downloads a <code>.json</code> file containing all customer data.</div>
              </div>
            </div>
            <button className="bp-btn-primary" style={{ background: 'var(--brand-primary)', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }} onClick={onBackup}>
              <Ic.Download s={14} /> Download Backup
            </button>
          </div>

          <div className="bp-backup-card bp-backup-import" style={cardStyle}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div className="bp-backup-card-icon" style={iconStyle}><Ic.Upload s={18} /></div>
              <div className="bp-backup-card-info">
                <div className="bp-backup-card-title" style={{ fontSize: '0.85rem', marginBottom: 2 }}>Restore from Backup</div>
                <div className="bp-backup-card-desc" style={{ fontSize: '0.72rem', lineHeight: 1.3 }}>Upload a previously downloaded <code>.json</code> backup file to restore customers.</div>
              </div>
            </div>
            <button className="bp-btn-outline" style={{ background: 'transparent', color: '#10b981', border: '1.5px solid #10b981', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }} onClick={() => onRestoreRef.current?.click()}>
              <Ic.Upload s={14} /> Restore Backup
            </button>
          </div>

          <div className="bp-backup-card" style={{ ...cardStyle, borderColor: 'rgba(239,68,68,0.3)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div className="bp-backup-card-icon" style={{ ...iconStyle, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}><Ic.Trash s={18} /></div>
              <div className="bp-backup-card-info">
                <div className="bp-backup-card-title" style={{ fontSize: '0.85rem', color: '#ef4444', marginBottom: 2 }}>Wipe Customer Data</div>
                <div className="bp-backup-card-desc" style={{ fontSize: '0.72rem', lineHeight: 1.3 }}>Permanently delete all customers and udhaar entries. This cannot be undone.</div>
              </div>
            </div>
            <button className="bp-btn-outline" style={{ background: 'transparent', color: '#ef4444', border: '1.5px solid #ef4444', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }} onClick={onClearAll}>
              <Ic.Trash s={14} /> Reset Customer Records
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// MAIN CUSTOMERS COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function Customers({ onClose, onNavigate }) {
  useBackButton(onClose)
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const fileInputRef = useRef(null)
  const { alert: showAlert, confirm: showConfirm } = useAlert()

  const load = useCallback(async () => {
    setLoading(true)
    const all = await getCustomers()

    // Auto-heal missing totalSpent for old data
    let needsRefresh = false
    for (const cust of all) {
      if ((!cust.totalSpent || cust.totalSpent === 0)) {
        const udh = await getUdhaarByCustomer(cust.customerId)
        if (udh.length > 0) {
          const spent = udh.reduce((sum, e) => sum + (e.amount || 0), 0)
          if (spent > 0) {
            await saveCustomer({ ...cust, totalSpent: spent })
            needsRefresh = true
          }
        }
      }
    }

    const finalAll = needsRefresh ? await getCustomers() : all
    const sortedAll = finalAll.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
    setCustomers(sortedAll)

    const openCustId = localStorage.getItem('mn-open-customer')
    if (openCustId) {
      const targetCust = sortedAll.find(c => c.customerId === openCustId || c.id === openCustId)
      if (targetCust) setSelected(targetCust)
      localStorage.removeItem('mn-open-customer')
    }

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleExportCSV = () => {
    exportCustomersCSV(customers)
    setExportModalOpen(false)
  }

  const handleBackup = async () => {
    const blob = await exportCustomersBackup()
    if (!blob) return showAlert('Failed to generate backup.', { type: 'error' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mansula-customers-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportModalOpen(false)
  }

  const handleRestore = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setExportModalOpen(false)
    const ok = await restoreCustomersBackup(file)
    if (ok) {
      await load()
      showAlert('Backup restored successfully!', { type: 'success' })
    } else {
      showAlert('Failed to restore backup. Invalid format or corrupted file.', { type: 'error' })
    }
  }

  const handleClearAll = async () => {
    const ok = await showConfirm(
      'Are you absolutely sure you want to permanently delete ALL customers and udhaar data? This cannot be undone!',
      { title: 'WIPE ALL DATA', type: 'danger', confirmText: 'Yes, Delete Everything', confirmWord: 'WIPE' }
    )
    if (!ok) return
    setExportModalOpen(false)
    const cleared = await clearAllCustomerData()
    if (cleared) {
      setCustomers([])
      showAlert('All customer data has been wiped.', { type: 'success' })
    } else {
      showAlert('Failed to clear data.', { type: 'error' })
    }
  }

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q)
    const matchTab = filterTab === 'all' ||
      (filterTab === 'vip' && c.tags?.includes('VIP')) ||
      (filterTab === 'udhaar' && c.udhaarBalance > 0)
    return matchSearch && matchTab
  })

  const totalUdhaar = customers.reduce((s, c) => s + (c.udhaarBalance || 0), 0)
  const vipCount = customers.filter(c => c.tags?.includes('VIP')).length
  const udhaarCount = customers.filter(c => c.udhaarBalance > 0).length

  return (
    <div className="cust-screen">
      {/* Header */}
      <div className="cust-header">
        <button className="cust-back-btn" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="cust-header-info">
          <h1 className="cust-header-title">Customers</h1>
          <p className="cust-header-sub">{customers.length} contacts</p>
        </div>
        <button className="or-export-btn" onClick={() => setExportModalOpen(true)} title="Data & Export">
          <Ic.DB s={15} /> Data
        </button>
      </div>

      {/* Stats Bar */}
      <div className="cust-stats-bar">
        <div className="cust-stats-card">
          <div className="cust-stats-icon cust-stats-icon--blue"><Ic.User /></div>
          <div>
            <div className="cust-stats-val">{customers.length}</div>
            <div className="cust-stats-lbl">Total</div>
          </div>
        </div>
        <div className="cust-stats-card">
          <div className="cust-stats-icon cust-stats-icon--gold"><Ic.Star /></div>
          <div>
            <div className="cust-stats-val">{vipCount}</div>
            <div className="cust-stats-lbl">VIPs</div>
          </div>
        </div>
        <div className="cust-stats-card">
          <div className={`cust-stats-icon ${totalUdhaar > 0 ? 'cust-stats-icon--red' : 'cust-stats-icon--green'}`}>
            <Ic.Ledger />
          </div>
          <div>
            <div className={`cust-stats-val ${totalUdhaar > 0 ? 'cust-danger' : ''}`}>{fmtCur(totalUdhaar)}</div>
            <div className="cust-stats-lbl">Udhaar</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="cust-search-bar">
        <div className="cust-search-wrap">
          <span className="cust-search-icon"><Ic.Search /></span>
          <input className="cust-search-input" placeholder="Search by name or phone..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="cust-search-clear" onClick={() => setSearch('')}><Ic.Close /></button>}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="cust-filter-tabs">
        {[
          { key: 'all', label: `All (${customers.length})` },
          { key: 'vip', label: `⭐ VIP (${vipCount})` },
          { key: 'udhaar', label: `Due (${udhaarCount})` },
        ].map(t => (
          <button key={t.key} className={`cust-filter-tab ${filterTab === t.key ? 'active' : ''}`}
            onClick={() => setFilterTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* List */}
      <div className="cust-list">
        {loading ? (
          <div className="cust-empty-state cust-loading-state">
            <div className="cust-loader" />
            <p>Loading customers...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="cust-empty-state">
            <div className="cust-empty-icon"><Ic.User /></div>
            <p>{search ? 'No customers match your search' : 'No customers yet'}</p>
            <span>{search ? 'Try a different name or phone' : 'Tap + to add your first customer'}</span>
            {!search && (
              <button className="cust-btn-primary" style={{ marginTop: 16 }} onClick={() => setShowAdd(true)}>
                Add First Customer
              </button>
            )}
          </div>
        ) : (
          filtered.map(cust => (
            <div key={cust.customerId} className="cust-card" onClick={() => setSelected(cust)}>
              <div className="cust-card-avatar" style={{ background: avatarColor(cust.name) }}>
                {initials(cust.name)}
                {cust.tags?.includes('VIP') && <span className="cust-card-vip"><Ic.Star /></span>}
              </div>
              <div className="cust-card-info">
                <div className="cust-card-name">{cust.name}</div>
                {cust.phone ? (
                  <div className="cust-card-phone">{cust.phone}</div>
                ) : (
                  <div className="cust-card-phone" style={{ opacity: 0.5, fontStyle: 'italic' }}>No phone added</div>
                )}
                <div className="cust-card-sub">
                  {cust.lastVisitAt && <span className="cust-card-visit">Last: {fmtRelative(cust.lastVisitAt)}</span>}
                  {(cust.tags || []).filter(t => t !== 'VIP').map(t => (
                    <span key={t} className="cust-tag-pill small">{t}</span>
                  ))}
                </div>
              </div>
              <div className="cust-card-right">
                {cust.udhaarBalance > 0 && (
                  <div className="cust-udh-badge">{fmtCur(cust.udhaarBalance)}</div>
                )}
                {cust.totalSpent > 0 && (
                  <div className="cust-spent-label">{fmtCur(cust.totalSpent)}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button className="cust-fab" onClick={() => setShowAdd(true)} aria-label="Add Customer">
        <Ic.Plus />
      </button>

      {/* Modals */}
      {showAdd && (
        <AddEditCustomerModal
          onSave={async (saved) => { await load(); setShowAdd(false) }}
          onClose={() => setShowAdd(false)}
        />
      )}
      {selected && (
        <CustomerDetailModal
          customer={selected}
          onClose={() => { setSelected(null); load() }}
          onNavigate={onNavigate}
          onUpdate={(updated) => {
            setCustomers(prev => prev.map(c => c.customerId === updated.customerId ? updated : c))
            setSelected(updated)
          }}
          onDelete={(id) => {
            setCustomers(prev => prev.filter(c => c.customerId !== id))
            setSelected(null)
          }}
        />
      )}
      {exportModalOpen && (
        <CustomerDataExportModal
          onClose={() => setExportModalOpen(false)}
          onExportCSV={handleExportCSV}
          onBackup={handleBackup}
          onRestoreRef={fileInputRef}
          onClearAll={handleClearAll}
        />
      )}

      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleRestore} />
    </div>
  )
}
