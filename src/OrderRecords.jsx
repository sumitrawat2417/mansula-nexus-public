import { useState, useEffect, useCallback, useRef } from 'react'
import { useBackButton } from './useBackButton.js'
import {
  getOrdersByDateRange, getStatsForDateRange,
  deleteOrderRecord, updateOrderRecord, getStorageEstimate, getAllOrderRecords, dbGet,
  exportOrdersBackup, restoreOrdersBackup, clearAllOrderRecords, getUdhaarByOrderId, getCustomerById, getOrderRecordById
} from './db.js'
import DateFilterDrawer, { computeNavRange, computeQuick } from './DateFilterDrawer.jsx'
import { useAlert } from './AlertDialog.jsx'

// ── SVG Icon Library ──
const I = {
  Back:      ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Search:    ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Edit:      ({ s=15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:     ({ s=15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  X:         ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  Check:     ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Receipt:   ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/></svg>,
  DB:        ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Cash:      ({ s=14 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>,
  Export:    ({ s=15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Upload:    ({ s=15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Download:  ({ s=15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  ChevL:     ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevR:     ({ s=18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevD:     ({ s=13 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  CalDay:    ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>,
  CalWeek:   ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="7" y1="14" x2="17" y2="14"/><line x1="7" y1="18" x2="13" y2="18"/></svg>,
  CalMonth:  ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="8" cy="15" r="1" fill="currentColor"/><circle cx="12" cy="15" r="1" fill="currentColor"/><circle cx="16" cy="15" r="1" fill="currentColor"/></svg>,
  CalYear:   ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h8M8 18h5"/></svg>,
  CalPick:   ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>,
  Range:     ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>,
  Filter:    ({ s=15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Warn:      ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Clock:     ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Globe:     ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Plus:      ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  Minus:     ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>,
  Package:   ({ s=16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
}

// ── Helpers ──
const fmtCur = (val, symbol = '₹') => `${symbol}${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
const fmtDate = (ts) => !ts ? '—' : new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const fmtTime = (ts) => !ts ? '' : new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
const fmtBytes = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
const toInputDate = (d) => d.toISOString().slice(0, 10)
const PAYMENT_LABEL = { cash: 'Cash', upi: 'UPI', card: 'Card', udhaar: 'Udhaar', split: 'Split', other: 'Other' }
const PAYMENT_COLOR = { cash: '#10b981', upi: '#6366f1', card: '#0ea5e9', udhaar: '#f59e0b', split: '#8b5cf6', other: '#64748b' }
const PAGE_SIZE = 50

// ── Order Detail Modal ──
function OrderDetailModal({ record, currency, onClose, onDelete, onEdit, onNavigate, onUpdateRecord }) {
  useBackButton(onClose)
  const { confirm: showConfirm } = useAlert()
  const [showAllItems, setShowAllItems] = useState(false)
  const [udhaarInfo, setUdhaarInfo] = useState(null)
  const [customerInfo, setCustomerInfo] = useState(null)
  
  const [editMode, setEditMode] = useState(false)
  const getLocalDatetime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const pad = n => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  const [tempDate, setTempDate] = useState(() => getLocalDatetime(record.completedAt))
  const [isSavingDate, setIsSavingDate] = useState(false)

  useEffect(() => {
    if (record.paymentMode === 'udhaar') {
      getUdhaarByOrderId(record.orderId).then(info => {
        setUdhaarInfo(info)
        if (info && info.customerId) {
          getCustomerById(info.customerId).then(setCustomerInfo)
        }
      })
    }
  }, [record.paymentMode, record.orderId])

  const sym = currency?.symbol || '₹'
  const items = record.items || []
  const subtotal = record.subtotal !== undefined ? record.subtotal : items.reduce((s, i) => s + i.price * i.qty, 0)

  const handleDelete = async () => {
    const ok = await showConfirm(
      'Are you sure you want to permanently delete this order?',
      { title: 'Delete Order', type: 'danger', confirmText: 'Yes, Delete', confirmWord: 'DELETE' }
    )
    if (!ok) return
    await onDelete(record.orderId)
    onClose()
  }

  const handleSaveDate = async () => {
    setIsSavingDate(true)
    const newTs = new Date(tempDate).getTime()
    const updated = { ...record, completedAt: newTs }
    await updateOrderRecord(record.orderId, { completedAt: newTs })
    setIsSavingDate(false)
    setEditMode(false)
    if (onUpdateRecord) onUpdateRecord(updated)
  }

  const PREVIEW_COUNT = 3
  const visibleItems = showAllItems ? items : items.slice(0, PREVIEW_COUNT)
  const hasMore = items.length > PREVIEW_COUNT

  return (
    <div className="or-modal-overlay" onClick={onClose}>
      <div className="or-modal" onClick={e => e.stopPropagation()}>
        <div className="or-modal-header">
          <div className="or-modal-title">
            <span className="or-modal-icon"><I.Receipt s={20} /></span>
            <div>
              <div className="or-modal-order-id">#{record.orderId} {editMode && <span style={{fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-primary)', marginLeft: 8}}>Editing</span>}</div>
              <div className="or-modal-date">{fmtDate(record.completedAt)} · {fmtTime(record.completedAt)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!editMode && <button className="or-icon-btn" onClick={() => setEditMode(true)} title="Edit Order"><I.Edit s={15} /></button>}
            <button className="or-icon-btn" onClick={onClose} title="Close"><I.X s={17} /></button>
          </div>
        </div>

        {editMode ? (
          <div className="or-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'var(--bg-surface-1)', padding: 16, borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 12, color: 'var(--text-primary)' }}>Edit Date & Time</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input 
                  type="datetime-local" 
                  value={tempDate} 
                  onChange={e => setTempDate(e.target.value)}
                  style={{ padding: '10px 12px', fontSize: '1rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', width: '100%', outline: 'none' }}
                />
                <button onClick={handleSaveDate} disabled={isSavingDate} style={{ background: 'var(--brand-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}>{isSavingDate ? 'Saving...' : 'Save Date & Time'}</button>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-1)', padding: 16, borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 8, color: 'var(--text-primary)' }}>Edit Cart Items</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>Modify products, quantities, or payments by returning to the POS.</div>
              <button onClick={() => onEdit(record)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 8, padding: '10px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <I.Edit s={16} /> Open in POS
              </button>
            </div>

            <button onClick={() => setEditMode(false)} style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', padding: '10px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', marginTop: 'auto' }}>
              Cancel Editing
            </button>
          </div>
        ) : (
          <div className="or-modal-body">
          <div className="or-detail-section-label">Items</div>
          <div className="or-detail-items">
            {visibleItems.map((item, idx) => (
              <div key={idx} className="or-detail-item-row">
                <span className="or-detail-emoji">{item.emoji || ''}</span>
                <div className="or-detail-item-info">
                  <div className="or-detail-item-name">{item.name}</div>
                  {item.variantLabel && <div className="or-detail-item-variant">{item.variantLabel}</div>}
                </div>
                <div className="or-detail-item-right">
                  <div className="or-detail-item-qty">×{item.qty}</div>
                  <div className="or-detail-item-price">{fmtCur(item.price * item.qty, sym)}</div>
                </div>
              </div>
            ))}
            {!showAllItems && hasMore && (
              <button 
                className="expand-items-btn" 
                onClick={() => setShowAllItems(true)}
                style={{ width: '100%', marginTop: 8 }}
              >
                + {items.length - PREVIEW_COUNT} more items
              </button>
            )}
          </div>

          <div className="or-detail-totals">
            <div className="or-total-row"><span>Subtotal</span><span>{fmtCur(subtotal, sym)}</span></div>
            {record.taxAmt > 0 && <div className="or-total-row"><span>{record.taxLabel || 'Tax'}</span><span>{fmtCur(record.taxAmt, sym)}</span></div>}
            {record.discountAmt > 0 && <div className="or-total-row discount"><span>Discount</span><span>−{fmtCur(record.discountAmt, sym)}</span></div>}
            {record.deliveryCharge > 0 && <div className="or-total-row"><span>Delivery</span><span>+{fmtCur(record.deliveryCharge, sym)}</span></div>}
            <div className="or-total-row grand"><span>Total</span><span className="or-grand-val">{fmtCur(record.total, sym)}</span></div>
          </div>

          <div className="or-detail-section-label" style={{ marginTop: 16 }}>Payment</div>
          <div 
            className="or-payment-badge" 
            style={{ 
              '--chip-color': PAYMENT_COLOR[record.paymentMode] || '#64748b',
              cursor: record.paymentMode === 'udhaar' ? 'pointer' : 'default'
            }}
            onClick={() => {
              if (record.paymentMode === 'udhaar' && udhaarInfo) {
                localStorage.setItem('mn-open-udhaar', udhaarInfo.udhaarId);
                if (customerInfo) {
                  localStorage.setItem('mn-open-customer', customerInfo.customerId || customerInfo.id);
                }
                onNavigate('customers');
              }
            }}
          >
            <I.Cash s={13} /> {PAYMENT_LABEL[record.paymentMode] || record.paymentMode} {customerInfo ? `• ${customerInfo.name}` : ''}
            {record.paymentMode === 'udhaar' && udhaarInfo && (udhaarInfo.amount - (udhaarInfo.paidAmt || 0)) <= 0 && (
              <span style={{ fontSize: '0.72rem', marginLeft: 8, opacity: 0.9, background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                ✓ CLEARED
              </span>
            )}
            {record.paymentMode === 'split' && record.paymentDetails && (
              <span style={{ fontSize: '0.72rem', marginLeft: 8, opacity: 0.8 }}>
                Cash {fmtCur(record.paymentDetails.cash, sym)} · UPI {fmtCur(record.paymentDetails.upi, sym)}
              </span>
            )}
          </div>
        </div>
        )}

        {!editMode && (
          <div className="or-modal-footer">
            <button className="or-btn-danger" onClick={handleDelete}>
              <I.Trash s={14} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Export Modal ──
function ExportModal({ onClose, onExportCSV, onBackup, onRestoreRef, onClearAll }) {
  useBackButton(onClose)
  const cardStyle = { padding: '12px 14px', gap: '10px' };
  const iconStyle = { width: 36, height: 36, flexShrink: 0 };

  return (
    <div className="or-modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="or-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450, padding: 0 }}>
        <div className="or-modal-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Data & Export</div>
          <button className="or-modal-close" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><I.X s={20} /></button>
        </div>
        
        <div className="or-modal-body" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          
          <div className="bp-backup-card bp-backup-export" style={cardStyle}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div className="bp-backup-card-icon" style={{ ...iconStyle, background: 'rgba(100,116,139,0.12)', color: '#64748b' }}><I.Receipt s={18} /></div>
              <div className="bp-backup-card-info">
                <div className="bp-backup-card-title" style={{ fontSize: '0.85rem', marginBottom: 2 }}>Export CSV</div>
                <div className="bp-backup-card-desc" style={{ fontSize: '0.72rem', lineHeight: 1.3 }}>Download a spreadsheet of your orders for the currently selected date range.</div>
              </div>
            </div>
            <button className="bp-btn-primary" style={{ background: '#64748b', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }} onClick={onExportCSV}>
              <I.Export s={14} /> Download CSV
            </button>
          </div>

          <div className="bp-backup-card bp-backup-export" style={cardStyle}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div className="bp-backup-card-icon" style={iconStyle}><I.Download s={18} /></div>
              <div className="bp-backup-card-info">
                <div className="bp-backup-card-title" style={{ fontSize: '0.85rem', marginBottom: 2 }}>Save Backup to Device</div>
                <div className="bp-backup-card-desc" style={{ fontSize: '0.72rem', lineHeight: 1.3 }}>Downloads a <code>.orms</code> file containing all your order records. Keep it safe to restore later.</div>
              </div>
            </div>
            <button className="bp-btn-primary" style={{ background: 'var(--brand-primary)', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }} onClick={onBackup}>
              <I.Download s={14} /> Download Backup
            </button>
          </div>

          <div className="bp-backup-card bp-backup-import" style={cardStyle}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div className="bp-backup-card-icon" style={iconStyle}><I.Upload s={18} /></div>
              <div className="bp-backup-card-info">
                <div className="bp-backup-card-title" style={{ fontSize: '0.85rem', marginBottom: 2 }}>Restore from Backup</div>
                <div className="bp-backup-card-desc" style={{ fontSize: '0.72rem', lineHeight: 1.3 }}>Upload a previously downloaded <code>.orms</code> backup file to restore your historical order records.</div>
              </div>
            </div>
            <button className="bp-btn-outline" style={{ background: 'transparent', color: '#10b981', border: '1.5px solid #10b981', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }} onClick={() => onRestoreRef.current?.click()}>
              <I.Upload s={14} /> Restore Backup
            </button>
          </div>

          <div className="bp-backup-card" style={{ ...cardStyle, borderColor: 'rgba(239,68,68,0.3)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div className="bp-backup-card-icon" style={{ ...iconStyle, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}><I.Trash s={18} /></div>
              <div className="bp-backup-card-info">
                <div className="bp-backup-card-title" style={{ fontSize: '0.85rem', color: '#ef4444', marginBottom: 2 }}>Wipe Order Data</div>
                <div className="bp-backup-card-desc" style={{ fontSize: '0.72rem', lineHeight: 1.3 }}>Permanently delete all order records and reset the order counter to #1. This cannot be undone.</div>
              </div>
            </div>
            <button className="bp-btn-outline" style={{ background: 'transparent', color: '#ef4444', border: '1.5px solid #ef4444', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }} onClick={onClearAll}>
              <I.Trash s={14} /> Reset Order Records
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Main OrderRecords ──
export default function OrderRecords({ onClose, currency, onEdit, onNavigate }) {
  useBackButton(onClose)
  const [records, setRecords]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [loadingMore, setLoadingMore]   = useState(false)
  const [total, setTotal]               = useState(0)
  const [stats, setStats]               = useState({ count: 0, revenue: 0, avg: 0, topPayment: '—' })
  const [statsLoading, setStatsLoading] = useState(true)

  // Applied date range
  const [dateRange, setDateRange] = useState(() => computeNavRange('day', 0))

  // Other filters
  const [search, setSearch]             = useState('')
  const [filterPayment, setFilterPayment] = useState('all')
  const [sortDesc, setSortDesc]         = useState(true)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [viewRecord, setViewRecord]     = useState(null)
  const [storageInfo, setStorageInfo]   = useState({ usage: 0, quota: 0 })

  const sym = currency?.symbol || '₹'
  const searchTimer = useRef(null)
  const sentinelRef = useRef(null)
  const fileInputRef = useRef(null)
  const { alert: showAlert, confirm: showConfirm } = useAlert()

  useEffect(() => {
    const openOrderId = localStorage.getItem('mn-open-order')
    if (openOrderId) {
      getOrderRecordById(openOrderId).then(order => {
        if (order) setViewRecord(order)
        localStorage.removeItem('mn-open-order')
      })
    }
  }, [])

  const loadPage = useCallback(async () => {
    setLoading(true)
    const result = await getOrdersByDateRange({
      fromTs: dateRange.fromTs, toTs: dateRange.toTs,
      paymentMode: filterPayment, search, sortDesc, offset: 0, limit: PAGE_SIZE
    })
    setRecords(result.records)
    setTotal(result.total)
    setLoading(false)
  }, [dateRange, filterPayment, search, sortDesc])

  const loadMore = useCallback(async () => {
    if (loadingMore) return
    setLoadingMore(true)
    const result = await getOrdersByDateRange({
      fromTs: dateRange.fromTs, toTs: dateRange.toTs,
      paymentMode: filterPayment, search, sortDesc, offset: records.length, limit: PAGE_SIZE
    })
    setRecords(prev => [...prev, ...result.records])
    setTotal(result.total)
    setLoadingMore(false)
  }, [dateRange, filterPayment, search, sortDesc, records.length, loadingMore])

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    const [s, storage] = await Promise.all([
      getStatsForDateRange({ fromTs: dateRange.fromTs, toTs: dateRange.toTs, paymentMode: filterPayment, search }),
      getStorageEstimate()
    ])
    setStats(s)
    setStorageInfo(storage)
    setStatsLoading(false)
  }, [dateRange, filterPayment, search])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { loadPage(); loadStats() }, search ? 300 : 0)
    return () => clearTimeout(searchTimer.current)
  }, [dateRange, filterPayment, sortDesc, search])

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && records.length < total && !loadingMore && !loading) loadMore()
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [records.length, total, loadingMore, loading, loadMore])

  const handleDelete = async (orderId) => {
    await deleteOrderRecord(orderId)
    setViewRecord(null)
    loadPage(); loadStats()
  }



  const exportCSV = async () => {
    const all = await getAllOrderRecords()
    const inRange = all.filter(r => r.completedAt >= dateRange.fromTs && r.completedAt <= dateRange.toTs)
    const header = ['Order ID','Date','Time','Items','Subtotal','Tax','Discount','Delivery','Total','Payment','Note']
    const rows = inRange.map(r => [
      r.orderId, fmtDate(r.completedAt), fmtTime(r.completedAt),
      (r.items||[]).map(i=>`${i.qty}x ${i.name}`).join('; '),
      r.subtotal||'', r.taxAmt||'', r.discountAmt||'', r.deliveryCharge||'',
      r.total||'', r.paymentMode||'', r.note||''
    ])
    const csv = [header,...rows].map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
    const a = document.createElement('a')
    a.href=url; a.download=`mansula-orders-${new Date().toISOString().slice(0,10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleBackup = async () => {
    const blob = await exportOrdersBackup()
    if (!blob) return showAlert('Backup failed. Please try again.', { title: 'Backup Failed', type: 'danger', confirmText: 'OK' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const d = new Date()
    const dStr = String(d.getDate()).padStart(2, '0') + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + d.getFullYear()
    a.download = `MansulaBOS_OrdersBackup_${dStr}.orms`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRestore = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const count = await restoreOrdersBackup(file)
    e.target.value = null // reset
    if (count < 0) showAlert('Restore failed. Invalid format or error.', { title: 'Restore Failed', type: 'danger', confirmText: 'OK' })
    else {
      await showAlert(`Successfully restored ${count} orders!`, { title: 'Restore Complete', type: 'success', confirmText: 'Great!' })
      setExportModalOpen(false)
      loadPage(); loadStats()
    }
  }

  const handleClearAll = async () => {
    const ok = await showConfirm(
      'This will permanently delete all order records and reset the order counter to #1. This action cannot be undone.',
      { title: 'Wipe Order Records?', type: 'danger', confirmText: 'Yes, Wipe Everything', cancelText: 'Cancel', confirmWord: 'WIPE' }
    )
    if (!ok) return
    
    const success = await clearAllOrderRecords()
    if (success) {
      await showAlert('All order records have been wiped.', { title: 'Done', type: 'info', confirmText: 'OK' })
      setExportModalOpen(false)
      loadPage(); loadStats()
    } else {
      showAlert('Failed to clear order records. Please try again.', { title: 'Error', type: 'danger', confirmText: 'OK' })
    }
  }

  return (
    <div className="or-root">
      {viewRecord && (
        <OrderDetailModal record={viewRecord} currency={currency}
          onClose={() => setViewRecord(null)} onDelete={handleDelete} onEdit={onEdit} onNavigate={onNavigate} onUpdateRecord={updated => { setViewRecord(updated); loadPage(); loadStats(); }} />
      )}
      {filterDrawerOpen && (
        <DateFilterDrawer
          current={dateRange}
          onApply={(range) => { setDateRange(range); setRecords([]) }}
          onClose={() => setFilterDrawerOpen(false)}
        />
      )}
      {exportModalOpen && (
        <ExportModal 
          onClose={() => setExportModalOpen(false)} 
          onExportCSV={() => { exportCSV(); setExportModalOpen(false); }} 
          onBackup={() => { handleBackup(); setExportModalOpen(false); }} 
          onRestoreRef={fileInputRef}
          onClearAll={handleClearAll}
        />
      )}

      {/* Header */}
      <header className="or-header">
        <button className="or-back-btn" onClick={onClose} aria-label="Back"><I.Back s={20} /></button>
        <div className="or-header-title"><I.Receipt s={19} /> Order Records</div>
        <button className="or-export-btn" onClick={() => setExportModalOpen(true)} title="Data & Export"><I.DB s={15} /> Data</button>
        <input type="file" accept=".orms,.msbos" style={{ display: 'none' }} ref={fileInputRef} onChange={handleRestore} />
      </header>

      {/* Storage Bar */}
      <div className="or-storage-bar">
        <I.DB s={13} />
        <span>Storage:</span>
        <span className="or-storage-val">
          {fmtBytes(storageInfo.usage)}
          {storageInfo.quota > 0 && ` (${((storageInfo.usage / storageInfo.quota) * 100).toFixed(2)}%)`}
        </span>
        {storageInfo.quota > 0 && (
          <>
            <div className="or-storage-track">
              <div className="or-storage-fill" style={{ width: `${Math.min(100, (storageInfo.usage / storageInfo.quota) * 100).toFixed(2)}%` }} />
            </div>
            <span className="or-storage-quota">of {fmtBytes(storageInfo.quota)}</span>
          </>
        )}
      </div>

      {/* Stats Cards */}
      <div className="or-stats-row">
        <div className="or-stat-card">
          <div className="or-stat-label">Orders</div>
          <div className="or-stat-val">{statsLoading ? '…' : stats.count.toLocaleString('en-IN')}</div>
        </div>
        <div className="or-stat-card accent">
          <div className="or-stat-label">Revenue</div>
          <div className="or-stat-val">{statsLoading ? '…' : fmtCur(stats.revenue, sym)}</div>
        </div>
        <div className="or-stat-card">
          <div className="or-stat-label">Avg Order</div>
          <div className="or-stat-val">{statsLoading ? '…' : fmtCur(stats.avg, sym)}</div>
        </div>
        <div className="or-stat-card">
          <div className="or-stat-label">Top Pay</div>
          <div className="or-stat-val" style={{ fontSize: '0.88rem', textTransform: 'capitalize' }}>
            {statsLoading ? '…' : (PAYMENT_LABEL[stats.topPayment] || stats.topPayment)}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="or-controls">
        <div className="or-search-wrap">
          <I.Search s={15} />
          <input className="or-search" placeholder="Search order ID or item…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="or-search-clear" onClick={() => setSearch('')}><I.X s={13} /></button>}
        </div>
        <div className="or-filter-row">
          <button className="or-date-filter-btn" onClick={() => setFilterDrawerOpen(true)}>
            <I.CalDay s={13} />
            <span>{dateRange.label}</span>
            <I.ChevD s={12} />
          </button>
          <select className="or-select" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
            <option value="all">All Pay</option>
            {Object.entries(PAYMENT_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className={`or-sort-btn ${!sortDesc ? 'asc' : ''}`} onClick={() => setSortDesc(d => !d)}>
            {sortDesc ? '↓ Newest' : '↑ Oldest'}
          </button>
        </div>
      </div>

      {/* Result count */}
      <div className="or-result-count">
        {loading ? 'Loading…' : `${total.toLocaleString('en-IN')} order${total !== 1 ? 's' : ''}`}
        {records.length > 0 && !loading && <span className="or-showing-badge">Showing {records.length.toLocaleString('en-IN')}</span>}
      </div>

      {/* List */}
      <div className="or-list">
        {loading ? (
          <div className="or-empty"><div className="or-empty-spin" /><p>Loading records…</p></div>
        ) : records.length === 0 ? (
          <div className="or-empty">
            <div className="or-empty-icon"><I.Receipt s={32} /></div>
            <p>No orders in this period</p>
            <button className="or-btn-ghost" onClick={() => setDateRange(computeQuick('alltime'))}>
              <I.Globe s={14} /> See all time
            </button>
          </div>
        ) : (
          <>
            {records.map(r => {
              const itemCount = (r.items||[]).reduce((s,i) => s+i.qty, 0)
              const payColor = PAYMENT_COLOR[r.paymentMode] || '#64748b'
              return (
                <div key={r.orderId} className="or-record-card" onClick={() => setViewRecord(r)}>
                  <div className="or-record-left">
                    <div className="or-record-id">#{r.orderId}</div>
                    <div className="or-record-meta">
                      <span>{fmtDate(r.completedAt)}</span>
                      <span className="or-meta-sep">·</span>
                      <span>{fmtTime(r.completedAt)}</span>
                      <span className="or-meta-sep">·</span>
                      <span>{itemCount} item{itemCount!==1?'s':''}</span>
                    </div>
                    <div className="or-record-items-preview">
                      {(r.items||[]).slice(0,3).map((i,idx) => <span key={idx} className="or-item-pill">{i.name}{i.variantLabel ? ` (${i.variantLabel})` : ''}</span>)}
                      {(r.items||[]).length>3 && <span className="or-item-pill muted">+{r.items.length-3} more</span>}
                    </div>
                  </div>
                  <div className="or-record-right">
                    <div className="or-record-total">{fmtCur(r.total, sym)}</div>
                    <div className="or-pay-tag" style={{'--pay-color': payColor}}>{PAYMENT_LABEL[r.paymentMode]||r.paymentMode}</div>
                    {r.note && <div className="or-note-dot" title={r.note}><I.Edit s={11}/></div>}
                  </div>
                </div>
              )
            })}
            <div ref={sentinelRef} style={{ height: 1 }} />
            {loadingMore && (
              <div className="or-loading-more">
                <div className="or-empty-spin" style={{ width: 20, height: 20 }} />
                <span>Loading more…</span>
              </div>
            )}
            {!loadingMore && records.length >= total && total > 0 && (
              <div className="or-end-label">
                <I.Check s={13} /> All {total.toLocaleString('en-IN')} orders loaded
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
