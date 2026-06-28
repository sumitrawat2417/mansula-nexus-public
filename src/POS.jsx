import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import './App.css'
import { dbGet, dbSet, saveOrderRecord, getNextOrderNum, getOrdersByMonth, getCustomers, saveCustomer, saveUdhaarEntry, recalcUdhaarBalance, getUdhaarByOrderId, getCustomerById, deleteUdhaarEntry } from './db.js'
import { DEFAULT_PRODUCTS, DEFAULT_CATEGORIES, KEY_PRODUCTS, KEY_CATEGORIES, KEY_BUSINESS, DEFAULT_BUSINESS } from './BusinessProfile.jsx'
import { useBackButton } from './useBackButton.js'
import { APP_NAME, APP_VERSION } from './appInfo.js'
import { QRCodeSVG } from 'qrcode.react'
import { BillDocument } from './BillReceipt.jsx'

// ─────────────── DATA (loaded from IDB, fallback to defaults) ───────────────


const CURRENCIES = [
  { code: 'INR', symbol: '₹', rate: 1, decimals: 0 },
  { code: 'USD', symbol: '$', rate: 0.012, decimals: 2 },
  { code: 'EUR', symbol: '€', rate: 0.011, decimals: 2 },
  { code: 'GBP', symbol: '£', rate: 0.0095, decimals: 2 },
  { code: 'AUD', symbol: 'A$', rate: 0.018, decimals: 2 },
]

const TAX_RATES = [
  { label: 'No Tax (0%)', value: 0 },
  { label: 'GST 5%', value: 0.05 },
  { label: 'GST 12%', value: 0.12 },
  { label: 'GST 18%', value: 0.18 },
  { label: 'GST 28%', value: 0.28 },
]

