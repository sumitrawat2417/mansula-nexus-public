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
const makeOrderId = () => {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${_oc++}-${dd}/${mm}/${yy}`
}
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
    } else if (type === 'alarm') {
      osc.type = 'square'
      const t = audioCtx.currentTime
      for(let i=0; i<6; i++) {
        osc.frequency.setValueAtTime(800, t + i*0.5)
        osc.frequency.setValueAtTime(1200, t + i*0.5 + 0.25)
      }
      gain.gain.setValueAtTime(0.1, t)
      gain.gain.linearRampToValueAtTime(0.1, t + 3)
      gain.gain.linearRampToValueAtTime(0.01, t + 3.1)
      osc.start(t); osc.stop(t + 3.1)
    }
  } catch (_) {}
}

// ─────────────── SWIPEABLE ROW ───────────────
function SwipeableRow({ children, onSwipeLeft, onSwipeRight, leftContent, rightContent }) {
  const [startX, setStartX] = useState(null)
  const [offsetX, setOffsetX] = useState(0)
  const [containerWidth, setContainerWidth] = useState(300)

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX)
    if (e.currentTarget) setContainerWidth(e.currentTarget.offsetWidth)
  }
  const handleTouchMove = (e) => {
    if (startX === null) return
    let diff = e.touches[0].clientX - startX
    if (!onSwipeLeft && diff < 0) diff = 0
    if (!onSwipeRight && diff > 0) diff = 0
    setOffsetX(diff)
  }
  const handleTouchEnd = () => {
    const threshold = containerWidth * 0.5
    if (offsetX > threshold && onSwipeRight) onSwipeRight()
    else if (offsetX < -threshold && onSwipeLeft) onSwipeLeft()
    setStartX(null)
    setOffsetX(0)
  }

  const bg = offsetX > 0 ? 'var(--brand-accent)' : offsetX < 0 ? '#ef4444' : 'transparent'
  const isDragging = startX !== null

  return (
    <div className="swipe-container" style={{ position: 'relative', overflow: 'hidden', borderRadius: 'inherit', width: '100%', display: 'flex' }}>
      <div className="swipe-background" style={{ position: 'absolute', inset: 0, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: offsetX > 0 ? 'flex-start' : 'flex-end', padding: '0 20px', color: 'white', fontWeight: 600, zIndex: 0 }}>
        {offsetX > 0 ? rightContent : leftContent}
      </div>
      <div
        className="swipe-content"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${offsetX}px)`, transition: isDragging ? 'none' : 'transform 0.3s ease', zIndex: 1, position: 'relative', width: '100%' }}
      >
        {children}
      </div>
    </div>
  )
}

