import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

// ─────────────────────────────────────────
//  Shared styles injected once per render
// ─────────────────────────────────────────
const DOC_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .brd-root {
    font-family: 'Inter', 'Segoe UI', sans-serif;
    background: #ffffff;
    width: 460px;
    color: #1a1a2e;
    line-height: 1.5;
    border-radius: 6px;
    overflow: hidden;
    box-sizing: border-box;
  }

  /* ── ACCENT BAR ─────────────────── */
  .brd-accent-bar {
    height: 5px;
    background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 60%, #a78bfa 100%);
  }

  /* ── HEADER ─────────────────────── */
  .brd-header {
    padding: 28px 32px 20px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    border-bottom: 1px solid #f0f0f5;
  }
  .brd-lockup {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .brd-logo-wrap {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    overflow: hidden;
    flex-shrink: 0;
    background: #f5f5ff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(99,102,241,0.15);
  }
  .brd-logo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .brd-brand-main {
    font-size: 18px;
    font-weight: 900;
    color: #1a1a2e;
    letter-spacing: -0.3px;
  }
  .brd-brand-sub {
    font-size: 10.5px;
    color: #6366f1;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    margin-top: 1px;
  }
  .brd-brand-micro {
    font-size: 9px;
    color: #9ca3af;
    margin-top: 6px;
    line-height: 1.4;
    font-weight: 600;
  }
  
  .brd-doc-type-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }
  .brd-doc-type {
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #1a1a2e;
  }
  .brd-doc-type span {
    color: #9ca3af;
    margin-left: 4px;
  }
  .brd-status-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 100px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .brd-status-badge.pending {
    background: #fffbeb;
    color: #d97706;
    border: 1px solid #fde68a;
  }
  .brd-status-badge.paid {
    background: #f0fdf4;
    color: #059669;
    border: 1px solid #bbf7d0;
  }
  .brd-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  .brd-status-dot.pending { background: #f59e0b; }
  .brd-status-dot.paid { background: #10b981; }

  /* ── META INFO ───────────────────── */
  .brd-meta-section {
    margin: 24px 32px 0;
  }
  .brd-meta-heading {
    font-size: 10px;
    font-weight: 800;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
    border-bottom: 1px solid #f0f0f5;
    padding-bottom: 6px;
  }
  .brd-meta-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .brd-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
  }
  .brd-meta-row span {
    color: #6b7280;
    font-weight: 500;
  }
  .brd-meta-row strong {
    color: #1a1a2e;
    font-weight: 700;
  }
  .brd-meta-row strong.accent { color: #6366f1; }
  .brd-meta-row strong.warn { color: #d97706; }
  .brd-meta-row strong.ok { color: #059669; }

  /* ── ITEMS TABLE ─────────────────── */
  .brd-items {
    margin: 28px 32px 0;
  }
  .brd-items-head {
    display: grid;
    grid-template-columns: 1fr 64px 70px 70px;
    gap: 0;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.8px;
    color: #9ca3af;
    text-transform: uppercase;
    border-bottom: 2px solid #f0f0f8;
    padding-bottom: 8px;
    margin-bottom: 4px;
  }
  .brd-items-head span:not(:first-child) { text-align: right; }
  .brd-item-row {
    display: grid;
    grid-template-columns: 1fr 64px 70px 70px;
    gap: 0;
    padding: 10px 0;
    border-bottom: 1px solid #f5f5f9;
    align-items: center;
  }
  .brd-item-name {
    font-size: 13.5px;
    font-weight: 700;
    color: #1a1a2e;
  }
  .brd-item-mod {
    font-size: 10.5px;
    color: #9ca3af;
    margin-top: 1px;
  }
  .brd-item-cell {
    text-align: right;
    font-size: 13px;
    font-weight: 600;
    color: #4b5563;
  }
  .brd-item-total {
    text-align: right;
    font-size: 13.5px;
    font-weight: 800;
    color: #1a1a2e;
  }

  /* ── TOTALS ──────────────────────── */
  .brd-totals {
    margin: 8px 32px 0;
    padding-top: 12px;
  }
  .brd-total-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: #6b7280;
    padding: 4px 0;
  }
  .brd-total-row.discount { color: #059669; font-weight: 600; }
  .brd-total-row.tax      { color: #d97706; font-weight: 600; }
  .brd-grand-total {
    margin-top: 16px;
    background: #1a1a2e;
    border-radius: 12px;
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 8px 16px rgba(26,26,46,0.15);
  }
  .brd-grand-label {
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 1px;
    color: #a5b4fc;
    text-transform: uppercase;
  }
  .brd-grand-sub {
    font-size: 10px;
    color: #818cf8;
    margin-top: 2px;
    font-weight: 500;
    opacity: 0.8;
  }
  .brd-grand-amt {
    font-size: 32px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: -1px;
  }
  .brd-grand-amt span {
    font-size: 18px;
    font-weight: 700;
    color: #a5b4fc;
    margin-right: 4px;
  }

  /* ── QR SECTION (Invoice) ─────────── */
  .brd-qr-section {
    margin: 24px 32px 0;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .brd-qr-wrap {
    flex-shrink: 0;
    padding: 8px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  .brd-qr-content {
    flex: 1;
  }
  .brd-qr-label {
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }
  .brd-qr-amount {
    font-size: 28px;
    font-weight: 900;
    color: #1a1a2e;
    margin-bottom: 2px;
    letter-spacing: -0.5px;
  }
  .brd-qr-amount span {
    font-size: 16px;
    color: #64748b;
    margin-right: 2px;
  }
  .brd-upi-id {
    font-size: 12px;
    font-weight: 600;
    color: #6366f1;
    margin-bottom: 8px;
  }
  .brd-qr-accepted {
    font-size: 10px;
    font-weight: 500;
    color: #94a3b8;
  }

  /* ── TIMELINE (Receipt) ─────────── */
  .brd-timeline {
    margin: 24px 32px 0;
    padding: 16px 20px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .brd-tl-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .brd-tl-icon {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #10b981;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .brd-tl-text {
    font-size: 11.5px;
    font-weight: 600;
    color: #334155;
  }

  /* ── TRUST & FOOTER ──────────────── */
  .brd-trust {
    margin: 32px 32px 0;
    display: flex;
    justify-content: center;
    gap: 16px;
    font-size: 11px;
    font-weight: 600;
    color: #10b981;
  }
  .brd-trust-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .brd-footer {
    margin: 20px 32px 0;
    border-top: 1px solid #f0f0f8;
    padding: 24px 0 32px;
    text-align: center;
  }
  .brd-footer-brand {
    font-size: 11px;
    color: #9ca3af;
    line-height: 1.5;
  }
  .brd-footer-brand strong {
    color: #6b7280;
    font-weight: 700;
    font-size: 12px;
  }
`

// ─────────────────────────────────────────────────────────
//  BillDocument — the printable/image document component
// ─────────────────────────────────────────────────────────
export function BillDocument({
  docRef,
  type = 'invoice',        // 'invoice' | 'receipt'
  business = {},
  order = {},
  math = {},
  logo = '/logo.png',
  paymentMode = 'UPI',
  hidden = true
}) {
  const isReceipt = type === 'receipt'
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yy = String(now.getFullYear()).slice(-2)
  const orderId = order.id || `#N-${dd}/${mm}/${yy}`
  const upiString = `upi://pay?pa=${business.upiId || 'test@ybl'}&pn=${encodeURIComponent(business.name || 'Business')}&am=${math.grandTotal || 0}&cu=INR&tn=ManSula%20BOS`

  const items = order.items || []
  const subtotal = math.subtotal || 0
  const discountAmt = math.discountAmt || 0
  const gstAmt = math.gstAmt || 0
  const delivery = order.deliveryCharge || 0
  const grandTotal = math.grandTotal || 0

  const content = (
    <div className="brd-root" ref={docRef}>
      {/* ACCENT BAR */}
      <div className="brd-accent-bar" />

      {/* HEADER */}
      <div className="brd-header">
        <div className="brd-lockup">
          <div className="brd-logo-wrap">
            <img src={logo} className="brd-logo-img" alt="Logo" />
          </div>
          <div>
            <div className="brd-brand-main">{business.name || 'Your Business'}</div>
            <div className="brd-brand-sub">{business.tagline || 'Business Operating System'}</div>
            <div className="brd-brand-micro">
              Verified Digital Invoice<br />
              Powered by ManSula BOS
            </div>
          </div>
        </div>
        <div className="brd-doc-type-wrap">
          <div className="brd-doc-type">
            {isReceipt ? 'Receipt' : 'Invoice'} <span>{orderId}</span>
          </div>
          <div className={`brd-status-badge ${isReceipt ? 'paid' : 'pending'}`}>
            <div className={`brd-status-dot ${isReceipt ? 'paid' : 'pending'}`}></div>
            {isReceipt ? 'Completed' : 'Pending'}
          </div>
        </div>
      </div>

      {/* META INFO (Clean layout) */}
      <div className="brd-meta-section">
        <div className="brd-meta-heading">Business Information</div>
        <div className="brd-meta-grid">
          <div className="brd-meta-row"><span>Business</span><strong>{business.name || '—'}</strong></div>
          {business.address && <div className="brd-meta-row"><span>Address</span><strong>{business.address}</strong></div>}
          <div className="brd-meta-row"><span>Contact</span><strong>{business.contact ? `+91 ${business.contact}` : '—'}</strong></div>
          {business.gstNumber && <div className="brd-meta-row"><span>GST No</span><strong className="accent">{business.gstNumber}</strong></div>}
        </div>

        <div className="brd-meta-heading" style={{ marginTop: 20 }}>Order Information</div>
        <div className="brd-meta-grid">
          <div className="brd-meta-row"><span>Date</span><strong>{dateStr} {timeStr}</strong></div>
          {order.customer && <div className="brd-meta-row"><span>Customer</span><strong>{order.customer}</strong></div>}
          {order.customerPhone && <div className="brd-meta-row"><span>Phone</span><strong>{order.customerPhone}</strong></div>}
          <div className="brd-meta-row"><span>Status</span><strong className={isReceipt ? 'ok' : 'warn'}>{isReceipt ? paymentMode : 'Pending'}</strong></div>
        </div>
      </div>

      {/* ITEMS */}
      <div className="brd-items">
        <div className="brd-items-head">
          <span>Item / Description</span>
          <span>Qty</span>
          <span>Rate</span>
          <span>Amount</span>
        </div>
        {items.map((item, i) => (
          <div className="brd-item-row" key={i}>
            <div>
              <div className="brd-item-name">{item.name}</div>
              {item.modifiers && Object.values(item.modifiers).length > 0 && (
                <div className="brd-item-mod">{Object.values(item.modifiers).join(' • ')}</div>
              )}
            </div>
            <div className="brd-item-cell">{item.qty}</div>
            <div className="brd-item-cell">₹{Number(item.unitPrice).toFixed(2)}</div>
            <div className="brd-item-total">₹{(item.qty * item.unitPrice).toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* TOTALS */}
      <div className="brd-totals">
        <div className="brd-total-row">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        {discountAmt > 0 && (
          <div className="brd-total-row discount">
            <span>Discount</span>
            <span>–₹{discountAmt.toFixed(2)}</span>
          </div>
        )}
        {gstAmt > 0 && (
          <div className="brd-total-row tax">
            <span>GST ({order.gstPercent || 0}%)</span>
            <span>+₹{gstAmt.toFixed(2)}</span>
          </div>
        )}
        {delivery > 0 && (
          <div className="brd-total-row">
            <span>Delivery</span>
            <span>₹{delivery.toFixed(2)}</span>
          </div>
        )}
        <div className="brd-grand-total">
          <div>
            <div className="brd-grand-label">{isReceipt ? 'Total Paid' : 'Amount Due'}</div>
            {!isReceipt && <div className="brd-grand-sub">Due Now</div>}
          </div>
          <div className="brd-grand-amt">
            <span>₹</span>{grandTotal.toFixed(2)}
          </div>
        </div>
      </div>

      {/* QR (Invoice) or TIMELINE (Receipt) */}
      {isReceipt ? (
        <div className="brd-timeline">
          <div className="brd-tl-item">
            <div className="brd-tl-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></div>
            <div className="brd-tl-text">Invoice Created</div>
          </div>
          <div className="brd-tl-item">
            <div className="brd-tl-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></div>
            <div className="brd-tl-text">Payment Received</div>
          </div>
          <div className="brd-tl-item">
            <div className="brd-tl-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></div>
            <div className="brd-tl-text">QR Generated</div>
          </div>
          <div className="brd-tl-item">
            <div className="brd-tl-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></div>
            <div className="brd-tl-text">Receipt Issued</div>
          </div>
        </div>
      ) : (
        <div className="brd-qr-section">
          <div className="brd-qr-wrap">
            <div style={{ position: 'relative', width: 130, height: 130 }}>
              <QRCodeSVG
                value={upiString}
                size={130}
                level="H"
                fgColor="#3730a3"
              />
              <img
                src={logo}
                crossOrigin="anonymous"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '2px solid #ffffff',
                  backgroundColor: '#ffffff',
                  objectFit: 'cover'
                }}
              />
            </div>
          </div>
          <div className="brd-qr-content">
            <div className="brd-qr-label">Scan to Pay</div>
            <div className="brd-qr-amount">
              <span>₹</span>{grandTotal.toFixed(2)}
            </div>
            <div className="brd-upi-id">{business.upiId || 'yourname@upi'}</div>
            <div className="brd-qr-accepted">PhonePe • GPay • Paytm • BHIM</div>
          </div>
        </div>
      )}

      {/* TRUST & FOOTER */}
      <div className="brd-trust">
        <div className="brd-trust-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          Secure UPI Payment
        </div>
        <div className="brd-trust-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          Verified Digital Invoice
        </div>
      </div>

      <div className="brd-footer">
        <div className="brd-footer-brand">
          <strong>Powered by ManSula BOS</strong><br />
          Business Operating System for Retail & Restaurants<br />
          <div style={{ marginTop: 6, color: '#818cf8', fontWeight: 600 }}>mansulabos.netlify.app</div>
          <div style={{ marginTop: 8, fontSize: 9 }}>© 2024 - {new Date().getFullYear()} ManSula DivLabs & ManSula</div>
        </div>
      </div>
    </div>
  )

  if (hidden) {
    return (
      <div style={{ position: 'fixed', top: -9999, left: -9999, zIndex: 0, pointerEvents: 'none' }}>
        <style>{DOC_STYLES}</style>
        {content}
      </div>
    )
  }

  return (
    <>
      <style>{DOC_STYLES}</style>
      {content}
    </>
  )
}

// ─────────────────────────────────────────────────────────
//  BillReceiptPreview — standalone test/preview page
//  Used ONLY for testing. Not part of main app flow.
// ─────────────────────────────────────────────────────────
const SAMPLE_BUSINESS = {
  name: 'Rawat General Store',
  tagline: 'Grocery & Daily Essentials',
  address: 'Sector 18, Noida',
  contact: '9818013446',
  gstNumber: '07ABCDE1234F1Z5',
  upiId: 'rawatstore@ybl',
}

const SAMPLE_ORDER = {
  id: '#1234',
  customer: 'Sumit Rawat',
  gstPercent: 5,
  deliveryCharge: 40,
  items: [
    { name: 'Cold Brew Coffee', qty: 2, unitPrice: 180, modifiers: { size: 'Large', milk: 'Oat Milk' } },
    { name: 'Butter Croissant', qty: 3, unitPrice: 85 },
    { name: 'Mineral Water', qty: 1, unitPrice: 25 },
  ],
}

const subtotal = SAMPLE_ORDER.items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
const gstAmt = parseFloat((subtotal * SAMPLE_ORDER.gstPercent / 100).toFixed(2))
const grandTotal = subtotal + gstAmt + SAMPLE_ORDER.deliveryCharge

const SAMPLE_MATH = { subtotal, gstAmt, grandTotal, discountAmt: 0 }

export default function BillReceiptPreview() {
  const invoiceRef = useRef(null)
  const receiptRef = useRef(null)

  const downloadDoc = async (ref, filename) => {
    if (!ref.current) return
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(ref.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })
    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)',
      padding: '40px 20px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        {/* Page title */}
        <div style={{ textAlign: 'center', margin: '0 0 40px 0' }}>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 900, margin: '0 0 8px', letterSpacing: -0.5 }}>
            Bill & Receipt Preview
          </h1>
          <p style={{ color: '#a5b4fc', fontSize: 14, margin: 0 }}>
            Design preview for ManSula BOS documents
          </p>
        </div>

        {/* Two columns */}
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>

          {/* INVOICE CARD */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.1)',
              padding: 16,
            }}>
              <div style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.4)', borderRadius: '6px', overflow: 'hidden' }} ref={invoiceRef}>
                {/* Render inline for preview */}
                <BillDocument
                  type="invoice"
                  business={SAMPLE_BUSINESS}
                  order={SAMPLE_ORDER}
                  math={SAMPLE_MATH}
                  logo="/logo.png"
                  hidden={false}
                />
              </div>
            </div>
            <button
              onClick={() => downloadDoc(invoiceRef, 'invoice-preview')}
              style={downloadBtnStyle('#d97706')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Invoice
            </button>
          </div>

          {/* RECEIPT CARD */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.1)',
              padding: 16,
            }}>
              <div style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.4)', borderRadius: '6px', overflow: 'hidden' }} ref={receiptRef}>
                <BillDocument
                  type="receipt"
                  business={SAMPLE_BUSINESS}
                  order={SAMPLE_ORDER}
                  math={SAMPLE_MATH}
                  logo="/logo.png"
                  paymentMode="UPI"
                  hidden={false}
                />
              </div>
            </div>
            <button
              onClick={() => downloadDoc(receiptRef, 'receipt-preview')}
              style={downloadBtnStyle('#059669')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared download button style ──
const downloadBtnStyle = (color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 24px',
  borderRadius: 100,
  border: 'none',
  background: color,
  color: 'white',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
  boxShadow: `0 4px 16px ${color}50`,
})
