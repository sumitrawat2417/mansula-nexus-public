import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import './App.css'

// ─────────────── DATA ───────────────
const PRODUCTS = [
  { id: 1,  name: 'Espresso',         category: 'Coffee',  price: 120,  emoji: '☕', badge: 'popular' },
  { id: 2,  name: 'Cappuccino',       category: 'Coffee',  price: 180,  emoji: '☕' },
  { id: 3,  name: 'Latte',            category: 'Coffee',  price: 200,  emoji: '🥛' },
  { id: 4,  name: 'Cold Brew',        category: 'Coffee',  price: 220,  emoji: '🧊', badge: 'new' },
  { id: 5,  name: 'Green Tea',        category: 'Tea',     price: 100,  emoji: '🍵' },
  { id: 6,  name: 'Chai Latte',       category: 'Tea',     price: 160,  emoji: '🫖', badge: 'popular' },
  { id: 7,  name: 'Croissant',        category: 'Bakery',  price: 140,  emoji: '🥐' },
  { id: 8,  name: 'Blueberry Muffin', category: 'Bakery',  price: 130,  emoji: '🧁', badge: 'new' },
  { id: 9,  name: 'Avocado Toast',    category: 'Food',    price: 380,  emoji: '🥑', badge: 'popular' },
  { id: 10, name: 'Club Sandwich',    category: 'Food',    price: 320,  emoji: '🥪' },
  { id: 11, name: 'Caesar Salad',     category: 'Food',    price: 280,  emoji: '🥗' },
  { id: 12, name: 'Orange Juice',     category: 'Drinks',  price: 120,  emoji: '🍊' },
  { id: 13, name: 'Mango Smoothie',   category: 'Drinks',  price: 180,  emoji: '🥭', badge: 'new' },
  { id: 14, name: 'Mineral Water',    category: 'Drinks',  price: 60,   emoji: '💧' },
  { id: 15, name: 'Chocolate Cake',   category: 'Bakery',  price: 200,  emoji: '🎂', badge: 'popular' },
  { id: 16, name: 'Cheesecake',       category: 'Bakery',  price: 220,  emoji: '🍰' },
]

const CATEGORIES = ['All', 'Coffee', 'Tea', 'Food', 'Bakery', 'Drinks']

const CURRENCIES = [
  { code: 'INR', symbol: '₹',  rate: 1,      decimals: 0 },
  { code: 'USD', symbol: '$',  rate: 0.012,  decimals: 2 },
  { code: 'EUR', symbol: '€',  rate: 0.011,  decimals: 2 },
  { code: 'GBP', symbol: '£',  rate: 0.0095, decimals: 2 },
  { code: 'AUD', symbol: 'A$', rate: 0.018,  decimals: 2 },
]

const TAX_RATES = [
  { label: 'No Tax (0%)',  value: 0    },
  { label: 'GST 5%',      value: 0.05 },
  { label: 'GST 12%',     value: 0.12 },
  { label: 'GST 18%',     value: 0.18 },
  { label: 'GST 28%',     value: 0.28 },
]

// ─────────────── ORDER ID ───────────────
// Counter lives at MODULE scope so React StrictMode's double-invoke of useState
// doesn't skip ORD-002. INIT_ORDER is created exactly once when the module loads.
let _oc = 1
const makeOrderId = () => `ORD-${String(_oc++).padStart(3, '0')}`
const makeOrder   = () => ({ id: makeOrderId(), items: [], createdAt: new Date(), status: 'active' })
const INIT_ORDER  = makeOrder() // ← called once at module level → always ORD-001

// ─────────────── SOUND ───────────────
let audioCtx = null
const playSound = (type) => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    const osc  = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain); gain.connect(audioCtx.destination)
    if (type === 'add') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, audioCtx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)
      osc.start(); osc.stop(audioCtx.currentTime + 0.1)
    } else if (type === 'remove') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(300, audioCtx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)
      osc.start(); osc.stop(audioCtx.currentTime + 0.1)
    } else if (type === 'checkout') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(440,    audioCtx.currentTime)
      osc.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.12)
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.24)
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
      gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.36)
      osc.start(); osc.stop(audioCtx.currentTime + 0.36)
    }
  } catch (_) {}
}

