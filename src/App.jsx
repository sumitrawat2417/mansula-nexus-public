import { useState, useEffect, useMemo, useRef } from 'react'
import './App.css'

// ───── DATA ─────
const PRODUCTS = [
  { id: 1,  name: 'Espresso',         category: 'Coffee',  price: 2.50, emoji: '☕', badge: 'popular' },
  { id: 2,  name: 'Cappuccino',       category: 'Coffee',  price: 3.50, emoji: '☕' },
  { id: 3,  name: 'Latte',            category: 'Coffee',  price: 3.75, emoji: '🥛' },
  { id: 4,  name: 'Cold Brew',        category: 'Coffee',  price: 4.00, emoji: '🧊', badge: 'new' },
  { id: 5,  name: 'Green Tea',        category: 'Tea',     price: 2.00, emoji: '🍵' },
  { id: 6,  name: 'Chai Latte',       category: 'Tea',     price: 3.25, emoji: '🫖', badge: 'popular' },
  { id: 7,  name: 'Croissant',        category: 'Bakery',  price: 2.75, emoji: '🥐' },
  { id: 8,  name: 'Blueberry Muffin', category: 'Bakery',  price: 2.50, emoji: '🧁', badge: 'new' },
  { id: 9,  name: 'Avocado Toast',    category: 'Food',    price: 7.50, emoji: '🥑', badge: 'popular' },
  { id: 10, name: 'Club Sandwich',    category: 'Food',    price: 8.00, emoji: '🥪' },
  { id: 11, name: 'Caesar Salad',     category: 'Food',    price: 6.50, emoji: '🥗' },
  { id: 12, name: 'Orange Juice',     category: 'Drinks',  price: 3.00, emoji: '🍊' },
  { id: 13, name: 'Mango Smoothie',   category: 'Drinks',  price: 4.50, emoji: '🥭', badge: 'new' },
  { id: 14, name: 'Mineral Water',    category: 'Drinks',  price: 1.50, emoji: '💧' },
  { id: 15, name: 'Chocolate Cake',   category: 'Bakery',  price: 4.00, emoji: '🎂', badge: 'popular' },
  { id: 16, name: 'Cheesecake',       category: 'Bakery',  price: 4.50, emoji: '🍰' },
]

const CATEGORIES = ['All', 'Coffee', 'Tea', 'Food', 'Bakery', 'Drinks']
const TAX_RATE = 0.08

// ───── ICONS ─────
const SearchIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const XIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
)
const CartIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)
const SunIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
)
const MoonIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)
const PlusIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
const MinusIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d="M5 12h14"/>
  </svg>
)
const TrashIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const LogoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
  </svg>
)

