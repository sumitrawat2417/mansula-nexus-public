import { useState, useEffect, useMemo } from 'react'
import './App.css'

// ───── SAMPLE PRODUCT DATA ─────
const PRODUCTS = [
  { id: 1,  name: 'Espresso',        category: 'Coffee',    price: 2.50, emoji: '☕', badge: 'Popular' },
  { id: 2,  name: 'Cappuccino',      category: 'Coffee',    price: 3.50, emoji: '☕' },
  { id: 3,  name: 'Latte',           category: 'Coffee',    price: 3.75, emoji: '🥛' },
  { id: 4,  name: 'Cold Brew',       category: 'Coffee',    price: 4.00, emoji: '🧊', badge: 'New' },
  { id: 5,  name: 'Green Tea',       category: 'Tea',       price: 2.00, emoji: '🍵' },
  { id: 6,  name: 'Chai Latte',      category: 'Tea',       price: 3.25, emoji: '🍵', badge: 'Popular' },
  { id: 7,  name: 'Croissant',       category: 'Bakery',    price: 2.75, emoji: '🥐' },
  { id: 8,  name: 'Blueberry Muffin',category: 'Bakery',    price: 2.50, emoji: '🧁', badge: 'New' },
  { id: 9,  name: 'Avocado Toast',   category: 'Food',      price: 7.50, emoji: '🥑', badge: 'Popular' },
  { id: 10, name: 'Club Sandwich',   category: 'Food',      price: 8.00, emoji: '🥪' },
  { id: 11, name: 'Caesar Salad',    category: 'Food',      price: 6.50, emoji: '🥗' },
  { id: 12, name: 'Orange Juice',    category: 'Drinks',    price: 3.00, emoji: '🍊' },
  { id: 13, name: 'Mango Smoothie',  category: 'Drinks',    price: 4.50, emoji: '🥭', badge: 'New' },
  { id: 14, name: 'Mineral Water',   category: 'Drinks',    price: 1.50, emoji: '💧' },
  { id: 15, name: 'Chocolate Cake',  category: 'Bakery',    price: 4.00, emoji: '🎂', badge: 'Popular' },
  { id: 16, name: 'Cheesecake',      category: 'Bakery',    price: 4.50, emoji: '🍰' },
]

const CATEGORIES = ['All', 'Coffee', 'Tea', 'Food', 'Bakery', 'Drinks']
const TAX_RATE = 0.08

// ───── ICONS ─────
const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)

const CartIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
)

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)

const MinusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d="M5 12h14"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const LogoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
  </svg>
)


// ───── PRODUCT CARD ─────
function ProductCard({ product, onAdd }) {
  return (
    <div className="product-card animate-slide-up" onClick={() => onAdd(product)} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onAdd(product)} aria-label={`Add ${product.name} to cart`}>
      
      <div className="product-img-wrap">
        <div className="product-img-placeholder">
          <span style={{ fontSize: '2.5rem' }}>{product.emoji}</span>
        </div>
        {product.badge && (
          <span className={`product-badge ${product.badge === 'Out of Stock' ? 'out' : ''}`}>
            {product.badge}
          </span>
        )}
      </div>

      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <div className="product-meta">
          <span className="product-price">${product.price.toFixed(2)}</span>
          <button className="product-add-btn" onClick={e => { e.stopPropagation(); onAdd(product); }} aria-label="Add to cart">
            <PlusIcon />
          </button>
        </div>
      </div>
    </div>
  )
}


// ───── CART ITEM ─────
function CartItem({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <div className="cart-item-card">
      <div className="cart-item-img" aria-hidden="true">{item.emoji}</div>
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
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutDone, setCheckoutDone] = useState(false)

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('mn-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  // Filtered products
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [activeCategory, search])

  // Cart actions
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
    setCheckoutDone(true)
    setCart([])
    setCartOpen(false)
    setTimeout(() => setCheckoutDone(false), 3000)
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div className={`cart-panel-overlay ${cartOpen ? 'open' : ''}`} onClick={() => setCartOpen(false)} aria-hidden="true" />

      <div className="app-shell">
        {/* ── HEADER ── */}
        <header className="app-header">
          <div className="header-brand" role="banner">
            <div className="header-brand-icon" aria-hidden="true"><LogoIcon /></div>
            <span className="header-brand-name">Mansula <span>Nexus</span></span>
          </div>

          {checkoutDone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--brand-accent)', fontSize: '0.9rem', fontWeight: 600, animation: 'fadeIn 0.3s ease' }}>
              <CheckIcon /> Order placed!
            </div>
          )}

          <div className="header-actions">
            <button className="icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
          </div>
        </header>

        {/* ── BODY ── */}
        <div className="app-body">
          {/* ── PRODUCTS PANEL ── */}
          <main className="pos-panel">
            {/* Search bar */}
            <div className="pos-toolbar">
              <div className="search-wrap">
                <span className="search-icon" aria-hidden="true"><SearchIcon /></span>
                <input
                  id="product-search"
                  type="search"
                  className="search-input"
                  placeholder="Search items..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Search products"
                />
              </div>
            </div>

            {/* Category chips */}
            <nav className="category-bar" aria-label="Product categories">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  id={`cat-${cat}`}
                  className={`chip ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                  aria-pressed={activeCategory === cat}
                >
                  {cat}
                </button>
              ))}
            </nav>

            {/* Products grid */}
            <div className="products-grid-wrap" role="main">
              {filteredProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
                  <p>No items found for "<strong>{search}</strong>"</p>
                </div>
              ) : (
                <div className="products-grid" role="list" aria-label="Products">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} onAdd={addToCart} />
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* ── CART PANEL ── */}
          <aside className={`cart-panel ${cartOpen ? 'open' : ''}`} aria-label="Shopping cart">
            <div className="cart-header">
              <div className="cart-title">
                <CartIcon size={18} />
                Order
                {totalItems > 0 && <span className="cart-count-badge">{totalItems}</span>}
              </div>
              {cart.length > 0 && (
                <button className="cart-clear-btn" onClick={clearCart} id="clear-cart-btn">Clear all</button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-icon" aria-hidden="true">🛒</div>
                <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Cart is empty</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tap an item to add it</p>
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
                      onRemove={decreaseQty}
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
                  <button id="checkout-btn" className="checkout-btn" onClick={handleCheckout} disabled={cart.length === 0}>
                    <CheckIcon />
                    Charge ${total.toFixed(2)}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>

      {/* ── MOBILE CART BUTTON ── */}
      <button
        id="mobile-cart-toggle"
        className="mobile-cart-toggle"
        onClick={() => setCartOpen(o => !o)}
        aria-label={`${cartOpen ? 'Close' : 'Open'} cart, ${totalItems} items`}
      >
        <CartIcon size={24} />
        {totalItems > 0 && <span className="mobile-cart-badge">{totalItems}</span>}
      </button>
    </>
  )
}
