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
    align-items: center;
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
  .brd-doc-badge {
    text-align: right;
  }
  .brd-doc-type {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 100px;
  }
  .brd-doc-type.invoice {
    color: #d97706;
    background: rgba(217,119,6,0.1);
    border: 1.5px solid rgba(217,119,6,0.25);
  }
  .brd-doc-type.receipt {
    color: #059669;
    background: rgba(5,150,105,0.1);
    border: 1.5px solid rgba(5,150,105,0.25);
  }
  .brd-doc-num {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 4px;
    font-weight: 500;
  }

  /* ── META GRID ───────────────────── */
  .brd-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    margin: 0 32px 0;
    background: #f9f9fe;
    border: 1px solid #ebebf8;
    border-radius: 12px;
    overflow: hidden;
    margin-top: 20px;
  }
  .brd-meta-cell {
    padding: 11px 16px;
    border-right: 1px solid #ebebf8;
    border-bottom: 1px solid #ebebf8;
  }
  .brd-meta-cell:nth-child(even) { border-right: none; }
  .brd-meta-cell:nth-last-child(-n+2) { border-bottom: none; }
  .brd-meta-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: #9ca3af;
    margin-bottom: 2px;
  }
  .brd-meta-value {
    font-size: 13px;
    font-weight: 700;
    color: #1a1a2e;
  }
  .brd-meta-value.accent { color: #6366f1; }
  .brd-meta-value.warn   { color: #d97706; }
  .brd-meta-value.ok     { color: #059669; }

  /* ── ITEMS TABLE ─────────────────── */
  .brd-items {
    margin: 20px 32px 0;
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
    margin-top: 14px;
    background: #1a1a2e;
    border-radius: 12px;
    padding: 16px 22px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .brd-grand-label {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 2px;
    color: #a5b4fc;
    text-transform: uppercase;
  }
  .brd-grand-amt {
    font-size: 30px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: -1px;
  }
  .brd-grand-amt span {
    font-size: 18px;
    font-weight: 700;
    color: #a5b4fc;
    margin-right: 2px;
  }

  /* ── QR SECTION (Invoice) ─────────── */
  .brd-qr-section {
    margin: 20px 32px 0;
    background: #f9f9fe;
    border: 1.5px dashed #c7d2fe;
    border-radius: 14px;
    padding: 18px;
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .brd-qr-wrap {
    position: relative;
    flex-shrink: 0;
    background: white;
    padding: 8px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(99,102,241,0.1);
  }
  .brd-qr-meta {
    flex: 1;
  }
  .brd-qr-label {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #6366f1;
    margin-bottom: 6px;
  }
  .brd-upi-id {
    font-size: 13px;
    font-weight: 700;
    color: #1a1a2e;
    word-break: break-all;
    margin-bottom: 8px;
  }
  .brd-scan-note {
    font-size: 11px;
    color: #9ca3af;
    line-height: 1.5;
  }
  .brd-amount-chip {
    display: inline-flex;
    align-items: baseline;
    gap: 2px;
    margin-top: 6px;
    background: #6366f1;
    color: white;
    border-radius: 100px;
    padding: 4px 12px;
    font-size: 15px;
    font-weight: 800;
  }
  .brd-amount-chip span { font-size: 11px; font-weight: 600; opacity: 0.8; }

  /* ── PAID STAMP (Receipt) ─────────── */
  .brd-paid-stamp {
    margin: 20px 32px 0;
    background: #f0fdf4;
    border: 1.5px solid #6ee7b7;
    border-radius: 14px;
    padding: 18px 22px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .brd-paid-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #059669;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .brd-paid-title {
    font-size: 16px;
    font-weight: 900;
    color: #065f46;
    letter-spacing: 0.5px;
  }
  .brd-paid-sub {
    font-size: 12px;
    color: #6b7280;
    margin-top: 2px;
  }

  /* ── FOOTER ──────────────────────── */
  .brd-footer {
    margin: 24px 32px 0;
    border-top: 1px solid #f0f0f8;
    padding: 20px 0 30px;
    text-align: center;
  }
  .brd-footer-tagline {
    font-size: 13px;
    font-style: italic;
    color: #9ca3af;
    margin: 0 0 12px;
  }
  .brd-footer-links {
    font-size: 10.5px;
    color: #c4b5fd;
    font-weight: 600;
    letter-spacing: 0.3px;
  }
  .brd-footer-brand {
    font-size: 11px;
    color: #d1d5db;
    margin-top: 8px;
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
}) {
  const isReceipt = type === 'receipt'
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const orderId = order.id || `#${Math.floor(10000 + Math.random() * 90000)}`
  const upiString = `upi://pay?pa=${business.upiId || 'test@ybl'}&pn=${encodeURIComponent(business.name || 'Business')}&am=${math.grandTotal || 0}&cu=INR&tn=ManSula%20BOS`

  const items = order.items || []
  const subtotal = math.subtotal || 0
  const discountAmt = math.discountAmt || 0
  const gstAmt = math.gstAmt || 0
  const delivery = order.deliveryCharge || 0
  const grandTotal = math.grandTotal || 0

  return (
    <div style={{ position: 'fixed', top: -9999, left: -9999, zIndex: 0, pointerEvents: 'none' }}>
      <style>{DOC_STYLES}</style>
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
            </div>
          </div>
          <div className="brd-doc-badge">
            <div className={`brd-doc-type ${isReceipt ? 'receipt' : 'invoice'}`}>
              {isReceipt ? 'Receipt' : 'Invoice'}
            </div>
            <div className="brd-doc-num">No. {orderId}</div>
          </div>
        </div>

        {/* META GRID */}
        <div className="brd-meta">
          <div className="brd-meta-cell">
            <div className="brd-meta-label">Business</div>
            <div className="brd-meta-value">{business.name || '—'}</div>
          </div>
          <div className="brd-meta-cell">
            <div className="brd-meta-label">Contact</div>
            <div className="brd-meta-value">{business.contact ? `+91 ${business.contact}` : '—'}</div>
          </div>
          {business.gstNumber && <>
            <div className="brd-meta-cell">
              <div className="brd-meta-label">GST No.</div>
              <div className="brd-meta-value accent">{business.gstNumber}</div>
            </div>
            <div className="brd-meta-cell">
              <div className="brd-meta-label">Order No.</div>
              <div className="brd-meta-value accent">{orderId}</div>
            </div>
          </>}
          {!business.gstNumber && <>
            <div className="brd-meta-cell">
              <div className="brd-meta-label">Order No.</div>
              <div className="brd-meta-value accent">{orderId}</div>
            </div>
            <div className="brd-meta-cell">
              <div className="brd-meta-label">Customer</div>
              <div className="brd-meta-value">{order.customer || 'Walk-in'}</div>
            </div>
          </>}
          <div className="brd-meta-cell">
            <div className="brd-meta-label">Date & Time</div>
            <div className="brd-meta-value">{dateStr} {timeStr}</div>
          </div>
          <div className="brd-meta-cell">
            <div className="brd-meta-label">Payment</div>
            <div className={`brd-meta-value ${isReceipt ? 'ok' : 'warn'}`}>
              {isReceipt ? paymentMode : 'Awaiting Payment'}
            </div>
          </div>
        </div>

        {/* ITEMS */}
        <div className="brd-items">
          <div className="brd-items-head">
            <span>Item / Description</span>
            <span style={{ textAlign: 'right' }}>Qty</span>
            <span style={{ textAlign: 'right' }}>Rate</span>
            <span style={{ textAlign: 'right' }}>Amount</span>
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
              <span>GST ({order.gstPercent}%)</span>
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
            </div>
            <div className="brd-grand-amt">
              <span>₹</span>{grandTotal.toFixed(2)}
            </div>
          </div>
        </div>

        {/* QR (Invoice) or PAID STAMP (Receipt) */}
        {isReceipt ? (
          <div className="brd-paid-stamp">
            <div className="brd-paid-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <div className="brd-paid-title">Payment Received</div>
              <div className="brd-paid-sub">via {paymentMode} — Thank you for your business!</div>
            </div>
          </div>
        ) : (
          <div className="brd-qr-section">
            <div className="brd-qr-wrap">
              <QRCodeSVG
                value={upiString}
                size={110}
                level="H"
                imageSettings={{ src: logo, height: 24, width: 24, excavate: true }}
              />
            </div>
            <div className="brd-qr-meta">
              <div className="brd-qr-label">Scan & Pay via UPI</div>
              <div className="brd-upi-id">{business.upiId || 'yourname@upi'}</div>
              <div className="brd-scan-note">Scan this QR code with any UPI app to pay instantly</div>
              <div className="brd-amount-chip">
                <span>₹</span>{grandTotal.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="brd-footer">
          <p className="brd-footer-tagline">"Empowering your business with smart technology"</p>
          <div className="brd-footer-links">mansulatech.netlify.app</div>
          <div className="brd-footer-brand" style={{ lineHeight: '1.6' }}>
            {isReceipt ? 'Receipt' : 'Invoice'} generated by ManSula Nexus<br/>
            Developed by ManSula DivLabs<br/>
            © {new Date().getFullYear()} ManSula Technologies & ManSula DivLabs
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
//  BillReceiptPreview — standalone test/preview page
//  Used ONLY for testing. Not part of main app flow.
// ─────────────────────────────────────────────────────────
const SAMPLE_BUSINESS = {
  name: 'Rawat General Store',
  tagline: 'Your Neighbourhood Shop',
  contact: '9818013446',
  gstNumber: '07ABCDE1234F1Z5',
  upiId: 'rawatstore@ybl',
}

const SAMPLE_ORDER = {
  id: '#1042',
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
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
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
              <style>{DOC_STYLES}</style>
              <div className="brd-root" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
                {/* Render inline for preview */}
                <InvoiceContent
                  business={SAMPLE_BUSINESS}
                  order={SAMPLE_ORDER}
                  math={SAMPLE_MATH}
                  logo="/logo.png"
                  orderId="#1042"
                />
              </div>
            </div>
            <button
              onClick={() => downloadDoc(invoiceRef, 'invoice-preview')}
              style={downloadBtnStyle('#d97706')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
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
              <div className="brd-root" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
                <ReceiptContent
                  business={SAMPLE_BUSINESS}
                  order={SAMPLE_ORDER}
                  math={SAMPLE_MATH}
                  logo="/logo.png"
                  orderId="#1042"
                  paymentMode="UPI"
                />
              </div>
            </div>
            <button
              onClick={() => downloadDoc(receiptRef, 'receipt-preview')}
              style={downloadBtnStyle('#059669')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Hidden refs for html2canvas capture */}
      <div style={{ position: 'fixed', top: -9999, left: -9999, zIndex: 0 }}>
        <div className="brd-root" ref={invoiceRef}>
          <InvoiceContent
            business={SAMPLE_BUSINESS}
            order={SAMPLE_ORDER}
            math={SAMPLE_MATH}
            logo="/logo.png"
            orderId="#1042"
          />
        </div>
        <div className="brd-root" ref={receiptRef}>
          <ReceiptContent
            business={SAMPLE_BUSINESS}
            order={SAMPLE_ORDER}
            math={SAMPLE_MATH}
            logo="/logo.png"
            orderId="#1042"
            paymentMode="UPI"
          />
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

// ── Shared body content for Invoice ──
function InvoiceContent({ business, order, math, logo, orderId }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const upiString = `upi://pay?pa=${business.upiId || 'test@ybl'}&pn=${encodeURIComponent(business.name || 'Business')}&am=${math.grandTotal || 0}&cu=INR`
  return <>
    <div className="brd-accent-bar" />
    <div className="brd-header">
      <div className="brd-lockup">
        <div className="brd-logo-wrap"><img src={logo} className="brd-logo-img" alt="Logo" /></div>
        <div>
          <div className="brd-brand-main">{business.name}</div>
          <div className="brd-brand-sub">{business.tagline}</div>
        </div>
      </div>
      <div className="brd-doc-badge">
        <div className="brd-doc-type invoice">Invoice</div>
        <div className="brd-doc-num">No. {orderId}</div>
      </div>
    </div>
    <div className="brd-meta">
      <div className="brd-meta-cell"><div className="brd-meta-label">Business</div><div className="brd-meta-value">{business.name}</div></div>
      <div className="brd-meta-cell"><div className="brd-meta-label">Contact</div><div className="brd-meta-value">+91 {business.contact}</div></div>
      <div className="brd-meta-cell"><div className="brd-meta-label">GST No.</div><div className="brd-meta-value accent">{business.gstNumber}</div></div>
      <div className="brd-meta-cell"><div className="brd-meta-label">Order No.</div><div className="brd-meta-value accent">{orderId}</div></div>
      <div className="brd-meta-cell"><div className="brd-meta-label">Date & Time</div><div className="brd-meta-value">{dateStr} {timeStr}</div></div>
      <div className="brd-meta-cell"><div className="brd-meta-label">Payment</div><div className="brd-meta-value warn">Awaiting Payment</div></div>
    </div>
    <div className="brd-items">
      <div className="brd-items-head">
        <span>Item / Description</span>
        <span style={{textAlign:'right'}}>Qty</span>
        <span style={{textAlign:'right'}}>Rate</span>
        <span style={{textAlign:'right'}}>Amount</span>
      </div>
      {order.items.map((item, i) => (
        <div className="brd-item-row" key={i}>
          <div>
            <div className="brd-item-name">{item.name}</div>
            {item.modifiers && <div className="brd-item-mod">{Object.values(item.modifiers).join(' • ')}</div>}
          </div>
          <div className="brd-item-cell">{item.qty}</div>
          <div className="brd-item-cell">₹{item.unitPrice.toFixed(2)}</div>
          <div className="brd-item-total">₹{(item.qty * item.unitPrice).toFixed(2)}</div>
        </div>
      ))}
    </div>
    <div className="brd-totals">
      <div className="brd-total-row"><span>Subtotal</span><span>₹{math.subtotal.toFixed(2)}</span></div>
      {math.discountAmt > 0 && <div className="brd-total-row discount"><span>Discount</span><span>–₹{math.discountAmt.toFixed(2)}</span></div>}
      <div className="brd-total-row tax"><span>GST ({order.gstPercent}%)</span><span>+₹{math.gstAmt.toFixed(2)}</span></div>
      <div className="brd-total-row"><span>Delivery</span><span>₹{order.deliveryCharge.toFixed(2)}</span></div>
      <div className="brd-grand-total">
        <div><div className="brd-grand-label">Amount Due</div></div>
        <div className="brd-grand-amt"><span>₹</span>{math.grandTotal.toFixed(2)}</div>
      </div>
    </div>
    <div className="brd-qr-section">
      <div className="brd-qr-wrap">
        <QRCodeSVG value={upiString} size={110} level="H" imageSettings={{ src: logo, height: 24, width: 24, excavate: true }} />
      </div>
      <div className="brd-qr-meta">
        <div className="brd-qr-label">Scan & Pay via UPI</div>
        <div className="brd-upi-id">{business.upiId}</div>
        <div className="brd-scan-note">Scan this QR code with any UPI app to pay instantly</div>
        <div className="brd-amount-chip"><span>₹</span>{math.grandTotal.toFixed(2)}</div>
      </div>
    </div>
    <div className="brd-footer">
      <p className="brd-footer-tagline">"Empowering your business with smart technology"</p>
      <div className="brd-footer-links">mansulatech.netlify.app</div>
      <div className="brd-footer-brand" style={{ lineHeight: '1.6' }}>
        Invoice generated by ManSula Nexus<br/>
        Developed by ManSula DivLabs<br/>
        © {new Date().getFullYear()} ManSula Technologies & ManSula DivLabs
      </div>
    </div>
  </>
}

// ── Shared body content for Receipt ──
function ReceiptContent({ business, order, math, logo, orderId, paymentMode }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return <>
    <div className="brd-accent-bar" />
    <div className="brd-header">
      <div className="brd-lockup">
        <div className="brd-logo-wrap"><img src={logo} className="brd-logo-img" alt="Logo" /></div>
        <div>
          <div className="brd-brand-main">{business.name}</div>
          <div className="brd-brand-sub">{business.tagline}</div>
        </div>
      </div>
      <div className="brd-doc-badge">
        <div className="brd-doc-type receipt">Receipt</div>
        <div className="brd-doc-num">No. {orderId}</div>
      </div>
    </div>
    <div className="brd-meta">
      <div className="brd-meta-cell"><div className="brd-meta-label">Business</div><div className="brd-meta-value">{business.name}</div></div>
      <div className="brd-meta-cell"><div className="brd-meta-label">Contact</div><div className="brd-meta-value">+91 {business.contact}</div></div>
      <div className="brd-meta-cell"><div className="brd-meta-label">GST No.</div><div className="brd-meta-value accent">{business.gstNumber}</div></div>
      <div className="brd-meta-cell"><div className="brd-meta-label">Order No.</div><div className="brd-meta-value accent">{orderId}</div></div>
      <div className="brd-meta-cell"><div className="brd-meta-label">Date & Time</div><div className="brd-meta-value">{dateStr} {timeStr}</div></div>
      <div className="brd-meta-cell"><div className="brd-meta-label">Payment</div><div className="brd-meta-value ok">{paymentMode}</div></div>
    </div>
    <div className="brd-items">
      <div className="brd-items-head">
        <span>Item / Description</span>
        <span style={{textAlign:'right'}}>Qty</span>
        <span style={{textAlign:'right'}}>Rate</span>
        <span style={{textAlign:'right'}}>Amount</span>
      </div>
      {order.items.map((item, i) => (
        <div className="brd-item-row" key={i}>
          <div>
            <div className="brd-item-name">{item.name}</div>
            {item.modifiers && <div className="brd-item-mod">{Object.values(item.modifiers).join(' • ')}</div>}
          </div>
          <div className="brd-item-cell">{item.qty}</div>
          <div className="brd-item-cell">₹{item.unitPrice.toFixed(2)}</div>
          <div className="brd-item-total">₹{(item.qty * item.unitPrice).toFixed(2)}</div>
        </div>
      ))}
    </div>
    <div className="brd-totals">
      <div className="brd-total-row"><span>Subtotal</span><span>₹{math.subtotal.toFixed(2)}</span></div>
      {math.discountAmt > 0 && <div className="brd-total-row discount"><span>Discount</span><span>–₹{math.discountAmt.toFixed(2)}</span></div>}
      <div className="brd-total-row tax"><span>GST ({order.gstPercent}%)</span><span>+₹{math.gstAmt.toFixed(2)}</span></div>
      <div className="brd-total-row"><span>Delivery</span><span>₹{order.deliveryCharge.toFixed(2)}</span></div>
      <div className="brd-grand-total">
        <div><div className="brd-grand-label">Total Paid</div></div>
        <div className="brd-grand-amt"><span>₹</span>{math.grandTotal.toFixed(2)}</div>
      </div>
    </div>
    <div className="brd-paid-stamp">
      <div className="brd-paid-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div>
        <div className="brd-paid-title">Payment Received</div>
        <div className="brd-paid-sub">via {paymentMode} — Thank you for your business!</div>
      </div>
    </div>
    <div className="brd-footer">
      <p className="brd-footer-tagline">"Empowering your business with smart technology"</p>
      <div className="brd-footer-links">mansulatech.netlify.app</div>
      <div className="brd-footer-brand" style={{ lineHeight: '1.6' }}>
        Receipt generated by ManSula Nexus<br/>
        Developed by ManSula DivLabs<br/>
        © {new Date().getFullYear()} ManSula Technologies & ManSula DivLabs
      </div>
    </div>
  </>
}
