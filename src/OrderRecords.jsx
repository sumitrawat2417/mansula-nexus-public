import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getOrdersByDateRange, getStatsForDateRange,
  deleteOrderRecord, updateOrderRecord, getStorageEstimate, getAllOrderRecords, dbGet
} from './db.js'

// ── SVG Icon Library ──
const I = {
  Back:      ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Search:    ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Edit:      ({ s=15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:     ({ s=15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  X:         ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Check:     ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Receipt:   ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>,
  DB:        ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Cash:      ({ s=14 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>,
  Export:    ({ s=15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  ChevL:     ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevR:     ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevD:     ({ s=13 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  CalDay:    ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>,
  CalWeek:   ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="7" y1="14" x2="17" y2="14"/><line x1="7" y1="18" x2="13" y2="18"/></svg>,
  CalMonth:  ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="8" cy="15" r="1" fill="currentColor"/><circle cx="12" cy="15" r="1" fill="currentColor"/><circle cx="16" cy="15" r="1" fill="currentColor"/></svg>,
  CalYear:   ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h8M8 18h5"/></svg>,
  CalPick:   ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>,
  Range:     ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>,
  Filter:    ({ s=15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Warn:      ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Clock:     ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Globe:     ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Plus:      ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  Minus:     ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>,
  Package:   ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
}

// ── Helpers ──
const fmtCur = (val, symbol = '₹') => `${symbol}${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const fmtDate = (ts) => !ts ? '—' : new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtTime = (ts) => !ts ? '' : new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
const fmtBytes = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
const toInputDate = (d) => d.toISOString().slice(0, 10)
const PAYMENT_LABEL = { cash: 'Cash', upi: 'UPI', card: 'Card', udhaar: 'Udhaar', split: 'Split', other: 'Other' }
const PAYMENT_COLOR = { cash: '#10b981', upi: '#6366f1', card: '#0ea5e9', udhaar: '#f59e0b', split: '#8b5cf6', other: '#64748b' }
const PAGE_SIZE = 50

// ── Date range computation ──
function sod(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() }
function eod(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime() }
function mondayOf(d) {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff)
}

function computeNavRange(mode, offset) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (mode === 'day') {
    const d = new Date(today)
    d.setDate(d.getDate() + offset)
    let label = ''
    if (offset === 0)  label = 'Today'
    else if (offset === -1) label = 'Yesterday'
    else if (offset === 1)  label = 'Tomorrow'
    else label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    return { fromTs: sod(d), toTs: eod(d), label }
  }

  if (mode === 'week') {
    const mon = mondayOf(today)
    mon.setDate(mon.getDate() + offset * 7)
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)
    let label = ''
    if (offset === 0)  label = 'This Week'
    else if (offset === -1) label = 'Last Week'
    else if (offset === 1)  label = 'Next Week'
    else label = `${mon.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${sun.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
    return { fromTs: sod(mon), toTs: eod(sun), label }
  }

  if (mode === 'month') {
    const m = new Date(today.getFullYear(), today.getMonth() + offset, 1)
    const lastDay = new Date(m.getFullYear(), m.getMonth() + 1, 0)
    let label = ''
    if (offset === 0)  label = 'This Month'
    else if (offset === -1) label = 'Last Month'
    else if (offset === 1)  label = 'Next Month'
    else label = m.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    return { fromTs: sod(m), toTs: eod(lastDay), label }
  }

  if (mode === 'year') {
    const y = today.getFullYear() + offset
    const s = new Date(y, 0, 1)
    const e = new Date(y, 11, 31)
    let label = ''
    if (offset === 0)  label = 'This Year'
    else if (offset === -1) label = 'Last Year'
    else label = String(y)
    return { fromTs: sod(s), toTs: eod(e), label }
  }

  return { fromTs: sod(today), toTs: eod(today), label: 'Today' }
}

function computeQuick(id) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const quick = {
    today:    { fromTs: sod(today), toTs: eod(today), label: 'Today' },
    last7:    (() => { const s = new Date(today); s.setDate(s.getDate() - 6); return { fromTs: sod(s), toTs: eod(today), label: 'Last 7 Days' } })(),
    last30:   (() => { const s = new Date(today); s.setDate(s.getDate() - 29); return { fromTs: sod(s), toTs: eod(today), label: 'Last 30 Days' } })(),
    last90:   (() => { const s = new Date(today); s.setDate(s.getDate() - 89); return { fromTs: sod(s), toTs: eod(today), label: 'Last 90 Days' } })(),
    alltime:  { fromTs: 0, toTs: Date.now() + 86400000, label: 'All Time' },
  }
  return quick[id] || quick.today
}

// ── Date Filter Drawer ──
const NAV_MODES = [
  { id: 'day',   Icon: I.CalDay,   label: 'Day'   },
  { id: 'week',  Icon: I.CalWeek,  label: 'Week'  },
  { id: 'month', Icon: I.CalMonth, label: 'Month' },
  { id: 'year',  Icon: I.CalYear,  label: 'Year'  },
]

const QUICK_PICKS = [
  { id: 'today',   Icon: I.Clock,  label: 'Today'       },
  { id: 'last7',   Icon: I.CalDay, label: 'Last 7 Days' },
  { id: 'last30',  Icon: I.CalWeek,label: 'Last 30 Days'},
  { id: 'last90',  Icon: I.CalMonth,label:'Last 90 Days'},
  { id: 'alltime', Icon: I.Globe,  label: 'All Time'    },
]

function DateFilterDrawer({ current, onApply, onClose }) {
  const [tab, setTab] = useState('navigate') // 'navigate' | 'pick' | 'custom'
  const [navMode, setNavMode] = useState('day')
  const [navOffset, setNavOffset] = useState(0)
  const [pickDate, setPickDate] = useState(toInputDate(new Date()))
  const [customFrom, setCustomFrom] = useState(toInputDate(new Date()))
  const [customTo, setCustomTo] = useState(toInputDate(new Date()))

  const navRange = computeNavRange(navMode, navOffset)

  const applyAndClose = (range) => { onApply(range); onClose() }

  const handleNavMode = (m) => { setNavMode(m); setNavOffset(0) }

  const applyPickDate = () => {
    if (!pickDate) return
    const d = new Date(pickDate + 'T00:00:00')
    const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    applyAndClose({ fromTs: sod(d), toTs: eod(d), label })
  }

  const applyCustom = () => {
    if (!customFrom || !customTo) return
    const from = new Date(customFrom + 'T00:00:00')
    const to   = new Date(customTo   + 'T23:59:59')
    const label = `${from.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${to.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
    applyAndClose({ fromTs: from.getTime(), toTs: to.getTime(), label })
  }

  return (
    <div className="or-filter-drawer-overlay" onClick={onClose}>
      <div className="or-filter-drawer" onClick={e => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="or-filter-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '1rem' }}>
            <I.Filter s={16} /> Date Filter
          </div>
          <button className="or-icon-btn" onClick={onClose}><I.X s={16} /></button>
        </div>

        {/* Tab Pills */}
        <div className="or-fd-tabs">
          {[
            { id: 'navigate', Icon: I.ChevL, label: 'Navigate' },
            { id: 'pick',     Icon: I.CalPick, label: 'Pick Day' },
            { id: 'custom',   Icon: I.Range, label: 'Custom Range' },
          ].map(t => (
            <button key={t.id} className={`or-fd-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              <t.Icon s={14} /> {t.label}
            </button>
          ))}
        </div>

        <div className="or-filter-drawer-body">
          {tab === 'navigate' && (
            <>
              {/* Quick Picks */}
              <div className="or-fd-section-label">Quick</div>
              <div className="or-preset-chips">
                {QUICK_PICKS.map(q => (
                  <button key={q.id} className="or-preset-chip" onClick={() => applyAndClose(computeQuick(q.id))}>
                    <q.Icon s={13} /> {q.label}
                  </button>
                ))}
              </div>

              {/* Navigator */}
              <div className="or-fd-section-label" style={{ marginTop: 20 }}>Navigate by Period</div>

              {/* Mode selector */}
              <div className="or-nav-mode-row">
                {NAV_MODES.map(m => (
                  <button key={m.id} className={`or-nav-mode-btn ${navMode === m.id ? 'active' : ''}`} onClick={() => handleNavMode(m.id)}>
                    <m.Icon s={14} /> {m.label}
                  </button>
                ))}
              </div>

              {/* Prev / Label / Next */}
              <div className="or-nav-row">
                <button className="or-nav-arrow" onClick={() => setNavOffset(o => o - 1)} aria-label="Previous">
                  <I.ChevL s={20} />
                </button>
                <button className="or-nav-label" onClick={() => applyAndClose(navRange)}>
                  <span>{navRange.label}</span>
                  <span className="or-nav-tap-hint">Tap to apply</span>
                </button>
                <button className="or-nav-arrow" onClick={() => setNavOffset(o => o + 1)} aria-label="Next">
                  <I.ChevR s={20} />
                </button>
              </div>

              <button className="or-btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={() => applyAndClose(navRange)}>
                <I.Check s={14} /> Apply: {navRange.label}
              </button>
            </>
          )}

          {tab === 'pick' && (
            <>
              <div className="or-fd-section-label">Pick a Specific Day</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 12px' }}>
                Select any date to view all orders completed on that day.
              </p>
              <div className="or-pick-date-wrap">
                <I.CalPick s={18} />
                <input
                  type="date"
                  className="or-date-input"
                  value={pickDate}
                  onChange={e => setPickDate(e.target.value)}
                  max={toInputDate(new Date())}
                />
              </div>
              {pickDate && (
                <div className="or-pick-preview">
                  <I.CalDay s={14} />
                  {new Date(pickDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
              <button className="or-btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={applyPickDate} disabled={!pickDate}>
                <I.Check s={14} /> View This Day
              </button>
            </>
          )}

          {tab === 'custom' && (
            <>
              <div className="or-fd-section-label">Custom Date Range</div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 12px' }}>
                Define an exact start and end date to view.
              </p>
              <div className="or-custom-range-row">
                <div className="or-custom-range-field">
                  <label>From</label>
                  <input type="date" className="or-date-input" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
                </div>
                <div className="or-custom-range-field">
                  <label>To</label>
                  <input type="date" className="or-date-input" value={customTo} min={customFrom} onChange={e => setCustomTo(e.target.value)} />
                </div>
              </div>
              {customFrom && customTo && (
                <div className="or-pick-preview">
                  <I.Range s={14} />
                  {new Date(customFrom + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' '}–{' '}
                  {new Date(customTo + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
              <button className="or-btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={applyCustom} disabled={!customFrom || !customTo || customFrom > customTo}>
                <I.Check s={14} /> Apply Range
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Order Detail Modal ──
function OrderDetailModal({ record, currency, onClose, onDelete, onEdit }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showAllItems, setShowAllItems] = useState(false)
  const sym = currency?.symbol || '₹'
  const items = record.items || []
  const subtotal = record.subtotal !== undefined ? record.subtotal : items.reduce((s, i) => s + i.price * i.qty, 0)

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await onDelete(record.orderId)
    onClose()
  }

  const PREVIEW_COUNT = 3
  const visibleItems = showAllItems ? items : items.slice(0, PREVIEW_COUNT)
  const hasMore = items.length > PREVIEW_COUNT

  return (
    <div className="or-modal-overlay" onClick={onClose}>
      <div className="or-modal" onClick={e => e.stopPropagation()}>
        <div className="or-modal-header">
          <div className="or-modal-title">
            <span className="or-modal-icon"><I.Receipt s={20} /></span>
            <div>
              <div className="or-modal-order-id">#{record.orderId}</div>
              <div className="or-modal-date">{fmtDate(record.completedAt)} · {fmtTime(record.completedAt)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="or-icon-btn" onClick={() => onEdit(record)} title="Edit"><I.Edit s={15} /></button>
            <button className="or-icon-btn" onClick={onClose} title="Close"><I.X s={17} /></button>
          </div>
        </div>

        <div className="or-modal-body">
          <div className="or-detail-section-label">Items</div>
          <div className="or-detail-items">
            {visibleItems.map((item, idx) => (
              <div key={idx} className="or-detail-item-row">
                <span className="or-detail-emoji">{item.emoji || ''}</span>
                <div className="or-detail-item-info">
                  <div className="or-detail-item-name">{item.name}</div>
                  {item.variantLabel && <div className="or-detail-item-variant">{item.variantLabel}</div>}
                </div>
                <div className="or-detail-item-right">
                  <div className="or-detail-item-qty">×{item.qty}</div>
                  <div className="or-detail-item-price">{fmtCur(item.price * item.qty, sym)}</div>
                </div>
              </div>
            ))}
            {!showAllItems && hasMore && (
              <button 
                className="expand-items-btn" 
                onClick={() => setShowAllItems(true)}
                style={{ width: '100%', marginTop: 8 }}
              >
                + {items.length - PREVIEW_COUNT} more items
              </button>
            )}
          </div>

          <div className="or-detail-totals">
            <div className="or-total-row"><span>Subtotal</span><span>{fmtCur(subtotal, sym)}</span></div>
            {record.taxAmt > 0 && <div className="or-total-row"><span>{record.taxLabel || 'Tax'}</span><span>{fmtCur(record.taxAmt, sym)}</span></div>}
            {record.discountAmt > 0 && <div className="or-total-row discount"><span>Discount</span><span>−{fmtCur(record.discountAmt, sym)}</span></div>}
            {record.deliveryCharge > 0 && <div className="or-total-row"><span>Delivery</span><span>+{fmtCur(record.deliveryCharge, sym)}</span></div>}
            <div className="or-total-row grand"><span>Total</span><span className="or-grand-val">{fmtCur(record.total, sym)}</span></div>
          </div>

          <div className="or-detail-section-label" style={{ marginTop: 16 }}>Payment</div>
          <div className="or-payment-badge" style={{ '--chip-color': PAYMENT_COLOR[record.paymentMode] || '#64748b' }}>
            <I.Cash s={13} /> {PAYMENT_LABEL[record.paymentMode] || record.paymentMode}
            {record.paymentMode === 'split' && record.paymentDetails && (
              <span style={{ fontSize: '0.72rem', marginLeft: 8, opacity: 0.8 }}>
                Cash {fmtCur(record.paymentDetails.cash, sym)} · UPI {fmtCur(record.paymentDetails.upi, sym)}
              </span>
            )}
          </div>

          <div className="or-detail-section-label" style={{ marginTop: 16 }}>Note</div>
          <div className="or-note-display">{record.note || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No note</span>}</div>
        </div>

        <div className="or-modal-footer">
          <button className={`or-btn-danger ${confirmDelete ? 'confirm' : ''}`} onClick={handleDelete}>
            {confirmDelete ? <><I.Warn s={14} /> Confirm Delete?</> : <><I.Trash s={14} /> Delete</>}
          </button>
          {confirmDelete && <button className="or-btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>}
        </div>
      </div>
    </div>
  )
}

// ── Main OrderRecords ──
export default function OrderRecords({ onClose, currency, onEdit }) {
  const [records, setRecords]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [total, setTotal]               = useState(0)
  const [stats, setStats]               = useState({ count: 0, revenue: 0, avg: 0, topPayment: '—' })
  const [statsLoading, setStatsLoading] = useState(true)

  // Applied date range
  const [dateRange, setDateRange] = useState(() => computeNavRange('day', 0))

  // Other filters
  const [search, setSearch]             = useState('')
  const [filterPayment, setFilterPayment] = useState('all')
  const [sortDesc, setSortDesc]         = useState(true)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [viewRecord, setViewRecord]     = useState(null)
  const [storageInfo, setStorageInfo]   = useState({ usage: 0, quota: 0 })

  const sym = currency?.symbol || '₹'
  const searchTimer = useRef(null)
  const sentinelRef = useRef(null)

  const loadPage = useCallback(async () => {
    setLoading(true)
    const result = await getOrdersByDateRange({
      fromTs: dateRange.fromTs, toTs: dateRange.toTs,
      paymentMode: filterPayment, search, sortDesc, offset: 0, limit: PAGE_SIZE
    })
    setRecords(result.records)
    setTotal(result.total)
    setLoading(false)
  }, [dateRange, filterPayment, search, sortDesc])

  const loadMore = useCallback(async () => {
    if (loadingMore) return
    setLoadingMore(true)
    const result = await getOrdersByDateRange({
      fromTs: dateRange.fromTs, toTs: dateRange.toTs,
      paymentMode: filterPayment, search, sortDesc, offset: records.length, limit: PAGE_SIZE
    })
    setRecords(prev => [...prev, ...result.records])
    setTotal(result.total)
    setLoadingMore(false)
  }, [dateRange, filterPayment, search, sortDesc, records.length, loadingMore])

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    const [s, storage] = await Promise.all([
      getStatsForDateRange({ fromTs: dateRange.fromTs, toTs: dateRange.toTs, paymentMode: filterPayment, search }),
      getStorageEstimate()
    ])
    setStats(s)
    setStorageInfo(storage)
    setStatsLoading(false)
  }, [dateRange, filterPayment, search])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { loadPage(); loadStats() }, search ? 300 : 0)
    return () => clearTimeout(searchTimer.current)
  }, [dateRange, filterPayment, sortDesc, search])

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && records.length < total && !loadingMore && !loading) loadMore()
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [records.length, total, loadingMore, loading, loadMore])

  const handleDelete = async (orderId) => {
    await deleteOrderRecord(orderId)
    setViewRecord(null)
    loadPage(); loadStats()
  }



  const exportCSV = async () => {
    const all = await getAllOrderRecords()
    const inRange = all.filter(r => r.completedAt >= dateRange.fromTs && r.completedAt <= dateRange.toTs)
    const header = ['Order ID','Date','Time','Items','Subtotal','Tax','Discount','Delivery','Total','Payment','Note']
    const rows = inRange.map(r => [
      r.orderId, fmtDate(r.completedAt), fmtTime(r.completedAt),
      (r.items||[]).map(i=>`${i.qty}x ${i.name}`).join('; '),
      r.subtotal||'', r.taxAmt||'', r.discountAmt||'', r.deliveryCharge||'',
      r.total||'', r.paymentMode||'', r.note||''
    ])
    const csv = [header,...rows].map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
    const a = document.createElement('a')
    a.href=url; a.download=`mansula-orders-${new Date().toISOString().slice(0,10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="or-root">
      {viewRecord && (
        <OrderDetailModal record={viewRecord} currency={currency}
          onClose={() => setViewRecord(null)} onDelete={handleDelete} onEdit={onEdit} />
      )}
      {filterDrawerOpen && (
        <DateFilterDrawer
          current={dateRange}
          onApply={(range) => { setDateRange(range); setRecords([]) }}
          onClose={() => setFilterDrawerOpen(false)}
        />
      )}

      {/* Header */}
      <header className="or-header">
        <button className="or-back-btn" onClick={onClose} aria-label="Back"><I.Back s={20} /></button>
        <div className="or-header-title"><I.Receipt s={19} /> Order Records</div>
        <button className="or-export-btn" onClick={exportCSV} title="Export CSV"><I.Export s={15} /> Export</button>
      </header>

      {/* Storage Bar */}
      <div className="or-storage-bar">
        <I.DB s={13} />
        <span>Storage:</span>
        <span className="or-storage-val">{fmtBytes(storageInfo.usage)}</span>
        {storageInfo.quota > 0 && (
          <>
            <div className="or-storage-track">
              <div className="or-storage-fill" style={{ width: `${Math.min(100, (storageInfo.usage / storageInfo.quota) * 100).toFixed(2)}%` }} />
            </div>
            <span className="or-storage-quota">of {fmtBytes(storageInfo.quota)}</span>
          </>
        )}
      </div>

      {/* Stats Cards */}
      <div className="or-stats-row">
        <div className="or-stat-card">
          <div className="or-stat-label">Orders</div>
          <div className="or-stat-val">{statsLoading ? '…' : stats.count.toLocaleString('en-IN')}</div>
        </div>
        <div className="or-stat-card accent">
          <div className="or-stat-label">Revenue</div>
          <div className="or-stat-val">{statsLoading ? '…' : fmtCur(stats.revenue, sym)}</div>
        </div>
        <div className="or-stat-card">
          <div className="or-stat-label">Avg Order</div>
          <div className="or-stat-val">{statsLoading ? '…' : fmtCur(stats.avg, sym)}</div>
        </div>
        <div className="or-stat-card">
          <div className="or-stat-label">Top Pay</div>
          <div className="or-stat-val" style={{ fontSize: '0.88rem', textTransform: 'capitalize' }}>
            {statsLoading ? '…' : (PAYMENT_LABEL[stats.topPayment] || stats.topPayment)}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="or-controls">
        <div className="or-search-wrap">
          <I.Search s={15} />
          <input className="or-search" placeholder="Search order ID or item…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="or-search-clear" onClick={() => setSearch('')}><I.X s={13} /></button>}
        </div>
        <div className="or-filter-row">
          <button className="or-date-filter-btn" onClick={() => setFilterDrawerOpen(true)}>
            <I.CalDay s={13} />
            <span>{dateRange.label}</span>
            <I.ChevD s={12} />
          </button>
          <select className="or-select" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
            <option value="all">All Pay</option>
            {Object.entries(PAYMENT_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className={`or-sort-btn ${!sortDesc ? 'asc' : ''}`} onClick={() => setSortDesc(d => !d)}>
            {sortDesc ? '↓ Newest' : '↑ Oldest'}
          </button>
        </div>
      </div>

      {/* Result count */}
      <div className="or-result-count">
        {loading ? 'Loading…' : `${total.toLocaleString('en-IN')} order${total !== 1 ? 's' : ''}`}
        {records.length > 0 && !loading && <span className="or-showing-badge">Showing {records.length.toLocaleString('en-IN')}</span>}
      </div>

      {/* List */}
      <div className="or-list">
        {loading ? (
          <div className="or-empty"><div className="or-empty-spin" /><p>Loading records…</p></div>
        ) : records.length === 0 ? (
          <div className="or-empty">
            <div className="or-empty-icon"><I.Receipt s={32} /></div>
            <p>No orders in this period</p>
            <button className="or-btn-ghost" onClick={() => setDateRange(computeQuick('alltime'))}>
              <I.Globe s={14} /> See all time
            </button>
          </div>
        ) : (
          <>
            {records.map(r => {
              const itemCount = (r.items||[]).reduce((s,i) => s+i.qty, 0)
              const payColor = PAYMENT_COLOR[r.paymentMode] || '#64748b'
              return (
                <div key={r.orderId} className="or-record-card" onClick={() => setViewRecord(r)}>
                  <div className="or-record-left">
                    <div className="or-record-id">#{r.orderId}</div>
                    <div className="or-record-meta">
                      <span>{fmtDate(r.completedAt)}</span>
                      <span className="or-meta-sep">·</span>
                      <span>{fmtTime(r.completedAt)}</span>
                      <span className="or-meta-sep">·</span>
                      <span>{itemCount} item{itemCount!==1?'s':''}</span>
                    </div>
                    <div className="or-record-items-preview">
                      {(r.items||[]).slice(0,3).map((i,idx) => <span key={idx} className="or-item-pill">{i.name}</span>)}
                      {(r.items||[]).length>3 && <span className="or-item-pill muted">+{r.items.length-3} more</span>}
                    </div>
                  </div>
                  <div className="or-record-right">
                    <div className="or-record-total">{fmtCur(r.total, sym)}</div>
                    <div className="or-pay-tag" style={{'--pay-color': payColor}}>{PAYMENT_LABEL[r.paymentMode]||r.paymentMode}</div>
                    {r.note && <div className="or-note-dot" title={r.note}><I.Edit s={11}/></div>}
                  </div>
                </div>
              )
            })}
            <div ref={sentinelRef} style={{ height: 1 }} />
            {loadingMore && (
              <div className="or-loading-more">
                <div className="or-empty-spin" style={{ width: 20, height: 20 }} />
                <span>Loading more…</span>
              </div>
            )}
            {!loadingMore && records.length >= total && total > 0 && (
              <div className="or-end-label">
                <I.Check s={13} /> All {total.toLocaleString('en-IN')} orders loaded
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
