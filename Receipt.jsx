import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function Receipt({
  receiptRef,
  liveProfile,
  activeSession,
  activeSessionId,
  currentMath,
  logo,
  orderSeq,
  paymentMode,
  isPaid = false,
}) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(2);
  const baseOrderId = orderSeq || activeSessionId || '1';
  const orderId = String(baseOrderId).includes('-') ? baseOrderId : `${baseOrderId}-${dd}/${mm}/${yy}`;
  const payLabel = isPaid ? (paymentMode || 'UPI') : 'Pending';

  return (
    <div className="fixed top-[-9999px] left-[-9999px] z-0 overflow-visible pointer-events-none text-left">
      <style>{`
        #receipt-design-container {
          background: #ffffff;
          width: 450px;
          padding: 40px;
          color: #2f3542;
          line-height: 1.6;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
          border-radius: 4px;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        .r-header {
          margin-bottom: 25px;
          border-bottom: 3px solid #ff4757;
          padding-bottom: 20px;
        }

        .r-lockup {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 16px;
          margin-bottom: 6px;
        }

        /* Header logo wrapper — circular, clips image */
        .r-logo-wrap {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          border: 3px solid #ff4757;
          overflow: hidden;
          flex-shrink: 0;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3px;
          box-sizing: border-box;
        }
        .r-logo-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }

        .r-text-group {
          display: flex;
          flex-direction: column;
          justify-content: center;
          line-height: 1.5;
        }

        .r-brand-main {
          color: #ff4757;
          font-weight: 900;
          font-size: 22px;
          letter-spacing: 0.2px;
          font-family: "Arial Black", sans-serif;
          white-space: nowrap;
        }

        .r-brand-sub {
          color: #2f3542;
          font-size: 11.5px;
          letter-spacing: 1.5px;
          font-weight: 600;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .r-tagline {
          margin: 6px 0 0 0;
          font-size: 12px;
          color: #747d8c;
          font-style: italic;
          padding-left: 88px;
        }

        /* INFO BAR */
        .r-info-bar {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 16px;
          margin-bottom: 25px;
          font-size: 13.5px;
          background: #f8f9fa;
          padding: 15px 18px;
          border-radius: 8px;
        }
        .r-info-label {
          color: #747d8c;
          font-weight: 600;
        }
        .r-info-value {
          color: #2f3542;
          font-weight: 800;
          text-align: right;
        }
        .r-info-value.accent {
          color: #ff4757;
        }
        .r-info-value.pending {
          color: #f39c12;
        }

        /* ITEMS TABLE */
        .r-table-head {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 12px;
          color: #a4b0be;
          text-transform: uppercase;
          margin-bottom: 12px;
          border-bottom: 1px solid #f1f2f6;
          padding-bottom: 5px;
        }
        .r-item-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          font-size: 15px;
          border-bottom: 1px solid #f9f9f9;
          padding-bottom: 10px;
        }

        /* THE BOX: Strict height, relative anchor */
        .r-grand-total-box {
          background: #2f3542;
          color: white;
          border-radius: 12px;
          height: 76px !important; 
          position: relative !important; /* Anchors the inner content */
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
          box-sizing: border-box !important;
          overflow: hidden; /* Prevents anything from leaking out */
        }

        /* THE INNER WRAPPER: Absolute mathematical center */
        .r-grand-total-inner {
          position: absolute !important;
          top: 50% !important;
          left: 24px !important;
          right: 24px !important;
          transform: translateY(-50%) !important; /* Pulls exactly half its height up */
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
        }

        /* THE TEXT: Stripped of all hidden browser spacing */
        .r-grand-total-label {
          font-family: "Segoe UI", Tahoma, sans-serif;
          font-weight: 900 !important;
          font-size: 15px !important;
          letter-spacing: 1.5px !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
        }

        .r-total-amt {
          font-weight: 900 !important;
          font-size: 32px !important;
          color: #ff4757 !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1 !important;
        }

        /* QR SECTION */
        .r-qr-section {
          text-align: center;
          margin-top: 25px;
          padding: 20px;
          border: 2px dashed #ff4757;
          border-radius: 12px;
          background: #fff5f5;
        }
        .qr-wrapper {
          position: relative;
          display: inline-block;
          background: white;
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 10px;
        }
        .qr-image {
          width: 180px;
          height: 180px;
          display: block;
          object-fit: contain;
        }
        .qr-logo-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          margin-top: -22px;
          margin-left: -22px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 2px solid #ffffffff;
          background: none;
          overflow: hidden;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        .qr-logo-overlay img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }

        /* PAID STAMP */
        .r-paid-stamp {
          text-align: center;
          margin-top: 20px;
          padding: 14px 20px;
          border: 2px solid #2ed573;
          border-radius: 12px;
          background: #f0fff4;
        }
        .r-paid-stamp-text {
          color: #27ae60;
          font-weight: 900;
          font-size: 18px;
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        /* FOOTER */
        .r-footer {
          text-align: center;
          margin-top: 40px;
          border-top: 1px solid #f1f2f6;
          padding-top: 20px;
        }
      `}</style>
      <div id="receipt-design-container" ref={receiptRef}>

        {/* HEADER */}
        <div className="r-header">
          <div className="r-lockup">
            <div className="r-logo-wrap">
              <img src={logo} className="r-logo-img" alt="Logo" />
            </div>
            <div className="r-text-group">
              <div className="r-brand-main">ManSula Nexus</div>
              <div className="r-brand-sub">by ManSula Technlogies & DevLabs</div>
            </div>
          </div>
          <p className="r-tagline">Hardware &nbsp;•&nbsp; Software &nbsp;•&nbsp; Tech Support</p>
        </div>

        {/* INFO BAR */}
        <div className="r-info-bar">
          <span className="r-info-label">Merchant</span>
          <span className="r-info-value">{liveProfile.name}</span>

          <span className="r-info-label">Contact</span>
          <span className="r-info-value">{liveProfile.contact ? `+91 ${liveProfile.contact}` : '—'}</span>

          {liveProfile.gstNumber && <>
            <span className="r-info-label">GST No.</span>
            <span className="r-info-value">{liveProfile.gstNumber}</span>
          </>}

          <span className="r-info-label">Order ID</span>
          <span className="r-info-value accent">#{orderId}</span>

          <span className="r-info-label">Date</span>
          <span className="r-info-value">
            {now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            &nbsp;
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          <span className="r-info-label">Payment</span>
          <span className={`r-info-value ${isPaid ? '' : 'pending'}`}>{payLabel}</span>
        </div>

        {/* ITEMS */}
        <div className="r-table-head">
          <span>Description / Qty</span>
          <span>Amount</span>
        </div>

        {activeSession.items.map((item, idx) => (
          <div className="r-item-row" key={idx}>
            <div>
              <span style={{ fontWeight: 700 }}>{item.name}</span>
              {item.modifiers && Object.values(item.modifiers).length > 0 && (
                <><br /><small style={{ color: '#a4b0be', fontSize: 11 }}>{Object.values(item.modifiers).join(' • ')}</small></>
              )}
              <br />
              <small style={{ color: '#747d8c' }}>
                {item.qty} unit{item.qty > 1 ? 's' : ''} × ₹{item.unitPrice.toFixed(2)}
              </small>
            </div>
            <div style={{ fontWeight: 700 }}>₹{(item.qty * item.unitPrice).toFixed(2)}</div>
          </div>
        ))}

        {/* TOTALS */}
        <div style={{ marginTop: '20px', borderTop: '2px solid #f1f2f6', paddingTop: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#747d8c', marginBottom: '5px' }}>
            <span>Subtotal</span>
            <span>₹{currentMath.subtotal.toFixed(2)}</span>
          </div>
          {currentMath.discountAmt > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#2ed573', fontWeight: 600 }}>
              <span>Discount ({activeSession.discountVal > 0 && activeSession.discountType === 'percent' ? activeSession.discountVal : 0}%)</span>
              <span>-₹{currentMath.discountAmt.toFixed(2)}</span>
            </div>
          )}
          {currentMath.gstAmt > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#ff4757', fontWeight: 600 }}>
              <span>GST ({activeSession.gstPercent}%)</span>
              <span>₹{currentMath.gstAmt.toFixed(2)}</span>
            </div>
          )}
          {(activeSession.deliveryCharge || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#747d8c', margin: '5px 0' }}>
              <span>Delivery Charges</span>
              <span>₹{(activeSession.deliveryCharge || 0).toFixed(2)}</span>
            </div>
          )}

          {/* Outer wrapper to shield against html2canvas margin alignment bug */}
          <div style={{ marginTop: '15px' }}>
            <div className="r-grand-total-box">
              <div className="r-grand-total-inner">
                <span className="r-grand-total-label">GRAND TOTAL</span>
                <span className="r-total-amt">
                  ₹{currentMath.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* QR or PAID STAMP */}
        {isPaid ? (
          <div className="r-paid-stamp">
            <div className="r-paid-stamp-text">✓ Payment Received</div>
            <div style={{ fontSize: 12, color: '#57606f', marginTop: 4 }}>via {paymentMode || 'UPI'} — Thank you!</div>
          </div>
        ) : (
          <div className="r-qr-section">
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 900, color: '#ff4757', letterSpacing: '1px' }}>
              SCAN TO PAY
            </p>
            <div className="qr-wrapper">
              <QRCodeSVG
                value={`upi://pay?pa=${liveProfile.upiId || 'test@ybl'}&pn=${liveProfile.name.replace(/\s+/g, '%20')}&am=${currentMath.grandTotal}&cu=INR&tn=Powered%20by%20ManSula%20Technologies`}
                size={180}
                level="H"
                className="qr-image"
                imageSettings={{
                  src: logo,
                  height: 38,
                  width: 38,
                  excavate: true,
                }}
              />
              <div className="qr-logo-overlay" style={{ pointerEvents: 'none' }}>
                <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#747d8c' }}>
              UPI ID: <span style={{ color: '#2f3542' }}>{liveProfile.upiId || 'test@ybl'}</span>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="r-footer">
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2f3542' }}>Thank You!</div>
          <p style={{ margin: '8px 0', fontSize: '13px', color: '#747d8c', fontStyle: 'italic' }}>
            "Empowering your business with smart technology and solutions"
          </p>
          <div style={{ marginTop: '20px', borderTop: '1px solid #f1f2f6', paddingTop: '15px', fontSize: '11px', color: '#a4b0be', fontWeight: 'bold' }}>
            <div style={{ color: '#ff4757', fontSize: '13px', marginBottom: '5px' }}>
              https://mansulanexus.netlify.app
            </div>
            <div style={{ marginBottom: '8px' }}>
              Email: mansula.rwt@gmail.com &nbsp; | &nbsp; Phone: +91 9818013446
            </div>
            <div style={{ color: '#ced4da', letterSpacing: '0.5px' }}>
              <br />
              Digital Receipt generated by ManSula Nexus v1.0.0<br />
              © 2026 ManSula Technologies &amp; ManSula DevLabs. All rights reserved.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
