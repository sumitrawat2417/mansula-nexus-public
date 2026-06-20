import { useState } from 'react'

const I = {
  X:         ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Check:     ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  ChevL:     ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevR:     ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  CalDay:    ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>,
  CalWeek:   ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="7" y1="14" x2="17" y2="14"/><line x1="7" y1="18" x2="13" y2="18"/></svg>,
  CalMonth:  ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="8" cy="15" r="1" fill="currentColor"/><circle cx="12" cy="15" r="1" fill="currentColor"/><circle cx="16" cy="15" r="1" fill="currentColor"/></svg>,
  CalYear:   ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h8M8 18h5"/></svg>,
  CalPick:   ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>,
  Range:     ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>,
  Filter:    ({ s=15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Clock:     ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Globe:     ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
}

const toInputDate = (d) => d.toISOString().slice(0, 10)

// ── Date range computation ──
function sod(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() }
function eod(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime() }
function mondayOf(d) {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff)
}

export function computeNavRange(mode, offset) {
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

export function computeQuick(id) {
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

export default function DateFilterDrawer({ current, onApply, onClose }) {
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
                Select any date to view all records for that day.
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
