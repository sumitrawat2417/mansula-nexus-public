import { useState, useEffect, useRef, useCallback } from 'react'
import { useBackButton } from './useBackButton.js'
import { useAlert } from './AlertDialog.jsx'
import { dbGet, dbSet } from './db.js'

// ── Helpers ──
const uid = () => `stf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
const shiftId = () => `shf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

const fmtTime = (ts) => ts ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'
const fmtDate = (ts) => ts ? new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtDateTime = (ts) => ts ? new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

const fmtDuration = (ms) => {
  if (!ms || ms < 0) return '0m'
  const totalMins = Math.floor(ms / 60000)
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

const avatarGrad = (name) => {
  const grads = [
    'linear-gradient(135deg,#6366f1,#8b5cf6)',
    'linear-gradient(135deg,#06b6d4,#0284c7)',
    'linear-gradient(135deg,#10b981,#059669)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#ec4899,#f43f5e)',
    'linear-gradient(135deg,#8b5cf6,#6366f1)',
    'linear-gradient(135deg,#0891b2,#0d9488)',
  ]
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return grads[Math.abs(hash) % grads.length]
}

const initials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── Constants ──
const ROLES = [
  { key: 'owner', label: 'Owner', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', desc: 'Full access to all features & settings' },
  { key: 'manager', label: 'Manager', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', desc: 'Access to analytics, inventory & staff management' },
  { key: 'cashier', label: 'Cashier', color: '#10b981', bg: 'rgba(16,185,129,0.12)', desc: 'POS, order records & own profile only' },
]

const ROLE_COLORS = { owner: '#f59e0b', manager: '#6366f1', cashier: '#10b981' }
const MAX_ABANDONED_SHIFT_HOURS = 12

// Storage keys
const KEY_STAFF = 'mn-staff-members'
const KEY_SHIFTS = 'mn-staff-shifts'
const KEY_ACTIVE_MEMBER = 'mn-active-staff'

// ── Icons ──
const Ic = {
  Close: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  ChevR: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>,
  Back: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
  User: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  Users: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  Shield: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  Warn: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  Del: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>,
  Eye: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  EyeOff: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
}

// ── PIN Pad Component ──
function PinPad({ title, subtitle, onSuccess, onCancel, pinLength = 4 }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  const handleDigit = (d) => {
    if (pin.length >= pinLength) return
    const newPin = pin + d
    setPin(newPin)
    if (newPin.length === pinLength) {
      setTimeout(() => onSuccess(newPin), 80)
    }
  }

  const handleBackspace = () => setPin(p => p.slice(0, -1))

  const triggerError = () => {
    setShake(true)
    setError(true)
    setPin('')
    setTimeout(() => { setShake(false); setError(false) }, 700)
  }

  // Expose triggerError via ref pattern via prop
  useEffect(() => {
    if (pin.length === pinLength) {
      setError(false)
    }
  }, [pin, pinLength])

  return (
    <div className="stf-pin-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={`stf-pin-modal ${shake ? 'stf-shake' : ''}`}>
        <div className="stf-pin-header">
          <div className="stf-pin-title">{title}</div>
          {subtitle && <div className="stf-pin-subtitle">{subtitle}</div>}
        </div>

        <div className="stf-pin-dots">
          {Array.from({ length: pinLength }).map((_, i) => (
            <div key={i} className={`stf-pin-dot ${i < pin.length ? 'filled' : ''} ${error ? 'error' : ''}`} />
          ))}
        </div>

        <div className="stf-pin-grid">
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((d, i) => {
            if (d === '') return <div key={i} />
            return (
              <button
                key={i}
                className={`stf-pin-key ${d === '⌫' ? 'stf-pin-del' : ''}`}
                onClick={() => d === '⌫' ? handleBackspace() : handleDigit(String(d))}
              >
                {d}
              </button>
            )
          })}
        </div>

        <button className="stf-pin-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

// ── Add/Edit Staff Modal ──
function AddEditStaffModal({ member, onSave, onClose }) {
  useBackButton(onClose)
  const [form, setForm] = useState({
    name: member?.name || '',
    role: member?.role || 'cashier',
    phone: member?.phone || '',
    hourlyRate: member?.hourlyRate || '',
  })
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pinError, setPinError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    if (!member) {
      // Creating new — PIN required
      if (pin.length !== 4) { setPinError('PIN must be 4 digits'); return }
      if (pin !== confirmPin) { setPinError('PINs do not match'); return }
    } else {
      // Editing — PIN change optional
      if (pin && pin.length !== 4) { setPinError('PIN must be 4 digits'); return }
      if (pin && pin !== confirmPin) { setPinError('PINs do not match'); return }
    }
    setPinError('')
    setSaving(true)
    const record = {
      ...(member || {}),
      memberId: member?.memberId || uid(),
      name: form.name.trim(),
      role: form.role,
      phone: form.phone.trim(),
      hourlyRate: parseFloat(form.hourlyRate) || 0,
      pin: pin || member?.pin || '',
      createdAt: member?.createdAt || Date.now(),
      updatedAt: Date.now(),
      isActive: member?.isActive ?? true,
    }
    setSaving(false)
    onSave(record)
  }

  return (
    <div className="stf-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="stf-modal">
        <div className="stf-modal-handle" />
        <div className="stf-modal-header">
          <h3 className="stf-modal-title">{member ? 'Edit Staff Member' : 'Add Staff Member'}</h3>
          <button className="stf-modal-close" onClick={onClose}><Ic.Close /></button>
        </div>

        <div className="stf-modal-body">
          {/* Avatar preview */}
          <div className="stf-add-avatar-wrap">
            <div className="stf-add-avatar" style={{ background: avatarGrad(form.name || '?') }}>
              {initials(form.name || '?')}
            </div>
          </div>

          <div className="stf-form-group">
            <label className="stf-label">Full Name *</label>
            <input className="stf-input" placeholder="e.g. Ramesh Kumar" value={form.name}
              onChange={e => set('name', e.target.value)} autoFocus />
          </div>

          <div className="stf-form-group">
            <label className="stf-label">Role *</label>
            <div className="stf-role-grid">
              {ROLES.map(r => (
                <button key={r.key}
                  className={`stf-role-btn ${form.role === r.key ? 'active' : ''}`}
                  style={form.role === r.key ? { borderColor: r.color, background: r.bg, color: r.color } : {}}
                  onClick={() => set('role', r.key)}
                >
                  <span className="stf-role-icon">
                    {r.key === 'owner' ? <Ic.Shield /> : r.key === 'manager' ? <Ic.Users /> : <Ic.User />}
                  </span>
                  <span className="stf-role-name">{r.label}</span>
                </button>
              ))}
            </div>
            <div className="stf-role-desc">{ROLES.find(r => r.key === form.role)?.desc}</div>
          </div>

          <div className="stf-form-group">
            <label className="stf-label">Phone Number</label>
            <input className="stf-input" placeholder="e.g. 9876543210" value={form.phone}
              onChange={e => set('phone', e.target.value)} type="tel" />
          </div>

          <div className="stf-form-group">
            <label className="stf-label">Hourly Rate (₹)</label>
            <input className="stf-input" placeholder="e.g. 60" value={form.hourlyRate}
              onChange={e => set('hourlyRate', e.target.value)} type="number" min="0" />
          </div>

          <div className="stf-pin-section">
            <div className="stf-pin-section-title">
              <Ic.Shield />
              {member ? 'Change PIN (leave blank to keep current)' : 'Set 4-Digit PIN *'}
            </div>
            <div className="stf-pin-inputs">
              <div className="stf-form-group" style={{ flex: 1 }}>
                <label className="stf-label">PIN</label>
                <div className="stf-pin-input-wrap">
                  <input className="stf-input" placeholder="••••"
                    value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    type={showPin ? 'text' : 'password'} inputMode="numeric" maxLength={4} />
                  <button className="stf-pin-eye" onClick={() => setShowPin(s => !s)}>
                    {showPin ? <Ic.EyeOff /> : <Ic.Eye />}
                  </button>
                </div>
              </div>
              <div className="stf-form-group" style={{ flex: 1 }}>
                <label className="stf-label">Confirm PIN</label>
                <input className="stf-input" placeholder="••••"
                  value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  type={showPin ? 'text' : 'password'} inputMode="numeric" maxLength={4} />
              </div>
            </div>
            {pinError && <div className="stf-pin-error"><Ic.Warn />{pinError}</div>}
          </div>
        </div>

        <div className="stf-modal-footer">
          <button className="stf-btn-secondary" onClick={onClose}>Cancel</button>
          <button className="stf-btn-primary" onClick={handleSave}
            disabled={saving || !form.name.trim()}>
            {saving ? 'Saving…' : member ? 'Save Changes' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Shift History Modal ──
function ShiftHistoryModal({ member, shifts, onClose }) {
  useBackButton(onClose)
  const memberShifts = shifts
    .filter(s => s.memberId === member.memberId)
    .sort((a, b) => b.clockIn - a.clockIn)

  const totalMs = memberShifts
    .filter(s => s.clockOut)
    .reduce((sum, s) => sum + (s.clockOut - s.clockIn), 0)

  const totalPay = member.hourlyRate
    ? (totalMs / 3600000) * member.hourlyRate
    : null

  return (
    <div className="stf-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="stf-modal stf-modal-wide">
        <div className="stf-modal-handle" />
        <div className="stf-modal-header">
          <h3 className="stf-modal-title">Shift History</h3>
          <button className="stf-modal-close" onClick={onClose}><Ic.Close /></button>
        </div>

        {/* Member hero */}
        <div className="stf-sh-hero" style={{ background: avatarGrad(member.name) }}>
          <div className="stf-sh-hero-ava">{initials(member.name)}</div>
          <div className="stf-sh-hero-info">
            <div className="stf-sh-hero-name">{member.name}</div>
            <div className="stf-sh-hero-role">{ROLES.find(r => r.key === member.role)?.label}</div>
          </div>
          <div className="stf-sh-hero-stats">
            <div className="stf-sh-stat">
              <div className="stf-sh-stat-v">{memberShifts.length}</div>
              <div className="stf-sh-stat-l">Shifts</div>
            </div>
            <div className="stf-sh-stat">
              <div className="stf-sh-stat-v">{fmtDuration(totalMs)}</div>
              <div className="stf-sh-stat-l">Total Hours</div>
            </div>
            {totalPay !== null && (
              <div className="stf-sh-stat">
                <div className="stf-sh-stat-v">₹{Math.round(totalPay)}</div>
                <div className="stf-sh-stat-l">Est. Pay</div>
              </div>
            )}
          </div>
        </div>

        <div className="stf-modal-body" style={{ paddingTop: 8 }}>
          {memberShifts.length === 0 ? (
            <div className="stf-empty">
              <Ic.Clock />
              <div>No shifts recorded yet</div>
            </div>
          ) : (
            <div className="stf-shift-list">
              {memberShifts.map(s => {
                const dur = s.clockOut ? s.clockOut - s.clockIn : Date.now() - s.clockIn
                const isOpen = !s.clockOut
                const isAbandoned = isOpen && dur > MAX_ABANDONED_SHIFT_HOURS * 3600000
                return (
                  <div key={s.shiftId} className={`stf-shift-item ${isOpen ? 'open' : ''} ${isAbandoned ? 'abandoned' : ''}`}>
                    <div className="stf-shift-left">
                      <div className={`stf-shift-dot ${isOpen ? 'live' : ''}`} />
                      <div>
                        <div className="stf-shift-date">{fmtDate(s.clockIn)}</div>
                        <div className="stf-shift-times">
                          <span>{fmtTime(s.clockIn)}</span>
                          <span className="stf-shift-arrow">→</span>
                          <span>{s.clockOut ? fmtTime(s.clockOut) : <span className="stf-shift-live">Live</span>}</span>
                        </div>
                        {isAbandoned && (
                          <div className="stf-shift-warn"><Ic.Warn /> Auto-capped at {MAX_ABANDONED_SHIFT_HOURS}h</div>
                        )}
                      </div>
                    </div>
                    <div className="stf-shift-right">
                      <div className="stf-shift-dur">{fmtDuration(dur)}</div>
                      {member.hourlyRate > 0 && s.clockOut && (
                        <div className="stf-shift-pay">₹{Math.round((dur / 3600000) * member.hourlyRate)}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Staff Member Card ──
function StaffCard({ member, activeShift, onSelect, onEdit, onHistory }) {
  const role = ROLES.find(r => r.key === member.role)
  const shiftDur = activeShift ? Date.now() - activeShift.clockIn : null
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!activeShift) return
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [activeShift])

  const liveDur = activeShift ? now - activeShift.clockIn : null

  return (
    <div className={`stf-card ${activeShift ? 'stf-card-active' : ''}`} onClick={() => onSelect(member)}>
      <div className="stf-card-inner">
        {/* Avatar + Status */}
        <div className="stf-card-avatar-wrap">
          <div className="stf-card-avatar" style={{ background: avatarGrad(member.name) }}>
            {initials(member.name)}
          </div>
          <div className={`stf-card-status ${activeShift ? 'on' : 'off'}`} />
        </div>

        {/* Info */}
        <div className="stf-card-info">
          <div className="stf-card-name">{member.name}</div>
          <div className="stf-card-role-chip" style={{ background: role?.bg, color: role?.color }}>
            {role?.label}
          </div>
          {activeShift ? (
            <div className="stf-card-shift-live">
              <span className="stf-card-live-dot" />
              Clocked in {fmtTime(activeShift.clockIn)} · {fmtDuration(liveDur)}
            </div>
          ) : (
            <div className="stf-card-off-label">Off Shift</div>
          )}
        </div>

        {/* Actions */}
        <div className="stf-card-actions" onClick={e => e.stopPropagation()}>
          <button className="stf-card-action-btn" onClick={() => onHistory(member)} title="Shift History">
            <Ic.Clock />
          </button>
          <button className="stf-card-action-btn" onClick={() => onEdit(member)} title="Edit">
            <Ic.Edit />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Export Shifts Data ──
function exportShiftsCsv(members, shifts) {
  const headers = ['Name', 'Role', 'Clock In', 'Clock Out', 'Duration (h)', 'Est. Pay (₹)']
  const rows = shifts
    .filter(s => s.clockOut)
    .sort((a, b) => b.clockIn - a.clockIn)
    .map(s => {
      const m = members.find(x => x.memberId === s.memberId)
      const dur = ((s.clockOut - s.clockIn) / 3600000).toFixed(2)
      const pay = m?.hourlyRate ? (parseFloat(dur) * m.hourlyRate).toFixed(0) : ''
      return [
        m?.name || 'Unknown',
        ROLES.find(r => r.key === m?.role)?.label || '',
        new Date(s.clockIn).toLocaleString('en-IN'),
        new Date(s.clockOut).toLocaleString('en-IN'),
        dur,
        pay,
      ]
    })

  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `StaffShifts_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ══════════════════════════════════════════════════════
// MAIN STAFF COMPONENT
// ══════════════════════════════════════════════════════
export default function Staff({ onClose }) {
  useBackButton(onClose)

  const [members, setMembers] = useState([])
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [historyMember, setHistoryMember] = useState(null)
  const [pinTarget, setPinTarget] = useState(null) // { member, action: 'clockin'|'clockout'|'delete' }
  const [pinError, setPinError] = useState(false)
  const [tab, setTab] = useState('directory') // directory | shifts
  const { alert: showAlert, confirm: showConfirm } = useAlert()

  // Load data
  const loadData = useCallback(async () => {
    const [m, s] = await Promise.all([
      dbGet(KEY_STAFF),
      dbGet(KEY_SHIFTS),
    ])
    setMembers(Array.isArray(m) ? m : [])
    setShifts(Array.isArray(s) ? s : [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Auto-cap abandoned shifts
  useEffect(() => {
    const capAbandoned = async () => {
      const raw = await dbGet(KEY_SHIFTS)
      if (!Array.isArray(raw)) return
      let changed = false
      const updated = raw.map(s => {
        if (!s.clockOut && (Date.now() - s.clockIn) > MAX_ABANDONED_SHIFT_HOURS * 3600000) {
          changed = true
          return { ...s, clockOut: s.clockIn + MAX_ABANDONED_SHIFT_HOURS * 3600000, autoCapped: true }
        }
        return s
      })
      if (changed) {
        await dbSet(KEY_SHIFTS, updated)
        setShifts(updated)
      }
    }
    capAbandoned()
  }, [])

  const getActiveShift = (memberId) => shifts.find(s => s.memberId === memberId && !s.clockOut) || null

  const handleSaveMember = async (record) => {
    const updated = members.some(m => m.memberId === record.memberId)
      ? members.map(m => m.memberId === record.memberId ? record : m)
      : [...members, record]
    await dbSet(KEY_STAFF, updated)
    setMembers(updated)
    setShowAdd(false)
    setEditingMember(null)
  }

  const handleDeleteMember = async (member) => {
    const ok = await showConfirm(
      `Delete "${member.name}" and all their shift records? This cannot be undone.`,
      { title: 'Delete Staff Member', type: 'danger', confirmText: 'Delete', confirmWord: 'DELETE' }
    )
    if (!ok) return
    const updatedMembers = members.filter(m => m.memberId !== member.memberId)
    const updatedShifts = shifts.filter(s => s.memberId !== member.memberId)
    await dbSet(KEY_STAFF, updatedMembers)
    await dbSet(KEY_SHIFTS, updatedShifts)
    setMembers(updatedMembers)
    setShifts(updatedShifts)
  }

  const handleSelectMember = (member) => {
    const active = getActiveShift(member.memberId)
    setPinError(false)
    setPinTarget({ member, action: active ? 'clockout' : 'clockin' })
  }

  const handlePinSuccess = async (enteredPin) => {
    const { member, action } = pinTarget
    if (enteredPin !== member.pin) {
      setPinError(true)
      // PinPad will re-render with error state; we close after short delay
      setTimeout(() => {
        setPinTarget(null)
        setPinError(false)
        showAlert('Incorrect PIN. Please try again.', { type: 'danger' })
      }, 800)
      return
    }

    // PIN correct
    if (action === 'clockin') {
      const newShift = {
        shiftId: shiftId(),
        memberId: member.memberId,
        clockIn: Date.now(),
        clockOut: null,
        autoCapped: false,
      }
      const updatedShifts = [...shifts, newShift]
      await dbSet(KEY_SHIFTS, updatedShifts)
      setShifts(updatedShifts)
      setPinTarget(null)
      showAlert(`${member.name} clocked in successfully!`, { type: 'success' })
    } else if (action === 'clockout') {
      const active = getActiveShift(member.memberId)
      if (active) {
        const updatedShifts = shifts.map(s =>
          s.shiftId === active.shiftId ? { ...s, clockOut: Date.now() } : s
        )
        await dbSet(KEY_SHIFTS, updatedShifts)
        setShifts(updatedShifts)
        const dur = Date.now() - active.clockIn
        setPinTarget(null)
        showAlert(`${member.name} clocked out. Shift: ${fmtDuration(dur)}`, { type: 'success' })
      }
    }
  }

  // Summary stats
  const activeCount = members.filter(m => getActiveShift(m.memberId)).length
  const todayShifts = shifts.filter(s => {
    const today = new Date()
    const sDate = new Date(s.clockIn)
    return sDate.toDateString() === today.toDateString()
  })
  const todayMs = todayShifts.filter(s => s.clockOut).reduce((sum, s) => sum + (s.clockOut - s.clockIn), 0)

  if (loading) {
    return (
      <div className="stf-root">
        <div className="stf-header">
          <button className="stf-back-btn" onClick={onClose}><Ic.Back /></button>
          <div className="stf-header-title">Staff</div>
        </div>
        <div className="stf-loading">Loading staff data…</div>
      </div>
    )
  }

  return (
    <div className="stf-root">
      {/* ── Header ── */}
      <div className="stf-header">
        <button className="stf-back-btn" onClick={onClose}><Ic.Back /></button>
        <div className="stf-header-title">Staff</div>
        <button className="stf-add-btn" onClick={() => setShowAdd(true)}>
          <Ic.Plus />
        </button>
      </div>

      {/* ── Stats Bar ── */}
      <div className="stf-stats-bar">
        <div className="stf-stat-pill">
          <div className="stf-stat-pill-v">{members.length}</div>
          <div className="stf-stat-pill-l">Members</div>
        </div>
        <div className="stf-stat-pill stf-stat-pill--green">
          <div className="stf-stat-pill-v">{activeCount}</div>
          <div className="stf-stat-pill-l">On Shift</div>
        </div>
        <div className="stf-stat-pill">
          <div className="stf-stat-pill-v">{todayShifts.length}</div>
          <div className="stf-stat-pill-l">Today's Shifts</div>
        </div>
        <div className="stf-stat-pill">
          <div className="stf-stat-pill-v">{fmtDuration(todayMs)}</div>
          <div className="stf-stat-pill-l">Hours Today</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="stf-tabs">
        <button className={`stf-tab ${tab === 'directory' ? 'active' : ''}`} onClick={() => setTab('directory')}>
          <Ic.Users /> Directory
        </button>
        <button className={`stf-tab ${tab === 'shifts' ? 'active' : ''}`} onClick={() => setTab('shifts')}>
          <Ic.Clock /> Shift Logs
        </button>
      </div>

      <div className="stf-body">

        {/* ── DIRECTORY TAB ── */}
        {tab === 'directory' && (
          <>
            {members.length === 0 ? (
              <div className="stf-empty-state">
                <div className="stf-empty-icon"><Ic.Users /></div>
                <div className="stf-empty-title">No Staff Members Yet</div>
                <div className="stf-empty-sub">Add your first team member to get started.</div>
                <button className="stf-btn-primary" onClick={() => setShowAdd(true)}>
                  <Ic.Plus /> Add First Member
                </button>
              </div>
            ) : (
              <div className="stf-section">
                {/* Active first */}
                {members.filter(m => getActiveShift(m.memberId)).length > 0 && (
                  <>
                    <div className="stf-section-label">
                      <span className="stf-live-pulse" /> On Shift Now
                    </div>
                    {members
                      .filter(m => getActiveShift(m.memberId))
                      .map(m => (
                        <StaffCard
                          key={m.memberId}
                          member={m}
                          activeShift={getActiveShift(m.memberId)}
                          onSelect={handleSelectMember}
                          onEdit={setEditingMember}
                          onHistory={setHistoryMember}
                        />
                      ))}
                  </>
                )}

                {members.filter(m => !getActiveShift(m.memberId)).length > 0 && (
                  <>
                    <div className="stf-section-label" style={{ marginTop: 16 }}>Off Shift</div>
                    {members
                      .filter(m => !getActiveShift(m.memberId))
                      .map(m => (
                        <StaffCard
                          key={m.memberId}
                          member={m}
                          activeShift={null}
                          onSelect={handleSelectMember}
                          onEdit={setEditingMember}
                          onHistory={setHistoryMember}
                        />
                      ))}
                  </>
                )}

                {/* Manage section */}
                <div className="stf-manage-section">
                  <div className="stf-section-label" style={{ marginTop: 20 }}>Manage</div>
                  {members.map(m => (
                    <div key={m.memberId} className="stf-manage-row">
                      <div className="stf-manage-ava" style={{ background: avatarGrad(m.name) }}>
                        {initials(m.name)}
                      </div>
                      <div className="stf-manage-info">
                        <div className="stf-manage-name">{m.name}</div>
                        <div className="stf-manage-role" style={{ color: ROLE_COLORS[m.role] }}>
                          {ROLES.find(r => r.key === m.role)?.label}
                        </div>
                      </div>
                      <div className="stf-manage-btns">
                        <button className="stf-manage-btn" onClick={() => setEditingMember(m)} title="Edit"><Ic.Edit /></button>
                        <button className="stf-manage-btn stf-manage-btn--danger" onClick={() => handleDeleteMember(m)} title="Delete"><Ic.Del /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── SHIFTS TAB ── */}
        {tab === 'shifts' && (
          <div className="stf-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="stf-section-label" style={{ margin: 0 }}>All Shift Records</div>
              {shifts.filter(s => s.clockOut).length > 0 && (
                <button className="stf-export-btn" onClick={() => exportShiftsCsv(members, shifts)}>
                  <Ic.Download /> Export CSV
                </button>
              )}
            </div>

            {shifts.length === 0 ? (
              <div className="stf-empty-state">
                <div className="stf-empty-icon"><Ic.Clock /></div>
                <div className="stf-empty-title">No Shifts Yet</div>
                <div className="stf-empty-sub">Shift logs will appear here after staff members clock in.</div>
              </div>
            ) : (
              <div className="stf-shift-log">
                {[...shifts]
                  .sort((a, b) => b.clockIn - a.clockIn)
                  .map(s => {
                    const m = members.find(x => x.memberId === s.memberId)
                    const dur = s.clockOut ? s.clockOut - s.clockIn : Date.now() - s.clockIn
                    const isOpen = !s.clockOut
                    return (
                      <div key={s.shiftId} className={`stf-log-row ${isOpen ? 'open' : ''}`}>
                        <div className="stf-log-ava" style={{ background: m ? avatarGrad(m.name) : '#ccc' }}>
                          {initials(m?.name || '?')}
                        </div>
                        <div className="stf-log-info">
                          <div className="stf-log-name">{m?.name || 'Unknown'}</div>
                          <div className="stf-log-date">{fmtDateTime(s.clockIn)} {s.clockOut ? `→ ${fmtTime(s.clockOut)}` : ''}</div>
                          {s.autoCapped && <div className="stf-log-cap"><Ic.Warn /> Auto-capped</div>}
                        </div>
                        <div className="stf-log-right">
                          {isOpen ? (
                            <span className="stf-log-live">Live</span>
                          ) : (
                            <div className="stf-log-dur">{fmtDuration(dur)}</div>
                          )}
                          {m?.hourlyRate > 0 && s.clockOut && (
                            <div className="stf-log-pay">₹{Math.round((dur / 3600000) * m.hourlyRate)}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Role Legend ── */}
      <div className="stf-role-legend">
        {ROLES.map(r => (
          <div key={r.key} className="stf-role-legend-item">
            <div className="stf-role-legend-dot" style={{ background: r.color }} />
            <span style={{ color: r.color, fontWeight: 600 }}>{r.label}</span>
            <span className="stf-role-legend-desc"> — {r.desc}</span>
          </div>
        ))}
      </div>

      {/* ── Modals ── */}
      {(showAdd || editingMember) && (
        <AddEditStaffModal
          member={editingMember}
          onSave={handleSaveMember}
          onClose={() => { setShowAdd(false); setEditingMember(null) }}
        />
      )}

      {historyMember && (
        <ShiftHistoryModal
          member={historyMember}
          shifts={shifts}
          onClose={() => setHistoryMember(null)}
        />
      )}

      {pinTarget && (
        <PinPad
          title={pinTarget.action === 'clockin'
            ? `Clock In — ${pinTarget.member.name}`
            : `Clock Out — ${pinTarget.member.name}`}
          subtitle={pinTarget.action === 'clockin' ? 'Enter your PIN to start your shift' : 'Enter your PIN to end your shift'}
          onSuccess={handlePinSuccess}
          onCancel={() => { setPinTarget(null); setPinError(false) }}
        />
      )}
    </div>
  )
}