// ─────────────── ICONS ───────────────
const I = {
  Search: ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  X: ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Menu: ({ s=20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>,
  Cart: ({ s=22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Sun: ({ s=17 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  Moon: ({ s=17 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Plus: ({ s=13 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  Minus: ({ s=13 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14"/></svg>,
  Trash: ({ s=13 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Check: ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Orders: ({ s=17 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>,
  Back: ({ s=17 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  ChevRight: ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Clock: ({ s=14 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Settings: ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  GridAuto: ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  Logo: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
}

// ─────────────── HELPERS ───────────────
const fmt  = (val, cur) => `${cur.symbol}${(val * cur.rate).toFixed(cur.decimals)}`
const fmtD = (d) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
const ordTotal = (order, taxRate) => {
  const sub = order.items.reduce((s, i) => s + i.price * i.qty, 0)
  return sub * (1 + taxRate)
}

// ─────────────── ORDER DETAIL PANEL ───────────────
function OrderDetail({ order, onBack, onSwitch, currentOrderId, currency, taxRateObj }) {
  const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0)
  const tax      = subtotal * taxRateObj.value
  const total    = subtotal + tax
  const isCurrent = order.id === currentOrderId
  const isActive  = order.status === 'active'

  return (
    <div className="order-detail">
      {/* Sub-header */}
      <div className="order-detail-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back to orders"><I.Back s={16} /></button>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>#{order.id}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <I.Clock s={12} /> {fmtD(order.createdAt)} · {order.status === 'completed' ? '✅ Completed' : '🟢 Active'}
          </div>
        </div>
        {isCurrent && <span className="order-row-badge" style={{ marginLeft: 'auto' }}>Current</span>}
        {!isCurrent && isActive && (
          <button className="switch-order-btn" onClick={() => { onSwitch(order.id); onBack() }}>
            Switch
          </button>
        )}
      </div>

      {/* Items */}
      <div className="order-detail-items">
        {order.items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🛒</div>
            <p>No items in this order</p>
          </div>
        ) : (
          order.items.map(item => (
            <div key={item.id} className="detail-item-row">
              <span className="detail-item-emoji">{item.emoji}</span>
              <div className="detail-item-info">
                <div className="detail-item-name">{item.name}</div>
                <div className="detail-item-unit">{fmt(item.price, currency)} × {item.qty}</div>
              </div>
              <div className="detail-item-total">{fmt(item.price * item.qty, currency)}</div>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      {order.items.length > 0 && (
        <div className="order-detail-totals">
          <div className="cart-total-row"><span className="label">Subtotal</span><span className="value">{fmt(subtotal, currency)}</span></div>
          <div className="cart-total-row"><span className="label">{taxRateObj.label}</span><span className="value">{fmt(tax, currency)}</span></div>
          <div className="cart-total-row grand"><span className="label">Total</span><span className="value">{fmt(total, currency)}</span></div>
        </div>
      )}
    </div>
  )
}

// ─────────────── ORDER CONSOLE ───────────────
function OrderConsole({ orders, currentOrderId, onSwitch, onNew, onClose, currency, taxRateObj }) {
  const [viewingId, setViewingId] = useState(null)

  const active    = orders.filter(o => o.status === 'active')
  const past      = orders.filter(o => o.status === 'completed')
  const viewOrder = viewingId ? orders.find(o => o.id === viewingId) : null

  if (viewOrder) {
    return (
      <div className="drawer-overlay open" onClick={onClose} aria-hidden="true">
        <div className="order-console" onClick={e => e.stopPropagation()} role="dialog" aria-label="Order details">
          <div className="console-header">
            <div className="console-title"><I.Orders s={18}/>Order Console</div>
            <button className="icon-btn" onClick={onClose} aria-label="Close"><I.X s={17}/></button>
          </div>
          <OrderDetail
            order={viewOrder}
            onBack={() => setViewingId(null)}
            onSwitch={(id) => { onSwitch(id) }}
            currentOrderId={currentOrderId}
            currency={currency}
            taxRateObj={taxRateObj}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="drawer-overlay open" onClick={onClose} aria-hidden="true">
      <div className="order-console" onClick={e => e.stopPropagation()} role="dialog" aria-label="Order console">
        <div className="console-header">
          <div className="console-title"><I.Orders s={18}/>Order Console</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><I.X s={17}/></button>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <button className="new-order-btn" onClick={onNew} id="new-order-btn">
            <I.Plus s={15}/> New Order
          </button>
        </div>

        <div className="console-body">
          {active.length > 0 && (
            <>
              <div className="console-section-label">Active Orders</div>
              {active.map(order => {
                const total = ordTotal(order, taxRateObj.value)
                const isCurrent = order.id === currentOrderId
                return (
                  <button
                    key={order.id}
                    className={`order-row ${isCurrent ? 'current' : ''}`}
                    onClick={() => setViewingId(order.id)}
                  >
                    <div className="order-row-left">
                      <div className="order-row-id">#{order.id}</div>
                      <div className="order-row-meta">
                        <I.Clock s={12}/> {fmtD(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="order-row-right">
                      <div className="order-row-total">{fmt(total, currency)}</div>
                      {isCurrent && <span className="order-row-badge">Current</span>}
                      <I.ChevRight s={14}/>
                    </div>
                  </button>
                )
              })}
            </>
          )}

          {past.length > 0 && (
            <>
              <div className="console-section-label" style={{ marginTop: 16 }}>Completed Orders</div>
              {past.slice(-20).reverse().map(order => {
                const total = ordTotal(order, taxRateObj.value)
                return (
                  <button
                    key={order.id}
                    className="order-row past"
                    onClick={() => setViewingId(order.id)}
                  >
                    <div className="order-row-left">
                      <div className="order-row-id">#{order.id}</div>
                      <div className="order-row-meta">
                        <I.Clock s={12}/> {fmtD(order.createdAt)} · {order.items.reduce((s,i)=>s+i.qty,0)} items
                      </div>
                    </div>
                    <div className="order-row-right">
                      <div className="order-row-total">{fmt(total, currency)}</div>
                      <span className="order-row-badge done">Done</span>
                      <I.ChevRight s={14}/>
                    </div>
                  </button>
                )
              })}
            </>
          )}

          {active.length === 0 && past.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📋</div>
              <p style={{ color: 'var(--text-secondary)' }}>No orders yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────── SETTINGS DRAWER ───────────────
function SettingsDrawer({ theme, onToggleTheme, cols, onCols, currency, onCurrency, taxRateObj, onTaxRate, onClose }) {
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const gridOptions = [
    { key: 'auto', label: 'Auto', icon: <I.GridAuto s={18}/> },
    { key: '2',    label: '2 cols', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/></svg> },
    { key: '3',    label: '3 cols', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="6" height="18" rx="1"/><rect x="9" y="3" width="6" height="18" rx="1"/><rect x="16" y="3" width="6" height="18" rx="1"/></svg> },
    { key: '4',    label: '4 cols', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="4" height="18" rx="1"/><rect x="7.33" y="3" width="4" height="18" rx="1"/><rect x="12.67" y="3" width="4" height="18" rx="1"/><rect x="18" y="3" width="4" height="18" rx="1"/></svg> },
    { key: '5',    label: '5 cols', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="4" height="18" rx="1"/><rect x="6" y="3" width="3.5" height="18" rx="1"/><rect x="10.25" y="3" width="3.5" height="18" rx="1"/><rect x="14.5" y="3" width="3.5" height="18" rx="1"/><rect x="19" y="3" width="4" height="18" rx="1"/></svg> },
  ]

  return (
    <div className="drawer-overlay open" onClick={onClose} aria-hidden="true">
      <div className="settings-drawer" onClick={e => e.stopPropagation()} role="dialog" aria-label="Settings">
        <div className="drawer-handle"/>
        <div className="console-header">
          <div className="console-title"><I.Settings s={18}/>Settings</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><I.X s={17}/></button>
        </div>

        <div className="console-body">
          {/* Appearance */}
          <div className="setting-row">
            <div>
              <div className="setting-label">Appearance</div>
              <div className="setting-desc">{theme === 'dark' ? 'Dark mode on' : 'Light mode on'}</div>
            </div>
            <button
              id="theme-toggle-setting"
              className={`toggle-switch ${theme === 'dark' ? 'on' : ''}`}
              onClick={onToggleTheme}
              role="switch"
              aria-checked={theme === 'dark'}
            >
              <span className="toggle-knob">{theme === 'dark' ? <I.Moon s={11}/> : <I.Sun s={11}/>}</span>
            </button>
          </div>

          {/* Grid */}
          <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
            <div>
              <div className="setting-label">Product Grid</div>
              <div className="setting-desc">Columns per row</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, width: '100%' }}>
              {gridOptions.map(opt => (
                <button
                  key={opt.key}
                  className={`grid-pick-btn ${cols === opt.key ? 'active' : ''}`}
                  onClick={() => onCols(opt.key)}
                  aria-pressed={cols === opt.key}
                >
                  {opt.icon}
                  <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <div>
              <div className="setting-label">Currency</div>
              <div className="setting-desc">Select billing currency</div>
            </div>
            <select className="settings-select" value={currency.code} onChange={e => onCurrency(CURRENCIES.find(c => c.code === e.target.value))}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.symbol}</option>)}
            </select>
          </div>

          {/* Tax Rate */}
          <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div>
                <div className="setting-label">Tax / GST Rate</div>
                <div className="setting-desc">Applied at checkout</div>
              </div>
              <button className="disclaimer-link" onClick={() => setShowDisclaimer(d => !d)}>
                ⚠️ Disclaimer
              </button>
            </div>
            <select className="settings-select" value={taxRateObj.value} onChange={e => onTaxRate(TAX_RATES.find(t => t.value === parseFloat(e.target.value)))}>
              {TAX_RATES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>

            {showDisclaimer && (
              <div className="gst-disclaimer">
                <p><strong>⚠️ GST Disclaimer</strong></p>
                <p>The tax rate shown is manually configured by the operator. Mansula Nexus does not verify, validate, or guarantee the accuracy of the selected GST slab for any product or transaction.</p>
                <p>Users are solely responsible for ensuring compliance with applicable GST laws. Mansula Nexus and its developers accept <strong>no liability</strong> for incorrect tax rates applied, tax filings, penalties, or disputes arising from the use of this software.</p>
                <p>Please consult a qualified tax professional for your correct GST obligations.</p>
                <button className="disclaimer-close" onClick={() => setShowDisclaimer(false)}>Got it</button>
              </div>
            )}
          </div>

          {/* About */}
          <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'center', gap: 4, opacity: 0.5, paddingTop: 16, borderBottom: 'none', marginTop: 'auto' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mansula Nexus v1.5.0-alpha</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>POS & Billing System</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────── PRODUCT CARD ───────────────
function ProductCard({ product, qty, onAdd, onDecrease, cols, currency }) {
  const inCart = qty > 0

  const handleAdd = (e) => {
    // Don't add if user tapped the decrease or remove button
    if (e.target.closest('.card-ov-btn.minus')) return
    onAdd(product)
  }

  return (
    <div
      className={`product-card ${inCart ? 'in-cart' : ''}`}
      data-cols={cols}
      onClick={handleAdd}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onAdd(product)}
      aria-label={`${product.name} — ${fmt(product.price, currency)}${inCart ? `, ${qty} in cart` : ', tap to add'}`}
    >
      {/* ── IMAGE ── */}
      <div className="product-img-wrap">
        <span className="product-emoji" aria-hidden="true">{product.emoji}</span>

        {product.badge && (
          <span className={`product-badge ${product.badge}`} aria-label={product.badge}>
            {product.badge === 'popular' ? 'Popular' : 'New'}
          </span>
        )}

        {/* Overlay controls — only shown when qty > 0 */}
        {inCart && (
          <div className="card-overlay-controls" onClick={e => e.stopPropagation()}>
            <button
              className="card-ov-btn minus"
              onClick={() => onDecrease(product.id)}
              aria-label={qty === 1 ? 'Remove from cart' : 'Decrease quantity'}
            >
              {qty === 1 ? <I.Trash/> : <I.Minus/>}
            </button>
            <span className="card-ov-qty">{qty}</span>
            <button
              className="card-ov-btn plus"
              onClick={() => onAdd(product)}
              aria-label="Add one more"
            >
              <I.Plus/>
            </button>
          </div>
        )}
      </div>

      {/* ── INFO ── */}
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <div className="product-price">{fmt(product.price, currency)}</div>
      </div>
    </div>
  )
}

// ─────────────── CART ITEM ───────────────
function CartItem({ item, onIncrease, onDecrease, currency }) {
  return (
    <div className="cart-item-card" role="listitem">
      <div className="cart-item-emoji">{item.emoji}</div>
      <div className="cart-item-details">
        <div className="cart-item-name" title={item.name}>{item.name}</div>
        <div className="cart-item-price">{fmt(item.price * item.qty, currency)}</div>
      </div>
      <div className="cart-item-controls">
        <button className="qty-btn" onClick={() => onDecrease(item.id)} aria-label="Decrease">
          {item.qty === 1 ? <I.Trash/> : <I.Minus/>}
        </button>
        <span className="qty-value">{item.qty}</span>
        <button className="qty-btn" onClick={() => onIncrease(item.id)} aria-label="Increase">
          <I.Plus/>
        </button>
      </div>
    </div>
  )
}

// ─────────────── MAIN APP ───────────────
export default function App() {
  const [theme,        setTheme]      = useState(() => localStorage.getItem('mn-theme')    || 'light')
  const [cols,         setCols]       = useState(() => localStorage.getItem('mn-cols')     || 'auto')
  const [currency,     setCurrency]   = useState(() => { try { return JSON.parse(localStorage.getItem('mn-currency')) || CURRENCIES[0] } catch { return CURRENCIES[0] } })
  const [taxRateObj,   setTaxRateObj] = useState(() => { try { return JSON.parse(localStorage.getItem('mn-taxrate'))  || TAX_RATES[1] } catch { return TAX_RATES[1] } })
  const [activeCategory, setActiveCat] = useState('All')
  const [search,       setSearch]     = useState('')
  const [searchOpen,   setSearchOpen] = useState(false)
  const [cartOpen,     setCartOpen]   = useState(false)
  const [menuOpen,     setMenuOpen]   = useState(false)
  const [ordersOpen,   setOrdersOpen] = useState(false)
  const [toast,        setToast]      = useState(null)
  const searchRef = useRef(null)

  // ── Orders — use module-level INIT_ORDER so ORD-002 is never skipped ──
  const [orders,         setOrders]         = useState([INIT_ORDER])
  const [currentOrderId, setCurrentOrderId] = useState(INIT_ORDER.id)

  const currentOrder = orders.find(o => o.id === currentOrderId)
  const cart = currentOrder?.items ?? []

  // Persist settings
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('mn-theme', theme) }, [theme])
  useEffect(() => { localStorage.setItem('mn-cols', cols) }, [cols])
  useEffect(() => { localStorage.setItem('mn-currency', JSON.stringify(currency)) }, [currency])
  useEffect(() => { localStorage.setItem('mn-taxrate', JSON.stringify(taxRateObj)) }, [taxRateObj])
  useEffect(() => { if (searchOpen) setTimeout(() => searchRef.current?.focus(), 80) }, [searchOpen])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800) }

  // ── Order mutations ──
  const setCartItems = useCallback((updater) => {
    setOrders(prev => prev.map(o =>
      o.id === currentOrderId
        ? { ...o, items: typeof updater === 'function' ? updater(o.items) : updater }
        : o
    ))
  }, [currentOrderId])

  const createNewOrder = () => {
    const newOrder = makeOrder()
    setOrders(prev => [...prev, newOrder])
    setCurrentOrderId(newOrder.id)
    showToast(`New order #${newOrder.id} started`)
  }

  const switchOrder = (id) => {
    setCurrentOrderId(id)
    showToast(`Switched to #${id}`)
  }

  // ── Cart mutations ──
  const addToCart = (product) => {
    playSound('add')
    setCartItems(prev => {
      const ex = prev.find(i => i.id === product.id)
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const increaseQty = (id) => { playSound('add');    setCartItems(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i)) }
  const decreaseQty = (id) => {
    playSound('remove')
    setCartItems(prev => {
      const item = prev.find(i => i.id === id)
      if (!item) return prev
      if (item.qty === 1) return prev.filter(i => i.id !== id)
      return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i)
    })
  }
  const clearCart = () => setCartItems([])

  // ── Totals ──
  const subtotal   = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const tax        = subtotal * taxRateObj.value
  const total      = subtotal + tax
  const totalItems = cart.reduce((s, i) => s + i.qty, 0)

  // ── Checkout ──
  const handleCheckout = () => {
    playSound('checkout')
    const completedId = currentOrderId
    setOrders(prev => prev.map(o => o.id === completedId ? { ...o, status: 'completed' } : o))
    const newOrder = makeOrder()
    setOrders(prev => [...prev, newOrder])
    setCurrentOrderId(newOrder.id)
    setCartOpen(false)
    showToast(`#${completedId} completed — ${fmt(total, currency)}`)
  }

  // ── Filter ──
  const filtered = useMemo(() => PRODUCTS.filter(p =>
    (activeCategory === 'All' || p.category === activeCategory) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  ), [activeCategory, search])

  const getQty    = (id)  => cart.find(i => i.id === id)?.qty ?? 0
  const closeSearch = ()  => { setSearch(''); setSearchOpen(false) }
  const activeOrders = orders.filter(o => o.status === 'active')

  return (
    <>
      {/* Toast */}
      {toast && <div className="toast" role="status"><I.Check s={15}/> {toast}</div>}

      {/* Mobile cart overlay */}
      <div className={`cart-overlay ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)} aria-hidden="true"/>

      {/* Drawers */}
      {menuOpen   && <SettingsDrawer theme={theme} onToggleTheme={toggleTheme} cols={cols} onCols={setCols} currency={currency} onCurrency={setCurrency} taxRateObj={taxRateObj} onTaxRate={setTaxRateObj} onClose={() => setMenuOpen(false)}/>}
      {ordersOpen && <OrderConsole   orders={orders} currentOrderId={currentOrderId} onSwitch={switchOrder} onNew={() => { createNewOrder(); setOrdersOpen(false) }} onClose={() => setOrdersOpen(false)} currency={currency} taxRateObj={taxRateObj}/>}

      {/* Search overlay */}
      <div className={`search-overlay ${searchOpen ? 'open' : ''}`} role="search">
        <input ref={searchRef} id="product-search" type="search" className="search-input" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Escape' && closeSearch()} aria-label="Search products"/>
        <button className="search-close-btn" onClick={closeSearch} aria-label="Close search"><I.X s={17}/></button>
      </div>

      {/* ── APP SHELL ── */}
      <div className="app-shell">

        {/* ── HEADER ── */}
        <header className="app-header">
          {/* Brand */}
          <div className="header-brand">
            <div className="header-brand-icon"><I.Logo/></div>
            <span className="header-brand-name">Mansula <span>Nexus</span></span>
          </div>

          {/* Current order ID pill (opens console on click) */}
          <button className="order-id-pill" onClick={() => setOrdersOpen(true)} id="current-order-pill">
            <I.Orders s={13}/> #{currentOrderId}
            {activeOrders.length > 1 && <span className="order-id-count">{activeOrders.length}</span>}
          </button>

          {/* Right: quick new order + hamburger (opens settings) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button id="new-order-header-btn" className="icon-btn new-order-quick" onClick={createNewOrder} aria-label="New order" title="New order">
              <I.Plus s={17}/>
            </button>
            <button id="menu-btn" className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Open settings">
              <I.Menu s={19}/>
            </button>
          </div>
        </header>

        {/* ── BODY ── */}
        <div className="app-body">

          {/* ── PRODUCTS ── */}
          <main className="pos-panel">
            <div className="pos-toolbar">
              <div className="category-scroll">
                {CATEGORIES.map(cat => (
                  <button key={cat} id={`cat-${cat.toLowerCase()}`} className={`chip ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCat(cat)} aria-pressed={activeCategory === cat}>
                    {cat}
                  </button>
                ))}
              </div>
              <button id="search-toggle-btn" className={`icon-btn ${searchOpen ? 'active' : ''}`} onClick={() => setSearchOpen(o => { if (o) setSearch(''); return !o })} aria-label={searchOpen ? 'Close search' : 'Search'}>
                {searchOpen ? <I.X s={16}/> : <I.Search s={16}/>}
              </button>
            </div>

            <div className="products-grid-wrap">
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-emoji">🔍</div>
                  <p>No results for <strong>"{search}"</strong></p>
                </div>
              ) : (
                <div className={`products-grid ${cols === 'auto' ? 'grid-cols-auto' : `grid-cols-${cols}`}`}>
                  {filtered.map(p => (
                    <ProductCard key={p.id} product={p} qty={getQty(p.id)} onAdd={addToCart} onDecrease={decreaseQty} cols={cols} currency={currency}/>
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* ── CART ── */}
          <aside className={`cart-panel ${cartOpen ? 'open' : ''}`} aria-label="Current order">
            <div className="cart-header">
              <div className="cart-title">
                <I.Cart s={17}/> #{currentOrderId}
                {totalItems > 0 && <span className="cart-count-badge">{totalItems}</span>}
              </div>
              {cart.length > 0 && <button id="clear-cart-btn" className="cart-clear-btn" onClick={clearCart}>Clear</button>}
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-icon">🛒</div>
                <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No items yet</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Tap a product to add</p>
              </div>
            ) : (
              <>
                <div className="cart-items" role="list">
                  {cart.map(item => <CartItem key={item.id} item={item} onIncrease={increaseQty} onDecrease={decreaseQty} currency={currency}/>)}
                </div>
                <div className="cart-footer">
                  <div className="cart-totals">
                    <div className="cart-total-row"><span className="label">Subtotal</span><span className="value">{fmt(subtotal, currency)}</span></div>
                    <div className="cart-total-row"><span className="label">{taxRateObj.label}</span><span className="value">{fmt(tax, currency)}</span></div>
                    <div className="cart-total-row grand"><span className="label">Total</span><span className="value">{fmt(total, currency)}</span></div>
                  </div>
                  <button id="checkout-btn" className="checkout-btn" onClick={handleCheckout} disabled={cart.length === 0}>
                    <I.Check s={17}/> Charge {fmt(total, currency)}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>

      {/* Mobile FAB */}
      <button id="mobile-cart-fab" className="mobile-cart-fab" onClick={() => setCartOpen(o => !o)} aria-label={`Cart — ${totalItems} items`}>
        <I.Cart s={24}/>
        {totalItems > 0 && <span className="mobile-cart-badge">{totalItems}</span>}
      </button>
    </>
  )
}
