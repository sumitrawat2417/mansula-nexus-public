import { useState, useEffect, useRef } from 'react'
import { dbGet, dbSet } from './db.js'

import { Html5Qrcode } from 'html5-qrcode'

// ── Keys ──
export const KEY_BUSINESS   = 'mn-business'
export const KEY_PRODUCTS   = 'mn-products'
export const KEY_CATEGORIES = 'mn-categories'

// ── Default data ──
export const DEFAULT_BUSINESS = {
  name: '', type: 'Café', tagline: '', phone: '', email: '', address: '', gstin: '', upiId: '', logo: '🏪',
}
export const DEFAULT_CATEGORIES = ['Coffee', 'Tea', 'Food', 'Bakery', 'Drinks']
export const DEFAULT_PRODUCTS = [
  { id: 1,  name: 'Espresso',         category: 'Coffee', price: 120, emoji: '☕', badge: 'popular' },
  { id: 2,  name: 'Cappuccino',       category: 'Coffee', price: 180, emoji: '☕' },
  { id: 3,  name: 'Latte',            category: 'Coffee', price: 200, emoji: '🥛' },
  { id: 4,  name: 'Cold Brew',        category: 'Coffee', price: 220, emoji: '🧊', badge: 'new' },
  { id: 5,  name: 'Green Tea',        category: 'Tea',    price: 100, emoji: '🍵' },
  { id: 6,  name: 'Chai Latte',       category: 'Tea',    price: 160, emoji: '🫖', badge: 'popular' },
  { id: 7,  name: 'Croissant',        category: 'Bakery', price: 140, emoji: '🥐' },
  { id: 8,  name: 'Blueberry Muffin', category: 'Bakery', price: 130, emoji: '🧁', badge: 'new' },
  { id: 9,  name: 'Avocado Toast',    category: 'Food',   price: 380, emoji: '🥑', badge: 'popular' },
  { id: 10, name: 'Club Sandwich',    category: 'Food',   price: 320, emoji: '🥪' },
  { id: 11, name: 'Caesar Salad',     category: 'Food',   price: 280, emoji: '🥗' },
  { id: 12, name: 'Orange Juice',     category: 'Drinks', price: 120, emoji: '🍊' },
  { id: 13, name: 'Mango Smoothie',   category: 'Drinks', price: 180, emoji: '🥭', badge: 'new' },
  { id: 14, name: 'Mineral Water',    category: 'Drinks', price: 60,  emoji: '💧' },
  { id: 15, name: 'Chocolate Cake',   category: 'Bakery', price: 200, emoji: '🎂', badge: 'popular' },
  { id: 16, name: 'Cheesecake',       category: 'Bakery', price: 220, emoji: '🍰' },
]

// ── Icons ──
const Ic = {
  Back:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Save:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Plus:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  Edit:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  X:        () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Check:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Store:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Menu:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>,
  Tag:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  Search:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Share:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Upload:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Phone:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91A16 16 0 0 0 15 15.91l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Mail:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  MapPin:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Receipt:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><path d="M16 8H8M16 12H8M12 16H8"/></svg>,
  AlertTri: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  QrCode:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="9" y="9" width="6" height="6"/></svg>,
}

const BUSINESS_TYPES = ['Café', 'Restaurant', 'Retail Shop', 'Grocery', 'Pharmacy', 'Bakery', 'Food Truck', 'Hotel', 'Other']
const BADGE_OPTIONS  = [{ value: '', label: 'None' }, { value: 'popular', label: '🔥 Popular' }, { value: 'new', label: '✨ New' }]

