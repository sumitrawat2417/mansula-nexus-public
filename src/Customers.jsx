import { useState, useEffect, useCallback } from 'react'
import {
  getCustomers, saveCustomer, deleteCustomer,
  getUdhaarByCustomer, saveUdhaarEntry, deleteUdhaarEntry,
  recalcUdhaarBalance
} from './db.js'
import { useAlert } from './AlertDialog.jsx'

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
    '#6366f1','#8b5cf6','#ec4899','#0891b2','#0d9488',
    '#059669','#d97706','#dc2626','#7c3aed','#2563eb'
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
  Close:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Plus:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Search:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Trash:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Edit:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Phone:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 11.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 .77l3-.01a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.45a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 15z"/></svg>,
  WhatsApp: () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>,
  ChevR:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Check:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Rupee:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="18" y2="3"/><line x1="6" y1="8" x2="18" y2="8"/><line x1="6" y1="21" x2="12" y2="8"/><path d="M6 8c0 0 4 1 4 4.5S6 17 6 17"/></svg>,
  User:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Note:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Export:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Star:     () => <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Info:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
}

// ── Add/Edit Customer Modal ──
function AddEditCustomerModal({ customer, onSave, onClose }) {
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
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    setSaving(true)
    const entry = await saveUdhaarEntry({ customerId, amount: amt, reason: reason.trim() })
    if (entry) await recalcUdhaarBalance(customerId)
    setSaving(false)
    if (entry) onSave()
  }

  return (
    <div className="cust-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cust-modal" style={{ maxWidth: 400 }}>
        <div className="cust-modal-handle" />
        <div className="cust-modal-header">
          <h3 className="cust-modal-title">Add Udhaar</h3>
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
            <input className="cust-input" placeholder="0" value={amount}
              onChange={e => setAmount(e.target.value)} type="number" min="0" autoFocus />
          </div>
          <div className="cust-form-group">
            <label className="cust-label">Reason / Description</label>
            <input className="cust-input" placeholder="e.g. Dal Makhani x2, Tea..." value={reason}
              onChange={e => setReason(e.target.value)} />
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
  const [paidAmt, setPaidAmt] = useState(String(entry.amount - (entry.paidAmt || 0)))
  const [saving, setSaving] = useState(false)
  const remaining = entry.amount - (entry.paidAmt || 0)

  const handleSave = async () => {
    const amt = Math.min(parseFloat(paidAmt) || 0, remaining)
    if (amt <= 0) return
    setSaving(true)
    const newPaid = (entry.paidAmt || 0) + amt
    const updated = { ...entry, paidAmt: newPaid, paidAt: newPaid >= entry.amount ? Date.now() : null }
    await saveUdhaarEntry(updated)
    await recalcUdhaarBalance(entry.customerId)
    setSaving(false)
    onSave()
  }

  return (
    <div className="cust-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cust-modal" style={{ maxWidth: 400 }}>
        <div className="cust-modal-handle" />
        <div className="cust-modal-header">
          <h3 className="cust-modal-title">Mark as Paid</h3>
          <button className="cust-modal-close" onClick={onClose}><Ic.Close /></button>
        </div>
        <div className="cust-modal-body">
          <div className="cust-udh-info-box">
            <div className="cust-udh-info-row"><span>Total Due</span><strong>{fmtCur(entry.amount)}</strong></div>
            <div className="cust-udh-info-row"><span>Already Paid</span><strong>{fmtCur(entry.paidAmt || 0)}</strong></div>
            <div className="cust-udh-info-row cust-udh-info-row--highlight"><span>Remaining</span><strong>{fmtCur(remaining)}</strong></div>
          </div>
          <div className="cust-form-group" style={{ marginTop: 16 }}>
            <label className="cust-label">Payment Amount (₹)</label>
            <input className="cust-input" value={paidAmt}
              onChange={e => setPaidAmt(e.target.value)} type="number" min="0" max={remaining} autoFocus />
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

// ── Customer Detail Modal ──
function CustomerDetailModal({ customer, onClose, onUpdate }) {
  const [tab, setTab] = useState('profile')
  const [udhaar, setUdhaar] = useState([])
  const [loadingUdh, setLoadingUdh] = useState(true)
  const [showAddUdh, setShowAddUdh] = useState(false)
  const [payEntry, setPayEntry] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [cust, setCust] = useState(customer)
  const { confirm } = useAlert()

  const loadUdhaar = useCallback(async () => {
    setLoadingUdh(true)
    const entries = await getUdhaarByCustomer(cust.customerId)
    setUdhaar(entries.sort((a, b) => b.createdAt - a.createdAt))
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

  const unpaidTotal = udhaar.filter(u => !u.paidAt).reduce((s, u) => s + (u.amount - (u.paidAmt || 0)), 0)
  const tabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'udhaar',  label: `Udhaar${unpaidTotal > 0 ? ` • ${fmtCur(unpaidTotal)}` : ''}` },
    { key: 'notes',   label: `Notes${(cust.notes || []).length > 0 ? ` (${(cust.notes || []).length})` : ''}` },
  ]

  return (
    <div className="cust-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cust-modal cust-modal-wide">
        <div className="cust-modal-handle" />
        {/* Header */}
        <div className="cust-detail-header">
          <button className="cust-modal-close" onClick={onClose}><Ic.Close /></button>
          <div className="cust-detail-avatar" style={{ background: avatarColor(cust.name) }}>
            {initials(cust.name)}
          </div>
          <div className="cust-detail-meta">
            <h2 className="cust-detail-name">
              {cust.name}
              {cust.tags?.includes('VIP') && <span className="cust-vip-star"><Ic.Star /></span>}
            </h2>
            {cust.phone && <a className="cust-detail-phone" href={`tel:${cust.phone}`}>{cust.phone}</a>}
          </div>
          <div className="cust-detail-actions">
            {cust.phone && (
              <a className="cust-action-btn cust-whatsapp-btn"
                href={`https://wa.me/91${cust.phone.replace(/\D/g, '')}${unpaidTotal > 0 ? `?text=${encodeURIComponent(`Hi ${cust.name}, you have an outstanding due of ${fmtCur(unpaidTotal)}. Please clear at your earliest.`)}` : ''}`}
                target="_blank" rel="noreferrer" title="WhatsApp">
                <Ic.WhatsApp />
              </a>
            )}
            {cust.phone && (
              <a className="cust-action-btn" href={`tel:${cust.phone}`} title="Call">
                <Ic.Phone />
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
                  <div className="cust-empty-icon"><Ic.Rupee /></div>
                  <p>No udhaar entries yet</p>
                  <span>This customer has a clean slate!</span>
                </div>
              ) : (
                <div className="cust-udh-list">
                  {udhaar.map(entry => {
                    const remaining = entry.amount - (entry.paidAmt || 0)
                    const isPaid = remaining <= 0
                    return (
                      <div key={entry.udhaarId} className={`cust-udh-entry ${isPaid ? 'paid' : ''}`}>
                        <div className="cust-udh-entry-left">
                          <div className={`cust-udh-status-dot ${isPaid ? 'paid' : ''}`} />
                          <div>
                            <div className="cust-udh-entry-reason">{entry.reason || 'No description'}</div>
                            <div className="cust-udh-entry-date">{fmtDateTime(entry.createdAt)}</div>
                          </div>
                        </div>
                        <div className="cust-udh-entry-right">
                          <div className={`cust-udh-amount ${isPaid ? 'paid' : 'due'}`}>
                            {isPaid ? '✓ Paid' : `${fmtCur(remaining)}`}
                          </div>
                          <div className="cust-udh-entry-actions">
                            {!isPaid && (
                              <button className="cust-udh-pay-btn" onClick={() => setPayEntry(entry)}>Pay</button>
                            )}
                            <button className="cust-udh-del-btn" onClick={() => handleDeleteUdh(entry)}>
                              <Ic.Trash />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
            const updated = await recalcUdhaarBalance(cust.customerId)
            const fresh = { ...cust, udhaarBalance: updated }
            setCust(fresh); onUpdate(fresh); loadUdhaar(); setShowAddUdh(false)
          }}
          onClose={() => setShowAddUdh(false)}
        />
      )}
      {payEntry && (
        <MarkPaidModal
          entry={payEntry}
          onSave={async () => {
            const bal = await recalcUdhaarBalance(cust.customerId)
            const fresh = { ...cust, udhaarBalance: bal }
            setCust(fresh); onUpdate(fresh); loadUdhaar(); setPayEntry(null)
          }}
          onClose={() => setPayEntry(null)}
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

// ══════════════════════════════════════════════════════════════════
// MAIN CUSTOMERS COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function Customers({ onClose }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
  const { confirm } = useAlert()

  const load = useCallback(async () => {
    setLoading(true)
    const all = await getCustomers()
    setCustomers(all.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

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

  const handleDelete = async (cust, e) => {
    e.stopPropagation()
    const ok = await confirm(`Delete "${cust.name}" and all their data?`, { title: 'Delete Customer', type: 'danger', confirmText: 'Delete', confirmWord: 'DELETE' })
    if (!ok) return
    await deleteCustomer(cust.customerId)
    setCustomers(prev => prev.filter(c => c.customerId !== cust.customerId))
    if (selected?.customerId === cust.customerId) setSelected(null)
  }

  return (
    <div className="cust-screen">
      {/* Header */}
      <div className="cust-header">
        <button className="cust-back-btn" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="cust-header-info">
          <h1 className="cust-header-title">Customers</h1>
          <p className="cust-header-sub">{customers.length} contacts</p>
        </div>
        <button className="cust-header-export" onClick={() => exportCustomersCSV(customers)} title="Export CSV">
          <Ic.Export />
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
            <Ic.Rupee />
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
          { key: 'all',    label: `All (${customers.length})` },
          { key: 'vip',    label: `⭐ VIP (${vipCount})` },
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
                {cust.phone && <div className="cust-card-phone">{cust.phone}</div>}
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
                <button className="cust-del-icon" onClick={e => handleDelete(cust, e)}><Ic.Trash /></button>
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
          onUpdate={(updated) => {
            setCustomers(prev => prev.map(c => c.customerId === updated.customerId ? updated : c))
            setSelected(updated)
          }}
        />
      )}
    </div>
  )
}
