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
const TAX_RATE   = 0.05   // 5% GST
const CURRENCY   = '₹'

let orderCounter = 1
const makeOrderId  = () => `ORD-${String(orderCounter++).padStart(3, '0')}`
const makeOrder    = () => ({ id: makeOrderId(), items: [], createdAt: new Date(), status: 'active' })

// ─────────────── ICONS ───────────────
const I = {
  Search: ({ s = 18 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  X: ({ s = 18 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  ),
  Menu: ({ s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M3 12h18M3 6h18M3 18h18"/>
    </svg>
  ),
  Cart: ({ s = 22 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  Sun: ({ s = 17 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  ),
  Moon: ({ s = 17 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Plus: ({ s = 13 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Minus: ({ s = 13 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M5 12h14"/>
    </svg>
  ),
  Trash: ({ s = 13 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  Check: ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Orders: ({ s = 17 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
    </svg>
  ),
  Grid2: ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/>
    </svg>
  ),
  Grid3: ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="18" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>
    </svg>
  ),
  Logo: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  ),
  ChevRight: ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Clock: ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
}

// ─────────────── HELPERS ───────────────
const fmt  = (n) => `${CURRENCY}${n.toFixed(0)}`
const time = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
const cartTotal = (items) => items.reduce((s, i) => s + i.price * i.qty, 0)

// ─────────────── PRODUCT CARD ───────────────
function ProductCard({ product, qty, onAdd, onDecrease, cols }) {
  const inCart = qty > 0

  const handleCardClick = (e) => {
    if (e.target.closest('.card-overlay-controls')) return
    onAdd(product)
  }

  return (
    <div
      className={`product-card ${inCart ? 'in-cart' : ''} cols-${cols}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onAdd(product)}
      aria-label={`${product.name} — ${fmt(product.price)}${inCart ? `, ${qty} in cart` : ''}`}
    >
      {/* Image area */}
      <div className="product-img-wrap">
        <span className="product-emoji" aria-hidden="true">{product.emoji}</span>

        {product.badge && (
          <span className={`product-badge ${product.badge}`}>
            {product.badge === 'popular' ? 'Popular' : 'New'}
          </span>
        )}

        {/* Overlay qty controls — sits at the bottom of the image */}
        {inCart ? (
          <div className="card-overlay-controls" onClick={e => e.stopPropagation()}>
            <button
              className="card-ov-btn minus"
              onClick={() => onDecrease(product.id)}
              aria-label="Remove one"
            >
              {qty === 1 ? <I.Trash /> : <I.Minus />}
            </button>
            <span className="card-ov-qty">{qty}</span>
            <button
              className="card-ov-btn plus"
              onClick={() => onAdd(product)}
              aria-label="Add one more"
            >
              <I.Plus />
            </button>
          </div>
        ) : (
          <div className="card-overlay-add" onClick={e => { e.stopPropagation(); onAdd(product) }}>
            <I.Plus s={12} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <div className="product-price">{fmt(product.price)}</div>
      </div>
    </div>
  )
}

// ─────────────── CART ITEM ───────────────
function CartItem({ item, onIncrease, onDecrease }) {
  return (
    <div className="cart-item-card" role="listitem">
      <div className="cart-item-emoji">{item.emoji}</div>
      <div className="cart-item-details">
        <div className="cart-item-name" title={item.name}>{item.name}</div>
        <div className="cart-item-price">{fmt(item.price * item.qty)}</div>
      </div>
      <div className="cart-item-controls">
        <button className="qty-btn" onClick={() => onDecrease(item.id)}>
          {item.qty === 1 ? <I.Trash /> : <I.Minus />}
        </button>
        <span className="qty-value">{item.qty}</span>
        <button className="qty-btn" onClick={() => onIncrease(item.id)}>
          <I.Plus />
        </button>
      </div>
    </div>
  )
}

// ─────────────── ORDER CONSOLE ───────────────
function OrderConsole({ orders, currentOrderId, onSwitch, onNew, onClose }) {
  const active = orders.filter(o => o.status === 'active')
  const past   = orders.filter(o => o.status === 'completed')

  return (
    <div className="drawer-overlay open" onClick={onClose} aria-hidden="true">
      <div className="order-console" onClick={e => e.stopPropagation()} role="dialog" aria-label="Order console">
        {/* Header */}
        <div className="console-header">
          <div className="console-title">
            <I.Orders s={18} />
            Order Console
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <I.X s={17} />
          </button>
        </div>

        {/* New order button */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <button className="new-order-btn" onClick={onNew} id="new-order-btn">
            <I.Plus s={15} />
            New Order
          </button>
        </div>

        {/* Active orders */}
        <div className="console-body">
          {active.length > 0 && (
            <>
              <div className="console-section-label">Active Orders</div>
              {active.map(order => {
                const total = cartTotal(order.items) * (1 + TAX_RATE)
                const isCurrent = order.id === currentOrderId
                return (
                  <button
                    key={order.id}
                    className={`order-row ${isCurrent ? 'current' : ''}`}
                    onClick={() => { onSwitch(order.id); onClose() }}
                  >
                    <div className="order-row-left">
                      <div className="order-row-id">#{order.id}</div>
                      <div className="order-row-meta">
                        <I.Clock s={12} />
                        {time(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="order-row-right">
                      <div className="order-row-total">{fmt(total)}</div>
                      {isCurrent && <span className="order-row-badge">Current</span>}
                      <I.ChevRight s={14} />
                    </div>
                  </button>
                )
              })}
            </>
          )}

          {past.length > 0 && (
            <>
              <div className="console-section-label" style={{ marginTop: 16 }}>Completed Orders</div>
              {past.slice(-10).reverse().map(order => {
                const total = cartTotal(order.items) * (1 + TAX_RATE)
                return (
                  <div key={order.id} className="order-row past">
                    <div className="order-row-left">
                      <div className="order-row-id">#{order.id}</div>
                      <div className="order-row-meta">
                        <I.Clock s={12} />
                        {time(order.createdAt)} · {order.items.reduce((s, i) => s + i.qty, 0)} items
                      </div>
                    </div>
                    <div className="order-row-right">
                      <div className="order-row-total">{fmt(total)}</div>
                      <span className="order-row-badge done">Done</span>
                    </div>
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
function SettingsDrawer({ theme, onToggleTheme, cols, onCols, onClose }) {
  return (
    <div className="drawer-overlay open" onClick={onClose} aria-hidden="true">
      <div className="settings-drawer" onClick={e => e.stopPropagation()} role="dialog" aria-label="Settings">
        {/* Handle */}
        <div className="drawer-handle" />

        {/* Header */}
        <div className="console-header">
          <div className="console-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Settings
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close settings"><I.X s={17} /></button>
        </div>

        <div className="console-body">
          {/* Theme */}
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
              aria-label="Toggle dark mode"
            >
              <span className="toggle-knob">
                {theme === 'dark' ? <I.Moon s={11} /> : <I.Sun s={11} />}
              </span>
            </button>
          </div>

          {/* Grid size */}
          <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <div className="setting-label">Product Grid</div>
              <div className="setting-desc">Columns per row</div>
            </div>
            <div className="grid-picker">
              {[2, 3, 4].map(n => (
                <button
                  key={n}
                  id={`grid-${n}-btn`}
                  className={`grid-pick-btn ${cols === n ? 'active' : ''}`}
                  onClick={() => onCols(n)}
                  aria-pressed={cols === n}
                >
                  {n === 2 ? <I.Grid2 s={18} /> : n === 3 ? <I.Grid3 s={18} /> : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="3" width="4" height="18" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>
                    </svg>
                  )}
                  <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{n} col{n > 1 ? 's' : ''}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Currency info */}
          <div className="setting-row">
            <div>
              <div className="setting-label">Currency</div>
              <div className="setting-desc">Indian Rupee (₹ INR)</div>
            </div>
            <div style={{ fontSize: '1.5rem' }}>🇮🇳</div>
          </div>

          {/* Tax info */}
          <div className="setting-row">
            <div>
              <div className="setting-label">Tax Rate</div>
              <div className="setting-desc">Applied at checkout</div>
            </div>
            <div style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: '0.95rem' }}>5% GST</div>
          </div>

          {/* App info */}
          <div className="setting-row" style={{ marginTop: 'auto', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: 0.5, paddingTop: 16 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mansula Nexus v1.3.0-alpha</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>POS & Billing System</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────── MAIN APP ───────────────
export default function App() {
  const [theme,        setTheme]        = useState(() => localStorage.getItem('mn-theme') || 'light')
  const [cols,         setCols]         = useState(() => parseInt(localStorage.getItem('mn-cols') || '3'))
  const [activeCategory, setActiveCat] = useState('All')
  const [search,       setSearch]       = useState('')
  const [searchOpen,   setSearchOpen]   = useState(false)
  const [cartOpen,     setCartOpen]     = useState(false)
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [ordersOpen,   setOrdersOpen]   = useState(false)
  const [toast,        setToast]        = useState(null)
  const searchRef = useRef(null)

  // ── Orders ──
  const [orders,         setOrders]         = useState(() => [makeOrder()])
  const [currentOrderId, setCurrentOrderId] = useState(() => orders[0]?.id)

  const currentOrder = orders.find(o => o.id === currentOrderId)
  const cart = currentOrder?.items ?? []

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('mn-theme', theme)
  }, [theme])

  // Cols persistence
  useEffect(() => { localStorage.setItem('mn-cols', cols) }, [cols])

  // Auto-focus search
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 80)
  }, [searchOpen])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2800)
  }

  // ── Order actions ──
  const setCartItems = useCallback((updater) => {
    setOrders(prev => prev.map(o =>
      o.id === currentOrderId ? { ...o, items: typeof updater === 'function' ? updater(o.items) : updater } : o
    ))
  }, [currentOrderId])

  const createNewOrder = () => {
    const newOrder = makeOrder()
    setOrders(prev => [...prev, newOrder])
    setCurrentOrderId(newOrder.id)
    showToast(`New order ${newOrder.id} started`)
  }

  const switchOrder = (id) => {
    setCurrentOrderId(id)
    showToast(`Switched to order ${id}`)
  }

  // ── Cart actions ──
  const addToCart = (product) => {
    setCartItems(prev => {
      const ex = prev.find(i => i.id === product.id)
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const increaseQty = (id) => setCartItems(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i))

  const decreaseQty = (id) => setCartItems(prev => {
    const item = prev.find(i => i.id === id)
    if (!item) return prev
    if (item.qty === 1) return prev.filter(i => i.id !== id)
    return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i)
  })

  const clearCart = () => setCartItems([])

  // ── Totals ──
  const subtotal   = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const tax        = subtotal * TAX_RATE
  const total      = subtotal + tax
  const totalItems = cart.reduce((s, i) => s + i.qty, 0)

  // ── Checkout ──
  const handleCheckout = () => {
    setOrders(prev => prev.map(o =>
      o.id === currentOrderId ? { ...o, status: 'completed' } : o
    ))
    const newOrder = makeOrder()
    setOrders(prev => [...prev, newOrder])
    setCurrentOrderId(newOrder.id)
    setCartOpen(false)
    showToast(`Order ${currentOrderId} completed — ${fmt(total)}`)
  }

  // ── Filtered products ──
  const filtered = useMemo(() => PRODUCTS.filter(p => {
    const matchCat    = activeCategory === 'All' || p.category === activeCategory
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  }), [activeCategory, search])

  const getQty = (id) => cart.find(i => i.id === id)?.qty ?? 0

  // ── Close search ──
  const closeSearch = () => { setSearch(''); setSearchOpen(false) }

  const activeOrders = orders.filter(o => o.status === 'active')

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <I.Check s={15} /> {toast}
        </div>
      )}

      {/* Mobile cart overlay */}
      <div className={`drawer-overlay ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)} aria-hidden="true" style={{ display: cartOpen ? 'block' : 'none' }} />

      {/* Drawers */}
      {menuOpen    && <SettingsDrawer theme={theme} onToggleTheme={toggleTheme} cols={cols} onCols={setCols} onClose={() => setMenuOpen(false)} />}
      {ordersOpen  && <OrderConsole   orders={orders} currentOrderId={currentOrderId} onSwitch={switchOrder} onNew={() => { createNewOrder(); setOrdersOpen(false) }} onClose={() => setOrdersOpen(false)} />}

      {/* Search overlay */}
      <div className={`search-overlay ${searchOpen ? 'open' : ''}`} role="search">
        <input
          ref={searchRef}
          id="product-search"
          type="search"
          className="search-input"
          placeholder="Search items…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Escape' && closeSearch()}
          aria-label="Search products"
        />
        <button className="search-close-btn" onClick={closeSearch} aria-label="Close search"><I.X s={17} /></button>
      </div>

      {/* ── APP SHELL ── */}
      <div className="app-shell">

        {/* ── HEADER ── */}
        <header className="app-header">
          {/* Left: hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button id="menu-btn" className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <I.Menu s={19} />
            </button>
            <div className="header-brand">
              <div className="header-brand-icon" aria-hidden="true"><I.Logo /></div>
              <span className="header-brand-name">Mansula <span>Nexus</span></span>
            </div>
          </div>

          {/* Centre: current order ID */}
          <button
            className="order-id-pill"
            onClick={() => setOrdersOpen(true)}
            aria-label="View order console"
            id="current-order-pill"
          >
            <I.Orders s={13} />
            #{currentOrderId}
            {activeOrders.length > 1 && (
              <span className="order-id-count">{activeOrders.length}</span>
            )}
          </button>

          {/* Right: new order + orders */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              id="new-order-header-btn"
              className="icon-btn new-order-quick"
              onClick={createNewOrder}
              aria-label="Quick new order"
              title="New order"
            >
              <I.Plus s={17} />
            </button>
            <button
              id="orders-btn"
              className="icon-btn"
              onClick={() => setOrdersOpen(true)}
              aria-label="Order console"
            >
              <I.Orders s={17} />
            </button>
          </div>
        </header>

        {/* ── BODY ── */}
        <div className="app-body">

          {/* ── PRODUCTS ── */}
          <main className="pos-panel">
            {/* Toolbar */}
            <div className="pos-toolbar">
              <div className="category-scroll">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    id={`cat-${cat.toLowerCase()}`}
                    className={`chip ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCat(cat)}
                    aria-pressed={activeCategory === cat}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button
                id="search-toggle-btn"
                className={`icon-btn ${searchOpen ? 'active' : ''}`}
                onClick={() => setSearchOpen(o => { if (o) setSearch(''); return !o })}
                aria-label={searchOpen ? 'Close search' : 'Search products'}
              >
                {searchOpen ? <I.X s={16} /> : <I.Search s={16} />}
              </button>
            </div>

            {/* Grid */}
            <div className="products-grid-wrap">
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-emoji">🔍</div>
                  <p>No results for <strong>"{search}"</strong></p>
                </div>
              ) : (
                <div className={`products-grid grid-cols-${cols}`}>
                  {filtered.map(p => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      qty={getQty(p.id)}
                      onAdd={addToCart}
                      onDecrease={decreaseQty}
                      cols={cols}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* ── CART ── */}
          <aside className={`cart-panel ${cartOpen ? 'open' : ''}`} aria-label="Current order">
            <div className="cart-header">
              <div className="cart-title">
                <I.Cart s={17} />
                #{currentOrderId}
                {totalItems > 0 && <span className="cart-count-badge">{totalItems}</span>}
              </div>
              {cart.length > 0 && (
                <button id="clear-cart-btn" className="cart-clear-btn" onClick={clearCart}>Clear</button>
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
                <div className="cart-items" role="list">
                  {cart.map(item => (
                    <CartItem key={item.id} item={item} onIncrease={increaseQty} onDecrease={decreaseQty} />
                  ))}
                </div>
                <div className="cart-footer">
                  <div className="cart-totals">
                    <div className="cart-total-row"><span className="label">Subtotal</span><span className="value">{fmt(subtotal)}</span></div>
                    <div className="cart-total-row"><span className="label">GST (5%)</span><span className="value">{fmt(tax)}</span></div>
                    <div className="cart-total-row grand"><span className="label">Total</span><span className="value">{fmt(total)}</span></div>
                  </div>
                  <button id="checkout-btn" className="checkout-btn" onClick={handleCheckout} disabled={cart.length === 0}>
                    <I.Check s={17} />
                    Charge {fmt(total)}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        id="mobile-cart-fab"
        className="mobile-cart-fab"
        onClick={() => setCartOpen(o => !o)}
        aria-label={`${cartOpen ? 'Close' : 'Open'} cart — ${totalItems} items`}
      >
        <I.Cart s={24} />
        {totalItems > 0 && <span className="mobile-cart-badge">{totalItems}</span>}
      </button>
    </>
  )
}
