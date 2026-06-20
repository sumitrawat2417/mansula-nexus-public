import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getInventoryItems, saveInventoryItem, deleteInventoryItem,
  adjustInventoryStock, logWastage,
  getPurchaseLogs, savePurchaseLog, deletePurchaseLog,
  getSuppliers, saveSupplier, deleteSupplier,
  dbGet,
} from './db.js'

// ── Helpers ──
const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const fmtCur = (n) => `₹${fmt(n)}`
const uid = () => `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
const nowMonthKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` }
const fmtDate = (ts) => ts ? new Date(ts).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'
const fmtDateTime = (ts) => ts ? new Date(ts).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'

const UNITS = ['pcs', 'kg', 'gm', 'L', 'mL', 'bottles', 'boxes', 'bags', 'dozen', 'plates', 'packets']
const WASTAGE_REASONS = ['Spoiled', 'Spilled', 'Expired', 'Damaged Packaging', 'Quality Issue', 'Other']

// ── Icon set ──
const Ic = {
  Close:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Plus:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Minus:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Search:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Trash:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Edit:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Warn:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Box:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Receipt:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>,
  Supplier: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9.5" y1="14.5" x2="14.5" y2="14.5"/></svg>,
  ChevDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  ChevRight:() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Link:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  History:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>,
  Phone:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 11.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 .77l3-.01a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.45a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 15z"/></svg>,
  Check:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
}

// ══════════════════════════════════════════════════════════════════
// MODAL / DRAWER WRAPPERS
// ══════════════════════════════════════════════════════════════════

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="inv-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`inv-modal ${wide ? 'inv-modal-wide' : ''}`}>
        <div className="inv-modal-handle" />
        <div className="inv-modal-header">
          <h3 className="inv-modal-title">{title}</h3>
          <button className="inv-modal-close" onClick={onClose}><Ic.Close /></button>
        </div>
        <div className="inv-modal-body">{children}</div>
      </div>
    </div>
  )
}


// ══════════════════════════════════════════════════════════════════
// TAB 1: LIVE STOCK
// ══════════════════════════════════════════════════════════════════

function StockCard({ item, onAdjust, onWastage, onEdit, onDelete }) {
  const isOut = item.currentQty === 0
  const isLow = !isOut && item.isLowStock

  return (
    <div className={`inv-stock-card ${isOut ? 'out-of-stock' : isLow ? 'low-stock' : ''}`}>
      <div className="inv-stock-card-top">
        <span className="inv-stock-emoji">{item.emoji || '📦'}</span>
        <div className="inv-stock-info">
          <div className="inv-stock-name">{item.name}</div>
          <div className="inv-stock-meta">
            {item.category && <span className="inv-tag">{item.category}</span>}
            {item.isMenuLinked && <span className="inv-tag inv-tag-link"><Ic.Link /> Menu</span>}
            <span className="inv-tag inv-tag-unit">{item.unit}</span>
          </div>
        </div>
        <div className="inv-stock-actions-top">
          <button className="inv-icon-btn" onClick={() => onEdit(item)} title="Edit"><Ic.Edit /></button>
          <button className="inv-icon-btn inv-icon-btn-danger" onClick={() => onDelete(item.id)} title="Delete"><Ic.Trash /></button>
        </div>
      </div>

      <div className="inv-stock-qty-row">
        <button className="inv-qty-btn" onClick={() => onAdjust(item.id, -1)} title="Decrease">
          <Ic.Minus />
        </button>
        <div className="inv-qty-display">
          <span className={`inv-qty-num ${isOut ? 'inv-qty-out' : isLow ? 'inv-qty-low' : ''}`}>{item.currentQty}</span>
          <span className="inv-qty-unit">{item.unit}</span>
        </div>
        <button className="inv-qty-btn" onClick={() => onAdjust(item.id, 1)} title="Increase">
          <Ic.Plus />
        </button>
      </div>

      {(isOut || isLow) && (
        <div className={`inv-alert-strip ${isOut ? 'inv-alert-out' : 'inv-alert-low'}`}>
          <Ic.Warn /> {isOut ? 'Out of Stock' : `Low Stock — Threshold: ${item.lowStockThreshold} ${item.unit}`}
        </div>
      )}

      <div className="inv-stock-prices">
        <div className="inv-price-pair">
          <span className="inv-price-label">Cost</span>
          <span className="inv-price-val">{fmtCur(item.costPrice)}</span>
        </div>
        <div className="inv-price-pair">
          <span className="inv-price-label">Stock Value</span>
          <span className="inv-price-val">{fmtCur(item.currentQty * item.costPrice)}</span>
        </div>
      </div>

      <button className="inv-wastage-btn" onClick={() => onWastage(item)}>
        <Ic.History /> Log Wastage
      </button>
    </div>
  )
}