// ─────────────── ORDER ID ───────────────
// Async monthly counter: queries IDB for count of orders this month, then +1
// Synchronous fallback uses Date.now() suffix for uniqueness
function getMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function makeDateSuffix(d = new Date()) {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${dd}/${mm}/${yy}`
}

// Synchronous temp id (replaced after async resolves)
let _tempCounter = 1
const makeTempOrderId = () => `T${_tempCounter++}-${makeDateSuffix()}`

const makeOrder = (id) => ({ id: id || makeTempOrderId(), items: [], createdAt: new Date(), status: 'active' })
const INIT_ORDER = makeOrder() // created once at module level

// ─────────────── SOUND ───────────────
let audioCtx = null
const playSound = (type) => {
  const volStr = localStorage.getItem('mn-volume')
  const vol = volStr !== null ? parseInt(volStr, 10) / 100 : 1
  if (vol === 0 || localStorage.getItem('mn-sound') === 'disabled') return

  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain); gain.connect(audioCtx.destination)
    if (type === 'add') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, audioCtx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.1 * vol, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01 * vol, audioCtx.currentTime + 0.1)
      osc.start(); osc.stop(audioCtx.currentTime + 0.1)
    } else if (type === 'remove') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(300, audioCtx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.1 * vol, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01 * vol, audioCtx.currentTime + 0.1)
      osc.start(); osc.stop(audioCtx.currentTime + 0.1)
    } else if (type === 'checkout') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(440, audioCtx.currentTime)
      osc.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.12)
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.24)
      gain.gain.setValueAtTime(0.1 * vol, audioCtx.currentTime)
      gain.gain.linearRampToValueAtTime(0.01 * vol, audioCtx.currentTime + 0.36)
      osc.start(); osc.stop(audioCtx.currentTime + 0.36)
    } else if (type === 'alarm') {
      osc.type = 'square'
      const t = audioCtx.currentTime
      for (let i = 0; i < 6; i++) {
        osc.frequency.setValueAtTime(800, t + i * 0.5)
        osc.frequency.setValueAtTime(1200, t + i * 0.5 + 0.25)
      }
      gain.gain.setValueAtTime(0.04 * vol, t)
      gain.gain.linearRampToValueAtTime(0.04 * vol, t + 3)
      gain.gain.linearRampToValueAtTime(0.01 * vol, t + 3.1)
      osc.start(t); osc.stop(t + 3.1)
    }
  } catch (_) { }
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
  Search: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>,
  X: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
  Menu: ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg>,
  Cart: ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>,
  Sun: ({ s = 17 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
  Moon: ({ s = 17 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
  Plus: ({ s = 13 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>,
  Minus: ({ s = 13 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14" /></svg>,
  Trash: ({ s = 13 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>,
  Users: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  Calendar: ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  Check: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  Orders: ({ s = 17 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></svg>,
  Back: ({ s = 17 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
  ChevRight: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>,
  Clock: ({ s = 14 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  Settings: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  GridAuto: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>,
  Home: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  Logo: () => <img src="/logo.png" width="20" height="20" alt="Logo" style={{ objectFit: 'contain' }} />,
}

// ─────────────── HELPERS ───────────────
const fmt = (val, cur) => `${cur.symbol}${(val * cur.rate).toFixed(cur.decimals)}`
const fmtD = (d) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
const ordTotal = (order, taxRate) => {
  const sub = order.items.reduce((s, i) => s + i.price * i.qty, 0)
  return sub * (1 + taxRate)
}

// ─────────────── SUCCESS MODAL ───────────────
function SuccessModal({ order, onClose, currency, taxRateObj }) {
  useBackButton(onClose)
  const [expanded, setExpanded] = useState(false)
  if (!order) return null

  // Use stored values if available, otherwise fallback to basic calculation
  const sub = order.subtotal !== undefined ? order.subtotal : order.items.reduce((s, i) => s + i.price * i.qty, 0)
  const tax = order.taxAmt !== undefined ? order.taxAmt : sub * taxRateObj.value
  const discount = order.discountAmt || 0
  const delivery = order.deliveryCharge || 0
  const total = order.total !== undefined ? order.total : (sub + tax - discount + delivery)

  const previewCount = 4
  const hasMore = order.items.length > previewCount
  const visibleItems = expanded ? order.items : order.items.slice(0, previewCount)

  return (
    <div className="drawer-overlay open" style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div className="success-modal" onClick={e => e.stopPropagation()}>
        <div className="success-icon-wrap">
          <svg className="success-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h2 className="success-title">Order Complete!</h2>
        <p className="success-subtitle">{formatOrderId(order.id)} has been finalized.</p>

        <div className="success-details" style={{ textAlign: 'center' }}>
          {visibleItems.map(item => (
            <div key={item.variantKey ? `${item.id}-${item.variantKey}` : item.id} className="success-item-row" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span>{item.qty}× {item.name}</span>
                {item.variantLabel && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '1.2rem', marginTop: 2 }}>{item.variantLabel}</div>}
              </div>
              <span>{fmt(item.price * item.qty, currency)}</span>
            </div>
          ))}
          {!expanded && hasMore && (
            <button className="expand-items-btn" onClick={() => setExpanded(true)}>
              + {order.items.length - previewCount} more items
            </button>
          )}

          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--border-color)', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span>{fmt(sub, currency)}</span>
            </div>
            {tax > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>{order.taxLabel || taxRateObj.label}</span>
                <span>{fmt(tax, currency)}</span>
              </div>
            )}
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--brand-danger)' }}>
                <span>Discount</span>
                <span>-{fmt(discount, currency)}</span>
              </div>
            )}
            {delivery > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--brand-accent)' }}>
                <span>Delivery</span>
                <span>+{fmt(delivery, currency)}</span>
              </div>
            )}
          </div>

          <div className="success-total-row" style={{ textAlign: 'left', marginTop: 8, paddingTop: 8, borderTop: '1.5px solid var(--border-color)' }}>
            <span>Total</span>
            <span className="success-total-val">{fmt(total, currency)}</span>
          </div>
          <div className="success-payment-mode" style={{ textAlign: 'left', marginTop: 8, fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Payment Mode</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {order.paymentMode === 'split' && order.paymentDetails
                ? `Split (Cash: ${fmt(order.paymentDetails.cash, currency)}, UPI: ${fmt(order.paymentDetails.upi, currency)})`
                : order.paymentMode || 'Cash'}
            </span>
          </div>
        </div>

        <button className="success-done-btn" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}

// ─────────────── ORDER CONSOLE ───────────────
function OrderConsole({ orders, currentOrderId, onSwitch, onSuccess, onNew, onClose, currency, taxRateObj, watchdogMins, onWatchdogMins }) {
  useBackButton(onClose)
  const [expandedId, setExpandedId] = useState(null)
  const [showAllItems, setShowAllItems] = useState(false)
  const [isCustomTimer, setIsCustomTimer] = useState(![0, 2, 5, 10, 15, 30].includes(watchdogMins))

  const active = orders.filter(o => o.status === 'active')
  const past = orders.filter(o => o.status === 'completed').sort((a, b) => b.completedAt - a.completedAt)

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id)
    setShowAllItems(false)
  }

  const renderDetailInline = (order) => {
    // Read from stored values or recalculate if missing (for legacy or active orders)
    const subtotal = order.subtotal !== undefined ? order.subtotal : order.items.reduce((s, i) => s + i.price * i.qty, 0)
    const tax = order.taxAmt !== undefined ? order.taxAmt : subtotal * taxRateObj.value
    const discount = order.discountAmt || 0
    const delivery = order.deliveryCharge || 0
    const total = order.total !== undefined ? order.total : (subtotal + tax - discount + delivery)

    const PREVIEW_COUNT = 3
    const visibleItems = showAllItems ? order.items : order.items.slice(0, PREVIEW_COUNT)
    const hasMore = order.items.length > PREVIEW_COUNT

    return (
      <div className="order-detail-inline">
        <div className="order-detail-items-inline">
          {order.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>No items in this order</div>
          ) : (
            <>
              {visibleItems.map(item => (
                <div key={item.variantKey ? `${item.id}-${item.variantKey}` : item.id} className="detail-item-row-inline">
                  <span className="detail-item-emoji-inline">{item.emoji}</span>
                  <div className="detail-item-info-inline">
                    <div className="detail-item-name-inline">
                      {item.name}
                      {item.variantLabel && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 6, fontWeight: 500 }}>({item.variantLabel})</span>}
                    </div>
                    <div className="detail-item-unit-inline">{fmt(item.price, currency)} × {item.qty}</div>
                  </div>
                  <div className="detail-item-total-inline">{fmt(item.price * item.qty, currency)}</div>
                </div>
              ))}
              {!showAllItems && hasMore && (
                <button
                  className="expand-items-btn"
                  onClick={() => setShowAllItems(true)}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  + {order.items.length - PREVIEW_COUNT} more items
                </button>
              )}
            </>
          )}
        </div>
        {order.items.length > 0 && (
          <div className="order-detail-totals-inline" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className="cart-total-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span className="label" style={{ color: 'var(--text-muted)' }}>Subtotal</span><span className="value">{fmt(subtotal, currency)}</span></div>
            {tax > 0 && <div className="cart-total-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}><span className="label" style={{ color: 'var(--text-muted)' }}>{order.taxLabel || taxRateObj.label}</span><span className="value">{fmt(tax, currency)}</span></div>}
            {discount > 0 && <div className="cart-total-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--brand-danger)' }}><span className="label">Discount</span><span className="value">-{fmt(discount, currency)}</span></div>}
            {delivery > 0 && <div className="cart-total-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--brand-accent)' }}><span className="label">Delivery</span><span className="value">+{fmt(delivery, currency)}</span></div>}
            <div className="cart-total-row grand" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 8, paddingTop: 8, borderTop: '1.5px solid var(--border-color)' }}><span className="label">Total</span><span className="value">{fmt(total, currency)}</span></div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="drawer-overlay open" onClick={onClose} aria-hidden="true">
      <div className="order-console" onClick={e => e.stopPropagation()} role="dialog" aria-label="Order console">
        <div className="console-header">
          <div className="console-title"><I.Orders s={18} />Order Console</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><I.X s={17} /></button>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="new-order-btn" onClick={onNew} id="new-order-btn" style={{ flex: 1 }}>
            <I.Plus s={15} /> New Order
          </button>
          <div className="watchdog-control" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface-2)', padding: '0 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', height: '40px' }} title="Watchdog Timer">
            <I.Clock s={14} color="var(--brand-primary)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Watchdog</span>
            {isCustomTimer ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="number"
                  value={watchdogMins}
                  onChange={e => onWatchdogMins(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{ width: 40, background: 'transparent', border: 'none', color: 'inherit', fontSize: '0.9rem', outline: 'none', textAlign: 'center', marginLeft: 4 }}
                />
                <button onClick={() => { setIsCustomTimer(false); onWatchdogMins(0); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }} title="Clear custom timer"><I.X s={12} /></button>
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
                            <I.Clock s={12} /> {fmtD(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
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
                              <I.Check s={14} /> Complete
                            </button>
                          )}
                          <span className="expand-indicator" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: '0.2s', display: 'flex' }}><I.ChevRight s={14} /></span>
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
              {past.slice(0, 20).map(order => {
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
                          <I.Clock s={12} /> {fmtD(order.createdAt)} · {order.items.reduce((s, i) => s + i.qty, 0)} items
                        </div>
                      </div>
                      <div className="order-row-right">
                        <span className="order-row-badge" style={{ backgroundColor: { cash: '#10b981', upi: '#6366f1', card: '#0ea5e9', udhaar: '#f59e0b', split: '#8b5cf6', other: '#64748b' }[order.paymentMode] || '#10b981' }}>{String(order.paymentMode || 'DONE').toUpperCase()}</span>
                        <div className="order-row-total">{fmt(total, currency)}</div>
                        <span style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: '0.2s', display: 'flex' }}><I.ChevRight s={14} /></span>
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
function SettingsDrawer({ cols, onCols, onExit, onClose }) {
  useBackButton(onClose)
  const gridOptions = [
    { key: 'auto', label: 'Auto', icon: <I.GridAuto s={18} /> },
    { key: '2', label: '2 cols', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="8" height="18" rx="1" /><rect x="13" y="3" width="8" height="18" rx="1" /></svg> },
    { key: '3', label: '3 cols', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="6" height="18" rx="1" /><rect x="9" y="3" width="6" height="18" rx="1" /><rect x="16" y="3" width="6" height="18" rx="1" /></svg> },
    { key: '4', label: '4 cols', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="4" height="18" rx="1" /><rect x="7.33" y="3" width="4" height="18" rx="1" /><rect x="12.67" y="3" width="4" height="18" rx="1" /><rect x="18" y="3" width="4" height="18" rx="1" /></svg> },
    { key: '5', label: '5 cols', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="4" height="18" rx="1" /><rect x="6" y="3" width="3.5" height="18" rx="1" /><rect x="10.25" y="3" width="3.5" height="18" rx="1" /><rect x="14.5" y="3" width="3.5" height="18" rx="1" /><rect x="19" y="3" width="4" height="18" rx="1" /></svg> },
  ]

  return (
    <div className="drawer-overlay open" onClick={onClose} aria-hidden="true">
      <div className="settings-drawer" onClick={e => e.stopPropagation()} role="dialog" aria-label="Settings">
        <div className="drawer-handle" />
        <div className="console-header">
          <div className="console-title"><I.Settings s={18} />Settings</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><I.X s={17} /></button>
        </div>

        <div className="console-body">
          {/* Go Home */}
          {onExit && (
            <div className="setting-row" style={{ cursor: 'pointer', padding: '14px 16px', background: 'var(--brand-primary-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--brand-primary)', marginBottom: 12 }} onClick={onExit}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'var(--brand-primary)', color: 'white', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <I.Home s={16} />
                </div>
                <div>
                  <div className="setting-label" style={{ color: 'var(--brand-primary)' }}>Back to Home</div>
                  <div className="setting-desc" style={{ color: 'var(--text-secondary)' }}>Exit POS &amp; return to dashboard</div>
                </div>
              </div>
              <I.ChevRight s={18} color="var(--brand-primary)" />
            </div>
          )}

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

          {/* About */}
          <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'center', gap: 4, opacity: 0.5, paddingTop: 16, borderBottom: 'none', marginTop: 'auto' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{APP_NAME} {APP_VERSION}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Business OS, POS &amp; Billing System</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────── VARIANT MODAL ───────────────
function VariantModal({ product, currency, onConfirm, onClose }) {
  useBackButton(onClose)
  // selections[groupId] = optionId
  const [selections, setSelections] = useState({})

  const allRequired = (product.variants || []).filter(g => g.required).every(g => selections[g.id])

  let base = product.price
  const priceGroups = (product.variants || []).filter(g => g.type === 'price')

  if (priceGroups.length > 0) {
    const matrixKey = priceGroups.map(g => selections[g.id] || '').join('|')
    if (product.variantsMatrix && product.variantsMatrix[matrixKey] !== undefined) {
      base = product.variantsMatrix[matrixKey]
    } else if (priceGroups.length === 1) {
      // fallback for old data or incomplete selection
      const sel = priceGroups[0].options.find(o => o.id === selections[priceGroups[0].id])
      if (sel) base = sel.price !== undefined ? sel.price : (sel.priceAdj || 0)
    }
  }

  const resolvedPrice = (product.variants || []).reduce((sum, g) => {
    if (g.type === 'price') return sum // already handled as base via matrix
    const sel = g.options.find(o => o.id === selections[g.id])
    if (!sel) return sum
    const val = sel.price !== undefined ? sel.price : (sel.priceAdj || 0)
    return sum + val
  }, base)

  const variantKey = (product.variants || []).map(g => selections[g.id] || '').join('|')
  const variantLabel = (product.variants || []).map(g => {
    const sel = g.options.find(o => o.id === selections[g.id])
    return sel ? sel.label : ''
  }).filter(Boolean).join(' · ')

  const handleAdd = () => {
    if (!allRequired) return
    onConfirm({
      ...product,
      unitPrice: resolvedPrice,
      price: resolvedPrice,
      variantKey,
      variantLabel,
    })
  }

  return (
    <div className="var-overlay" onClick={onClose}>
      <div className="var-sheet" onClick={e => e.stopPropagation()}>
        <div className="var-handle" />
        <div className="var-header">
          <div className="var-emoji">{product.emoji}</div>
          <div className="var-info">
            <div className="var-name">{product.name}</div>
            <div className="var-base-price">from {fmt(product.price, currency)}</div>
          </div>
          <button className="var-close" onClick={onClose}><I.X /></button>
        </div>

        <div className="var-body">
          {(product.variants || []).map(g => (
            <div key={g.id} className="var-group">
              <div className="var-group-label">
                {g.name}
                {g.required && <span className="var-req-badge">Required</span>}
              </div>
              <div className="var-opts">
                {g.options.map(o => {
                  let val = o.price !== undefined ? o.price : (o.priceAdj || 0)
                  let showPrice = false

                  if (g.type === 'price') {
                    if (priceGroups.length === 1) {
                      // If there's only 1 price group, we can show its explicit price
                      if (product.variantsMatrix && product.variantsMatrix[o.id] !== undefined) {
                        val = product.variantsMatrix[o.id]
                      }
                      showPrice = true
                    }
                    // If > 1 price group, we don't show individual prices because it's a matrix combination
                  }

                  return (
                    <button
                      key={o.id}
                      className={`var-opt ${selections[g.id] === o.id ? 'selected' : ''}`}
                      onClick={() => setSelections(s => ({ ...s, [g.id]: o.id }))}
                    >
                      <span className="var-opt-label">{o.label}</span>
                      {g.type === 'price' ? (
                        showPrice && <span className="var-opt-adj">{fmt(val, currency)}</span>
                      ) : (
                        val !== 0 && (
                          <span className="var-opt-adj">{val > 0 ? `+${fmt(val, currency)}` : `-${fmt(Math.abs(val), currency)}`}</span>
                        )
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="var-footer">
          <div className="var-total">
            <span className="var-total-label">Total</span>
            <span className="var-total-price">{fmt(resolvedPrice, currency)}</span>
          </div>
          <button className="var-add-btn" onClick={handleAdd} disabled={!allRequired}>
            Add to Cart
            {!allRequired && <span className="var-add-hint"> — select all required options</span>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────── PRODUCT CARD ───────────────
function ProductCard({ product, qty, onAdd, onDecrease, cols, currency }) {
  const inCart = qty > 0
  const hasVariants = product.variants && product.variants.length > 0

  const handleAdd = () => onAdd(product)

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
              {qty === 1 ? <I.Trash /> : <I.Minus />}
            </button>
            <span className="card-ov-qty">{qty}</span>
            <button
              className="card-ov-btn plus"
              style={{ pointerEvents: 'auto' }}
              onClick={(e) => { e.stopPropagation(); onAdd(product); }}
              aria-label="Add one more"
            >
              <I.Plus />
            </button>
          </div>
        )}
      </div>

      {/* ── INFO ── */}
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <div className="product-price">
          {hasVariants ? `from ${fmt(product.price, currency)}` : fmt(product.price, currency)}
        </div>
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
        {item.variantLabel && <div className="cart-item-variant">{item.variantLabel}</div>}
        <div className="cart-item-price">{fmt(item.price * item.qty, currency)}</div>
      </div>
      <div className="cart-item-controls">
        <button className="qty-btn" onClick={() => onDecrease(item.variantKey ? `${item.id}|${item.variantKey}` : item.id)} aria-label="Decrease">
          {item.qty === 1 ? <I.Trash /> : <I.Minus />}
        </button>
        <span className="qty-value">{item.qty}</span>
        <button className="qty-btn" onClick={() => onIncrease(item.variantKey ? `${item.id}|${item.variantKey}` : item.id)} aria-label="Increase">
          <I.Plus />
        </button>
      </div>
    </div>
  )
}

// ─────────────── MAIN POS ───────────────
export default function POS({ onExit, currency, taxRateObj, editingRecord, onClearEditing }) {
  useBackButton(onExit)
  const [cols, setCols] = useState(() => localStorage.getItem('mn-cols') || 'auto')
  const [products, setProducts] = useState(DEFAULT_PRODUCTS)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [business, setBusiness] = useState(DEFAULT_BUSINESS)



  const [activeCategory, setActiveCat] = useState('All')
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [variantProduct, setVariantProduct] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const handleCartClose = useCallback(() => setCartOpen(false), [])
  useBackButton(cartOpen ? handleCartClose : null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [ordersOpen, setOrdersOpen] = useState(false)
  const [successOrder, setSuccessOrder] = useState(null)
  const [watchdogMins, setWatchdogMins] = useState(() => { try { return parseInt(localStorage.getItem('mn-watchdog')) || 5 } catch { return 5 } })
  // Discount / Delivery / Payment
  const [discountType, setDiscountType] = useState('none')   // 'none' | 'flat' | 'percent'
  const [discountVal, setDiscountVal] = useState(0)
  const [deliveryCharge, setDeliveryCharge] = useState(0)
  const [paymentMode, setPaymentMode] = useState('cash')  // 'cash' | 'upi' | 'udhaar' | 'card' | 'other'
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customersList, setCustomersList] = useState([])
  const [customerFocus, setCustomerFocus] = useState(false)
  const [cartStep, setCartStep] = useState('cart')   // 'cart' | 'payment'

  useEffect(() => {
    getCustomers().then(c => setCustomersList(c || []))
  }, [])
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const [cashNotes, setCashNotes] = useState({ 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 })
  const [splitCash, setSplitCash] = useState(0)
  const [chipPage, setChipPage] = useState(0)
  const touchStartX = useRef(null)
  const totalCashReceived = Object.entries(cashNotes).reduce((sum, [amt, count]) => sum + (Number(amt) * count), 0)
  const searchRef = useRef(null)

  // WA Share
  const [isSharingWA, setIsSharingWA] = useState(false)
  const [showWAShare, setShowWAShare] = useState(false)
  const waDocRef = useRef(null)

  // ── Orders — start with INIT_ORDER; ids get assigned proper monthly nums async ──
  const [orders, setOrders] = useState([INIT_ORDER])
  const [currentOrderId, setCurrentOrderId] = useState(INIT_ORDER.id)

  const currentOrder = orders.find(o => o.id === currentOrderId)
  const cart = currentOrder?.items ?? []

  const hasLoaded = useRef(false)

  // Load products/categories/business from IDB on mount
  // Also load any persisted active orders and fix the INIT_ORDER id
  useEffect(() => {
    async function load() {
      const [p, c, b, activeOrders, monthOrders] = await Promise.all([
        dbGet(KEY_PRODUCTS),
        dbGet(KEY_CATEGORIES),
        dbGet(KEY_BUSINESS),
        dbGet('mn-active-orders'),
        getOrdersByMonth(getMonthKey()),
      ])
      if (p && p.length > 0) setProducts(p)
      if (c && c.length > 0) setCategories(c)
      if (b) setBusiness({ ...DEFAULT_BUSINESS, ...b })

      // Restore persisted active orders (survive refresh)
      let loadedOrders = (activeOrders && activeOrders.length > 0)
        ? activeOrders.map(o => ({ ...o, createdAt: new Date(o.createdAt) }))
        : [INIT_ORDER]

      // Replace any temporary 'T' IDs with proper sequential IDs
      const mk = getMonthKey()
      let nextNum = await getNextOrderNum(mk)
      let newCurrentId = loadedOrders[0]?.id || INIT_ORDER.id

      loadedOrders = loadedOrders.map(o => {
        if (o.id.startsWith('T')) {
          const properid = `${nextNum++}-${makeDateSuffix()}`
          if (o.id === newCurrentId) newCurrentId = properid
          return { ...o, id: properid }
        }
        return o
      })

      // Also restore completed orders for TODAY so the Order Console shows them
      const todayStr = new Date().toDateString()
      let todayCompleted = (monthOrders || [])
        .filter(o => new Date(o.completedAt).toDateString() === todayStr)
        .sort((a, b) => a.completedAt - b.completedAt) // sort chronologically
        .map(o => ({
          ...o,
          id: o.orderId, // map DB schema back to POS schema
          createdAt: new Date(o.createdAt),
          status: 'completed'
        }))

      if (editingRecord) {
        const existing = loadedOrders.find(o => o.id === editingRecord.orderId)
        if (!existing) {
          const orderToEdit = {
            id: editingRecord.orderId,
            items: editingRecord.items || [],
            createdAt: new Date(editingRecord.createdAt || Date.now()),
            originalCompletedAt: editingRecord.completedAt,
            originalPaymentMode: editingRecord.paymentMode,
            status: 'active',
            alarmed: false
          }
          loadedOrders.push(orderToEdit)
        }
        newCurrentId = editingRecord.orderId

        // Remove from todayCompleted so it's not duplicated
        todayCompleted = todayCompleted.filter(o => o.id !== editingRecord.orderId)

        // removed orderDate setting
        if (editingRecord.customerDetails) {
          setCustomerName(editingRecord.customerDetails.name || '')
          setCustomerPhone(editingRecord.customerDetails.phone || '')
        } else if (editingRecord.paymentMode === 'udhaar') {
          getUdhaarByOrderId(editingRecord.orderId).then(info => {
            if (info && info.customerId) {
              getCustomerById(info.customerId).then(cust => {
                if (cust) {
                  setCustomerName(cust.name || '')
                  setCustomerPhone(cust.phone || '')
                }
              })
            }
          })
        }
        setDiscountType(editingRecord.discountAmt > 0 ? 'flat' : 'none')
        setDiscountVal(editingRecord.discountAmt || 0)
        setDeliveryCharge(editingRecord.deliveryCharge || 0)
        setPaymentMode(editingRecord.paymentMode || 'cash')
        if (editingRecord.paymentDetails?.cash) {
          setSplitCash(editingRecord.paymentDetails.cash)
        }
        if (onClearEditing) onClearEditing()
      }

      setOrders([...loadedOrders, ...todayCompleted])
      setCurrentOrderId(newCurrentId)
      hasLoaded.current = true
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])



  // Persist settings
  useEffect(() => { localStorage.setItem('mn-cols', cols) }, [cols])
  useEffect(() => { if (searchOpen) setTimeout(() => searchRef.current?.focus(), 80) }, [searchOpen])
  useEffect(() => {
    if (!cartOpen) {
      setCartStep('cart')
      setSummaryExpanded(false)
    }
  }, [cartOpen])

  const toggleTheme = () => { }

  const [toast, setToast] = useState(null)
  const toastTimeout = useRef(null)

  const showToast = (msg, type = 'success', persistent = false) => {
    setToast({ msg, type, persistent })
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    if (!persistent) {
      toastTimeout.current = setTimeout(() => setToast(null), 2800)
    }
  }

  const closeToast = () => {
    setToast(null)
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
  }

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
              showToast(`⚠️ Warning: Order #${o.id} is overdue!`, 'error', true)
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

  const createNewOrder = async () => {
    const current = orders.find(o => o.id === currentOrderId)
    if (current && current.items.length === 0) {
      showToast('Current order is empty. Cannot create new.')
      return
    }
    // Get proper monthly sequential ID
    const mk = getMonthKey()
    const num = await getNextOrderNum(mk)
    const properid = `${num}-${makeDateSuffix()}`
    const newOrder = makeOrder(properid)
    setOrders(prev => [...prev, newOrder])
    setCurrentOrderId(newOrder.id)
    showToast(`New order ${newOrder.id} started`)
  }

  const switchOrder = (id) => {
    setCurrentOrderId(id)
    showToast(`Switched to #${id}`)
  }

  // ── Cart mutations ──
  const addToCart = (product) => {
    // If product has variants, open selection modal instead
    if (product.variants && product.variants.length > 0 && !product.variantKey) {
      setVariantProduct(product)
      return
    }
    playSound('add')
    const cartKey = product.variantKey ? `${product.id}|${product.variantKey}` : product.id
    setCartItems(prev => {
      const ex = prev.find(i => (i.variantKey ? `${i.id}|${i.variantKey}` : i.id) === cartKey)
      if (ex) return prev.map(i => (i.variantKey ? `${i.id}|${i.variantKey}` : i.id) === cartKey ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const increaseQty = (cartKey) => {
    playSound('add')
    setCartItems(prev => prev.map(i => (i.variantKey ? `${i.id}|${i.variantKey}` : i.id) === cartKey ? { ...i, qty: i.qty + 1 } : i))
  }

  const decreaseQty = (cartKey) => {
    playSound('remove')
    setCartItems(prev => {
      let matchKey = cartKey
      let item = prev.find(i => (i.variantKey ? `${i.id}|${i.variantKey}` : i.id) === cartKey)
      
      if (!item) {
        // Fallback: if raw product ID is passed from the grid but item has variants in cart
        const variants = prev.filter(i => i.id === cartKey)
        if (variants.length > 0) {
          item = variants[variants.length - 1]
          matchKey = `${item.id}|${item.variantKey}`
        } else {
          return prev
        }
      }

      if (item.qty === 1) return prev.filter(i => (i.variantKey ? `${i.id}|${i.variantKey}` : i.id) !== matchKey)
      return prev.map(i => (i.variantKey ? `${i.id}|${i.variantKey}` : i.id) === matchKey ? { ...i, qty: i.qty - 1 } : i)
    })
  }
  const clearCart = () => { setCartItems([]); setCartStep('cart') }

  // ── Totals ──
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const tax = subtotal * taxRateObj.value
  const discountAmt = discountType === 'flat'
    ? Math.min(discountVal, subtotal)
    : subtotal * (discountVal / 100)
  const delivery = deliveryCharge
  const total = Math.max(0, subtotal + tax - discountAmt + delivery)
  const totalItems = cart.reduce((s, i) => s + i.qty, 0)

  // ── Persist active orders to IDB so they survive refresh ──
  useEffect(() => {
    if (!hasLoaded.current) return
    const activeOrders = orders.filter(o => o.status === 'active')
    // Serialize Dates to timestamps for storage
    const serialized = activeOrders.map(o => ({ ...o, createdAt: o.createdAt instanceof Date ? o.createdAt.getTime() : o.createdAt }))
    dbSet('mn-active-orders', serialized)
  }, [orders])

  // ── Checkout ──
  const handleCheckoutOrder = async (orderId) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return
    if (order.items.length === 0) {
      showToast('Cannot complete an empty order.', 'error')
      return
    }
    if (paymentMode === 'udhaar' && !customerPhone.trim()) {
      showToast('Please enter customer phone number for Udhaar', 'error')
      return
    }

    // eslint-disable-next-line react-hooks/purity
    const completedAt = order.originalCompletedAt || Date.now()
    const enrichedOrder = {
      ...order,
      subtotal,
      discountType,
      discountAmt,
      deliveryCharge: delivery,
      paymentMode,
      paymentDetails: paymentMode === 'split' ? { cash: splitCash, upi: Math.max(0, total - splitCash) } : null,
      total,
      completedAt,
      taxLabel: taxRateObj.label,
      taxAmt: subtotal * taxRateObj.value,
    }

    // Save to permanent order records
    await saveOrderRecord(enrichedOrder)


    // Process customer if provided
    let customerIdToLink = null;
    let customerNameToLink = null;
    let customerPhoneToLink = null;

    if (customerName.trim() || customerPhone.trim()) {
      const allCustomers = await getCustomers() || []
      let customer = customerPhone.trim() ? allCustomers.find(c => c.phone === customerPhone.trim()) : null
      if (!customer && customerName.trim()) {
        customer = allCustomers.find(c => c.name.toLowerCase() === customerName.trim().toLowerCase())
      }

      if (!customer) {
        customer = {
          customerId: 'cust-' + Date.now(),
          name: customerName.trim() || 'Customer ' + customerPhone.trim().slice(-4),
          phone: customerPhone.trim(),
          udhaarBalance: 0,
          createdAt: new Date().toISOString()
        }
        await saveCustomer(customer)
      } else if (customerPhone.trim() && !customer.phone) {
        customer.phone = customerPhone.trim()
        await saveCustomer(customer)
      }

      customerIdToLink = customer.customerId;
      customerNameToLink = customer.name;
      customerPhoneToLink = customer.phone;
    }

    if (paymentMode === 'udhaar' && !customerIdToLink) {
      showToast('Please enter customer details for Udhaar', 'error')
      setProcessing(false)
      return
    }

    const completedAtTimestamp = order.originalCompletedAt || Date.now();

    let existingUdhaar = null
    if (order.originalPaymentMode === 'udhaar') {
      existingUdhaar = await getUdhaarByOrderId(order.id)
    }

    if (paymentMode === 'udhaar') {
      const itemsStr = enrichedOrder.items.map(i => `${i.qty}x ${i.name} @ ${i.price}`).join(', ')
      const udhaarEntry = existingUdhaar ? {
        ...existingUdhaar,
        customerId: customerIdToLink,
        amount: enrichedOrder.total,
        reason: itemsStr
      } : {
        udhaarId: 'udh-' + Date.now(),
        customerId: customerIdToLink,
        amount: enrichedOrder.total,
        date: new Date().toISOString(),
        reason: itemsStr,
        isCleared: false,
        clearedAt: null,
        clearedAmount: 0,
        createdAt: new Date().toISOString(),
        orderId: enrichedOrder.id,
        paymentHistory: []
      }
      await saveUdhaarEntry(udhaarEntry)
      await recalcUdhaarBalance(customerIdToLink)

      if (existingUdhaar && existingUdhaar.customerId && existingUdhaar.customerId !== customerIdToLink) {
        await recalcUdhaarBalance(existingUdhaar.customerId)
      }
    } else {
      if (existingUdhaar) {
        await deleteUdhaarEntry(existingUdhaar.udhaarId)
        if (existingUdhaar.customerId) {
          await recalcUdhaarBalance(existingUdhaar.customerId)
        }
      }
    }

    playSound('checkout')
    setSuccessOrder(enrichedOrder)

    let newCurrentId = currentOrderId
    let newOrders = orders.map(o => o.id === orderId ? { ...enrichedOrder, status: 'completed' } : o)

    if (orderId === currentOrderId) {
      const remainingActive = newOrders.filter(o => o.status === 'active')
      if (remainingActive.length > 0) {
        remainingActive.sort((a, b) => {
          const at = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt
          const bt = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt
          return at - bt
        })
        newCurrentId = remainingActive[0].id
      } else {
        // Create next order with proper monthly ID
        const mk = getMonthKey()
        const num = await getNextOrderNum(mk)
        const properid = `${num}-${makeDateSuffix()}`
        const newOrder = makeOrder(properid)
        newOrders.push(newOrder)
        newCurrentId = newOrder.id
      }
      setCartOpen(false)
      setCartStep('cart')
      setSummaryExpanded(false)
      setDiscountType('none'); setDiscountVal(0); setDeliveryCharge(0); setPaymentMode('cash'); setCashNotes({ 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 }); setCustomerName(''); setCustomerPhone('')
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

  // ── WhatsApp Share ──
  const handleShareWA = async () => {
    if (!customerPhone.trim()) {
      showToast('Please enter customer phone number', 'error')
      return
    }
    if (!waDocRef.current) return
    
    setIsSharingWA(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(waDocRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      })
      canvas.toBlob(async (blob) => {
        try {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `invoice-${currentOrderId.replace('/', '-')}.png`
          a.click()
          URL.revokeObjectURL(url)
          
          const cleanPhone = customerPhone.replace(/\s/g, '')
          const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Here is your bill/invoice for Order ${currentOrderId} from ${business.name || APP_NAME}. I have downloaded the image for you to attach.`)}`
          window.open(waUrl, '_blank')
          showToast('Downloaded image. Please attach it in WhatsApp.', 'info', true)
        } catch (e) {
          console.error(e)
          if (e.name !== 'AbortError') showToast('Sharing failed or was cancelled.', 'error')
        } finally {
          setIsSharingWA(false)
        }
      }, 'image/png')
    } catch (e) {
      console.error(e)
      showToast('Failed to generate invoice image', 'error')
      setIsSharingWA(false)
    }
  }

  // ── Filter ──
  const filtered = useMemo(() => products.filter(p =>
    (activeCategory === 'All' || p.category === activeCategory) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  ), [activeCategory, search, products])

  // For variant products: sum qty across ALL variant combos of that product
  const getQty = (id) => cart.filter(i => i.id === id).reduce((s, i) => s + i.qty, 0)
  const closeSearch = () => { setSearch(''); setSearchOpen(false) }
  const activeOrders = orders.filter(o => o.status === 'active')

  const filteredCusts = useMemo(() => {
    if (!customerFocus) return []
    const n = customerName.trim().toLowerCase()
    const p = customerPhone.trim()
    if (!n && !p) return customersList.slice(0, 5)

    return customersList.filter(c => {
      const matchName = n ? (c.name || '').toLowerCase().includes(n) : true;
      const matchPhone = p ? (c.phone || '').includes(p) : true;
      return matchName && matchPhone;
    }).slice(0, 5)
  }, [customerName, customerPhone, customersList, customerFocus])

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.startsWith('91') && val.length > 10) val = val.substring(2)
    val = val.replace(/^0+/, '')
    setCustomerPhone(val.slice(0, 10))
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`} role="alert">
          {toast.type === 'success' ? <I.Check s={15} /> : <I.Clock s={15} />}
          {toast.msg}
          {toast.persistent && (
            <button className="toast-close-btn" onClick={closeToast} aria-label="Close alert"><I.X s={14} /></button>
          )}
        </div>
      )}

      {/* Mobile cart overlay */}
      <div className={`cart-overlay ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)} aria-hidden="true" />

      {/* Drawers & Modals */}
      {successOrder && <SuccessModal order={successOrder} onClose={() => setSuccessOrder(null)} currency={currency} taxRateObj={taxRateObj} />}
      {menuOpen && <SettingsDrawer cols={cols} onCols={setCols} onExit={onExit} onClose={() => setMenuOpen(false)} />}
      {ordersOpen && <OrderConsole orders={orders} currentOrderId={currentOrderId} onSwitch={switchOrder} onSuccess={handleCheckoutOrder} onNew={() => { createNewOrder(); setOrdersOpen(false) }} onClose={() => setOrdersOpen(false)} currency={currency} taxRateObj={taxRateObj} watchdogMins={watchdogMins} onWatchdogMins={(v) => { setWatchdogMins(v); localStorage.setItem('mn-watchdog', v); }} />}
      {variantProduct && (
        <VariantModal
          product={variantProduct}
          currency={currency}
          onClose={() => setVariantProduct(null)}
          onConfirm={(resolved) => {
            setVariantProduct(null)
            addToCart(resolved)
          }}
        />
      )}

      {/* Search overlay */}
      <div className={`search-overlay ${searchOpen ? 'open' : ''}`} role="search">
        <input ref={searchRef} id="product-search" type="search" className="search-input" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Escape' && closeSearch()} aria-label="Search products" />
        <button className="search-close-btn" onClick={closeSearch} aria-label="Close search"><I.X s={17} /></button>
      </div>

      {/* ── APP SHELL ── */}
      <div className="app-shell">

        {/* ── HEADER ── */}
        <header className="app-header">
          <div className="header-brand" onClick={onExit} style={{ cursor: onExit ? 'pointer' : 'default' }}>
            <div className="header-brand-icon"><I.Logo /></div>
            <span className="header-brand-name">ManSula <span>BOS</span></span>
          </div>

          {/* Current order ID pill (opens console on click) */}
          <button className="order-id-pill" onClick={() => setOrdersOpen(true)} id="current-order-pill">
            <I.Orders s={13} /> {formatOrderId(currentOrderId)}
            {activeOrders.length > 1 && <span className="order-id-count">{activeOrders.length}</span>}
          </button>

          {/* Right: quick new order + hamburger (opens settings) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button id="new-order-header-btn" className="icon-btn new-order-quick" onClick={createNewOrder} aria-label="New order" title="New order">
              <I.Plus s={17} />
            </button>
            <button id="menu-btn" className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Open settings">
              <I.Menu s={19} />
            </button>
          </div>
        </header>

        {/* ── BODY ── */}
        <div className="app-body">

          {/* ── PRODUCTS ── */}
          <main className="pos-panel">
            <div className="pos-toolbar">
              <div className="category-scroll">
                {['All', ...categories].map(cat => (
                  <button key={cat} id={`cat-${cat.toLowerCase()}`} className={`chip ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCat(cat)} aria-pressed={activeCategory === cat}>
                    {cat}
                  </button>
                ))}
              </div>
              <button id="search-toggle-btn" className={`icon-btn ${searchOpen ? 'active' : ''}`} onClick={() => setSearchOpen(o => { if (o) setSearch(''); return !o })} aria-label={searchOpen ? 'Close search' : 'Search'}>
                {searchOpen ? <I.X s={16} /> : <I.Search s={16} />}
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
                    <ProductCard key={p.id} product={p} qty={getQty(p.id)} onAdd={addToCart} onDecrease={decreaseQty} cols={cols} currency={currency} />
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* ── CART ── */}
          <div className={`cart-overlay ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)} aria-hidden="true" />
          <aside className={`cart-panel ${cartOpen ? 'open' : ''}`} aria-label="Current order">
            <div
              onTouchStart={e => { window._cartTouchY = e.touches[0].clientY }}
              onTouchEnd={e => {
                if (window._cartTouchY == null) return;
                const dy = e.changedTouches[0].clientY - window._cartTouchY;
                if (dy > 40) setCartOpen(false);
                window._cartTouchY = null;
              }}
            >
              <div className="drawer-handle" onClick={() => setCartOpen(false)} style={{ display: window.innerWidth <= 768 ? 'block' : 'none', cursor: 'pointer', marginBottom: '8px' }} />
              {cartStep === 'cart' && (
                <div className="cart-header">
                  <div className="cart-title">
                    <I.Cart s={17} /> {formatOrderId(currentOrderId)}
                    {totalItems > 0 && <span className="cart-count-badge">{totalItems}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {cart.length > 0 && <button id="clear-cart-btn" className="cart-clear-btn" onClick={clearCart}>Clear</button>}
                    <button className="mobile-close-btn" onClick={() => setCartOpen(false)} aria-label="Close">
                      <I.X s={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>


            {cart.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-icon">🛒</div>
                <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No items yet</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Tap a product to add</p>
              </div>
            ) : (
              <>
                {cartStep === 'cart' ? (
                  <>
                    <div className="cart-items" role="list">
                      {cart.map(item => <CartItem key={item.variantKey ? `${item.id}-${item.variantKey}` : item.id} item={item} onIncrease={increaseQty} onDecrease={decreaseQty} currency={currency} />)}
                    </div>
                    <div className="cart-footer">
                      {/* Subtotal / Tax */}
                      <div className="cart-totals">
                        <div className="cart-total-row"><span className="label">Subtotal</span><span className="value">{fmt(subtotal, currency)}</span></div>
                        <div className="cart-total-row"><span className="label">{taxRateObj.label}</span><span className="value">{fmt(tax, currency)}</span></div>
                      </div>

                      {/* Extras card */}
                      <div className="cart-extras-card">
                        <div className="cart-extra-row">
                          <div className="cart-extra-label">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--brand-danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                            <span>Discount</span>
                          </div>
                          <div className="cart-extra-controls">
                            <div className="discount-type-toggle">
                              <button className={`disc-toggle-btn ${discountType === 'none' ? 'active' : ''}`} onClick={() => { setDiscountType('none'); setDiscountVal(0) }}>Off</button>
                              <button className={`disc-toggle-btn ${discountType === 'flat' ? 'active' : ''}`} onClick={() => setDiscountType('flat')}>{currency.symbol}</button>
                              <button className={`disc-toggle-btn ${discountType === 'percent' ? 'active' : ''}`} onClick={() => setDiscountType('percent')}>%</button>
                            </div>
                            {discountType !== 'none' && (
                              <div className="cart-extra-input-wrap">
                                <span className="cart-extra-unit">{discountType === 'flat' ? currency.symbol : '%'}</span>
                                <input className="cart-extra-input" type="number" min="0"
                                  max={discountType === 'percent' ? 100 : undefined}
                                  value={discountVal || ''} placeholder="0"
                                  onChange={e => setDiscountVal(Math.max(0, parseFloat(e.target.value) || 0))} />
                              </div>
                            )}
                            {discountAmt > 0 && <span className="cart-extra-badge danger">-{fmt(discountAmt, currency)}</span>}
                          </div>
                        </div>
                        <div className="cart-extra-row">
                          <div className="cart-extra-label">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 5v3h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                            <span>Delivery</span>
                          </div>
                          <div className="cart-extra-controls">
                            <div className="cart-extra-input-wrap">
                              <span className="cart-extra-unit">{currency.symbol}</span>
                              <input className="cart-extra-input" type="number" min="0"
                                value={deliveryCharge || ''} placeholder="0"
                                onChange={e => setDeliveryCharge(Math.max(0, parseFloat(e.target.value) || 0))} />
                            </div>
                            {deliveryCharge > 0 && <span className="cart-extra-badge accent">+{fmt(deliveryCharge, currency)}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Grand Total */}
                      <div className="cart-grand-total-row">
                        <span>Total</span>
                        <span className="cart-grand-total-val">{fmt(total, currency)}</span>
                      </div>

                      {/* Continue button */}
                      <button className="checkout-btn" onClick={() => setCartStep('payment')} disabled={cart.length === 0}>
                        Continue to Payment →
                      </button>
                    </div>
                  </>
                ) : (
                  /* ── STEP 2: Payment Screen ── */
                  <div className="payment-screen">

                    {/* Header */}
                    <div className="payment-screen-header">
                      <button className="payment-back-btn" onClick={() => setCartStep('cart')}>
                        <I.Back s={15} /> Back
                      </button>
                      <div className="payment-screen-title">Payment</div>
                      <div style={{ width: 60, display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="mobile-close-btn" onClick={() => setCartOpen(false)} aria-label="Close">
                          <I.X s={20} />
                        </button>
                      </div>
                    </div>

                    {/* Scrollable body */}
                    <div className="payment-screen-body">



                      {/* UPI QR — shown when UPI selected */}
                      {paymentMode === 'upi' && (
                        <div className="upi-qr-section">
                          <div className="upi-qr-label">Scan &amp; Pay</div>
                          {business.upiId ? (
                            <>
                              {!showWAShare && (
                                <>
                                  <div className="upi-qr-wrap">
                                      <QRCodeSVG
                                        value={`upi://pay?pa=${business.upiId}&pn=${encodeURIComponent(business.name || APP_NAME)}&am=${total}&cu=INR&tn=${encodeURIComponent(`#${currentOrderId} | by ${APP_NAME}`)}`}
                                        size={180}
                                        fgColor="#3730a3"
                                        bgColor="#ffffff"
                                        level="M"
                                        marginSize={1}
                                        className="upi-qr-img"
                                      />
                                    {/* UPI logo overlay */}
                                    <div className="upi-qr-logo">
                                      <img src="/logo.png" alt="Logo" width="24" height="24" style={{ objectFit: 'contain' }} />
                                    </div>
                                  </div>
                                  <div className="upi-qr-meta">
                                    <span className="upi-qr-id">{business.upiId}</span>
                                    <span className="upi-qr-amount">Total: {fmt(total, currency)}</span>
                                  </div>
                                </>
                              )}
                              
                              {/* Share via WhatsApp toggle / section */}
                              {!showWAShare ? (
                                <div style={{ marginTop: 24, padding: '0 16px' }}>
                                  <button 
                                    onClick={() => setShowWAShare(true)}
                                    className="bp-btn-primary"
                                    style={{ width: '100%' }}
                                  >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                                    Share Bill via WhatsApp
                                  </button>
                                </div>
                              ) : (
                                <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-surface-2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div style={{ background: 'var(--brand-primary)', color: '#fff', borderRadius: '50%', padding: '6px', display: 'flex' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                                      </div>
                                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Share Bill</div>
                                    </div>
                                    <button onClick={() => setShowWAShare(false)} className="bp-btn-ghost" style={{ padding: '6px 10px', fontSize: '0.8rem', height: 'auto' }}>
                                      Cancel
                                    </button>
                                  </div>
                                  
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1.5px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                                      <span style={{ padding: '0 0 0 14px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>+91</span>
                                      <input
                                        type="tel"
                                        placeholder="Customer Phone"
                                        value={customerPhone}
                                        onChange={handlePhoneChange}
                                        className="bp-input"
                                        style={{ border: 'none', borderRadius: 0, paddingLeft: 8, background: 'transparent' }}
                                      />
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="Customer Name (Optional)"
                                      value={customerName}
                                      onChange={e => setCustomerName(e.target.value)}
                                      className="bp-input"
                                    />
                                    <button 
                                      onClick={handleShareWA} 
                                      disabled={isSharingWA}
                                      className="bp-btn-primary"
                                      style={{ width: '100%', marginTop: 4 }}
                                    >
                                      {isSharingWA ? 'Generating...' : 'Send Invoice'}
                                      {!isSharingWA && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>UPI ID not configured in Business Profile</div>
                          )}
                        </div>
                      )}

                      {/* Cash Calculator — shown when Cash selected */}
                      {paymentMode === 'cash' && (
                        <div className="cash-calc-section">
                          <div className="cash-calc-label">Received from customer</div>
                          <div className="cash-calc-chips">
                            {[500, 200, 100, 50, 20, 10].map(amt => (
                              <button key={amt} className={`cash-calc-btn ${cashNotes[amt] > 0 ? 'active' : ''}`} onClick={() => setCashNotes(p => ({ ...p, [amt]: p[amt] + 1 }))}>
                                <span>{fmt(amt, currency).replace(/\s/g, '')}</span>
                                {cashNotes[amt] > 0 && <span className="cash-count">{cashNotes[amt]}</span>}
                              </button>
                            ))}
                            <button className="cash-calc-btn clear" onClick={() => setCashNotes({ 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 })}>Clear</button>
                          </div>

                          <div className="cash-calc-result">
                            <div className="cash-received">Total Received: <span className="val">{fmt(totalCashReceived, currency)}</span></div>
                            {totalCashReceived >= total && (
                              <div className="cash-return">Return Change: <span className="val">{fmt(totalCashReceived - total, currency)}</span></div>
                            )}
                            {totalCashReceived > 0 && totalCashReceived < total && (
                              <div className="cash-short">Short by: <span className="val">{fmt(total - totalCashReceived, currency)}</span></div>
                            )}
                          </div>
                        </div>
                      )}

                      {paymentMode === 'udhaar' && (
                        <div className="cash-calc-section" style={{ padding: '16px', background: 'linear-gradient(145deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.05) 100%)', border: '1px solid rgba(99,102,241,0.1)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '8px', padding: '6px' }}>
                              <I.Users s={16} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Customer Details</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Link customer for Udhaar or loyalty</div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden', transition: 'border-color 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                              <span style={{ padding: '12px 0 12px 16px', color: '#6366f1', fontSize: '0.95rem', fontWeight: 600 }}>+91</span>
                              <input
                                type="tel"
                                placeholder="Phone Number (Required for Udhaar)"
                                value={customerPhone}
                                onChange={handlePhoneChange}
                                onFocus={() => setCustomerFocus(true)}
                                onBlur={() => setTimeout(() => setCustomerFocus(false), 200)}
                                style={{ padding: '12px 16px 12px 8px', background: 'transparent', border: 'none', fontSize: '0.95rem', width: '100%', color: 'var(--text-primary)', outline: 'none' }}
                              />
                              {customerPhone.length >= 10 && <div style={{ paddingRight: 16, color: '#10b981' }}><I.Check s={16} /></div>}
                            </div>

                            <input
                              type="text"
                              placeholder="Customer Name"
                              value={customerName}
                              onChange={e => setCustomerName(e.target.value)}
                              onFocus={() => setCustomerFocus(true)}
                              onBlur={() => setTimeout(() => setCustomerFocus(false), 200)}
                              style={{ padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '0.95rem', color: 'var(--text-primary)', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}
                            />

                            {customerFocus && filteredCusts.length > 0 && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', marginTop: 8, zIndex: 100, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                                <div style={{ padding: '8px 12px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-surface-1)' }}>SUGGESTED CUSTOMERS</div>
                                {filteredCusts.map(c => (
                                  <div
                                    key={c.customerId}
                                    style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}
                                    onMouseDown={(e) => {
                                      e.preventDefault() // prevent blur
                                      setCustomerName(c.name || '')
                                      setCustomerPhone(c.phone || '')
                                      setCustomerFocus(false)
                                    }}
                                  >
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 600 }}>
                                      {(c.name || 'C')[0].toUpperCase()}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{c.name || 'Unknown'}</div>
                                      {c.phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>+91 {c.phone}</div>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Split Pay — shown when Split selected */}
                      {paymentMode === 'split' && (
                        <div className="cash-calc-section" style={{ padding: '8px 12px' }}>
                          <div className="cash-calc-label" style={{ fontSize: '0.7rem', marginBottom: 2 }}>Cash Received</div>
                          <div className="split-cash-input-wrap">
                            <span className="split-cash-unit">{currency.symbol}</span>
                            <input
                              className="split-cash-input"
                              type="number"
                              min="0"
                              max={total}
                              value={splitCash === 0 ? '' : splitCash}
                              placeholder="0"
                              onChange={e => setSplitCash(Math.min(total, Math.max(0, parseFloat(e.target.value) || 0)))}
                              autoFocus
                            />
                          </div>

                          <div style={{ padding: '0 4px', marginBottom: 6 }}>
                            <input
                              type="range"
                              min="0"
                              max={total}
                              step="10"
                              value={splitCash || 0}
                              onChange={e => setSplitCash(Number(e.target.value))}
                              style={{ width: '100%', accentColor: 'var(--brand-primary)', cursor: 'pointer', height: 12 }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 0, fontWeight: 600 }}>
                              <span>{fmt(0, currency)}</span>
                              <span>{fmt(total, currency)}</span>
                            </div>
                          </div>

                          <div className="cash-calc-chips" style={{ justifyContent: 'center', gap: 4 }}>
                            {[500, 200, 100, 50, 20, 10].map(amt => (
                              <button key={amt} className="cash-calc-btn" onClick={() => setSplitCash(p => Math.min(total, p + amt))} style={{ flex: '0 1 auto', minWidth: '36px', padding: '3px 4px', fontSize: '0.75rem', borderRadius: 4 }}>
                                +{amt}
                              </button>
                            ))}
                            <button className="cash-calc-btn clear" onClick={() => setSplitCash(0)} style={{ flex: '0 1 auto', padding: '3px 4px', fontSize: '0.75rem', borderRadius: 4 }}>Clear</button>
                          </div>

                          {splitCash < total ? (
                            <div className="upi-qr-section" style={{ marginTop: 2, padding: '4px 0 0' }}>
                              <div className="upi-qr-label" style={{ color: 'var(--brand-accent)', fontSize: '0.75rem', marginBottom: 4 }}>Remaining via UPI: {fmt(total - splitCash, currency)}</div>
                              {business.upiId ? (
                                <>
                                  <div className="upi-qr-wrap" style={{ margin: '0 auto', boxShadow: 'none', border: '1px solid var(--border-color)', padding: 4 }}>
                                    <QRCodeSVG
                                      value={`upi://pay?pa=${business.upiId}&pn=${encodeURIComponent(business.name || APP_NAME)}&am=${total - splitCash}&cu=INR&tn=${encodeURIComponent(`#${currentOrderId} | by ${APP_NAME}`)}`}
                                      size={170}
                                      fgColor="#3730a3"
                                      bgColor="#ffffff"
                                      level="M"
                                      marginSize={1}
                                      className="upi-qr-img"
                                    />
                                    <div className="upi-qr-logo">
                                      <img src="/logo.png" alt="Logo" width="24" height="24" style={{ objectFit: 'contain' }} />
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'center', marginTop: 4, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{business.upiId}</div>
                                </>
                              ) : (
                                <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>UPI ID not configured</div>
                              )}
                            </div>
                          ) : (
                            <div className="cash-calc-result" style={{ marginTop: 4 }}>
                              <div className="cash-return">Return Change: <span className="val">{fmt(splitCash - total, currency)}</span></div>
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ flex: 1 }} />{/* spacer to push payment method down */}

                      {/* Order summary card moved to bottom */}
                      <div className="payment-order-summary" onClick={() => setSummaryExpanded(e => !e)} style={{ cursor: 'pointer', alignItems: summaryExpanded ? 'flex-start' : 'center', marginTop: 16 }}>
                        <div className="payment-summary-left">
                          <div className="payment-summary-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Order {formatOrderId(currentOrderId)}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: summaryExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', opacity: 0.8 }}>
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>
                          <div className="payment-summary-items" style={{ maxHeight: summaryExpanded ? '1000px' : '0px', opacity: summaryExpanded ? 1 : 0, overflow: 'hidden', transition: 'all 0.3s ease', marginTop: summaryExpanded ? '8px' : '0px' }}>
                            {cart.map(i => (
                              <span key={i.variantKey ? `${i.id}-${i.variantKey}` : i.id} className="payment-summary-item">{i.qty}× {i.name}</span>
                            ))}
                          </div>
                        </div>
                        <div className="payment-summary-total" style={{ marginTop: summaryExpanded ? '2px' : '0px', transition: 'margin-top 0.3s ease' }}>{fmt(total, currency)}</div>
                      </div>

                    </div>{/* end body */}

                    {/* Sticky footer with Payment Methods and Confirm */}
                    <div className="payment-screen-footer">
                      {/* Payment method label */}
                      <div className="payment-section-label" style={{ marginBottom: 12 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                        Select Payment Method
                      </div>

                      {/* Payment chips — paginated 4-per-page carousel */}
                      {(() => {
                        const allModes = [
                          { id: 'cash', label: 'Cash', svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M5 8v.01M19 8v.01M5 16v.01M19 16v.01" /></svg> },
                          { id: 'upi', label: 'UPI', svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg> },
                          { id: 'split', label: 'Split', svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
                          { id: 'udhaar', label: 'Udhaar', svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
                          { id: 'card', label: 'Card', svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /><path d="M5 15h2M10 15h4" /></svg> },
                          { id: 'other', label: 'Other', svg: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg> },
                        ];
                        const PAGE_SIZE = 4;
                        const totalPages = Math.ceil(allModes.length / PAGE_SIZE);
                        const visibleModes = allModes.slice(chipPage * PAGE_SIZE, chipPage * PAGE_SIZE + PAGE_SIZE);
                        return (
                          <div style={{ marginBottom: 16 }}>
                            <div
                              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}
                              onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
                              onTouchEnd={e => {
                                if (touchStartX.current === null) return;
                                const dx = touchStartX.current - e.changedTouches[0].clientX;
                                if (dx > 40 && chipPage < totalPages - 1) setChipPage(p => p + 1);
                                else if (dx < -40 && chipPage > 0) setChipPage(p => p - 1);
                                touchStartX.current = null;
                              }}
                            >
                              {visibleModes.map(m => (
                                <button key={m.id} className={`payment-chip ${paymentMode === m.id ? 'active' : ''}`}
                                  onClick={() => setPaymentMode(m.id)}>
                                  <span className="payment-chip-icon">{m.svg}</span>
                                  <span className="payment-chip-label">{m.label}</span>
                                </button>
                              ))}
                            </div>
                            {totalPages > 1 && (
                              <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 8 }}>
                                {Array.from({ length: totalPages }).map((_, i) => (
                                  <div key={i} onClick={() => setChipPage(i)} style={{
                                    width: i === chipPage ? 16 : 6, height: 6,
                                    borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s',
                                    background: i === chipPage ? 'var(--brand-primary)' : 'var(--border-color)'
                                  }} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <button id="checkout-btn" className="checkout-btn" onClick={handleCheckout}>
                        <I.Check s={17} />
                        <span>Confirm &amp; Charge {fmt(total, currency)}</span>
                        <span className="checkout-btn-mode">{paymentMode.charAt(0).toUpperCase() + paymentMode.slice(1)}</span>
                      </button>
                    </div>

                  </div>
                )}
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
            rightContent={<><I.Check s={18} style={{ marginRight: 4 }} /> Complete</>}
            onSwipeLeft={() => clearCart()}
            leftContent={<><I.Trash s={18} style={{ marginRight: 4 }} /> Clear</>}
          >
            <button id="mobile-cart-bar" className="mobile-cart-bar" onClick={() => { if (window.innerWidth > 768 && totalItems > 0) handleCheckout(); else setCartOpen(o => !o); }} aria-label={`Cart — ${totalItems} items`} title={window.innerWidth > 768 ? "Click to Checkout" : "Tap to open cart"}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <I.Cart s={20} />
                <span className="mobile-cart-bar-qty">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
              </div>
              <div className="mobile-cart-bar-total">{fmt(total, currency)}</div>
            </button>
          </SwipeableRow>
        </div>
      )}
      {totalItems === 0 && (
        <button id="mobile-cart-fab" className="mobile-cart-fab" onClick={() => setCartOpen(o => !o)} aria-label={`Cart`}>
          <I.Cart s={24} />
        </button>
      )}

      {/* Hidden Bill Document for WhatsApp Share */}
      {paymentMode === 'upi' && (
        <BillDocument
          docRef={waDocRef}
          type="invoice"
          business={business}
          order={{ 
            id: currentOrderId, 
            items: cart.map(i => ({ ...i, unitPrice: i.price })), 
            customer: customerName, 
            customerPhone: customerPhone, 
            gstPercent: taxRateObj.value * 100, 
            deliveryCharge: delivery 
          }}
          math={{ subtotal, discountAmt, gstAmt: tax, grandTotal: total }}
          logo="/logo.png"
          paymentMode="UPI"
          hidden={true}
        />
      )}
    </>
  )
}