// ───── PRODUCT CARD ─────
function ProductCard({ product, qty, onAdd, onDecrease }) {
  const inCart = qty > 0

  const handleCardClick = (e) => {
    // Don't fire add if clicking the minus button
    if (e.target.closest('.card-qty-btn.minus')) return
    onAdd(product)
  }

  const handleMinus = (e) => {
    e.stopPropagation()
    onDecrease(product.id)
  }

  return (
    <div
      className={`product-card animate-slide-up ${inCart ? 'in-cart' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onAdd(product)}
      aria-label={`${product.name} — $${product.price.toFixed(2)}${inCart ? `, ${qty} in cart` : ''}`}
    >
      <div className="product-img-wrap">
        <span className="product-emoji" aria-hidden="true">{product.emoji}</span>
        {product.badge && (
          <span className={`product-badge ${product.badge}`} aria-label={product.badge}>
            {product.badge === 'popular' ? 'Popular' : 'New'}
          </span>
        )}
        {inCart && (
          <span className="card-qty-indicator" aria-label={`${qty} in cart`}>{qty}</span>
        )}
      </div>

      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <div className="product-footer">
          <span className="product-price">${product.price.toFixed(2)}</span>
          {inCart ? (
            <div className="card-controls" onClick={e => e.stopPropagation()}>
              <button
                className="card-qty-btn minus"
                onClick={handleMinus}
                aria-label="Remove one from cart"
              >
                {qty === 1 ? <TrashIcon /> : <MinusIcon />}
              </button>
              <span className="card-qty-num">{qty}</span>
              <button
                className="card-qty-btn"
                onClick={e => { e.stopPropagation(); onAdd(product); }}
                aria-label="Add one more"
              >
                <PlusIcon />
              </button>
            </div>
          ) : (
            <button
              className="product-add-btn"
              onClick={e => { e.stopPropagation(); onAdd(product); }}
              aria-label={`Add ${product.name}`}
            >
              <PlusIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ───── CART ITEM ─────
function CartItem({ item, onIncrease, onDecrease }) {
  return (
    <div className="cart-item-card" role="listitem">
      <div className="cart-item-emoji" aria-hidden="true">{item.emoji}</div>
      <div className="cart-item-details">
        <div className="cart-item-name" title={item.name}>{item.name}</div>
        <div className="cart-item-price">${(item.price * item.qty).toFixed(2)}</div>
      </div>
      <div className="cart-item-controls">
        <button className="qty-btn" onClick={() => onDecrease(item.id)} aria-label="Decrease quantity">
          {item.qty === 1 ? <TrashIcon /> : <MinusIcon />}
        </button>
        <span className="qty-value">{item.qty}</span>
        <button className="qty-btn" onClick={() => onIncrease(item.id)} aria-label="Increase quantity">
          <PlusIcon />
        </button>
      </div>
    </div>
  )
}

// ───── MAIN APP ─────
export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('mn-theme') || 'light')
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const searchRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('mn-theme', theme)
  }, [theme])

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 100)
    }
  }, [searchOpen])

  const toggleSearch = () => {
    setSearchOpen(o => {
      if (o) setSearch('')
      return !o
    })
  }

  const closeSearch = () => {
    setSearch('')
    setSearchOpen(false)
  }

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  // Filtered products
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [activeCategory, search])

  // Get qty for a product id
  const getQty = (id) => cart.find(i => i.id === id)?.qty ?? 0

  // Cart mutations
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const increaseQty = (id) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i))

  const decreaseQty = (id) => setCart(prev => {
    const item = prev.find(i => i.id === id)
    if (!item) return prev
    if (item.qty === 1) return prev.filter(i => i.id !== id)
    return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i)
  })

  const clearCart = () => setCart([])

  // Totals
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0)
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax
  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0)

  // Checkout
  const handleCheckout = () => {
    setCart([])
    setCartOpen(false)
    setToast(`Order of $${total.toFixed(2)} placed!`)
    setTimeout(() => setToast(null), 2800)
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <CheckIcon size={16} /> {toast}
        </div>
      )}

      {/* Mobile overlay */}
      <div
        className={`cart-panel-overlay ${cartOpen ? 'open' : ''}`}
        onClick={() => setCartOpen(false)}
        aria-hidden="true"
      />

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
        <button className="search-close-btn" onClick={closeSearch} aria-label="Close search">
          <XIcon />
        </button>
      </div>

      <div className="app-shell">
        {/* ── HEADER ── */}
        <header className="app-header">
          <div className="header-brand" role="banner">
            <div className="header-brand-icon" aria-hidden="true"><LogoIcon /></div>
            <span className="header-brand-name">Mansula <span>Nexus</span></span>
          </div>

          <div className="header-actions">
            {totalItems > 0 && (
              <button
                className="header-order-summary"
                onClick={() => setCartOpen(true)}
                aria-label={`View cart — ${totalItems} items, $${total.toFixed(2)}`}
                style={{ display: 'none' }} /* shown via CSS on desktop if needed */
              >
                <span className="cart-count-badge">{totalItems}</span>
                <span className="total-text">${total.toFixed(2)}</span>
              </button>
            )}
            <button className="icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>
        </header>

        {/* ── BODY ── */}
        <div className="app-body">
          {/* ── PRODUCTS ── */}
          <main className="pos-panel">
            {/* Category bar + search icon */}
            <div className="pos-toolbar" role="toolbar" aria-label="Filter and search">
              <nav className="category-scroll" aria-label="Categories">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    id={`cat-${cat.toLowerCase()}`}
                    className={`chip ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                    aria-pressed={activeCategory === cat}
                  >
                    {cat}
                  </button>
                ))}
              </nav>
              <button
                id="search-toggle-btn"
                className={`icon-btn ${searchOpen ? 'active' : ''}`}
                onClick={toggleSearch}
                aria-label={searchOpen ? 'Close search' : 'Open search'}
                aria-expanded={searchOpen}
              >
                {searchOpen ? <XIcon size={17} /> : <SearchIcon size={17} />}
              </button>
            </div>

            {/* Products grid */}
            <div className="products-grid-wrap" role="main">
              {filteredProducts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-emoji">🔍</div>
                  <p>No results for <strong>"{search}"</strong></p>
                </div>
              ) : (
                <div className="products-grid" role="list" aria-label="Products">
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      qty={getQty(product.id)}
                      onAdd={addToCart}
                      onDecrease={decreaseQty}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* ── CART ── */}
          <aside className={`cart-panel ${cartOpen ? 'open' : ''}`} aria-label="Shopping cart">
            <div className="cart-header">
              <div className="cart-title">
                <CartIcon size={17} />
                Current Order
                {totalItems > 0 && <span className="cart-count-badge">{totalItems}</span>}
              </div>
              {cart.length > 0 && (
                <button id="clear-cart-btn" className="cart-clear-btn" onClick={clearCart}>
                  Clear all
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-icon" aria-hidden="true">🛒</div>
                <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Cart is empty</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Tap any item to add it</p>
              </div>
            ) : (
              <>
                <div className="cart-items" role="list" aria-label="Cart items">
                  {cart.map(item => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onIncrease={increaseQty}
                      onDecrease={decreaseQty}
                    />
                  ))}
                </div>
                <div className="cart-footer">
                  <div className="cart-totals">
                    <div className="cart-total-row">
                      <span className="label">Subtotal</span>
                      <span className="value">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="cart-total-row">
                      <span className="label">Tax (8%)</span>
                      <span className="value">${tax.toFixed(2)}</span>
                    </div>
                    <div className="cart-total-row grand">
                      <span className="label">Total</span>
                      <span className="value">${total.toFixed(2)}</span>
                    </div>
                  </div>
                  <button
                    id="checkout-btn"
                    className="checkout-btn"
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                  >
                    <CheckIcon size={17} />
                    Charge ${total.toFixed(2)}
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
        <CartIcon size={24} />
        {totalItems > 0 && <span className="mobile-cart-badge">{totalItems}</span>}
      </button>
    </>
  )
}