function formatOrderId(id) {
  if (!id) return ''
  const parts = id.split('-')
  if (parts.length < 2) return `#${id}`
  return (
    <>
      <span style={{ fontSize: '1.4em' }}>#{parts[0]}</span>
      <span style={{ opacity: 0.8 }}>-{parts[1]}</span>
    </>
  )
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

// ─────────────── SUCCESS MODAL ───────────────
function SuccessModal({ order, onClose, currency, taxRateObj }) {
  const [expanded, setExpanded] = useState(false)
  if (!order) return null
  const sub = order.items.reduce((s, i) => s + i.price * i.qty, 0)
  const total = sub * (1 + taxRateObj.value)

  const previewCount = 4
  const hasMore = order.items.length > previewCount
  const visibleItems = expanded ? order.items : order.items.slice(0, previewCount)

  return (
    <div className="drawer-overlay open" style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div className="success-modal" onClick={e => e.stopPropagation()}>
        <div className="success-icon-wrap">
          <svg className="success-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 className="success-title">Order Complete!</h2>
        <p className="success-subtitle">{formatOrderId(order.id)} has been finalized.</p>
        
        <div className="success-details" style={{ textAlign: 'center' }}>
          {visibleItems.map(item => (
            <div key={item.id} className="success-item-row" style={{ textAlign: 'left' }}>
              <span>{item.qty}× {item.name}</span>
              <span>{fmt(item.price * item.qty, currency)}</span>
            </div>
          ))}
          {!expanded && hasMore && (
            <button className="expand-items-btn" onClick={() => setExpanded(true)}>
              + {order.items.length - previewCount} more items
            </button>
          )}
          <div className="success-total-row" style={{ textAlign: 'left' }}>
            <span>Total</span>
            <span className="success-total-val">{fmt(total, currency)}</span>
          </div>
        </div>
        
        <button className="success-done-btn" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}

// ─────────────── ORDER CONSOLE ───────────────
function OrderConsole({ orders, currentOrderId, onSwitch, onSuccess, onNew, onClose, currency, taxRateObj, watchdogMins, onWatchdogMins }) {
  const [expandedId, setExpandedId] = useState(null)
  const [isCustomTimer, setIsCustomTimer] = useState(![0, 2, 5, 10, 15, 30].includes(watchdogMins))

  const active    = orders.filter(o => o.status === 'active')
  const past      = orders.filter(o => o.status === 'completed')

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id)

  const renderDetailInline = (order) => {
    const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0)
    const tax      = subtotal * taxRateObj.value
    const total    = subtotal + tax
    return (
      <div className="order-detail-inline">
        <div className="order-detail-items-inline">
          {order.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>No items in this order</div>
          ) : (
            order.items.map(item => (
              <div key={item.id} className="detail-item-row-inline">
                <span className="detail-item-emoji-inline">{item.emoji}</span>
                <div className="detail-item-info-inline">
                  <div className="detail-item-name-inline">{item.name}</div>
                  <div className="detail-item-unit-inline">{fmt(item.price, currency)} × {item.qty}</div>
                </div>
                <div className="detail-item-total-inline">{fmt(item.price * item.qty, currency)}</div>
              </div>
            ))
          )}
        </div>
        {order.items.length > 0 && (
          <div className="order-detail-totals-inline">
            <div className="cart-total-row"><span className="label">Subtotal</span><span className="value">{fmt(subtotal, currency)}</span></div>
            <div className="cart-total-row"><span className="label">{taxRateObj.label}</span><span className="value">{fmt(tax, currency)}</span></div>
            <div className="cart-total-row grand"><span className="label">Total</span><span className="value">{fmt(total, currency)}</span></div>
          </div>
        )}
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

        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="new-order-btn" onClick={onNew} id="new-order-btn" style={{ flex: 1 }}>
            <I.Plus s={15}/> New Order
          </button>
          <div className="watchdog-control" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface-2)', padding: '0 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', height: '40px' }} title="Watchdog Timer">
            <I.Clock s={14} color="var(--brand-primary)"/>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Watchdog</span>
            {isCustomTimer ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input 
                  type="number" 
                  value={watchdogMins} 
                  onChange={e => onWatchdogMins(Math.max(0, parseInt(e.target.value) || 0))} 
                  style={{ width: 40, background: 'transparent', border: 'none', color: 'inherit', fontSize: '0.9rem', outline: 'none', textAlign: 'center', marginLeft: 4 }}
                  autoFocus
                />
                <button onClick={() => { setIsCustomTimer(false); onWatchdogMins(0); }} style={{ background:'none', border:'none', cursor:'pointer', padding:'4px', color:'var(--text-muted)' }} title="Clear custom timer"><I.X s={12}/></button>
              </div>
            ) : (
              <select 
                value={watchdogMins}
                onChange={e => {
                  if (e.target.value === 'custom') {
                    setIsCustomTimer(true)
                    onWatchdogMins(watchdogMins === 0 ? 1 : watchdogMins)
                  } else {
                    onWatchdogMins(parseInt(e.target.value))
                  }
                }}
                style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '0.9rem', outline: 'none', appearance: 'none', cursor: 'pointer', marginLeft: 4 }}
              >
                <option value={0}>Off</option>
                <option value={2}>2m</option>
                <option value={5}>5m</option>
                <option value={10}>10m</option>
                <option value={15}>15m</option>
                <option value={30}>30m</option>
                <option value="custom">Custom</option>
              </select>
            )}
          </div>
        </div>

        <div className="console-body">
          {active.length > 0 && (
            <>
              <div className="console-section-label">Active Orders</div>
              {active.map(order => {
                const total = ordTotal(order, taxRateObj.value)
                const isCurrent = order.id === currentOrderId
                const isExpanded = expandedId === order.id
                const isOverdue = order.alarmed
                return (
                  <div key={order.id} className={`order-row-wrap ${isExpanded ? 'expanded' : ''} ${isOverdue ? 'overdue' : ''}`}>
                    <SwipeableRow
                      onSwipeRight={order.items.length > 0 ? (e) => { e?.stopPropagation(); onSuccess(order.id) } : undefined}
                      rightContent={<><I.Check s={16} /> Complete</>}
                    >
                      <div
                        className={`order-row ${isCurrent ? 'current' : ''}`}
                        onClick={() => toggleExpand(order.id)}
                      >
                        <div className="order-row-left">
                          <div className="order-row-id">
                            {isOverdue && <I.Clock s={14} color="#ef4444" />}
                            {formatOrderId(order.id)}
                          </div>
                          <div className="order-row-meta">
                            <I.Clock s={12}/> {fmtD(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="order-row-right">
                          <div className="order-row-total">{fmt(total, currency)}</div>
                          {isCurrent && <span className="order-row-badge">Current</span>}
                          {!isCurrent && (
                            <button className="switch-order-btn-small" onClick={(e) => { e.stopPropagation(); onSwitch(order.id); onClose(); }}>Switch</button>
                          )}
                          {order.items.length > 0 && (
                            <button className="desktop-complete-btn" onClick={(e) => { e.stopPropagation(); onSuccess(order.id); }} title="Complete Order">
                              <I.Check s={14}/> Complete
                            </button>
                          )}
                          <span className="expand-indicator" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: '0.2s', display: 'flex' }}><I.ChevRight s={14}/></span>
                        </div>
                      </div>
                    </SwipeableRow>
                    {isExpanded && renderDetailInline(order)}
                  </div>
                )
              })}
            </>
          )}

          {past.length > 0 && (
            <>
              <div className="console-section-label" style={{ marginTop: 16 }}>Completed Orders</div>
              {past.slice(-20).reverse().map(order => {
                const total = ordTotal(order, taxRateObj.value)
                const isExpanded = expandedId === order.id
                return (
                  <div key={order.id} className={`order-row-wrap ${isExpanded ? 'expanded' : ''}`}>
                    <div
                      className="order-row past"
                      onClick={() => toggleExpand(order.id)}
                    >
                      <div className="order-row-left">
                        <div className="order-row-id">{formatOrderId(order.id)}</div>
                        <div className="order-row-meta">
                          <I.Clock s={12}/> {fmtD(order.createdAt)} · {order.items.reduce((s,i)=>s+i.qty,0)} items
                        </div>
                      </div>
                      <div className="order-row-right">
                        <div className="order-row-total">{fmt(total, currency)}</div>
                        <span className="order-row-badge done">Done</span>
                        <span style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: '0.2s', display: 'flex' }}><I.ChevRight s={14}/></span>
                      </div>
                    </div>
                    {isExpanded && renderDetailInline(order)}
                  </div>
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

  const handleAdd = () => {
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
          <div className="card-overlay-controls" style={{ pointerEvents: 'none' }}>
            <button
              className="card-ov-btn minus"
              style={{ pointerEvents: 'auto' }}
              onClick={(e) => { e.stopPropagation(); onDecrease(product.id); }}
              aria-label={qty === 1 ? 'Remove from cart' : 'Decrease quantity'}
            >
              {qty === 1 ? <I.Trash/> : <I.Minus/>}
            </button>
            <span className="card-ov-qty">{qty}</span>
            <button
              className="card-ov-btn plus"
              style={{ pointerEvents: 'auto' }}
              onClick={(e) => { e.stopPropagation(); onAdd(product); }}
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
  const [successOrder, setSuccessOrder] = useState(null)
  const [watchdogMins, setWatchdogMins] = useState(() => { try { return parseInt(localStorage.getItem('mn-watchdog')) || 5 } catch { return 5 } })
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

  const showToast = (msg, type='success') => { setToast({msg, type}); setTimeout(() => setToast(null), 2800) }

  // ── Watchdog Timer ──
  useEffect(() => {
    if (watchdogMins === 0) return
    const interval = setInterval(() => {
      setOrders(currentOrders => {
        const now = Date.now()
        const threshold = watchdogMins * 60 * 1000
        let newAlarm = false

        currentOrders.forEach(o => {
          if (o.status === 'active' && o.items.length > 0) {
            const elapsed = now - o.createdAt.getTime()
            const timeSinceAlarm = o.lastAlarm ? now - o.lastAlarm : elapsed
            if (elapsed > threshold && timeSinceAlarm >= 60000) {
              showToast(`⚠️ Warning: Order #${o.id} is overdue!`, 'error')
              newAlarm = true
            }
          }
        })

        if (newAlarm) {
          playSound('alarm')
          return currentOrders.map(o => {
            if (o.status === 'active' && o.items.length > 0) {
              const elapsed = now - o.createdAt.getTime()
              const timeSinceAlarm = o.lastAlarm ? now - o.lastAlarm : elapsed
              if (elapsed > threshold && timeSinceAlarm >= 60000) {
                return { ...o, alarmed: true, lastAlarm: now }
              }
            }
            return o
          })
        }
        return currentOrders
      })
    }, 10000)
    return () => clearInterval(interval)
  }, [watchdogMins])

  // ── Order mutations ──
  const setCartItems = useCallback((updater) => {
    setOrders(prev => prev.map(o =>
      o.id === currentOrderId
        ? { ...o, items: typeof updater === 'function' ? updater(o.items) : updater }
        : o
    ))
  }, [currentOrderId])

  const createNewOrder = () => {
    const current = orders.find(o => o.id === currentOrderId)
    if (current && current.items.length === 0) {
      showToast('Current order is empty. Cannot create new.')
      return
    }
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
  const handleCheckoutOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return
    if (order.items.length === 0) {
      showToast('Cannot complete an empty order.', 'error')
      return
    }

    playSound('checkout')
    setSuccessOrder(order)
    
    let newCurrentId = currentOrderId
    let newOrders = orders.map(o => o.id === orderId ? { ...o, status: 'completed' } : o)
    
    if (orderId === currentOrderId) {
      const remainingActive = newOrders.filter(o => o.status === 'active')
      if (remainingActive.length > 0) {
        remainingActive.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        newCurrentId = remainingActive[0].id
      } else {
        const newOrder = makeOrder()
        newOrders.push(newOrder)
        newCurrentId = newOrder.id
      }
      setCartOpen(false)
    }
    
    setOrders(newOrders)
    if (newCurrentId !== currentOrderId) {
      setCurrentOrderId(newCurrentId)
    }
  }

  const handleCheckout = () => {
    const current = orders.find(o => o.id === currentOrderId)
    if (current && current.items.length === 0) {
      showToast('Cannot complete an empty order.')
      return
    }
    handleCheckoutOrder(currentOrderId)
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
      {toast && <div className={`toast ${toast.type}`} role="status">{toast.type==='success' ? <I.Check s={15}/> : <I.Clock s={15}/>} {toast.msg}</div>}

      {/* Mobile cart overlay */}
      <div className={`cart-overlay ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)} aria-hidden="true"/>

      {/* Drawers & Modals */}
      {successOrder && <SuccessModal order={successOrder} onClose={() => setSuccessOrder(null)} currency={currency} taxRateObj={taxRateObj} />}
      {menuOpen   && <SettingsDrawer theme={theme} onToggleTheme={toggleTheme} cols={cols} onCols={setCols} currency={currency} onCurrency={setCurrency} taxRateObj={taxRateObj} onTaxRate={setTaxRateObj} onClose={() => setMenuOpen(false)}/>}
      {ordersOpen && <OrderConsole orders={orders} currentOrderId={currentOrderId} onSwitch={switchOrder} onSuccess={handleCheckoutOrder} onNew={() => { createNewOrder(); setOrdersOpen(false) }} onClose={() => setOrdersOpen(false)} currency={currency} taxRateObj={taxRateObj} watchdogMins={watchdogMins} onWatchdogMins={(v) => { setWatchdogMins(v); localStorage.setItem('mn-watchdog', v); }}/>}

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
            <span className="header-brand-name">ManSula <span>Nexus</span></span>
          </div>

          {/* Current order ID pill (opens console on click) */}
          <button className="order-id-pill" onClick={() => setOrdersOpen(true)} id="current-order-pill">
            <I.Orders s={13}/> {formatOrderId(currentOrderId)}
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
                <I.Cart s={17}/> {formatOrderId(currentOrderId)}
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
      {totalItems > 0 && (
        <div className="mobile-cart-bar-wrap">
          <SwipeableRow
            onSwipeRight={totalItems > 0 ? () => handleCheckout() : undefined}
            rightContent={<><I.Check s={18} style={{marginRight: 4}}/> Complete</>}
            onSwipeLeft={() => clearCart()}
            leftContent={<><I.Trash s={18} style={{marginRight: 4}}/> Clear</>}
          >
            <button id="mobile-cart-bar" className="mobile-cart-bar" onClick={() => { if (window.innerWidth > 768 && totalItems > 0) handleCheckout(); else setCartOpen(o => !o); }} aria-label={`Cart — ${totalItems} items`} title={window.innerWidth > 768 ? "Click to Checkout" : "Tap to open cart"}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <I.Cart s={20}/>
                <span className="mobile-cart-bar-qty">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
              </div>
              <div className="mobile-cart-bar-total">{fmt(total, currency)}</div>
            </button>
          </SwipeableRow>
        </div>
      )}
      {totalItems === 0 && (
        <button id="mobile-cart-fab" className="mobile-cart-fab" onClick={() => setCartOpen(o => !o)} aria-label={`Cart`}>
          <I.Cart s={24}/>
        </button>
      )}
    </>
  )
}
