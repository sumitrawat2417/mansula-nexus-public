import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getInventoryItems, saveInventoryItem, deleteInventoryItem,
  adjustInventoryStock, logWastage,
  getPurchaseLogs, savePurchaseLog, deletePurchaseLog,
  getSuppliers, saveSupplier, deleteSupplier,
  dbGet, exportInventoryBackup, restoreInventoryBackup, clearAllInventoryData
} from './db.js'
import DateFilterDrawer, { computeQuick } from './DateFilterDrawer.jsx'
import { useAlert } from './AlertDialog.jsx'

// ── Helpers ──
const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const fmtCur = (n) => `₹${fmt(n)}`
const uid = () => `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
const nowMonthKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
const fmtDate = (ts) => ts ? new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtDateTime = (ts) => ts ? new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const UNITS = ['pcs', 'kg', 'gm', 'L', 'mL', 'bottles', 'boxes', 'bags', 'dozen', 'plates', 'packets']
const WASTAGE_REASONS = ['Spoiled', 'Spilled', 'Expired', 'Damaged Packaging', 'Quality Issue', 'Other']

// ── Icon set ──
const Ic = {
  Close: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  Minus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  Warn: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  Box: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
  Receipt: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="12" y2="17" /></svg>,
  Supplier: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="12" x2="12" y2="17" /><line x1="9.5" y1="14.5" x2="14.5" y2="14.5" /></svg>,
  CalDay: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="12" y1="14" x2="12" y2="18" /><line x1="10" y1="16" x2="14" y2="16" /></svg>,
  ChevDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
  ChevRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  Link: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
  History: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.5" /></svg>,
  Phone: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 11.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 .77l3-.01a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.45a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 15z" /></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  WhatsApp: () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>,
  DB: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Export: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Upload: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
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

// ── Export Modal ──
function ExportModal({ onClose, onExportCSV, onBackup, onRestoreRef, onClearAll }) {
  const cardStyle = { padding: '12px 14px', gap: '10px' };
  const iconStyle = { width: 36, height: 36, flexShrink: 0 };

  return (
    <div className="inv-modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="inv-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450, padding: 0 }}>
        <div className="inv-modal-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Data & Export</div>
          <button className="inv-modal-close" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Ic.Close /></button>
        </div>
        
        <div className="inv-modal-body" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          <div className="bp-backup-card bp-backup-export" style={cardStyle}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div className="bp-backup-card-icon" style={{ ...iconStyle, background: 'rgba(100,116,139,0.12)', color: '#64748b' }}><span style={{ width: 18, height: 18, display: 'flex' }}><Ic.Receipt /></span></div>
              <div className="bp-backup-card-info">
                <div className="bp-backup-card-title" style={{ fontSize: '0.85rem', marginBottom: 2 }}>Export CSV</div>
                <div className="bp-backup-card-desc" style={{ fontSize: '0.72rem', lineHeight: 1.3 }}>Download a spreadsheet of your current live stock inventory.</div>
              </div>
            </div>
            <button className="bp-btn-primary" style={{ background: '#64748b', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }} onClick={onExportCSV}>
              <span style={{ width: 14, height: 14, display: 'flex' }}><Ic.Export /></span> Download CSV
            </button>
          </div>
          
          <div className="bp-backup-card bp-backup-export" style={cardStyle}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div className="bp-backup-card-icon" style={iconStyle}><span style={{ width: 18, height: 18, display: 'flex' }}><Ic.Download /></span></div>
              <div className="bp-backup-card-info">
                <div className="bp-backup-card-title" style={{ fontSize: '0.85rem', marginBottom: 2 }}>Save Backup to Device</div>
                <div className="bp-backup-card-desc" style={{ fontSize: '0.72rem', lineHeight: 1.3 }}>Downloads a <code>.json</code> file containing all your inventory stock, suppliers, and purchase logs.</div>
              </div>
            </div>
            <button className="bp-btn-primary" style={{ background: 'var(--brand-primary)', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }} onClick={onBackup}>
              <span style={{ width: 14, height: 14, display: 'flex' }}><Ic.Download /></span> Download Backup
            </button>
          </div>

          <div className="bp-backup-card bp-backup-import" style={cardStyle}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div className="bp-backup-card-icon" style={iconStyle}><span style={{ width: 18, height: 18, display: 'flex' }}><Ic.Upload /></span></div>
              <div className="bp-backup-card-info">
                <div className="bp-backup-card-title" style={{ fontSize: '0.85rem', marginBottom: 2 }}>Restore from Backup</div>
                <div className="bp-backup-card-desc" style={{ fontSize: '0.72rem', lineHeight: 1.3 }}>Upload a previously downloaded <code>.json</code> backup file to restore your inventory data.</div>
              </div>
            </div>
            <button className="bp-btn-outline" style={{ background: 'transparent', color: '#10b981', border: '1.5px solid #10b981', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }} onClick={() => onRestoreRef.current?.click()}>
              <span style={{ width: 14, height: 14, display: 'flex' }}><Ic.Upload /></span> Restore Backup
            </button>
          </div>

          <div className="bp-backup-card" style={{ ...cardStyle, borderColor: 'rgba(239,68,68,0.3)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div className="bp-backup-card-icon" style={{ ...iconStyle, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}><span style={{ width: 18, height: 18, display: 'flex' }}><Ic.Trash /></span></div>
              <div className="bp-backup-card-info">
                <div className="bp-backup-card-title" style={{ fontSize: '0.85rem', color: '#ef4444', marginBottom: 2 }}>Wipe Inventory Data</div>
                <div className="bp-backup-card-desc" style={{ fontSize: '0.72rem', lineHeight: 1.3 }}>Permanently delete all live stock, purchase logs, and suppliers. This cannot be undone.</div>
              </div>
            </div>
            <button className="bp-btn-danger" style={{ background: 'transparent', color: '#ef4444', border: '1.5px solid #ef4444', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }} onClick={onClearAll}>
              <span style={{ width: 14, height: 14, display: 'flex' }}><Ic.Trash /></span> Reset Inventory
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// TAB 1: LIVE STOCK
// ══════════════════════════════════════════════════════════════════

function StockCard({ item, purchaseLogs, onAdjust, onWastage, onEdit, onDelete, onShowPriceGraph }) {
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
          {(() => {
            const myLogs = (purchaseLogs || []).flatMap(l => (l.items || []).filter(i => i.productId === item.id).map(i => ({ date: l.purchasedAt, price: i.costPerUnit, qty: i.qty }))).filter(x => x.price > 0)
            if (myLogs.length > 0) {
              const prices = myLogs.map(x => x.price)
              const minP = Math.min(...prices)
              const maxP = Math.max(...prices)
              if (minP !== maxP) {
                return <span className="inv-price-val inv-price-interactive" onClick={() => onShowPriceGraph(item, myLogs)}>{fmtCur(minP)} - {fmtCur(maxP)}</span>
              }
            }
            return <span className="inv-price-val">{fmtCur(item.costPrice)}</span>
          })()}
        </div>
        <div className="inv-price-pair">
          <span className="inv-price-label">Stock Value</span>
          {(() => {
            const myLogs = (purchaseLogs || []).flatMap(l => (l.items || []).filter(i => i.productId === item.id)).filter(x => x.costPerUnit > 0 && x.qty > 0)
            let avgCost = item.costPrice || 0
            if (myLogs.length > 0) {
              const totalCost = myLogs.reduce((s, x) => s + (x.qty * x.costPerUnit), 0)
              const totalQty = myLogs.reduce((s, x) => s + x.qty, 0)
              avgCost = totalCost / totalQty
            }
            return <span className="inv-price-val">{fmtCur(item.currentQty * avgCost)}</span>
          })()}
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

function PriceHistoryModal({ item, data, onClose }) {
  const [dateRange, setDateRange] = useState(() => computeQuick('alltime'))
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  const filteredData = data.filter(d => d.date >= dateRange.fromTs && d.date <= dateRange.toTs)
  const sorted = [...filteredData].sort((a, b) => a.date - b.date)

  const width = 500
  const height = 220
  const padding = 45

  const prices = sorted.map(d => d.price)
  const maxP = prices.length ? Math.max(...prices) : 0
  const minP = prices.length ? Math.min(...prices) : 0 // Actual lowest price
  const axisMinP = 0 // Axis starts at 0
  const rangeP = maxP - axisMinP || 1

  const dates = sorted.map(d => d.date)
  const minD = dates.length ? Math.min(...dates) : 0
  const maxD = dates.length ? Math.max(...dates) : 0
  const rangeD = maxD - minD || 1

  const getX = (d) => padding + ((d - minD) / rangeD) * (width - padding * 2)
  const getY = (p) => height - padding - ((p - axisMinP) / rangeP) * (height - padding * 2)

  const points = sorted.map(d => `${getX(d.date)},${getY(d.price)}`).join(' ')

  return (
    <Modal title={`Price History: ${item.name}`} onClose={onClose}>
      {filterDrawerOpen && (
        <DateFilterDrawer current={dateRange} onApply={setDateRange} onClose={() => setFilterDrawerOpen(false)} />
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="or-date-filter-btn" onClick={() => setFilterDrawerOpen(true)}>
          <Ic.CalDay /> {dateRange.label}
        </button>
      </div>
      <div className="inv-price-graph-wrap">
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>No price data in this date range.</div>
        ) : (
          <div style={{ overflowX: 'auto', paddingBottom: 10 }}>
            <svg width={Math.max(width, sorted.length * 60 + padding * 2)} height={height} style={{ minWidth: '100%', display: 'block', overflow: 'visible' }}>
              <line x1={padding} y1={height - padding} x2={Math.max(width, sorted.length * 60 + padding * 2) - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
              <line x1={padding} y1={padding} x2={Math.max(width, sorted.length * 60 + padding * 2) - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="4 4" strokeLinecap="round" />

              <text x={padding - 10} y={height - padding + 4} textAnchor="end" fontSize="12" fill="#64748b" fontWeight="600">{fmtCur(axisMinP)}</text>
              <text x={padding - 10} y={padding + 4} textAnchor="end" fontSize="12" fill="#64748b" fontWeight="600">{fmtCur(maxP)}</text>

              {sorted.map((d, i) => {
                const getDynamicX = (index) => padding + 30 + (index * 60);
                const x = getDynamicX(i);
                const y = getY(d.price);
                const barWidth = 24;
                const baseLine = height - padding;
                const dObj = new Date(d.date);
                const sDate = `${dObj.getDate()} ${dObj.toLocaleString('default', { month: 'short' })}`;

                return (
                  <g key={i} className="inv-graph-point">
                    <rect x={x - barWidth / 2} y={y} width={barWidth} height={Math.max(2, baseLine - y)} fill="var(--brand-primary)" rx="4" />
                    <text x={x} y={y - 8} textAnchor="middle" fontSize="11" fill="#1e293b" fontWeight="bold" opacity="0" className="inv-point-tooltip">{fmtCur(d.price)}</text>
                    <text x={x} y={baseLine + 18} textAnchor="middle" fontSize="10" fill="#64748b">{sDate}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>
      {sorted.length > 0 && (
        <div className="inv-price-graph-meta">
          <div><span className="inv-price-graph-badge">Lowest</span> <strong>{fmtCur(minP)}</strong></div>
          <div><span className="inv-price-graph-badge">Highest</span> <strong>{fmtCur(maxP)}</strong></div>
        </div>
      )}
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
  const [purchaseLogs, setPurchaseLogs] = useState([])
  const [priceGraphItem, setPriceGraphItem] = useState(null)

  const load = useCallback(async () => {
    const data = await getInventoryItems()
    const logs = await getPurchaseLogs()
    setItems(data)
    setPurchaseLogs(logs)
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
    const rows = [['Name', 'Category', 'Unit', 'Qty', 'Low Threshold', 'Cost Price', 'Selling Price', 'Stock Value', 'Wastage Count']]
    filtered.forEach(i => rows.push([i.name, i.category, i.unit, i.currentQty, i.lowStockThreshold, i.costPrice, i.sellingPrice, (i.currentQty * i.costPrice).toFixed(2), (i.wastageLog || []).length]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `inventory-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = items.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.category || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'low' && i.isLowStock && i.currentQty > 0) || (filter === 'out' && i.currentQty === 0) || (filter === 'linked' && i.isMenuLinked)
    return matchSearch && matchFilter
  })

  const getAvgCost = (item) => {
    const myLogs = (purchaseLogs || []).flatMap(l => (l.items || []).filter(li => li.productId === item.id)).filter(x => x.costPerUnit > 0 && x.qty > 0)
    if (myLogs.length === 0) return item.costPrice || 0
    const totalCost = myLogs.reduce((s, x) => s + (x.qty * x.costPerUnit), 0)
    const totalQty = myLogs.reduce((s, x) => s + x.qty, 0)
    return totalCost / totalQty
  }

  const totalValue = items.reduce((s, i) => s + (i.currentQty * getAvgCost(i)), 0)
  const lowCount = items.filter(i => i.isLowStock).length
  const outCount = items.filter(i => i.currentQty === 0).length
  const totalWastage = items.reduce((s, i) => s + (i.wastageLog || []).reduce((a, w) => a + w.qty, 0), 0)

  return (
    <div className="inv-tab-content">
      {/* KPI Strip */}
      <div className="inv-kpi-strip">
        <div className="inv-kpi-card">
          <div className="inv-kpi-label">Total Items</div>
          <div className="inv-kpi-val">{items.length}</div>
        </div>
        <div className="inv-kpi-card">
          <div className="inv-kpi-label">Stock Value</div>
          <div className="inv-kpi-val">{fmtCur(totalValue)}</div>
        </div>
        <div className="inv-kpi-card inv-kpi-card-warn">
          <div className="inv-kpi-label">Low Stock</div>
          <div className="inv-kpi-val">{lowCount}</div>
        </div>
        <div className="inv-kpi-card inv-kpi-card-danger">
          <div className="inv-kpi-label">Out of Stock</div>
          <div className="inv-kpi-val">{outCount}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="inv-toolbar">
        <div className="inv-search-wrap">
          <Ic.Search />
          <input className="inv-search" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="inv-filter-chips">
          {['all', 'low', 'out', 'linked'].map(f => (
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
            <StockCard key={item.id} item={item} purchaseLogs={purchaseLogs} onAdjust={handleAdjust} onWastage={setWastageItem} onEdit={setEditItem} onDelete={handleDelete} onShowPriceGraph={(it, data) => setPriceGraphItem({ item: it, data })} />
          ))}
        </div>
      )}

      {(showAdd || editItem) && (
        <AddEditItemModal item={editItem} menuProducts={menuProducts} onSave={handleSaveItem} onClose={() => { setShowAdd(false); setEditItem(null) }} />
      )}
      {wastageItem && (
        <WastageModal item={wastageItem} onSave={handleWastage} onClose={() => setWastageItem(null)} />
      )}
      {priceGraphItem && (
        <PriceHistoryModal item={priceGraphItem.item} data={priceGraphItem.data} onClose={() => setPriceGraphItem(null)} />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// TAB 2: PURCHASE LOGS
// ══════════════════════════════════════════════════════════════════

function PurchaseForm({ suppliers, menuProducts, inventoryItems, logToEdit, onSave, onClose }) {
  const [supplierName, setSupplierName] = useState(logToEdit?.supplierName || '')
  const selectedS = suppliers.find(s => s.name.toLowerCase() === supplierName.trim().toLowerCase())
  const [lines, setLines] = useState(logToEdit?.items?.length ? logToEdit.items.map(l => ({ ...l, lineTotal: l.qty * l.costPerUnit })) : [{ id: uid(), productId: '', productName: '', qty: 1, unit: 'pcs', costPerUnit: 0, lineTotal: 0, emoji: '📦', category: '', isExpenseOnly: false }])
  const [invoiceNo, setInvoiceNo] = useState(logToEdit?.invoiceNumber || '')
  const [notes, setNotes] = useState(logToEdit?.notes || '')
  const [date, setDate] = useState(() => {
    const d = logToEdit?.purchasedAt ? new Date(logToEdit.purchasedAt) : new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  })
  const [saving, setSaving] = useState(false)

  const addLine = () => setLines(p => [...p, { id: uid(), productId: '', productName: '', qty: 1, unit: 'pcs', costPerUnit: 0, lineTotal: 0, emoji: '📦', category: '', isExpenseOnly: false }])
  const removeLine = (id) => setLines(p => p.filter(l => l.id !== id))
  const updateLine = (id, k, v) => setLines(p => p.map(l => {
    if (l.id !== id) return l
    let next = { ...l, [k]: v }
    if (k === 'qty') {
      next.lineTotal = Number(next.qty || 0) * Number(next.costPerUnit || 0)
    } else if (k === 'costPerUnit') {
      next.lineTotal = Number(next.qty || 0) * Number(next.costPerUnit || 0)
    } else if (k === 'lineTotal') {
      const q = Number(next.qty) || 1
      next.costPerUnit = Number(next.lineTotal || 0) / q
    }
    return next
  }))

  const allProducts = [...menuProducts, ...inventoryItems.filter(i => !menuProducts.find(p => p.id === i.id))]

  const handleProductNameChange = (lineId, val) => {
    const p = allProducts.find(x => x.name === val)
    if (p) {
      setLines(prev => prev.map(l => l.id === lineId ? { ...l, productId: p.id, productName: p.name, emoji: p.emoji || '📦', unit: p.unit || 'pcs', category: p.category || '', costPerUnit: p.costPrice || 0 } : l))
    } else {
      setLines(prev => prev.map(l => l.id === lineId ? { ...l, productId: '', productName: val } : l))
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
      items: validLines.map(l => ({ ...l, productId: l.productId || uid(), qty: Number(l.qty), costPerUnit: Number(l.costPerUnit), totalCost: Number(l.lineTotal || 0) })),
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
            {selectedS && selectedS.phone && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Ic.Phone style={{ width: '12px', height: '12px' }} /> {selectedS.phone}
              </div>
            )}
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
                      {allProducts.map(p => <option key={p.id} value={p.name} />)}
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
                      <input className="inv-form-input" type="number" min="0" step="0.01" value={line.lineTotal} onChange={e => updateLine(line.id, 'lineTotal', e.target.value)} />
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
              <label className="inv-form-label">Purchase Date & Time</label>
              <input className="inv-form-input" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
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
            <span className="inv-log-date">{fmtDateTime(log.purchasedAt)}</span>
            {log.invoiceNumber && <><span className="inv-log-dot">·</span><span className="inv-log-inv">#{log.invoiceNumber}</span></>}
          </div>
          <div className="inv-log-items-preview">
            {(log.items || []).slice(0, 3).map((i, idx) => <span key={idx} className="inv-log-item-tag">{i.emoji} {i.productName} ×{i.qty}</span>)}
            {(log.items || []).length > 3 && <span className="inv-log-item-tag">+{log.items.length - 3} more</span>}
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
              {(log.items || []).map((item, i) => (
                <tr key={i}>
                  <td>{item.emoji} {item.productName}</td>
                  <td>{item.qty}</td>
                  <td>{item.unit}</td>
                  <td>{fmtCur(item.costPerUnit)}</td>
                  <td>{fmtCur(item.totalCost)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" style={{ textAlign: 'right', fontWeight: 'bold', paddingTop: '12px', borderTop: '2px solid #f1f5f9' }}>Grand Total:</td>
                <td style={{ fontWeight: 'bold', color: 'var(--brand-primary)', paddingTop: '12px', borderTop: '2px solid #f1f5f9' }}>{fmtCur(log.totalAmount)}</td>
              </tr>
            </tfoot>
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
  const [dateRange, setDateRange] = useState(() => computeQuick('alltime'))
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

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
    const rows = [['Purchase ID', 'Supplier', 'Date', 'Invoice', 'Items', 'Total Amount']]
    logs.forEach(l => rows.push([l.purchaseId, l.supplierName, fmtDate(l.purchasedAt), l.invoiceNumber || '', (l.items || []).length, l.totalAmount]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `purchases-${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = logs.filter(l => {
    if (l.purchasedAt < dateRange.fromTs || l.purchasedAt > dateRange.toTs) return false
    if (!search) return true
    const s = search.toLowerCase()
    return l.supplierName?.toLowerCase().includes(s) || l.purchaseId.toLowerCase().includes(s) || (l.items || []).some(i => i.productName.toLowerCase().includes(s))
  })

  const filteredSpend = filtered.reduce((s, l) => s + (l.totalAmount || 0), 0)
  const avgSpend = filtered.length ? filteredSpend / filtered.length : 0
  const topSupplier = Object.entries(filtered.reduce((acc, l) => { acc[l.supplierName] = (acc[l.supplierName] || 0) + l.totalAmount; return acc }, {})).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="inv-tab-content">
      {filterDrawerOpen && (
        <DateFilterDrawer
          current={dateRange}
          onApply={setDateRange}
          onClose={() => setFilterDrawerOpen(false)}
        />
      )}
      <div className="inv-kpi-strip">
        <div className="inv-kpi-card">
          <div className="inv-kpi-label">Logs</div>
          <div className="inv-kpi-val">{filtered.length}</div>
        </div>
        <div className="inv-kpi-card">
          <div className="inv-kpi-label">Spend</div>
          <div className="inv-kpi-val">{fmtCur(filteredSpend)}</div>
        </div>
        <div className="inv-kpi-card">
          <div className="inv-kpi-label">Avg Value</div>
          <div className="inv-kpi-val">{fmtCur(avgSpend)}</div>
        </div>
        <div className="inv-kpi-card">
          <div className="inv-kpi-label">Top Supp.</div>
          <div className="inv-kpi-val inv-kpi-val-sm" style={{ display: 'block', maxWidth: '80px', margin: '0 auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topSupplier?.[0] || '—'}</div>
        </div>
      </div>

      <div className="inv-toolbar">
        <div className="inv-search-wrap">
          <Ic.Search />
          <input className="inv-search" placeholder="Search purchases…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="or-date-filter-btn" onClick={() => setFilterDrawerOpen(true)}>
          <Ic.CalDay />
          <span>{dateRange.label}</span>
          <Ic.ChevDown />
        </button>
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
          <input className="inv-form-input" value={form.gstNo} onChange={e => setF('gstNo', e.target.value)} placeholder="GSTIN" style={{ textTransform: 'uppercase' }} />
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

function SupplierDetailsModal({ supplier, purchaseLogs, onClose, onShowPriceGraph }) {
  const myLogs = purchaseLogs.filter(l => l.supplierId === supplier.id)

  const itemStats = {}
  myLogs.forEach(log => {
    (log.items || []).forEach(item => {
      if (!itemStats[item.productId]) {
        itemStats[item.productId] = {
          id: item.productId,
          name: item.productName,
          unit: item.unit,
          totalQty: 0,
          totalSpent: 0,
          purchaseDates: [],
        }
      }
      const stat = itemStats[item.productId]
      stat.totalQty += item.qty
      stat.totalSpent += (item.qty * item.costPerUnit)
      stat.purchaseDates.push({ date: log.purchasedAt, price: item.costPerUnit, qty: item.qty })
    })
  })

  const itemsList = Object.values(itemStats).sort((a, b) => b.totalSpent - a.totalSpent)

  return (
    <Modal title={`${supplier.name} - Purchases`} onClose={onClose}>
      <div className="inv-supplier-details">
        {itemsList.length === 0 ? (
          <div className="inv-empty" style={{ padding: '30px 0' }}>
            <div className="inv-empty-icon">📦</div>
            <div className="inv-empty-title">No purchases yet</div>
          </div>
        ) : (
          <div className="inv-item-list">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 8, color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <div>Item</div>
              <div style={{ textAlign: 'right' }}>Total Qty</div>
              <div style={{ textAlign: 'right' }}>Total Spent</div>
            </div>
            {itemsList.map(it => (
              <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '12px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>{it.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', cursor: 'pointer', marginTop: 4, display: 'inline-flex', alignItems: 'center' }} onClick={() => onShowPriceGraph({ id: it.id, name: it.name }, it.purchaseDates)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, marginRight: 4 }}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                    <span style={{ textDecoration: 'underline', textDecorationStyle: 'dotted' }}>View Price History</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: '500', color: '#475569' }}>{it.totalQty} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{it.unit}</span></div>
                <div style={{ textAlign: 'right', fontWeight: '700', color: '#1e293b' }}>{fmtCur(it.totalSpent)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

function SuppliersTab({ suppliers, onSuppliersChanged }) {
  const [showForm, setShowForm] = useState(false)
  const [editSupplier, setEditSupplier] = useState(null)
  const [detailsSupplier, setDetailsSupplier] = useState(null)
  const [purchaseLogs, setPurchaseLogs] = useState([])
  const [priceGraphItem, setPriceGraphItem] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getPurchaseLogs().then(setPurchaseLogs)
  }, [])

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

  const filtered = suppliers.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase())))
  const totalSpendAll = suppliers.reduce((s, sup) => s + (sup.totalSpend || 0), 0)

  return (
    <div className="inv-tab-content">
      <div className="inv-kpi-strip">
        <div className="inv-kpi-card">
          <div className="inv-kpi-label">Total Suppliers</div>
          <div className="inv-kpi-val">{suppliers.length}</div>
        </div>
        <div className="inv-kpi-card">
          <div className="inv-kpi-label">Total Spend (All Time)</div>
          <div className="inv-kpi-val">{fmtCur(totalSpendAll)}</div>
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
            <div key={s.id} className="inv-supplier-card" onClick={() => setDetailsSupplier(s)} style={{ cursor: 'pointer' }}>
              <div className="inv-supplier-card-header">
                <div className="inv-supplier-avatar-lg">{s.name[0]}</div>
                <div className="inv-supplier-card-info">
                  <div className="inv-supplier-card-name">{s.name}</div>
                  {s.phone && <div className="inv-supplier-card-meta"><Ic.Phone /> {s.phone}</div>}
                  {s.email && <div className="inv-supplier-card-meta">✉ {s.email}</div>}
                  {s.gstNo && <div className="inv-supplier-card-meta">GST: {s.gstNo}</div>}
                </div>
                <div className="inv-supplier-card-actions" onClick={e => e.stopPropagation()}>
                  {s.phone && (
                    <a href={`https://wa.me/${s.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inv-icon-btn" style={{ color: '#25D366', borderColor: 'rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.1)', display: 'flex' }} title="WhatsApp">
                      <Ic.WhatsApp />
                    </a>
                  )}
                  <button className="inv-icon-btn" onClick={() => setEditSupplier(s)}><Ic.Edit /></button>
                  <button className="inv-icon-btn inv-icon-btn-danger" onClick={() => handleDelete(s.id)}><Ic.Trash /></button>
                </div>
              </div>
              {s.address && <div className="inv-supplier-card-address">📍 {s.address}</div>}
              {(s.tags || []).length > 0 && (
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
      {detailsSupplier && (
        <SupplierDetailsModal
          supplier={detailsSupplier}
          purchaseLogs={purchaseLogs}
          onClose={() => setDetailsSupplier(null)}
          onShowPriceGraph={(item, data) => setPriceGraphItem({ item, data })}
        />
      )}
      {priceGraphItem && (
        <PriceHistoryModal
          item={priceGraphItem.item}
          data={priceGraphItem.data}
          onClose={() => setPriceGraphItem(null)}
        />
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
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const restoreFileRef = useRef(null)
  const { alert: showAlert, confirm: showConfirm } = useAlert()

  const handleBackup = async () => {
    const blob = await exportInventoryBackup()
    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mansula-inventory-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleRestore = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const success = await restoreInventoryBackup(file)
    if (success) {
      await showAlert('Inventory data restored successfully!', { title: 'Restore Complete', type: 'success', confirmText: 'Great!' })
      loadSuppliers()
      loadMenu()
      loadInventory()
      setExportModalOpen(false)
    } else {
      showAlert('Failed to restore. Invalid or corrupted backup file.', { title: 'Restore Failed', type: 'danger', confirmText: 'OK' })
    }
    e.target.value = ''
  }

  const handleClearAll = async () => {
    const ok = await showConfirm(
      'This will permanently delete ALL live stock, purchase logs, and suppliers. This action cannot be undone.',
      { title: 'Wipe Inventory Data?', type: 'danger', confirmText: 'Yes, Wipe Everything', cancelText: 'Cancel' }
    )
    if (!ok) return
    const success = await clearAllInventoryData()
    if (success) {
      await showAlert('All inventory data has been wiped.', { title: 'Done', type: 'info', confirmText: 'OK' })
      loadSuppliers()
      loadInventory()
      setExportModalOpen(false)
    } else {
      showAlert('Failed to wipe data. Please try again.', { title: 'Error', type: 'danger', confirmText: 'OK' })
    }
  }

  const handleExportCSV = () => {
    if (inventoryItems.length === 0) {
      showAlert('No inventory items to export yet.', { title: 'Nothing to Export', type: 'warning', confirmText: 'OK' });
      return;
    }
    const headers = ['Item Name', 'Category', 'Quantity', 'Unit', 'Avg Price'];
    const rows = inventoryItems.map(item => [
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      item.qty || 0,
      `"${(item.unit || '').replace(/"/g, '""')}"`,
      item.avgPrice || 0
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mansula-inventory-stock-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportModalOpen(false);
  }

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
        <button className="inv-back-btn" onClick={onClose} aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="inv-header-title"><Ic.Box /> Inventory</div>
        <button className="inv-export-btn" onClick={() => setExportModalOpen(true)} title="Data & Export"><Ic.DB /> Data</button>
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

      {/* Hidden file input for restore */}
      <input type="file" accept=".json" style={{ display: 'none' }} ref={restoreFileRef} onChange={handleRestore} />

      {/* Export Modal */}
      {exportModalOpen && (
        <ExportModal
          onClose={() => setExportModalOpen(false)}
          onExportCSV={handleExportCSV}
          onBackup={handleBackup}
          onRestoreRef={restoreFileRef}
          onClearAll={handleClearAll}
        />
      )}
    </div>
  )
}