function AddEditItemModal({ item, menuProducts, onSave, onClose }) {
  const [form, setForm] = useState({
    id: item?.id || '',
    name: item?.name || '',
    category: item?.category || '',
    emoji: item?.emoji || '📦',
    unit: item?.unit || 'pcs',
    currentQty: item?.currentQty ?? 0,
    lowStockThreshold: item?.lowStockThreshold ?? 5,
    costPrice: item?.costPrice ?? 0,
    sellingPrice: item?.sellingPrice ?? 0,
    isMenuLinked: item?.isMenuLinked || false,
    menuProductId: item?.id || '',
  })
  const [linkMode, setLinkMode] = useState(item?.isMenuLinked || false)

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleMenuSelect = (productId) => {
    const p = menuProducts.find(p => p.id === productId)
    if (p) {
      setF('name', p.name)
      setF('emoji', p.emoji || '📦')
      setF('sellingPrice', p.price || 0)
      setF('id', p.id)
      setF('menuProductId', p.id)
      setF('category', p.category || '')
      setF('isMenuLinked', true)
    }
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    const id = linkMode ? (form.menuProductId || form.id || uid()) : (form.id || uid())
    onSave({ ...form, id, isMenuLinked: linkMode, currentQty: Number(form.currentQty), lowStockThreshold: Number(form.lowStockThreshold), costPrice: Number(form.costPrice), sellingPrice: Number(form.sellingPrice) })
  }

  return (
    <Modal title={item ? 'Edit Inventory Item' : 'Add Inventory Item'} onClose={onClose}>
      <div className="inv-form">
        <div className="inv-form-switch-row">
          <button className={`inv-switch-tab ${!linkMode ? 'active' : ''}`} onClick={() => setLinkMode(false)}>
            📦 Standalone Item
          </button>
          <button className={`inv-switch-tab ${linkMode ? 'active' : ''}`} onClick={() => setLinkMode(true)}>
            <Ic.Link /> Link to Menu
          </button>
        </div>

        {linkMode && (
          <div className="inv-form-group">
            <label className="inv-form-label">Select Menu Product</label>
            <select className="inv-form-input" value={form.menuProductId} onChange={e => handleMenuSelect(e.target.value)}>
              <option value="">— Pick a product —</option>
              {menuProducts.map(p => (
                <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="inv-form-row-2">
          <div className="inv-form-group">
            <label className="inv-form-label">Emoji</label>
            <input className="inv-form-input inv-emoji-input" value={form.emoji} onChange={e => setF('emoji', e.target.value)} maxLength={4} />
          </div>
          <div className="inv-form-group inv-form-group-flex">
            <label className="inv-form-label">Item Name *</label>
            <input className="inv-form-input" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Refined Oil" disabled={linkMode && !!form.menuProductId} />
          </div>
        </div>

        <div className="inv-form-row-2">
          <div className="inv-form-group">
            <label className="inv-form-label">Category</label>
            <input className="inv-form-input" list="inv-category-list" value={form.category} onChange={e => setF('category', e.target.value)} placeholder="e.g. Raw Material, Rent" />
            <datalist id="inv-category-list">
              <option value="Raw Material" />
              <option value="Disposables & Packaging" />
              <option value="Transport & Logistics" />
              <option value="Rent & Lease" />
              <option value="Electricity & Utilities" />
              <option value="Equipment & Maintenance" />
              <option value="Cleaning & Hygiene" />
              <option value="Marketing & Advertising" />
              <option value="Office Supplies" />
              <option value="Staff & Labor" />
              <option value="Miscellaneous" />
            </datalist>
          </div>
          <div className="inv-form-group">
            <label className="inv-form-label">Unit</label>
            <select className="inv-form-input" value={form.unit} onChange={e => setF('unit', e.target.value)}>
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="inv-form-row-2">
          <div className="inv-form-group">
            <label className="inv-form-label">Opening Qty</label>
            <input className="inv-form-input" type="number" min="0" value={form.currentQty} onChange={e => setF('currentQty', e.target.value)} />
          </div>
          <div className="inv-form-group">
            <label className="inv-form-label">Low Stock Alert at</label>
            <input className="inv-form-input" type="number" min="0" value={form.lowStockThreshold} onChange={e => setF('lowStockThreshold', e.target.value)} />
          </div>
        </div>

        <div className="inv-form-group">
          <label className="inv-form-label">Cost Price (per unit)</label>
          <input className="inv-form-input" type="number" min="0" step="0.01" value={form.costPrice} onChange={e => setF('costPrice', e.target.value)} placeholder="₹0" />
        </div>

        <button className="inv-save-btn" onClick={handleSave}>
          <Ic.Check /> Save Item
        </button>
      </div>
    </Modal>
  )
}

function WastageModal({ item, onSave, onClose }) {
  const [qty, setQty] = useState(1)
  const [reason, setReason] = useState(WASTAGE_REASONS[0])
  const [customReason, setCustomReason] = useState('')

  const handleSave = () => {
    if (qty <= 0) return
    onSave(item.id, { qty: Number(qty), reason: reason === 'Other' ? customReason || 'Other' : reason, date: new Date().toISOString() })
  }

  return (
    <Modal title={`Log Wastage — ${item.emoji} ${item.name}`} onClose={onClose}>
      <div className="inv-form">
        <div className="inv-wastage-current">
          <span>Current Stock:</span>
          <strong>{item.currentQty} {item.unit}</strong>
        </div>
        <div className="inv-form-group">
          <label className="inv-form-label">Quantity Wasted ({item.unit})</label>
          <input className="inv-form-input" type="number" min="0.01" step="0.01" max={item.currentQty} value={qty} onChange={e => setQty(e.target.value)} />
        </div>
        <div className="inv-form-group">
          <label className="inv-form-label">Reason</label>
          <div className="inv-reason-chips">
            {WASTAGE_REASONS.map(r => (
              <button key={r} className={`inv-reason-chip ${reason === r ? 'active' : ''}`} onClick={() => setReason(r)}>{r}</button>
            ))}
          </div>
        </div>
        {reason === 'Other' && (
          <div className="inv-form-group">
            <label className="inv-form-label">Specify reason</label>
            <input className="inv-form-input" value={customReason} onChange={e => setCustomReason(e.target.value)} placeholder="Describe the reason..." />
          </div>
        )}
        <div className="inv-wastage-preview">
          After logging: <strong>{Math.max(0, item.currentQty - qty)} {item.unit}</strong> remaining
        </div>
        <button className="inv-save-btn inv-save-btn-warn" onClick={handleSave}>
          <Ic.History /> Confirm Wastage
        </button>

        {(item.wastageLog?.length > 0) && (
          <div className="inv-wastage-history">
            <div className="inv-section-label">Past Wastage</div>
            {item.wastageLog.slice(0, 5).map((w, i) => (
              <div key={i} className="inv-wastage-row">
                <span className="inv-wastage-qty">−{w.qty} {item.unit}</span>
                <span className="inv-wastage-reason">{w.reason}</span>
                <span className="inv-wastage-date">{fmtDate(w.loggedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

function LiveStockTab({ menuProducts }) {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | low | out | linked
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [wastageItem, setWastageItem] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const data = await getInventoryItems()
    setItems(data)
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const handleSaveItem = async (item) => {
    await saveInventoryItem(item)
    await load()
    setShowAdd(false)
    setEditItem(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this inventory item?')) return
    await deleteInventoryItem(id)
    await load()
  }

  const handleAdjust = async (id, delta) => {
    await adjustInventoryStock(id, delta)
    await load()
  }

  const handleWastage = async (itemId, entry) => {
    await logWastage(itemId, entry)
    await load()
    setWastageItem(null)
  }

  const exportCSV = () => {
    const rows = [['Name','Category','Unit','Qty','Low Threshold','Cost Price','Selling Price','Stock Value','Wastage Count']]
    filtered.forEach(i => rows.push([i.name,i.category,i.unit,i.currentQty,i.lowStockThreshold,i.costPrice,i.sellingPrice,(i.currentQty*i.costPrice).toFixed(2),(i.wastageLog||[]).length]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], {type:'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `inventory-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = items.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.category||'').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'low' && i.isLowStock && i.currentQty > 0) || (filter === 'out' && i.currentQty === 0) || (filter === 'linked' && i.isMenuLinked)
    return matchSearch && matchFilter
  })

  const totalValue = items.reduce((s, i) => s + (i.currentQty * i.costPrice), 0)
  const lowCount = items.filter(i => i.isLowStock).length
  const outCount = items.filter(i => i.currentQty === 0).length
  const totalWastage = items.reduce((s, i) => s + (i.wastageLog||[]).reduce((a, w) => a + w.qty, 0), 0)

  return (
    <div className="inv-tab-content">
      {/* KPI Strip */}
      <div className="inv-kpi-strip">
        <div className="inv-kpi-card">
          <div className="inv-kpi-val">{items.length}</div>
          <div className="inv-kpi-label">Total Items</div>
        </div>
        <div className="inv-kpi-card">
          <div className="inv-kpi-val">{fmtCur(totalValue)}</div>
          <div className="inv-kpi-label">Stock Value</div>
        </div>
        <div className="inv-kpi-card inv-kpi-card-warn">
          <div className="inv-kpi-val">{lowCount}</div>
          <div className="inv-kpi-label">Low Stock</div>
        </div>
        <div className="inv-kpi-card inv-kpi-card-danger">
          <div className="inv-kpi-val">{outCount}</div>
          <div className="inv-kpi-label">Out of Stock</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="inv-toolbar">
        <div className="inv-search-wrap">
          <Ic.Search />
          <input className="inv-search" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="inv-filter-chips">
          {['all','low','out','linked'].map(f => (
            <button key={f} className={`inv-filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'low' ? '⚠ Low' : f === 'out' ? '🚫 Out' : '🔗 Menu'}
            </button>
          ))}
        </div>
        <div className="inv-toolbar-actions">
          <button className="inv-action-btn inv-action-btn-secondary" onClick={exportCSV}><Ic.Download /> Export</button>
          <button className="inv-action-btn" onClick={() => setShowAdd(true)}><Ic.Plus /> Add Item</button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="inv-loading">Loading inventory…</div>
      ) : filtered.length === 0 ? (
        <div className="inv-empty">
          <div className="inv-empty-icon">📦</div>
          <div className="inv-empty-title">{items.length === 0 ? 'No inventory yet' : 'Nothing matches your search'}</div>
          <div className="inv-empty-desc">{items.length === 0 ? 'Add your first item or log a purchase to get started.' : 'Try adjusting your search or filter.'}</div>
          {items.length === 0 && <button className="inv-action-btn" onClick={() => setShowAdd(true)}><Ic.Plus /> Add First Item</button>}
        </div>
      ) : (
        <div className="inv-stock-grid">
          {filtered.map(item => (
            <StockCard key={item.id} item={item} onAdjust={handleAdjust} onWastage={setWastageItem} onEdit={setEditItem} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {(showAdd || editItem) && (
        <AddEditItemModal item={editItem} menuProducts={menuProducts} onSave={handleSaveItem} onClose={() => { setShowAdd(false); setEditItem(null) }} />
      )}
      {wastageItem && (
        <WastageModal item={wastageItem} onSave={handleWastage} onClose={() => setWastageItem(null)} />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// TAB 2: PURCHASE LOGS
// ══════════════════════════════════════════════════════════════════

function PurchaseForm({ suppliers, menuProducts, inventoryItems, logToEdit, onSave, onClose }) {
  const [supplierName, setSupplierName] = useState(logToEdit?.supplierName || '')
  const [lines, setLines] = useState(logToEdit?.items?.length ? logToEdit.items.map(i => ({...i, lineTotal: (i.qty * i.costPerUnit).toFixed(2)})) : [{ id: uid(), productId: '', productName: '', qty: 1, unit: 'pcs', costPerUnit: 0, lineTotal: 0, emoji: '📦', category: '', isExpenseOnly: false }])
  const [invoiceNo, setInvoiceNo] = useState(logToEdit?.invoiceNumber || '')
  const [notes, setNotes] = useState(logToEdit?.notes || '')
  const [date, setDate] = useState(logToEdit?.purchasedAt ? new Date(logToEdit.purchasedAt).toISOString().slice(0,10) : new Date().toISOString().slice(0,10))
  const [saving, setSaving] = useState(false)

  const addLine = () => setLines(p => [...p, { id: uid(), productId: '', productName: '', qty: 1, unit: 'pcs', costPerUnit: 0, lineTotal: 0, emoji: '📦', category: '', isExpenseOnly: false }])
  const removeLine = (id) => setLines(p => p.filter(l => l.id !== id))
  const updateLine = (id, k, v) => setLines(p => p.map(l => {
    if (l.id !== id) return l;
    let nl = { ...l, [k]: v };
    if (k === 'qty' || k === 'costPerUnit') {
      nl.lineTotal = (Number(nl.qty) * Number(nl.costPerUnit)).toFixed(2);
    } else if (k === 'lineTotal') {
      const tot = Number(v);
      const q = Number(nl.qty);
      const c = Number(nl.costPerUnit);
      if (c === 0 || isNaN(c)) {
        nl.costPerUnit = q > 0 ? (tot / q).toFixed(2) : 0;
      } else if (q === 0 || q === 1 || isNaN(q)) {
        nl.qty = c > 0 ? (tot / c).toFixed(2) : 0;
      } else {
        nl.costPerUnit = q > 0 ? (tot / q).toFixed(2) : 0;
      }
    }
    return nl;
  }))

  const allProducts = [...menuProducts, ...inventoryItems.filter(i => !menuProducts.find(p => p.id === i.id))]

  const handleProductNameChange = (lineId, val) => {
    const p = allProducts.find(x => x.name === val)
    if (p) {
      setLines(prev => prev.map(l => l.id === lineId ? {...l, productId: p.id, productName: p.name, emoji: p.emoji || '📦', unit: p.unit || 'pcs', category: p.category || '', costPerUnit: p.costPrice || 0} : l))
    } else {
      setLines(prev => prev.map(l => l.id === lineId ? {...l, productId: '', productName: val} : l))
    }
  }

  const total = lines.reduce((s, l) => s + Number(l.lineTotal || 0), 0)

  const handleSave = async () => {
    const validLines = lines.filter(l => l.productName.trim() && Number(l.qty) > 0)
    if (validLines.length === 0) return
    setSaving(true)
    const log = {
      purchaseId: logToEdit?.purchaseId,
      createdAt: logToEdit?.createdAt,
      supplierId: logToEdit?.supplierId || '',
      supplierName: supplierName.trim() || 'Unknown',
      items: validLines.map(l => ({ ...l, productId: l.productId || uid(), qty: Number(l.qty), costPerUnit: Number(l.costPerUnit), totalCost: Number(l.qty)*Number(l.costPerUnit) })),
      invoiceNumber: invoiceNo,
      notes,
      totalAmount: total,
      purchasedAt: new Date(date).getTime(),
    }
    await onSave(log)
    setSaving(false)
  }



  return (
    <Modal title="Log New Purchase" onClose={onClose} wide>
      <div className="inv-purchase-form">
        {/* Supplier */}
        <div className="inv-pf-section">
          <div className="inv-section-label">Supplier Name</div>
          <div className="inv-form-group">
            <input className="inv-form-input" list="pf-supplier-list" placeholder="Select or type new supplier..." value={supplierName} onChange={e => setSupplierName(e.target.value)} />
            <datalist id="pf-supplier-list">
              {suppliers.map(s => <option key={s.id} value={s.name} />)}
            </datalist>
          </div>
        </div>

        {/* Line Items */}
        <div className="inv-pf-section">
          <div className="inv-section-label">Items Purchased</div>
          <div className="inv-line-items">
            {lines.map((line, idx) => (
              <div key={line.id} className="inv-line-item">
                <div className="inv-line-num">{idx + 1}</div>
                <div className="inv-line-fields">
                  <div className="inv-form-group">
                    <label className="inv-form-label">Product Name</label>
                    <input className="inv-form-input" list={`products-datalist-${line.id}`} placeholder="Type name or select from list..." value={line.productName} onChange={e => handleProductNameChange(line.id, e.target.value)} />
                    <datalist id={`products-datalist-${line.id}`}>
                      {allProducts.map(p => <option key={p.id} value={p.name}>{p.emoji} {p.name}</option>)}
                    </datalist>
                  </div>
                  {!line.productId && line.productName.trim() !== '' && (
                    <div className="inv-form-row-2" style={{ alignItems: 'center' }}>
                      <div className="inv-form-group">
                        <label className="inv-form-label">Category (For New Item)</label>
                        <input className="inv-form-input" list="pf-category-list" placeholder="e.g. Raw Material, Rent..." value={line.category || ''} onChange={e => updateLine(line.id, 'category', e.target.value)} />
                      </div>
                      <div className="inv-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                        <input type="checkbox" id={`track-stock-${line.id}`} checked={!line.isExpenseOnly} onChange={e => updateLine(line.id, 'isExpenseOnly', !e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--brand-primary)' }} />
                        <label htmlFor={`track-stock-${line.id}`} style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer', userSelect: 'none' }}>Track as Stock Item</label>
                      </div>
                    </div>
                  )}
                  <div className="inv-line-row-3">
                    <div className="inv-form-group">
                      <label className="inv-form-label">Qty</label>
                      <input className="inv-form-input" type="number" min="0.01" step="0.01" value={line.qty} onChange={e => updateLine(line.id, 'qty', e.target.value)} />
                    </div>
                    <div className="inv-form-group">
                      <label className="inv-form-label">Unit</label>
                      <select className="inv-form-input" value={line.unit} onChange={e => updateLine(line.id, 'unit', e.target.value)}>
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="inv-form-group">
                      <label className="inv-form-label">Cost/Unit (₹)</label>
                      <input className="inv-form-input" type="number" min="0" step="0.01" value={line.costPerUnit} onChange={e => updateLine(line.id, 'costPerUnit', e.target.value)} />
                    </div>
                    <div className="inv-form-group">
                      <label className="inv-form-label">Line Total</label>
                      <input className="inv-form-input" style={{ fontWeight: 'bold', color: 'var(--brand-primary)' }} type="number" min="0" step="0.01" value={line.lineTotal} onChange={e => updateLine(line.id, 'lineTotal', e.target.value)} />
                    </div>
                  </div>
                </div>
                {lines.length > 1 && (
                  <button className="inv-remove-line" onClick={() => removeLine(line.id)}><Ic.Close /></button>
                )}
              </div>
            ))}
            <button className="inv-add-line-btn" onClick={addLine}><Ic.Plus /> Add Another Item</button>
          </div>
        </div>

        {/* Meta */}
        <div className="inv-pf-section">
          <div className="inv-form-row-2">
            <div className="inv-form-group">
              <label className="inv-form-label">Purchase Date</label>
              <input className="inv-form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="inv-form-group">
              <label className="inv-form-label">Invoice / Bill No.</label>
              <input className="inv-form-input" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="inv-form-group">
            <label className="inv-form-label">Notes</label>
            <textarea className="inv-form-input inv-textarea" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes…" />
          </div>
        </div>

        {/* Total + Save */}
        <div className="inv-pf-footer">
          <div className="inv-pf-total">
            <span>Total Amount</span>
            <strong>{fmtCur(total)}</strong>
          </div>
          <div className="inv-pf-note">
            ⚡ Stock quantities will auto-update after saving
          </div>
          <button className="inv-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : <><Ic.Check /> Save Purchase & Update Stock</>}
          </button>
        </div>
      </div>
      <datalist id="pf-category-list">
        <option value="Raw Material" />
        <option value="Disposables & Packaging" />
        <option value="Transport & Logistics" />
        <option value="Rent & Lease" />
        <option value="Electricity & Utilities" />
        <option value="Equipment & Maintenance" />
        <option value="Cleaning & Hygiene" />
        <option value="Marketing & Advertising" />
        <option value="Office Supplies" />
        <option value="Staff & Labor" />
        <option value="Miscellaneous" />
      </datalist>
    </Modal>
  )
}

function PurchaseLogItem({ log, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="inv-log-card">
      <div className="inv-log-header" onClick={() => setExpanded(p => !p)}>
        <div className="inv-log-left">
          <div className="inv-log-id">{log.purchaseId}</div>
          <div className="inv-log-meta">
            <span className="inv-log-supplier">{log.supplierName || 'No supplier'}</span>
            <span className="inv-log-dot">·</span>
            <span className="inv-log-date">{fmtDate(log.purchasedAt)}</span>
            {log.invoiceNumber && <><span className="inv-log-dot">·</span><span className="inv-log-inv">#{log.invoiceNumber}</span></>}
          </div>
          <div className="inv-log-items-preview">
            {(log.items||[]).slice(0,3).map((i,idx) => <span key={idx} className="inv-log-item-tag">{i.emoji} {i.productName} ×{i.qty}</span>)}
            {(log.items||[]).length > 3 && <span className="inv-log-item-tag">+{log.items.length - 3} more</span>}
          </div>
        </div>
        <div className="inv-log-right">
          <div className="inv-log-total">{fmtCur(log.totalAmount)}</div>
          <div className="inv-log-count">{log.items?.length || 0} items</div>
          <div className={`inv-log-chevron ${expanded ? 'rotated' : ''}`}><Ic.ChevDown /></div>
        </div>
      </div>
      {expanded && (
        <div className="inv-log-body">
          <table className="inv-log-table">
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Unit</th><th>Cost/Unit</th><th>Total</th></tr>
            </thead>
            <tbody>
              {(log.items||[]).map((item, i) => (
                <tr key={i}>
                  <td>{item.emoji} {item.productName}</td>
                  <td>{item.qty}</td>
                  <td>{item.unit}</td>
                  <td>{fmtCur(item.costPerUnit)}</td>
                  <td>{fmtCur(item.totalCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {log.notes && <div className="inv-log-notes">📝 {log.notes}</div>}
          <div className="inv-log-actions">
            <button className="inv-icon-btn" title="Edit Log" onClick={() => onEdit?.(log)}><Ic.Edit /></button>
            <button className="inv-icon-btn inv-icon-btn-danger" title="Delete Log" onClick={() => onDelete(log.purchaseId)}><Ic.Trash /></button>
          </div>
        </div>
      )}
    </div>
  )
}

function PurchaseLogsTab({ suppliers, menuProducts, inventoryItems, onPurchaseSaved }) {
  const [logs, setLogs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editLog, setEditLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    const data = await getPurchaseLogs()
    setLogs(data)
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const handleSave = async (log) => {
    let sId = log.supplierId
    if (log.supplierName && log.supplierName !== 'Unknown') {
      const existing = suppliers.find(s => s.name.toLowerCase() === log.supplierName.toLowerCase())
      if (existing) {
        sId = existing.id
        log.supplierName = existing.name
      } else if (!sId || log.supplierName !== editLog?.supplierName) {
        const newS = await saveSupplier({ id: uid(), name: log.supplierName, phone: '', email: '', address: '', gstNo: '', tags: [], totalSpend: 0 })
        sId = newS.id
      }
    }
    log.supplierId = sId

    await savePurchaseLog(log)
    await load()
    onPurchaseSaved?.()
    setShowForm(false)
    setEditLog(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this purchase log? This will NOT reverse stock changes.')) return
    await deletePurchaseLog(id)
    await load()
  }

  const exportCSV = () => {
    const rows = [['Purchase ID','Supplier','Date','Invoice','Items','Total Amount']]
    logs.forEach(l => rows.push([l.purchaseId,l.supplierName,fmtDate(l.purchasedAt),l.invoiceNumber||'',(l.items||[]).length,l.totalAmount]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], {type:'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `purchases-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = logs.filter(l => !search || l.supplierName?.toLowerCase().includes(search.toLowerCase()) || l.purchaseId.toLowerCase().includes(search.toLowerCase()) || (l.items||[]).some(i => i.productName.toLowerCase().includes(search.toLowerCase())))

  const monthKey = nowMonthKey()
  const thisMonthLogs = logs.filter(l => { const d = new Date(l.purchasedAt); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` === monthKey })
  const thisMonthSpend = thisMonthLogs.reduce((s, l) => s + (l.totalAmount || 0), 0)
  const topSupplier = Object.entries(logs.reduce((acc, l) => { acc[l.supplierName] = (acc[l.supplierName] || 0) + l.totalAmount; return acc }, {})).sort((a,b) => b[1]-a[1])[0]

  return (
    <div className="inv-tab-content">
      <div className="inv-kpi-strip">
        <div className="inv-kpi-card">
          <div className="inv-kpi-val">{logs.length}</div>
          <div className="inv-kpi-label">Total Logs</div>
        </div>
        <div className="inv-kpi-card">
          <div className="inv-kpi-val">{fmtCur(thisMonthSpend)}</div>
          <div className="inv-kpi-label">This Month</div>
        </div>
        <div className="inv-kpi-card">
          <div className="inv-kpi-val">{thisMonthLogs.length}</div>
          <div className="inv-kpi-label">Purchases (Month)</div>
        </div>
        <div className="inv-kpi-card">
          <div className="inv-kpi-val inv-kpi-val-sm">{topSupplier?.[0] || '—'}</div>
          <div className="inv-kpi-label">Top Supplier</div>
        </div>
      </div>

      <div className="inv-toolbar">
        <div className="inv-search-wrap">
          <Ic.Search />
          <input className="inv-search" placeholder="Search purchases…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="inv-toolbar-actions">
          <button className="inv-action-btn inv-action-btn-secondary" onClick={exportCSV}><Ic.Download /> Export</button>
          <button className="inv-action-btn" onClick={() => setShowForm(true)}><Ic.Plus /> Log Purchase</button>
        </div>
      </div>

      {loading ? (
        <div className="inv-loading">Loading purchase logs…</div>
      ) : filtered.length === 0 ? (
        <div className="inv-empty">
          <div className="inv-empty-icon">🧾</div>
          <div className="inv-empty-title">{logs.length === 0 ? 'No purchases logged yet' : 'Nothing matches'}</div>
          <div className="inv-empty-desc">{logs.length === 0 ? 'Log your first purchase and watch stock auto-update.' : 'Try adjusting your search.'}</div>
          {logs.length === 0 && <button className="inv-action-btn" onClick={() => setShowForm(true)}><Ic.Plus /> Log First Purchase</button>}
        </div>
      ) : (
        <div className="inv-logs-list">
          {filtered.map(log => (
            <PurchaseLogItem key={log.purchaseId} log={log} onEdit={setEditLog} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {(showForm || editLog) && <PurchaseForm suppliers={suppliers} menuProducts={menuProducts} inventoryItems={inventoryItems} logToEdit={editLog} onSave={handleSave} onClose={() => { setShowForm(false); setEditLog(null) }} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// TAB 3: SUPPLIERS
// ══════════════════════════════════════════════════════════════════

function SupplierFormModal({ supplier, onSave, onClose }) {
  const [form, setForm] = useState({
    id: supplier?.id || uid(),
    name: supplier?.name || '',
    phone: supplier?.phone || '',
    email: supplier?.email || '',
    address: supplier?.address || '',
    gstNo: supplier?.gstNo || '',
    tags: supplier?.tags?.join(', ') || '',
    totalSpend: supplier?.totalSpend || 0,
    createdAt: supplier?.createdAt,
  })
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    if (!form.name.trim()) return
    onSave({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) })
  }

  return (
    <Modal title={supplier ? 'Edit Supplier' : 'Add Supplier'} onClose={onClose}>
      <div className="inv-form">
        <div className="inv-form-group">
          <label className="inv-form-label">Supplier Name *</label>
          <input className="inv-form-input" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Sharma Brothers Wholesale" />
        </div>
        <div className="inv-form-row-2">
          <div className="inv-form-group">
            <label className="inv-form-label"><Ic.Phone /> Phone</label>
            <input className="inv-form-input" value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
          </div>
          <div className="inv-form-group">
            <label className="inv-form-label">Email</label>
            <input className="inv-form-input" type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="supplier@email.com" />
          </div>
        </div>
        <div className="inv-form-group">
          <label className="inv-form-label">GST Number</label>
          <input className="inv-form-input" value={form.gstNo} onChange={e => setF('gstNo', e.target.value)} placeholder="GSTIN" style={{textTransform:'uppercase'}} />
        </div>
        <div className="inv-form-group">
          <label className="inv-form-label">Address</label>
          <textarea className="inv-form-input inv-textarea" rows={2} value={form.address} onChange={e => setF('address', e.target.value)} placeholder="Full address..." />
        </div>
        <div className="inv-form-group">
          <label className="inv-form-label">Tags (comma separated)</label>
          <input className="inv-form-input" value={form.tags} onChange={e => setF('tags', e.target.value)} placeholder="e.g. dairy, vegetables, packaging" />
        </div>
        <button className="inv-save-btn" onClick={handleSave}><Ic.Check /> Save Supplier</button>
      </div>
    </Modal>
  )
}

function SuppliersTab({ suppliers, onSuppliersChanged }) {
  const [showForm, setShowForm] = useState(false)
  const [editSupplier, setEditSupplier] = useState(null)
  const [search, setSearch] = useState('')

  const handleSave = async (s) => {
    await saveSupplier(s)
    onSuppliersChanged()
    setShowForm(false)
    setEditSupplier(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this supplier?')) return
    await deleteSupplier(id)
    onSuppliersChanged()
  }

  const filtered = suppliers.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.tags||[]).some(t => t.toLowerCase().includes(search.toLowerCase())))
  const totalSpendAll = suppliers.reduce((s, sup) => s + (sup.totalSpend || 0), 0)

  return (
    <div className="inv-tab-content">
      <div className="inv-kpi-strip">
        <div className="inv-kpi-card">
          <div className="inv-kpi-val">{suppliers.length}</div>
          <div className="inv-kpi-label">Total Suppliers</div>
        </div>
        <div className="inv-kpi-card">
          <div className="inv-kpi-val">{fmtCur(totalSpendAll)}</div>
          <div className="inv-kpi-label">Total Spend (All Time)</div>
        </div>
      </div>

      <div className="inv-toolbar">
        <div className="inv-search-wrap">
          <Ic.Search />
          <input className="inv-search" placeholder="Search suppliers…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="inv-toolbar-actions">
          <button className="inv-action-btn" onClick={() => setShowForm(true)}><Ic.Plus /> Add Supplier</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="inv-empty">
          <div className="inv-empty-icon">🏢</div>
          <div className="inv-empty-title">{suppliers.length === 0 ? 'No suppliers yet' : 'Nothing matches'}</div>
          <div className="inv-empty-desc">{suppliers.length === 0 ? 'Add your regular suppliers for easy purchase logging.' : 'Try a different search.'}</div>
          {suppliers.length === 0 && <button className="inv-action-btn" onClick={() => setShowForm(true)}><Ic.Plus /> Add First Supplier</button>}
        </div>
      ) : (
        <div className="inv-supplier-grid">
          {filtered.map(s => (
            <div key={s.id} className="inv-supplier-card">
              <div className="inv-supplier-card-header">
                <div className="inv-supplier-avatar-lg">{s.name[0]}</div>
                <div className="inv-supplier-card-info">
                  <div className="inv-supplier-card-name">{s.name}</div>
                  {s.phone && <div className="inv-supplier-card-meta"><Ic.Phone /> {s.phone}</div>}
                  {s.email && <div className="inv-supplier-card-meta">✉ {s.email}</div>}
                  {s.gstNo && <div className="inv-supplier-card-meta">GST: {s.gstNo}</div>}
                </div>
                <div className="inv-supplier-card-actions">
                  <button className="inv-icon-btn" onClick={() => setEditSupplier(s)}><Ic.Edit /></button>
                  <button className="inv-icon-btn inv-icon-btn-danger" onClick={() => handleDelete(s.id)}><Ic.Trash /></button>
                </div>
              </div>
              {s.address && <div className="inv-supplier-card-address">📍 {s.address}</div>}
              {(s.tags||[]).length > 0 && (
                <div className="inv-supplier-card-tags">
                  {s.tags.map((t, i) => <span key={i} className="inv-tag">{t}</span>)}
                </div>
              )}
              <div className="inv-supplier-card-footer">
                <div className="inv-supplier-stat">
                  <div className="inv-supplier-stat-val">{fmtCur(s.totalSpend || 0)}</div>
                  <div className="inv-supplier-stat-label">Total Spend</div>
                </div>
                <div className="inv-supplier-stat">
                  <div className="inv-supplier-stat-val">{s.lastPurchaseAt ? fmtDate(s.lastPurchaseAt) : '—'}</div>
                  <div className="inv-supplier-stat-label">Last Purchase</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showForm || editSupplier) && (
        <SupplierFormModal supplier={editSupplier} onSave={handleSave} onClose={() => { setShowForm(false); setEditSupplier(null) }} />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// MAIN INVENTORY COMPONENT
// ══════════════════════════════════════════════════════════════════

export default function Inventory({ onClose }) {
  const [tab, setTab] = useState(0) // 0=stock, 1=purchases, 2=suppliers
  const [suppliers, setSuppliers] = useState([])
  const [menuProducts, setMenuProducts] = useState([])
  const [inventoryItems, setInventoryItems] = useState([])
  const stockRef = useRef(null)

  const loadSuppliers = useCallback(async () => {
    const data = await getSuppliers()
    setSuppliers(data)
  }, [])

  const loadInventory = useCallback(async () => {
    const data = await getInventoryItems()
    setInventoryItems(data)
  }, [])

  const loadMenu = useCallback(async () => {
    const menu = await dbGet('mn-menu') || []
    const prods = menu.flatMap(cat => (cat.items || []).map(i => ({ ...i, category: cat.name })))
    setMenuProducts(prods)
  }, [])

  useEffect(() => {
    loadSuppliers()
    loadMenu()
    loadInventory()
  }, [loadSuppliers, loadMenu, loadInventory])

  const TABS = [
    { label: 'Live Stock', icon: Ic.Box },
    { label: 'Purchase Logs', icon: Ic.Receipt },
    { label: 'Suppliers', icon: Ic.Supplier },
  ]

  return (
    <div className="inv-root">
      {/* Header matches BusinessProfile / OrderRecords style */}
      <header className="inv-header">
        <button className="inv-back-btn" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="inv-header-icon">
          <Ic.Box />
        </div>
        <div className="inv-header-info">
          <h1 className="inv-header-title">Inventory</h1>
          <div className="inv-header-sub">ManSula Nexus</div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="inv-tab-bar">
        {TABS.map((t, i) => (
          <button key={i} className={`inv-tab-btn ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>
            <t.icon /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 0 && <LiveStockTab menuProducts={menuProducts} />}
      {tab === 1 && (
        <PurchaseLogsTab
          suppliers={suppliers}
          menuProducts={menuProducts}
          inventoryItems={inventoryItems}
          onPurchaseSaved={() => { loadInventory(); loadSuppliers(); }}
        />
      )}
      {tab === 2 && <SuppliersTab suppliers={suppliers} onSuppliersChanged={loadSuppliers} />}
    </div>
  )
}