// ─── UPI SCANNER ───
function UpiScanner({ onScan, onClose }) {
  const scannerRef = useRef(null)
  const fileRef = useRef(null)

  const processScan = (decodedText, scanner) => {
    try {
      const url = new URL(decodedText)
      if (url.protocol === 'upi:') {
        const pa = url.searchParams.get('pa')
        if (pa) {
          if (scanner && scanner.isScanning) scanner.stop().then(() => onScan(pa)).catch(() => onScan(pa))
          else onScan(pa)
        }
      }
    } catch(e) {
      if (decodedText.includes('@')) {
        if (scanner && scanner.isScanning) scanner.stop().then(() => onScan(decodedText)).catch(() => onScan(decodedText))
        else onScan(decodedText)
      }
    }
  }

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader")
    scannerRef.current = html5QrCode
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (text) => processScan(text, html5QrCode),
      () => {}
    ).catch(console.error)

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {})
      }
      scannerRef.current = null
    }
  }, [onScan])

  const handleFileUpload = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (!scannerRef.current) return
      try {
        const decodedText = await scannerRef.current.scanFile(file, true)
        processScan(decodedText, scannerRef.current)
      } catch (err) {
        alert("Couldn't find a valid QR code in this image.")
      }
      e.target.value = ''
    }
  }

  return (
    <div className="bp-form-overlay" style={{ zIndex: 600 }}>
      <div className="bp-form-sheet" style={{ alignItems: 'center', padding: '20px' }}>
        <div className="bp-form-header" style={{ width: '100%', padding: '0 0 10px', borderBottom: 'none' }}>
          <div className="bp-form-title">Scan UPI QR</div>
          <button className="bp-icon-btn" onClick={onClose}><Ic.X /></button>
        </div>
        
        <div id="reader" style={{ width: '100%', maxWidth: '300px', borderRadius: '12px', overflow: 'hidden' }}></div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 12, marginBottom: 16 }}>Point camera at any UPI QR code.</p>
        
        <div style={{ width: '100%', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Or upload an image</span>
          <input type="file" ref={fileRef} accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          <button className="bp-btn-outline" onClick={() => fileRef.current?.click()} style={{ width: '100%' }}>
            <Ic.Upload /> Upload QR Image
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PRODUCT FORM ───
function ProductForm({ product, categories, onSave, onCancel }) {
  const isNew = !product?.id
  const [form, setForm] = useState({
    name:     product?.name     || '',
    category: product?.category || (categories[0] || 'Coffee'),
    price:    product?.price    || '',
    emoji:    product?.emoji    || '🍽️',
    badge:    product?.badge    || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── Variants state ──
  const [variants, setVariants] = useState(product?.variants || [])
  // newGroup form: { name, required, type }
  const [newGroup, setNewGroup] = useState(null) // null = hidden, obj = visible
  // newOption form per group: { [groupId]: { label, price } }
  const [newOpts, setNewOpts] = useState({})
  
  // variantsMatrix: { 'o1|o2': price }
  const [variantsMatrix, setVariantsMatrix] = useState(product?.variantsMatrix || {})

  const addGroup = () => {
    if (!newGroup?.name?.trim()) return
    const g = { 
      id: `g-${Date.now()}`, 
      name: newGroup.name.trim(), 
      required: newGroup.required ?? true, 
      type: newGroup.type || 'price',
      options: [] 
    }
    setVariants(vs => [...vs, g])
    setNewGroup(null)
  }

  const removeGroup = (gid) => setVariants(vs => vs.filter(g => g.id !== gid))

  const addOption = (gid) => {
    const opt = newOpts[gid]
    if (!opt?.label?.trim()) return
    const o = { id: `o-${Date.now()}`, label: opt.label.trim(), price: parseFloat(opt.price) || 0 }
    setVariants(vs => vs.map(g => g.id === gid ? { ...g, options: [...g.options, o] } : g))
    setNewOpts(prev => ({ ...prev, [gid]: { label: '', price: '' } }))
  }

  const removeOption = (gid, oid) => setVariants(vs => vs.map(g => g.id === gid ? { ...g, options: g.options.filter(o => o.id !== oid) } : g))

  const handleSave = () => {
    if (!form.name.trim()) return
    const price = parseFloat(form.price)
    // If they have a 'price' variant, the base price can be 0 or anything.
    // We only enforce base price > 0 if there are NO variants that set the price.
    const hasPriceVariant = variants.some(g => g.type === 'price')
    if (isNaN(price) || (price <= 0 && !hasPriceVariant)) return
    onSave({
      ...(product || {}),
      id:       product?.id || Date.now(),
      name:     form.name.trim(),
      category: form.category,
      price,
      emoji:    form.emoji || '🍽️',
      badge:    form.badge || undefined,
      variants: variants.length > 0 ? variants : undefined,
      variantsMatrix: Object.keys(variantsMatrix).length > 0 ? variantsMatrix : undefined,
    })
  }

  return (
    <div className="bp-form-overlay" onClick={onCancel}>
      <div className="bp-form-sheet" onClick={e => e.stopPropagation()}>
        <div className="bp-form-handle" />
        <div className="bp-form-header">
          <div className="bp-form-title">{isNew ? 'Add Product' : 'Edit Product'}</div>
          <button className="bp-icon-btn" onClick={onCancel}><Ic.X /></button>
        </div>
        <div className="bp-form-body">
          <div className="bp-field">
            <label className="bp-label">Emoji</label>
            <input className="bp-input bp-emoji-input" value={form.emoji} onChange={e => set('emoji', e.target.value)} maxLength={2} placeholder="🍽️" />
          </div>
          <div className="bp-field">
            <label className="bp-label">Name *</label>
            <input className="bp-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Masala Chai" autoFocus />
          </div>
          <div className="bp-field">
            <label className="bp-label">Category *</label>
            <select className="bp-select" value={form.category} onChange={e => set('category', e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="bp-field">
            <label className="bp-label">Default Price (₹) *</label>
            <input className="bp-input" type="number" inputMode="decimal" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0" min="0" />
            <span className="bp-label" style={{ fontSize: '0.72rem', marginTop: 4, color: 'var(--text-muted)', display: 'block' }}>Used if no "Price" variants are added</span>
          </div>
          <div className="bp-field">
            <label className="bp-label">Badge</label>
            <div className="bp-badge-row">
              {BADGE_OPTIONS.map(b => (
                <button key={b.value} className={`bp-badge-opt ${form.badge === b.value ? 'active' : ''}`} onClick={() => set('badge', b.value)} type="button">{b.label}</button>
              ))}
            </div>
          </div>

          {/* ── Variants ── */}
          <div className="bp-section-label" style={{ marginTop: 8 }}>
            Variants
            <span className="bp-variant-hint">optional — for items with sizes, fillings, etc.</span>
          </div>

          {variants.map(g => (
            <div key={g.id} className="bp-variant-group">
              <div className="bp-variant-group-header">
                <div className="bp-variant-group-name">
                  {g.name}
                  {g.required && <span className="bp-variant-req">Required</span>}
                  <span className="bp-variant-hint" style={{marginLeft: 4}}>{g.type === 'price' ? 'Sets Item Price' : 'Adds to Price'}</span>
                </div>
                <button className="bp-icon-btn bp-icon-btn-danger" onClick={() => removeGroup(g.id)} title="Remove group"><Ic.Trash /></button>
              </div>

              <div className="bp-variant-options">
                {g.options.map(o => {
                  const val = o.price !== undefined ? o.price : (o.priceAdj || 0)
                  return (
                    <div key={o.id} className="bp-variant-opt-row">
                      <span className="bp-variant-opt-label">{o.label}</span>
                      {g.type !== 'price' && (
                        <span className="bp-variant-opt-price">
                          {val > 0 ? `+₹${val}` : val < 0 ? `-₹${Math.abs(val)}` : 'Free'}
                        </span>
                      )}
                      <button className="bp-icon-btn bp-icon-btn-sm" onClick={() => removeOption(g.id, o.id)} title="Remove"><Ic.X /></button>
                    </div>
                  )
                })}
              </div>

              {/* Add option row */}
              <div className="bp-variant-add-opt">
                <input
                  className="bp-input bp-input-sm"
                  placeholder="Option label (e.g. 200g)"
                  value={newOpts[g.id]?.label || ''}
                  style={{ flex: 1 }}
                  onChange={e => setNewOpts(p => ({ ...p, [g.id]: { ...p[g.id], label: e.target.value } }))}
                  onKeyDown={e => e.key === 'Enter' && addOption(g.id)}
                />
                {g.type !== 'price' && (
                  <input
                    className="bp-input bp-input-sm bp-input-price"
                    placeholder="+₹ Extra"
                    type="number"
                    value={newOpts[g.id]?.price || ''}
                    onChange={e => setNewOpts(p => ({ ...p, [g.id]: { ...p[g.id], price: e.target.value } }))}
                    onKeyDown={e => e.key === 'Enter' && addOption(g.id)}
                  />
                )}
                <button className="bp-btn-primary bp-btn-xs" onClick={() => addOption(g.id)}><Ic.Plus /></button>
              </div>
            </div>
          ))}

          {/* Add variant group */}
          {newGroup ? (
            <div className="bp-variant-new-group">
              <input
                className="bp-input"
                placeholder="Group name (e.g. Size, Filling)"
                value={newGroup.name || ''}
                autoFocus
                onChange={e => setNewGroup(g => ({ ...g, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addGroup()}
              />
              <div className="bp-variant-req-row" style={{ marginTop: 4 }}>
                <select 
                  className="bp-select" 
                  style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                  value={newGroup.type} 
                  onChange={e => setNewGroup(g => ({ ...g, type: e.target.value }))}
                >
                  <option value="price">This variant sets the Item Price (e.g. Size)</option>
                  <option value="addon">This variant adds an Extra Charge (e.g. Toppings)</option>
                </select>
              </div>
              <div className="bp-variant-req-row">
                <label className="bp-variant-req-label">
                  <input
                    type="checkbox"
                    checked={newGroup.required ?? true}
                    onChange={e => setNewGroup(g => ({ ...g, required: e.target.checked }))}
                    style={{ marginRight: 6 }}
                  />
                  Required (must select before adding to cart)
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="bp-btn-ghost" style={{ flex: 1 }} onClick={() => setNewGroup(null)}>Cancel</button>
                <button className="bp-btn-primary" style={{ flex: 2 }} onClick={addGroup} disabled={!newGroup?.name?.trim()}>
                  <Ic.Check /> Add Group
                </button>
              </div>
            </div>
          ) : (
            <button className="bp-variant-add-group-btn" onClick={() => setNewGroup({ name: '', required: true, type: 'price' })}>
              <Ic.Plus /> Add Variant Group
            </button>
          )}

          {/* ── Matrix Pricing Table ── */}
          {(() => {
            const priceGroups = variants.filter(g => g.type === 'price' && g.options.length > 0)
            if (priceGroups.length === 0) return null

            let combos = []
            combos = priceGroups.reduce((acc, group) => {
              const opts = group.options
              if (acc.length === 0) return opts.map(o => [o])
              const newAcc = []
              acc.forEach(combo => {
                opts.forEach(o => {
                  newAcc.push([...combo, o])
                })
              })
              return newAcc
            }, [])

            return (
              <div className="bp-matrix-container">
                <div className="bp-section-label" style={{ marginTop: 24, marginBottom: 8 }}>Price Matrix</div>
                <div className="bp-matrix-table-wrap">
                  {priceGroups.length === 2 ? (
                    <table className="bp-matrix-table">
                      <thead>
                        <tr>
                          <th>{priceGroups[0].name} \ {priceGroups[1].name}</th>
                          {priceGroups[1].options.map(c => <th key={c.id}>{c.label}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {priceGroups[0].options.map(r => (
                          <tr key={r.id}>
                            <td><strong>{r.label}</strong></td>
                            {priceGroups[1].options.map(c => {
                              const key = `${r.id}|${c.id}`
                              // Fallback support for old data where price was on the option itself
                              let fallbackPrice = ''
                              if (!variantsMatrix[key]) {
                                fallbackPrice = r.price !== undefined ? r.price : (c.price !== undefined ? c.price : '')
                              }
                              return (
                                <td key={c.id}>
                                  <div className="bp-matrix-input-wrap">
                                    <span>₹</span>
                                    <input 
                                      type="number" 
                                      value={variantsMatrix[key] !== undefined ? variantsMatrix[key] : fallbackPrice} 
                                      onChange={e => setVariantsMatrix(m => ({ ...m, [key]: parseFloat(e.target.value) || '' }))} 
                                    />
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="bp-matrix-table">
                      <thead>
                        <tr>
                          <th>Combination</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {combos.map(combo => {
                          const key = combo.map(c => c.id).join('|')
                          let fallbackPrice = ''
                          if (!variantsMatrix[key]) {
                             fallbackPrice = combo[0].price !== undefined ? combo[0].price : ''
                          }
                          return (
                            <tr key={key}>
                              <td>{combo.map(c => c.label).join(' · ')}</td>
                              <td>
                                <div className="bp-matrix-input-wrap">
                                  <span>₹</span>
                                  <input 
                                    type="number" 
                                    value={variantsMatrix[key] !== undefined ? variantsMatrix[key] : fallbackPrice} 
                                    onChange={e => setVariantsMatrix(m => ({ ...m, [key]: parseFloat(e.target.value) || '' }))} 
                                  />
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )
          })()}

        </div>
        <div className="bp-form-footer">
          <button className="bp-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="bp-btn-primary" onClick={handleSave} disabled={!form.name.trim() || isNaN(parseFloat(form.price))}>
            <Ic.Check /> {isNew ? 'Add Product' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CATEGORY FORM ───
function CategoryForm({ categories, onAdd, onDelete }) {
  const [newCat, setNewCat] = useState('')
  const handleAdd = () => {
    const val = newCat.trim()
    if (!val || categories.includes(val)) return
    onAdd(val); setNewCat('')
  }
  return (
    <div className="bp-cat-section">
      <div className="bp-section-label">Categories</div>
      <div className="bp-cat-list">
        {categories.map(cat => (
          <div key={cat} className="bp-cat-row">
            <span className="bp-cat-name">{cat}</span>
            <button className="bp-icon-btn bp-icon-btn-danger" onClick={() => onDelete(cat)} title={`Remove ${cat}`}><Ic.Trash /></button>
          </div>
        ))}
      </div>
      <div className="bp-cat-add-row">
        <input className="bp-input" value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="New category name…" />
        <button className="bp-btn-primary bp-btn-sm" onClick={handleAdd}><Ic.Plus /> Add</button>
      </div>
    </div>
  )
}

// ─── PROFILE VIEW (read-only) ───
function ProfileView({ business, taxRateObj, onEdit, onRestoreBackup }) {
  const hasData = business.name || business.phone || business.email

  // Draws a premium branded QR card on a canvas and returns a blob
  const generateQRCard = () => new Promise(async (resolve, reject) => {
    try {
      const W = 600, H = 900
      const canvas = document.createElement('canvas')
      canvas.width = W; canvas.height = H
      const ctx = canvas.getContext('2d')

      // ── Background gradient (deep indigo → violet) ──
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, '#1e1b4b')
      bg.addColorStop(0.5, '#312e81')
      bg.addColorStop(1, '#4c1d95')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // ── Decorative circles ──
      ctx.save()
      ctx.globalAlpha = 0.07
      ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.arc(W - 60, 60, 140, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(60, H - 60, 120, 0, Math.PI * 2); ctx.fill()
      ctx.globalAlpha = 0.04
      ctx.beginPath(); ctx.arc(W / 2, H / 2, 280, 0, Math.PI * 2); ctx.fill()
      ctx.restore()

      // ── App logo emoji ──
      ctx.font = 'bold 40px serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#ffffff'
      ctx.fillText('🏪', W / 2, 72)

      // ── App name ──
      ctx.font = 'bold 28px Arial, sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.fillText('ManSula Nexus', W / 2, 110)

      // ── Tagline ──
      ctx.font = '16px Arial, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.fillText('Smart Billing & Payments', W / 2, 136)

      // ── White card ──
      const cardX = 60, cardY = 160, cardW = W - 120, cardH = 560
      const r = 28
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.4)'
      ctx.shadowBlur = 40
      ctx.shadowOffsetY = 16
      ctx.beginPath()
      ctx.moveTo(cardX + r, cardY)
      ctx.lineTo(cardX + cardW - r, cardY)
      ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + r)
      ctx.lineTo(cardX + cardW, cardY + cardH - r)
      ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - r, cardY + cardH)
      ctx.lineTo(cardX + r, cardY + cardH)
      ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - r)
      ctx.lineTo(cardX, cardY + r)
      ctx.quadraticCurveTo(cardX, cardY, cardX + r, cardY)
      ctx.closePath()
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.restore()

      // ── "Scan & Pay" pill label ──
      ctx.save()
      const pillW = 130, pillH = 32, pillX = W / 2 - pillW / 2, pillY = cardY + 24
      ctx.beginPath()
      ctx.roundRect(pillX, pillY, pillW, pillH, 16)
      const pillGrad = ctx.createLinearGradient(pillX, 0, pillX + pillW, 0)
      pillGrad.addColorStop(0, '#6366f1')
      pillGrad.addColorStop(1, '#a855f7')
      ctx.fillStyle = pillGrad
      ctx.fill()
      ctx.restore()
      ctx.font = 'bold 14px Arial, sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.fillText('SCAN & PAY', W / 2, pillY + 21)

      // ── Load & draw QR image ──
      const qrSize = 260
      const qrX = W / 2 - qrSize / 2, qrY = cardY + 76
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&qzone=2&color=312e81&bgcolor=ffffff&data=${encodeURIComponent(`upi://pay?pa=${business.upiId}&pn=${encodeURIComponent(business.name || 'ManSula Nexus')}&cu=INR`)}`
      const qrImg = new Image(); qrImg.crossOrigin = 'anonymous'
      await new Promise((res2, rej2) => { qrImg.onload = res2; qrImg.onerror = rej2; qrImg.src = qrUrl })

      // QR background with subtle border
      ctx.save()
      ctx.shadowColor = 'rgba(99,102,241,0.15)'
      ctx.shadowBlur = 20
      ctx.fillStyle = '#f8f8ff'
      ctx.beginPath(); ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 16); ctx.fill()
      ctx.restore()
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

      // ── Logo circle overlay in center of QR ──
      const lx = W / 2, ly = qrY + qrSize / 2
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.2)'
      ctx.shadowBlur = 8
      ctx.beginPath(); ctx.arc(lx, ly, 26, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'; ctx.fill()
      ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2.5; ctx.stroke()
      ctx.restore()
      // Emoji logo
      ctx.font = '26px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(business.logo || '🏪', lx, ly + 1)
      ctx.textBaseline = 'alphabetic'

      // ── Divider ──
      const divY = qrY + qrSize + 30
      ctx.strokeStyle = '#e8e8f0'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(cardX + 30, divY); ctx.lineTo(cardX + cardW - 30, divY); ctx.stroke()

      // ── Business name ──
      ctx.font = 'bold 26px Arial, sans-serif'
      ctx.fillStyle = '#1e1b4b'
      ctx.textAlign = 'center'
      ctx.fillText(business.name || 'ManSula Nexus', W / 2, divY + 38)

      // ── UPI ID pill ──
      const upiFontSize = 15
      ctx.font = `${upiFontSize}px Arial, sans-serif`
      const upiTxtW = ctx.measureText(business.upiId).width
      const upiPillW = upiTxtW + 40, upiPillH = 30
      const upiPillX = W / 2 - upiPillW / 2, upiPillY = divY + 52
      ctx.save()
      ctx.beginPath(); ctx.roundRect(upiPillX, upiPillY, upiPillW, upiPillH, 15)
      ctx.fillStyle = '#ede9fe'; ctx.fill()
      ctx.restore()
      ctx.font = `600 ${upiFontSize}px Arial, sans-serif`
      ctx.fillStyle = '#6d28d9'
      ctx.fillText(business.upiId, W / 2, upiPillY + 20)

      // ── "No amount pre-set" note ──
      ctx.font = '13px Arial, sans-serif'
      ctx.fillStyle = '#9ca3af'
      ctx.fillText('No amount pre-set · Powered by UPI', W / 2, divY + 104)

      // ── UPI logo text badge ──
      const badgeW = 80, badgeH = 28, badgeX = W / 2 - badgeW / 2, badgeY = divY + 118
      ctx.save()
      const badgeGrad = ctx.createLinearGradient(badgeX, 0, badgeX + badgeW, 0)
      badgeGrad.addColorStop(0, '#f97316')
      badgeGrad.addColorStop(0.5, '#ec4899')
      badgeGrad.addColorStop(1, '#8b5cf6')
      ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 14)
      ctx.fillStyle = badgeGrad; ctx.fill()
      ctx.restore()
      ctx.font = 'bold 14px Arial, sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.fillText('UPI', W / 2, badgeY + 19)

      // ── Footer ──
      const footY = H - 60
      ctx.font = 'bold 14px Arial, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fillText('Generated by', W / 2, footY)
      ctx.font = 'bold 18px Arial, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillText('ManSula Nexus', W / 2, footY + 22)
      ctx.font = '12px Arial, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fillText('mansulanexus.app', W / 2, footY + 40)

      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas failed')), 'image/png')
    } catch (err) { reject(err) }
  })

  const handleDownloadQR = async () => {
    try {
      const blob = await generateQRCard()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${(business.name || 'Business').replace(/\s+/g, '-')}-UPI-QR.png`
      a.click()
    } catch (e) { console.error(e); alert('Failed to generate QR card') }
  }

  const handleShareQR = async () => {
    try {
      const blob = await generateQRCard()
      const file = new File([blob], 'upi-qr-card.png', { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: `Pay ${business.name || 'us'} via UPI`, text: `UPI ID: ${business.upiId}`, files: [file] })
      } else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${(business.name || 'Business').replace(/\s+/g, '-')}-UPI-QR.png`
        a.click()
      }
    } catch (e) { console.error(e) }
  }


  if (!hasData) {
    return (
      <div className="bp-profile-empty">
        <div className="bp-profile-empty-logo">🏪</div>
        <div className="bp-profile-empty-title">No business info yet</div>
        <div className="bp-profile-empty-sub">Set up your business name, contact, and legal details to get started.</div>
        <button className="bp-btn-primary" onClick={onEdit}><Ic.Edit /> Set Up Business</button>
        <div className="bp-profile-empty-divider">or</div>
        <button className="bp-btn-outline" onClick={onRestoreBackup} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', fontSize: '0.9rem' }}>
          <Ic.Upload /> Restore from Backup
        </button>
        <div className="bp-profile-empty-sub" style={{ marginTop: 0 }}>Have a previously downloaded <code>.json</code> backup file? Upload it to restore all your data instantly.</div>
      </div>
    )
  }

  const InfoRow = ({ icon: IcComp, label, value }) => value ? (
    <div className="bp-info-row">
      <span className="bp-info-icon"><IcComp /></span>
      <div className="bp-info-content">
        <div className="bp-info-label">{label}</div>
        <div className="bp-info-value">{value}</div>
      </div>
    </div>
  ) : null

  return (
    <div className="bp-profile-view">
      {/* Hero card */}
      <div className="bp-profile-hero">
        <div className="bp-profile-hero-logo">{business.logo || '🏪'}</div>
        <div className="bp-profile-hero-name">{business.name || '—'}</div>
        {business.type && <div className="bp-profile-hero-type">{business.type}</div>}
        {business.tagline && <div className="bp-profile-hero-tagline">"{business.tagline}"</div>}
        <button className="bp-profile-edit-btn" onClick={onEdit}><Ic.Edit /> Edit Profile</button>
      </div>

      {/* Info rows */}
      <div className="bp-info-card">
        <div className="bp-info-card-title">Contact Details</div>
        <InfoRow icon={Ic.Phone}  label="Phone"   value={business.phone} />
        <InfoRow icon={Ic.Mail}   label="Email"   value={business.email} />
        <InfoRow icon={Ic.MapPin} label="Address" value={business.address} />
      </div>

      {(business.gstin || business.upiId || taxRateObj) && (
        <div className="bp-info-card">
          <div className="bp-info-card-title">Tax &amp; Legal / Payments</div>
          <InfoRow icon={Ic.Receipt} label="GSTIN" value={business.gstin} />
          <InfoRow icon={Ic.QrCode} label="UPI ID" value={business.upiId} />
          
          {business.upiId && (
            <div className="upi-qr-section" style={{ margin: '12px 16px', border: '1px dashed var(--border-color)', background: 'var(--bg-subtle, rgba(0,0,0,0.02))' }}>
              <div className="upi-qr-wrap">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&qzone=1&color=3730a3&bgcolor=ffffff&data=${encodeURIComponent(`upi://pay?pa=${business.upiId}&pn=${encodeURIComponent(business.name || 'ManSula Nexus')}&cu=INR`)}`}
                  alt="UPI QR Code"
                  className="upi-qr-img"
                  width={180} height={180}
                />
                <div className="upi-qr-logo">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" width="24" height="24" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button className="bp-btn-outline" style={{ fontSize: '0.8rem', padding: '6px 16px', color: '#10b981', borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.05)', borderRadius: '20px', fontWeight: 600 }} onClick={handleShareQR}>
                  <Ic.Share /> Share
                </button>
                <button className="bp-btn-outline" style={{ fontSize: '0.8rem', padding: '6px 16px', color: '#10b981', borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.05)', borderRadius: '20px', fontWeight: 600 }} onClick={handleDownloadQR}>
                  <Ic.Download /> Download
                </button>
              </div>
            </div>
          )}

          {taxRateObj && <InfoRow icon={Ic.Tag} label="Tax Rate" value={taxRateObj.label} />}
        </div>
      )}
    </div>
  )
}

// ─── MAIN COMPONENT ───
export default function BusinessProfile({ onClose, taxRateObj, onTaxRate, taxRates }) {
  const [tab, setTab]           = useState('info')
  const [infoMode, setInfoMode] = useState('view')   // 'view' | 'edit'
  const [business, setBusiness] = useState(DEFAULT_BUSINESS)
  const [products, setProducts] = useState(DEFAULT_PRODUCTS)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [loaded, setLoaded]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [searchQ, setSearchQ]   = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [importStatus, setImportStatus] = useState(null) // null | 'ok' | 'err'
  const [showScanner, setShowScanner] = useState(false)
  const importRef = useRef(null)

  // Load from IDB
  useEffect(() => {
    async function load() {
      const [b, p, c] = await Promise.all([dbGet(KEY_BUSINESS), dbGet(KEY_PRODUCTS), dbGet(KEY_CATEGORIES)])
      if (b) setBusiness({ ...DEFAULT_BUSINESS, ...b })
      if (p) setProducts(p)
      if (c) setCategories(c)
      setLoaded(true)
    }
    load()
  }, [])

  // Save business info
  const saveBusiness = async () => {
    await dbSet(KEY_BUSINESS, business)
    setSaved(true)
    setInfoMode('view')
    setTimeout(() => setSaved(false), 2500)
  }

  // ── Export backup ──
  const handleExport = () => {
    const payload = {
      _version: 1,
      _exported: new Date().toISOString(),
      business,
      products,
      categories,
    }
    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    const name = (business.name || 'mansula-nexus').replace(/\s+/g, '-').toLowerCase()
    a.href     = url
    a.download = `${name}-backup-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Import backup ──
  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data._version) throw new Error('Invalid backup')
      if (data.business)   { setBusiness({ ...DEFAULT_BUSINESS, ...data.business }); await dbSet(KEY_BUSINESS,   data.business) }
      if (data.products)   { setProducts(data.products);   await dbSet(KEY_PRODUCTS,   data.products) }
      if (data.categories) { setCategories(data.categories); await dbSet(KEY_CATEGORIES, data.categories) }
      setImportStatus('ok')
      setInfoMode('view')
    } catch {
      setImportStatus('err')
    }
    e.target.value = ''
    setTimeout(() => setImportStatus(null), 3500)
  }

  // Product mutations
  const saveProduct = async (prod) => {
    const next = editProduct === 'new' ? [...products, prod] : products.map(p => p.id === prod.id ? prod : p)
    setProducts(next); await dbSet(KEY_PRODUCTS, next); setEditProduct(null)
  }
  const deleteProduct = async (id) => {
    const next = products.filter(p => p.id !== id); setProducts(next); await dbSet(KEY_PRODUCTS, next)
  }
  const addCategory = async (cat) => {
    const next = [...categories, cat]; setCategories(next); await dbSet(KEY_CATEGORIES, next)
  }
  const deleteCategory = async (cat) => {
    const next = categories.filter(c => c !== cat); setCategories(next); await dbSet(KEY_CATEGORIES, next)
  }

  const filteredProducts = products.filter(p => {
    const matchQ   = !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase())
    const matchCat = filterCat === 'All' || p.category === filterCat
    return matchQ && matchCat
  })

  const tabs = [
    { id: 'info',       label: 'Profile',    Icon: Ic.Store },
    { id: 'menu',       label: 'Menu',       Icon: Ic.Menu  },
    { id: 'categories', label: 'Categories', Icon: Ic.Tag   },
    { id: 'backup',     label: 'Backup',     Icon: Ic.Download },
  ]

  if (!loaded) {
    return <div className="bp-root"><div className="bp-loading">Loading…</div></div>
  }

  return (
    <div className="bp-root">
      {showScanner && (
        <UpiScanner 
          onClose={() => setShowScanner(false)} 
          onScan={(id) => { 
            setBusiness(b => ({ ...b, upiId: id }))
            setShowScanner(false)
          }} 
        />
      )}

      {/* Hidden file input for import */}
      <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />

      {/* Product form sheet */}
      {editProduct !== null && (
        <ProductForm product={editProduct === 'new' ? null : editProduct} categories={categories} onSave={saveProduct} onCancel={() => setEditProduct(null)} />
      )}

      {/* Header */}
      <header className="bp-header">
        <button className="bp-back-btn" onClick={onClose}><Ic.Back /></button>
        <div className="bp-header-title">
          <div className="bp-header-main">Business Profile</div>
          <div className="bp-header-sub">{business.name || 'Set up your business'}</div>
        </div>
        {tab === 'info' && infoMode === 'edit' && (
          <button className={`bp-save-btn ${saved ? 'saved' : ''}`} onClick={saveBusiness}>
            {saved ? <><Ic.Check /> Saved</> : <><Ic.Save /> Save</>}
          </button>
        )}
      </header>

      {/* Import status toast */}
      {importStatus && (
        <div className={`bp-import-toast ${importStatus}`}>
          {importStatus === 'ok' ? <><Ic.Check /> Backup restored successfully!</> : <><Ic.AlertTri /> Invalid backup file</>}
        </div>
      )}

      {/* Tabs */}
      <div className="bp-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`bp-tab ${tab === t.id ? 'active' : ''}`} onClick={() => { setTab(t.id); if (t.id !== 'info') setInfoMode('view') }}>
            <span className="bp-tab-icon"><t.Icon /></span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Profile (view / edit) ── */}
      {tab === 'info' && (
        <div className="bp-body">
          {infoMode === 'view' ? (
            <ProfileView business={business} taxRateObj={taxRateObj} onEdit={() => setInfoMode('edit')} onRestoreBackup={() => importRef.current?.click()} />
          ) : (
            <>
              {/* Edit form */}
              <div className="bp-logo-section">
                <div className="bp-logo-preview"><span>{business.logo || '🏪'}</span></div>
                <div className="bp-logo-hint">Change logo emoji below</div>
                <input className="bp-input bp-logo-input" value={business.logo} onChange={e => setBusiness(b => ({ ...b, logo: e.target.value }))} maxLength={2} placeholder="🏪" />
              </div>

              <div className="bp-section-label">Basic Info</div>
              <div className="bp-field">
                <label className="bp-label">Business Name</label>
                <input className="bp-input" value={business.name} onChange={e => setBusiness(b => ({ ...b, name: e.target.value }))} placeholder="e.g. Mansu's Café" />
              </div>
              <div className="bp-field">
                <label className="bp-label">Business Type</label>
                <select className="bp-select" value={business.type} onChange={e => setBusiness(b => ({ ...b, type: e.target.value }))}>
                  {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="bp-field">
                <label className="bp-label">Tagline</label>
                <input className="bp-input" value={business.tagline} onChange={e => setBusiness(b => ({ ...b, tagline: e.target.value }))} placeholder="e.g. Fresh brews, warm smiles" />
              </div>

              <div className="bp-section-label">Contact</div>
              <div className="bp-field">
                <label className="bp-label">Phone</label>
                <input className="bp-input" type="tel" inputMode="numeric" value={business.phone} onChange={e => setBusiness(b => ({ ...b, phone: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
              <div className="bp-field">
                <label className="bp-label">Email</label>
                <input className="bp-input" type="email" inputMode="email" value={business.email} onChange={e => setBusiness(b => ({ ...b, email: e.target.value }))} placeholder="hello@yourbusiness.com" />
              </div>
              <div className="bp-field">
                <label className="bp-label">Address</label>
                <textarea className="bp-input bp-textarea" value={business.address} onChange={e => setBusiness(b => ({ ...b, address: e.target.value }))} placeholder="Shop No., Street, City, State — PIN" rows={2} />
              </div>

              <div className="bp-section-label">Tax &amp; Legal / Payments</div>
              <div className="bp-field">
                <label className="bp-label">Tax / GST Rate (applied at checkout)</label>
                <select className="bp-input" value={taxRateObj.value} onChange={e => onTaxRate(taxRates.find(t => t.value === parseFloat(e.target.value)))}>
                  {taxRates.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="bp-field">
                <label className="bp-label">GSTIN</label>
                <input className="bp-input" value={business.gstin} onChange={e => setBusiness(b => ({ ...b, gstin: e.target.value.toUpperCase() }))} placeholder="22AAAAA0000A1Z5" maxLength={15} style={{ fontFamily: 'monospace', letterSpacing: '0.06em' }} />
              </div>
              <div className="bp-field">
                <label className="bp-label">UPI ID</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input className="bp-input" style={{ flex: 1 }} value={business.upiId} onChange={e => setBusiness(b => ({ ...b, upiId: e.target.value }))} placeholder="e.g. 9876543210@ybl" />
                  <button className="bp-btn-outline" style={{ padding: '0 14px' }} onClick={() => setShowScanner(true)}>
                    <Ic.QrCode /> Scan
                  </button>
                </div>
              </div>

              <div className="bp-edit-actions">
                <button className="bp-btn-ghost" onClick={() => setInfoMode('view')}>Cancel</button>
                <button className="bp-btn-primary bp-save-full" style={{ flex: 2 }} onClick={saveBusiness}>
                  {saved ? <><Ic.Check /> Saved!</> : <><Ic.Save /> Save Profile</>}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab: Menu ── */}
      {tab === 'menu' && (
        <div className="bp-body">
          <div className="bp-menu-toolbar">
            <div className="bp-search-wrap">
              <span className="bp-search-icon"><Ic.Search /></span>
              <input className="bp-search-input" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search products…" />
            </div>
            <button className="bp-btn-primary bp-btn-sm" onClick={() => setEditProduct('new')}><Ic.Plus /> Add</button>
          </div>
          <div className="bp-cat-chips">
            {['All', ...categories].map(c => (
              <button key={c} className={`bp-cat-chip ${filterCat === c ? 'active' : ''}`} onClick={() => setFilterCat(c)}>{c}</button>
            ))}
          </div>
          <div className="bp-product-list">
            {filteredProducts.length === 0 && (
              <div className="bp-empty">
                <div className="bp-empty-icon">🍽️</div>
                <div className="bp-empty-text">No products yet</div>
                <div className="bp-empty-sub">Tap "Add" to create your first menu item</div>
              </div>
            )}
            {filteredProducts.map(prod => (
              <div key={prod.id} className="bp-product-row">
                <div className="bp-product-emoji">{prod.emoji}</div>
                <div className="bp-product-info">
                  <div className="bp-product-name">
                    {prod.name}
                    {prod.badge && <span className={`bp-badge bp-badge-${prod.badge}`}>{prod.badge}</span>}
                    {prod.variants?.length > 0 && <span className="bp-badge variant-badge" style={{marginLeft: 6}}>Variants</span>}
                  </div>
                  <div className="bp-product-meta">
                    {prod.category} · {prod.variants?.length > 0 ? `from ₹${prod.price}` : `₹${prod.price}`}
                  </div>
                </div>
                <div className="bp-product-actions">
                  <button className="bp-icon-btn" onClick={() => setEditProduct(prod)} title="Edit"><Ic.Edit /></button>
                  <button className="bp-icon-btn bp-icon-btn-danger" onClick={() => deleteProduct(prod.id)} title="Delete"><Ic.Trash /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Categories ── */}
      {tab === 'categories' && (
        <div className="bp-body">
          <p className="bp-hint-text">Categories organise your menu. Removing a category won't delete products — they'll still appear under their original category.</p>
          <CategoryForm categories={categories} onAdd={addCategory} onDelete={deleteCategory} />
        </div>
      )}

      {/* ── Tab: Backup ── */}
      {tab === 'backup' && (
        <div className="bp-body">
          {/* Export */}
          <div className="bp-backup-card bp-backup-export">
            <div className="bp-backup-card-icon"><Ic.Download /></div>
            <div className="bp-backup-card-info">
              <div className="bp-backup-card-title">Save Backup to Device</div>
              <div className="bp-backup-card-desc">Downloads a <code>.json</code> file containing your business profile, full product catalogue, and category list. Keep it safe — you can restore everything from this file.</div>
            </div>
            <button className="bp-btn-primary" onClick={handleExport}>
              <Ic.Download /> Download Backup
            </button>
          </div>

          {/* Import */}
          <div className="bp-backup-card bp-backup-import">
            <div className="bp-backup-card-icon"><Ic.Upload /></div>
            <div className="bp-backup-card-info">
              <div className="bp-backup-card-title">Restore from Backup</div>
              <div className="bp-backup-card-desc">Upload a previously downloaded <code>.json</code> backup file to restore your business data, products, and categories. This will overwrite your current data.</div>
            </div>
            <button className="bp-btn-outline" onClick={() => importRef.current?.click()}>
              <Ic.Upload /> Restore Backup
            </button>
          </div>

          {/* Warning */}
          <div className="bp-backup-warning">
            <span className="bp-backup-warning-icon"><Ic.AlertTri /></span>
            <div>
              <strong>When to use this</strong><br />
              If you clear browser storage, reset the app, or switch to a new device, use your downloaded backup to restore all your data instantly.
            </div>
          </div>

          {/* What's included */}
          <div className="bp-backup-info-box">
            <div className="bp-backup-info-title">📦 Backup includes</div>
            <ul className="bp-backup-info-list">
              <li>✅ Business name, type, contact & GSTIN</li>
              <li>✅ Full product menu ({products.length} items)</li>
              <li>✅ All categories ({categories.length} total)</li>
              <li>❌ Orders & sales history (not stored yet)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
