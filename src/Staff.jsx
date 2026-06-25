import { useState, useEffect, useCallback } from 'react'
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

export const avatarGrad = (name) => {
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

export const initials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── Constants ──
// ── Constants ──

// Storage keys
const KEY_STAFF = 'mn-staff-members'
const KEY_SHIFTS = 'mn-staff-shifts'

// ── Icons ──
const Ic = {
  Close: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
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

// ── Add/Edit Staff Modal ──
function AddEditStaffModal({ member, onSave, onClose }) {
  useBackButton(onClose)
  const [form, setForm] = useState({
    name: member?.name || '',
    phone: member?.phone || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const record = {
      ...(member || {}),
      memberId: member?.memberId || uid(),
      name: form.name.trim(),
      phone: form.phone.trim(),
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
            <label className="stf-label">Phone Number</label>
            <input className="stf-input" placeholder="e.g. 9876543210" value={form.phone}
              onChange={e => set('phone', e.target.value)} type="tel" />
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

const calStyles = {
  container: { background: 'var(--bg-surface-2)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, border: '1px solid var(--border-color)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  nav: { background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: 8, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px 4px', textAlign: 'center' },
  weekday: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' },
  day: { height: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', position: 'relative', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, margin: '0 auto', width: 36 },
  dayEmpty: { visibility: 'hidden' },
  dayToday: { background: 'var(--brand-primary)', color: 'white', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)' },
  dayShift: { border: '2px solid var(--success-color)', color: 'var(--text-primary)' },
  dot: { width: 4, height: 4, background: 'var(--success-color)', borderRadius: '50%', position: 'absolute', bottom: 4 }
}

function AttendanceCalendar({ memberShifts }) {
  const [currentMonth, setCurrentMonth] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const today = new Date()

  const shiftMap = {}
  memberShifts.forEach(s => {
    const dStr = new Date(s.clockIn).toDateString()
    if (!shiftMap[dStr]) shiftMap[dStr] = []
    shiftMap[dStr].push(s)
  })

  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i))

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  return (
    <div style={calStyles.container}>
      <div style={calStyles.header}>
        <button style={calStyles.nav} onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}><Ic.Back /></button>
        <div style={calStyles.title}>{monthNames[month]} {year}</div>
        <button style={{...calStyles.nav, transform: 'rotate(180deg)'}} onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}><Ic.Back /></button>
      </div>
      <div style={calStyles.grid}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} style={calStyles.weekday}>{d}</div>)}
      </div>
      <div style={calStyles.grid}>
        {days.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} style={{...calStyles.day, ...calStyles.dayEmpty}} />
          const isToday = d.toDateString() === today.toDateString()
          const hasShift = !!shiftMap[d.toDateString()]
          let style = { ...calStyles.day }
          if (isToday) style = { ...style, ...calStyles.dayToday }
          if (hasShift && !isToday) style = { ...style, ...calStyles.dayShift }
          
          return (
            <div key={i} style={style}>
              {d.getDate()}
              {hasShift && !isToday && <div style={calStyles.dot} />}
            </div>
          )
        })}
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

  return (
    <div className="stf-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="stf-modal stf-modal-wide">
        <div className="stf-modal-handle" />
        <div className="stf-modal-header">
          <h3 className="stf-modal-title">Attendance History</h3>
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
              <div className="stf-sh-stat-l">Attendance Days</div>
            </div>
          </div>
        </div>

        <div className="stf-modal-body" style={{ paddingTop: 16 }}>
          <AttendanceCalendar memberShifts={memberShifts} />

          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            All Attendance Records
          </div>

          {memberShifts.length === 0 ? (
            <div className="stf-empty">
              <Ic.Check />
              <div>No attendance recorded yet</div>
            </div>
          ) : (
            <div className="stf-shift-list">
              {memberShifts.map(s => {
                return (
                  <div key={s.shiftId} className={`stf-shift-item open`}>
                    <div className="stf-shift-left">
                      <div className={`stf-shift-dot live`} />
                      <div>
                        <div className="stf-shift-date">{fmtDate(s.clockIn)}</div>
                        <div className="stf-shift-times">
                          <span>Marked Present at {fmtTime(s.clockIn)}</span>
                        </div>
                      </div>
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
// Cards are read-only for navigation (mark present). Edit is ONLY in the Manage section below.
function StaffCard({ member, activeShift, onSelect, onHistory }) {
  const handleCardClick = () => {
    onSelect(member)
  }

  return (
    <div
      className={`stf-card ${activeShift ? 'stf-card-active' : ''}`}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
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
          <div className="stf-card-role-chip" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
            Staff
          </div>
          {activeShift ? (
            <div className="stf-card-shift-live">
              <span className="stf-card-live-dot" />
              Marked Present Today
            </div>
          ) : (
            <div className="stf-card-off-label">Tap to Mark Present</div>
          )}
        </div>

        {/* Only history button — no edit on the card */}
        <div className="stf-card-actions" onClick={e => e.stopPropagation()}>
          <button className="stf-card-action-btn" onClick={() => onHistory(member)} title="Attendance History">
            <Ic.Check />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Export Shifts Data ──
function exportShiftsCsv(members, shifts) {
  const headers = ['Name', 'Date', 'Time Marked']
  const rows = shifts
    .sort((a, b) => b.clockIn - a.clockIn)
    .map(s => {
      const m = members.find(x => x.memberId === s.memberId)
      return [
        m?.name || 'Unknown',
        new Date(s.clockIn).toLocaleDateString('en-IN'),
        new Date(s.clockIn).toLocaleTimeString('en-IN'),
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
export default function Staff({ onClose, onStaffChanged }) {
  useBackButton(onClose)

  const [members, setMembers] = useState([])
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [historyMember, setHistoryMember] = useState(null)
  const [tab, setTab] = useState('directory')
  const { alert: showAlert, confirm: showConfirm } = useAlert()

  // Load data
  const loadData = useCallback(async () => {
    const [m, s] = await Promise.all([dbGet(KEY_STAFF), dbGet(KEY_SHIFTS)])
    setMembers(Array.isArray(m) ? m : [])
    setShifts(Array.isArray(s) ? s : [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => { loadData() }, [loadData])

  const getTodayAttendance = (memberId) => shifts.find(s => s.memberId === memberId && new Date(s.clockIn).toDateString() === new Date().toDateString()) || null

  const handleSaveMember = async (record) => {
    const updated = members.some(m => m.memberId === record.memberId)
      ? members.map(m => m.memberId === record.memberId ? record : m)
      : [...members, record]
    await dbSet(KEY_STAFF, updated)
    setMembers(updated)
    setShowAdd(false)
    setEditingMember(null)
    if (onStaffChanged) onStaffChanged()
  }

  const handleDeleteMember = async (member) => {
    const ok = await showConfirm(
      `Delete "${member.name}" and all their attendance records? This cannot be undone.`,
      { title: 'Delete Staff Member', type: 'danger', confirmText: 'Delete', confirmWord: 'DELETE' }
    )
    if (!ok) return
    const updatedMembers = members.filter(m => m.memberId !== member.memberId)
    const updatedShifts = shifts.filter(s => s.memberId !== member.memberId)
    await dbSet(KEY_STAFF, updatedMembers)
    await dbSet(KEY_SHIFTS, updatedShifts)
    setMembers(updatedMembers)
    setShifts(updatedShifts)
    if (onStaffChanged) onStaffChanged()
  }

  const toggleAttendance = async (member) => {
    const active = getTodayAttendance(member.memberId)
    if (active) {
      // Unmark attendance
      const updatedShifts = shifts.filter(s => s.shiftId !== active.shiftId)
      await dbSet(KEY_SHIFTS, updatedShifts)
      setShifts(updatedShifts)
      showAlert(`${member.name}'s attendance removed.`, { type: 'success' })
    } else {
      // Mark attendance
      const newShift = { shiftId: shiftId(), memberId: member.memberId, clockIn: Date.now() }
      const updatedShifts = [...shifts, newShift]
      await dbSet(KEY_SHIFTS, updatedShifts)
      setShifts(updatedShifts)
      showAlert(`${member.name} marked present!`, { type: 'success' })
    }
  }

  const handleSelectMember = (member) => {
    toggleAttendance(member)
  }
  // Stats — owners excluded from shift stats
  const shiftableMembers = members.filter(m => m.role !== 'owner')
  const presentCount = shiftableMembers.filter(m => getTodayAttendance(m.memberId)).length

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
          <div className="stf-stat-pill-v">{presentCount}</div>
          <div className="stf-stat-pill-l">Present Today</div>
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
        <button className={`stf-tab ${tab === 'manage' ? 'active' : ''}`} onClick={() => setTab('manage')}>
          <Ic.Shield /> Manage
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


                {/* Staff Present Today */}
                {members.filter(m => getTodayAttendance(m.memberId)).length > 0 && (
                  <>
                    <div className="stf-section-label" style={{ marginTop: 14 }}>
                      <span className="stf-live-pulse" /> Present Today
                    </div>
                    {members.filter(m => getTodayAttendance(m.memberId)).map(m => (
                      <StaffCard key={m.memberId} member={m} activeShift={getTodayAttendance(m.memberId)}
                        onSelect={handleSelectMember} onHistory={setHistoryMember} />
                    ))}
                  </>
                )}

                {/* Staff Not Marked */}
                {members.filter(m => !getTodayAttendance(m.memberId)).length > 0 && (
                  <>
                    <div className="stf-section-label" style={{ marginTop: 14 }}>Not Marked</div>
                    {members.filter(m => !getTodayAttendance(m.memberId)).map(m => (
                      <StaffCard key={m.memberId} member={m} activeShift={null}
                        onSelect={handleSelectMember} onHistory={setHistoryMember} />
                    ))}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ── SHIFTS TAB ── */}
        {tab === 'shifts' && (
          <div className="stf-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="stf-section-label" style={{ margin: 0 }}>All Attendance Records</div>
              {shifts.length > 0 && (
                <button className="stf-export-btn" onClick={() => exportShiftsCsv(members, shifts)}>
                  <Ic.Download /> Export CSV
                </button>
              )}
            </div>

            {shifts.length === 0 ? (
              <div className="stf-empty-state">
                <div className="stf-empty-icon"><Ic.Check /></div>
                <div className="stf-empty-title">No Attendance Yet</div>
                <div className="stf-empty-sub">Attendance records appear after staff are marked present.</div>
              </div>
            ) : (
              <div className="stf-shift-log">
                {[...shifts].sort((a, b) => b.clockIn - a.clockIn).map(s => {
                  const m = members.find(x => x.memberId === s.memberId)
                  return (
                    <div key={s.shiftId} className={`stf-log-row open`}>
                      <div className="stf-log-ava" style={{ background: m ? avatarGrad(m.name) : '#ccc' }}>
                        {initials(m?.name || '?')}
                      </div>
                      <div className="stf-log-info">
                        <div className="stf-log-name">{m?.name || 'Unknown'}</div>
                        <div className="stf-log-date">{fmtDate(s.clockIn)}</div>
                      </div>
                      <div className="stf-log-right" style={{ textAlign: 'right' }}>
                        <span className="stf-log-live" style={{ background: 'var(--success-color)' }}>Present</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          {fmtTime(s.clockIn)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MANAGE TAB — Owner/Manager only ── */}
        {tab === 'manage' && (
          <div className="stf-section">
            <div className="stf-manage-info-banner">
              <Ic.Shield />
              <div>
                <strong>Admin Area</strong>
                <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: 2 }}>
                  Edit details, permissions, and remove staff members here.
                </div>
              </div>
            </div>

            {members.length === 0 ? (
              <div className="stf-empty-state">
                <div className="stf-empty-icon"><Ic.Users /></div>
                <div className="stf-empty-title">No Members to Manage</div>
                <button className="stf-btn-primary" onClick={() => { setShowAdd(true); setTab('directory') }}>
                  <Ic.Plus /> Add First Member
                </button>
              </div>
            ) : (
              <div className="stf-manage-section">
                {members.map(m => (
                  <div key={m.memberId} className="stf-manage-row">
                    <div className="stf-manage-ava" style={{ background: avatarGrad(m.name) }}>
                      {initials(m.name)}
                    </div>
                    <div className="stf-manage-info">
                      <div className="stf-manage-name">{m.name}</div>

                    </div>
                    <div className="stf-manage-btns">
                      <button className="stf-manage-btn" onClick={() => setEditingMember(m)} title="Edit"><Ic.Edit /></button>
                      <button className="stf-manage-btn stf-manage-btn--danger" onClick={() => handleDeleteMember(m)} title="Delete"><Ic.Del /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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


    </div>
  )
}
