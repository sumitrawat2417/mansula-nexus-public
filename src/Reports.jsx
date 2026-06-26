import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useBackButton } from './useBackButton.js'
import {
  getAnalyticsData, getPurchaseAnalyticsData,
  getInventoryItems, getCustomers, getPurchaseLogs,
} from './db.js'
import DateFilterDrawer, { computeQuick } from './DateFilterDrawer.jsx'

// ── Icons ──────────────────────────────────────────────────────────────────────
const Ic = {
  Back:     ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  FileText: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Download: ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Print:    ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  Calendar: ({ s = 13 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  ChevD:    ({ s = 12 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  ChevR:    ({ s = 14 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  TrendUp:  ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Package:  ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Card:     ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Receipt:  ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>,
  Users:    ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Database: ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Alert:    ({ s = 14 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Wallet:   ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>,
  ClockH:   ({ s = 14 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtNum = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
const fmtCur = (n, sym = '₹') => `${sym}${fmtNum(n)}`
const fmtDate = (ts) => new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
const pct = (part, total) => total > 0 ? ((part / total) * 100).toFixed(1) + '%' : '0%'

const PAYMENT_COLOR  = { cash: '#10b981', upi: '#6366f1', card: '#0ea5e9', udhaar: '#f59e0b', split: '#8b5cf6', other: '#64748b' }
const PAYMENT_LABEL  = { cash: 'Cash', upi: 'UPI', card: 'Card', udhaar: 'Udhaar', split: 'Split', other: 'Other' }
const PAYMENT_MODES  = ['cash', 'upi', 'card', 'udhaar', 'split', 'other']
const GST_RATES      = [0, 0.05, 0.12, 0.18, 0.28]
const GST_LABELS     = { 0: 'No Tax (0%)', 0.05: 'GST 5%', 0.12: 'GST 12%', 0.18: 'GST 18%', 0.28: 'GST 28%' }

// ── CSV download ──────────────────────────────────────────────────────────────
function downloadCSV(filename, headers, rows) {
  const e = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = [headers.map(e).join(','), ...rows.map(r => r.map(e).join(','))]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function KpiGrid({ children }) {
  return <div className="an-kpi-grid">{children}</div>
}
function KpiCard({ label, value, sub, color }) {
  return (
    <div className="an-kpi-card">
      <div className="an-kpi-label">{label}</div>
      <div className="an-kpi-value" style={{ color }}>{value}</div>
      {sub && <div className="an-kpi-sub">{sub}</div>}
    </div>
  )
}

function ReportSection({ title, children }) {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border-color)', overflow: 'hidden', flexShrink: 0 }}>
      {title && (
        <div style={{ padding: '10px 14px 0', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
          {title}
        </div>
      )}
      {children}
    </div>
  )
}

const Th = ({ children, right }) => (
  <th style={{ padding: '8px 12px', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', textAlign: right ? 'right' : 'left', background: 'var(--bg-surface-2)', whiteSpace: 'nowrap' }}>
    {children}
  </th>
)
const Td = ({ children, right, bold, muted, color }) => (
  <td style={{ padding: '9px 12px', fontSize: '0.8rem', fontWeight: bold ? 700 : 400, color: color || (muted ? 'var(--text-muted)' : 'var(--text-primary)'), textAlign: right ? 'right' : 'left', borderTop: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
    {children}
  </td>
)

function StatusBadge({ label, color }) {
  return (
    <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 100, background: `${color}18`, color, fontSize: '0.7rem', fontWeight: 700 }}>
      {label}
    </span>
  )
}

function NoticeBanner({ children, color = '#f59e0b' }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: `${color}10`, borderRadius: 12, border: `1px solid ${color}30`, flexShrink: 0 }}>
      <Ic.Alert s={14} style={{ color, flexShrink: 0, marginTop: 1 }} />
      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{children}</p>
    </div>
  )
}

function ExportBar({ onCSV, onPrint, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border-color)', marginTop: 4, flexShrink: 0 }}>
      <button onClick={onPrint} disabled={disabled} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', background: 'var(--bg-surface-2)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.8rem', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, fontFamily: 'Outfit, sans-serif' }}>
        <Ic.Print s={14} /> Print / PDF
      </button>
      <button onClick={onCSV} disabled={disabled} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, fontFamily: 'Outfit, sans-serif', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}>
        <Ic.Download s={14} /> Export CSV
      </button>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--bg-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
        <Ic.FileText s={22} />
      </div>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>No data for this period</div>
      <div style={{ fontSize: '0.75rem', marginTop: 4 }}>Try changing the date range.</div>
    </div>
  )
}

function SkeletonRows({ count = 4 }) {
  return (
    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ height: 36, borderRadius: 8, background: 'var(--bg-surface-2)', opacity: 1 - i * 0.15, animation: 'pulse 1.4s ease-in-out infinite' }} />
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// REPORT 1 — DAILY SUMMARY
// ════════════════════════════════════════════════════════════════════════════════
function DailySummaryReport({ orders, currency }) {
  const sym = currency?.symbol || '₹'

  const stats = useMemo(() => {
    const total = orders.reduce((s, o) => s + (o.total || 0), 0)
    const count = orders.length
    const aov = count > 0 ? total / count : 0
    const discountGiven = orders.reduce((s, o) => s + (o.discountAmt || 0), 0)
    const taxCollected = orders.reduce((s, o) => s + (o.taxAmt || 0), 0)
    const hourMap = {}
    for (let h = 0; h < 24; h++) hourMap[h] = { count: 0, revenue: 0 }
    orders.forEach(o => {
      const h = new Date(o.completedAt).getHours()
      hourMap[h].count++
      hourMap[h].revenue += (o.total || 0)
    })
    const hourly = Object.entries(hourMap).filter(([, v]) => v.count > 0).map(([h, v]) => ({ hour: Number(h), ...v }))
    const itemMap = {}
    orders.forEach(o => {
      (o.items || []).forEach(i => {
        if (!itemMap[i.name]) itemMap[i.name] = { name: i.name, qty: 0, revenue: 0 }
        itemMap[i.name].qty += i.qty
        itemMap[i.name].revenue += i.price * i.qty
      })
    })
    const topItems = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8)
    return { total, count, aov, discountGiven, taxCollected, hourly, topItems }
  }, [orders])

  const handleCSV = () => {
    downloadCSV('DailySummary.csv',
      ['Product', 'Qty Sold', 'Revenue'],
      stats.topItems.map(i => [i.name, i.qty, i.revenue.toFixed(2)])
    )
  }

  if (orders.length === 0) return <EmptyState />

  return (
    <div className="an-tab-content">
      <KpiGrid>
        <KpiCard label="Total Orders" value={stats.count} color="var(--brand-primary)" />
        <KpiCard label="Revenue" value={fmtCur(stats.total, sym)} color="#10b981" />
        <KpiCard label="Avg Order Value" value={fmtCur(stats.aov, sym)} color="#0ea5e9" />
        <KpiCard label="Tax Collected" value={fmtCur(stats.taxCollected, sym)} color="#f59e0b" />
      </KpiGrid>

      {stats.discountGiven > 0 && (
        <NoticeBanner color="#ef4444">Discounts given: <strong style={{ color: '#ef4444' }}>{fmtCur(stats.discountGiven, sym)}</strong></NoticeBanner>
      )}

      {stats.hourly.length > 0 && (
        <ReportSection title="Hourly Activity">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><Th>Hour</Th><Th right>Orders</Th><Th right>Revenue</Th></tr></thead>
              <tbody>
                {stats.hourly.map(h => (
                  <tr key={h.hour}>
                    <Td>{h.hour === 0 ? '12 AM' : h.hour < 12 ? `${h.hour} AM` : h.hour === 12 ? '12 PM' : `${h.hour - 12} PM`}</Td>
                    <Td right>{h.count}</Td>
                    <Td right bold>{fmtCur(h.revenue, sym)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportSection>
      )}

      {stats.topItems.length > 0 && (
        <ReportSection title="Top Items">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><Th>Product</Th><Th right>Qty</Th><Th right>Revenue</Th><Th right>Share</Th></tr></thead>
              <tbody>
                {stats.topItems.map((item, i) => (
                  <tr key={i}>
                    <Td>{item.name}</Td>
                    <Td right>{item.qty}</Td>
                    <Td right bold>{fmtCur(item.revenue, sym)}</Td>
                    <Td right muted>{pct(item.revenue, stats.total)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportSection>
      )}

      <ExportBar onCSV={handleCSV} onPrint={() => window.print()} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// REPORT 2 — SALES BY PRODUCT
// ════════════════════════════════════════════════════════════════════════════════
function SalesByProductReport({ orders, currency }) {
  const sym = currency?.symbol || '₹'

  const products = useMemo(() => {
    const map = {}
    const totalRev = orders.reduce((s, o) => s + (o.total || 0), 0)
    orders.forEach(o => {
      (o.items || []).forEach(i => {
        if (!map[i.name]) map[i.name] = { name: i.name, qty: 0, revenue: 0 }
        map[i.name].qty += i.qty
        map[i.name].revenue += i.price * i.qty
      })
    })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).map((p, i) => ({ ...p, rank: i + 1, sharePct: pct(p.revenue, totalRev), shareNum: totalRev > 0 ? (p.revenue / totalRev) * 100 : 0 }))
  }, [orders])

  const handleCSV = () => {
    downloadCSV('SalesByProduct.csv',
      ['Rank', 'Product', 'Qty Sold', 'Revenue', 'Share'],
      products.map(p => [p.rank, p.name, p.qty, p.revenue.toFixed(2), p.sharePct])
    )
  }

  if (products.length === 0) return <EmptyState />

  return (
    <div className="an-tab-content">
      <KpiGrid>
        <KpiCard label="Products Sold" value={products.length} color="var(--brand-primary)" />
        <KpiCard label="Total Units" value={fmtNum(products.reduce((s, p) => s + p.qty, 0))} color="#10b981" />
      </KpiGrid>

      <ReportSection>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><Th>#</Th><Th>Product</Th><Th right>Qty</Th><Th right>Revenue</Th><Th right>Share</Th></tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.rank}>
                  <Td muted>{p.rank}</Td>
                  <Td bold>{p.name}</Td>
                  <Td right>{fmtNum(p.qty)}</Td>
                  <Td right bold>{fmtCur(p.revenue, sym)}</Td>
                  <Td right>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <div style={{ width: 44, height: 4, borderRadius: 2, background: 'var(--border-color)', overflow: 'hidden' }}>
                        <div style={{ width: `${p.shareNum}%`, height: '100%', background: '#f59e0b', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: 36 }}>{p.sharePct}</span>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>

      <ExportBar onCSV={handleCSV} onPrint={() => window.print()} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// REPORT 3 — PAYMENT BREAKDOWN
// ════════════════════════════════════════════════════════════════════════════════
function PaymentBreakdownReport({ orders, currency }) {
  const sym = currency?.symbol || '₹'

  const breakdown = useMemo(() => {
    const map = {}
    PAYMENT_MODES.forEach(m => { map[m] = { count: 0, amount: 0 } })
    const totalRev = orders.reduce((s, o) => s + (o.total || 0), 0)
    orders.forEach(o => {
      const mode = o.paymentMode || 'cash'
      if (mode === 'split' && o.paymentDetails) {
        map['cash'].count++; map['cash'].amount += (o.paymentDetails.cash || 0)
        map['upi'].count++;  map['upi'].amount  += (o.paymentDetails.upi  || 0)
      } else {
        const m = map[mode] ? mode : 'other'
        map[m].count++; map[m].amount += (o.total || 0)
      }
    })
    return PAYMENT_MODES
      .map(m => ({ mode: m, label: PAYMENT_LABEL[m], color: PAYMENT_COLOR[m], ...map[m], sharePct: pct(map[m].amount, totalRev), shareNum: totalRev > 0 ? (map[m].amount / totalRev) * 100 : 0 }))
      .filter(m => m.count > 0)
      .sort((a, b) => b.amount - a.amount)
  }, [orders])

  const totalRev = orders.reduce((s, o) => s + (o.total || 0), 0)

  const handleCSV = () => {
    downloadCSV('PaymentBreakdown.csv',
      ['Payment Mode', 'Orders', 'Amount', 'Share'],
      breakdown.map(b => [b.label, b.count, b.amount.toFixed(2), b.sharePct])
    )
  }

  if (breakdown.length === 0) return <EmptyState />

  return (
    <div className="an-tab-content">
      <KpiGrid>
        <KpiCard label="Total Orders" value={fmtNum(orders.length)} color="var(--brand-primary)" />
        <KpiCard label="Total Revenue" value={fmtCur(totalRev, sym)} color="#10b981" />
      </KpiGrid>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {breakdown.map(b => (
          <div key={b.mode} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border-color)', flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${b.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ic.Card s={16} style={{ color: b.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 5 }}>{b.label}</div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--border-color)', overflow: 'hidden' }}>
                <div style={{ width: `${b.shareNum}%`, height: '100%', background: b.color, borderRadius: 2, transition: 'width 0.5s ease' }} />
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: b.color }}>{fmtCur(b.amount, sym)}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{b.count} orders · {b.sharePct}</div>
            </div>
          </div>
        ))}
      </div>

      <ExportBar onCSV={handleCSV} onPrint={() => window.print()} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// REPORT 4 — PROFIT & LOSS
// ════════════════════════════════════════════════════════════════════════════════
function ProfitLossReport({ orders, purchases, currency }) {
  const sym = currency?.symbol || '₹'

  const pl = useMemo(() => {
    const revenue      = orders.reduce((s, o) => s + (o.total || 0), 0)
    const discountGiven = orders.reduce((s, o) => s + (o.discountAmt || 0), 0)
    const taxCollected  = orders.reduce((s, o) => s + (o.taxAmt || 0), 0)
    const cogs          = purchases.reduce((s, p) => s + (p.totalAmount || 0), 0)
    const netProfit     = revenue - cogs
    return { revenue, discountGiven, taxCollected, cogs, netProfit }
  }, [orders, purchases])

  const isProfit = pl.netProfit >= 0

  const rows = [
    { label: 'Gross Revenue',              value: pl.revenue,        color: '#10b981' },
    { label: 'Discounts Given',            value: -pl.discountGiven, color: '#ef4444' },
    { label: 'Tax Collected',              value: pl.taxCollected,   color: '#6366f1' },
    { label: 'Cost of Goods (Purchases)',  value: -pl.cogs,          color: '#f59e0b' },
    null,
    { label: 'Net Profit / Loss',          value: pl.netProfit,      color: isProfit ? '#10b981' : '#ef4444', bold: true },
  ]

  const handleCSV = () => {
    downloadCSV('ProfitLoss.csv',
      ['Line Item', 'Amount'],
      [
        ['Gross Revenue', pl.revenue.toFixed(2)],
        ['Discounts Given', (-pl.discountGiven).toFixed(2)],
        ['Tax Collected', pl.taxCollected.toFixed(2)],
        ['Cost of Goods', (-pl.cogs).toFixed(2)],
        ['Net Profit / Loss', pl.netProfit.toFixed(2)],
      ]
    )
  }

  return (
    <div className="an-tab-content">
      {/* Hero */}
      <div style={{ borderRadius: 16, padding: '20px', background: isProfit ? 'linear-gradient(130deg,#059669,#10b981)' : 'linear-gradient(130deg,#dc2626,#ef4444)', color: '#fff', boxShadow: isProfit ? '0 8px 24px rgba(16,185,129,0.3)' : '0 8px 24px rgba(239,68,68,0.3)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.85, marginBottom: 8 }}>
          <Ic.TrendUp s={13} /> {isProfit ? 'Net Profit' : 'Net Loss'}
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 900 }}>{fmtCur(Math.abs(pl.netProfit), sym)}</div>
        <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: 4 }}>{orders.length} orders · {purchases.length} purchases logged</div>
      </div>

      {/* P&L table */}
      <ReportSection>
        {rows.map((row, i) => row === null ? (
          <div key={i} style={{ height: 1, background: 'var(--border-color)', margin: '0 14px' }} />
        ) : (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderTop: i > 0 && rows[i - 1] !== null ? '1px solid var(--border-color)' : 'none', background: row.bold ? 'var(--bg-surface-2)' : 'transparent' }}>
            <span style={{ fontSize: row.bold ? '0.85rem' : '0.82rem', fontWeight: row.bold ? 800 : 500, color: 'var(--text-primary)' }}>{row.label}</span>
            <span style={{ fontSize: row.bold ? '0.95rem' : '0.82rem', fontWeight: row.bold ? 800 : 600, color: row.color }}>
              {row.value < 0 ? '–' : ''}{fmtCur(Math.abs(row.value), sym)}
            </span>
          </div>
        ))}
      </ReportSection>

      {pl.cogs === 0 && (
        <NoticeBanner>No purchase records found for this period. Add purchase logs in Inventory to see accurate profit calculations.</NoticeBanner>
      )}

      <ExportBar onCSV={handleCSV} onPrint={() => window.print()} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// REPORT 5 — TAX SUMMARY
// ════════════════════════════════════════════════════════════════════════════════
function TaxSummaryReport({ orders, currency }) {
  const sym = currency?.symbol || '₹'

  const taxData = useMemo(() => {
    const slabs = {}
    GST_RATES.forEach(r => { slabs[r] = { rate: r, orderCount: 0, taxableAmount: 0, taxCollected: 0 } })
    orders.forEach(o => {
      const taxAmt  = o.taxAmt || 0
      const subtotal = o.subtotal || 0
      if (taxAmt === 0) { slabs[0].orderCount++; slabs[0].taxableAmount += subtotal; return }
      const rate    = subtotal > 0 ? taxAmt / subtotal : 0
      let closest   = GST_RATES.reduce((prev, curr) => Math.abs(curr - rate) < Math.abs(prev - rate) ? curr : prev)
      if (!slabs[closest]) closest = 0
      slabs[closest].orderCount++
      slabs[closest].taxableAmount += subtotal
      slabs[closest].taxCollected  += taxAmt
    })
    return Object.values(slabs).filter(s => s.orderCount > 0)
  }, [orders])

  const totalTax = taxData.reduce((s, t) => s + t.taxCollected, 0)

  const handleCSV = () => {
    downloadCSV('TaxSummary.csv',
      ['Tax Slab', 'Orders', 'Taxable Amount', 'Tax Collected'],
      taxData.map(t => [GST_LABELS[t.rate], t.orderCount, t.taxableAmount.toFixed(2), t.taxCollected.toFixed(2)])
    )
  }

  if (orders.length === 0) return <EmptyState />

  return (
    <div className="an-tab-content">
      <KpiGrid>
        <KpiCard label="Tax Collected" value={fmtCur(totalTax, sym)} color="#6366f1" />
        <KpiCard label="Taxable Orders" value={fmtNum(taxData.filter(t => t.rate > 0).reduce((s, t) => s + t.orderCount, 0))} color="#f59e0b" />
      </KpiGrid>

      <ReportSection>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Tax Slab</Th><Th right>Orders</Th><Th right>Taxable Amt</Th><Th right>Tax Collected</Th></tr></thead>
            <tbody>
              {taxData.map(t => (
                <tr key={t.rate}>
                  <Td><StatusBadge label={GST_LABELS[t.rate]} color={t.rate > 0 ? '#6366f1' : '#64748b'} /></Td>
                  <Td right>{t.orderCount}</Td>
                  <Td right>{fmtCur(t.taxableAmount, sym)}</Td>
                  <Td right bold color={t.rate > 0 ? '#6366f1' : 'var(--text-muted)'}>{fmtCur(t.taxCollected, sym)}</Td>
                </tr>
              ))}
              <tr style={{ background: 'var(--bg-surface-2)' }}>
                <Td bold>Total</Td>
                <Td right bold>{fmtNum(taxData.reduce((s, t) => s + t.orderCount, 0))}</Td>
                <Td right bold>{fmtCur(taxData.reduce((s, t) => s + t.taxableAmount, 0), sym)}</Td>
                <Td right bold color="#6366f1">{fmtCur(totalTax, sym)}</Td>
              </tr>
            </tbody>
          </table>
        </div>
      </ReportSection>

      <ExportBar onCSV={handleCSV} onPrint={() => window.print()} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// REPORT 6 — PURCHASES
// ════════════════════════════════════════════════════════════════════════════════
function PurchasesReport({ purchases, currency }) {
  const sym = currency?.symbol || '₹'

  const purchaseData = useMemo(() => {
    const map = {}
    purchases.forEach(log => {
      (log.items || []).forEach(pi => {
        const rawName = pi.productName || pi.name
        if (!rawName) return
        const key = rawName.trim().toLowerCase()
        if (!map[key]) {
          map[key] = { name: rawName.trim(), category: pi.category, unit: pi.unit, qty: 0, cost: 0, count: 0 }
        }
        map[key].qty += pi.qty
        map[key].cost += (pi.qty * pi.costPerUnit)
        map[key].count += 1
      })
    })
    return Object.values(map).sort((a, b) => b.cost - a.cost)
  }, [purchases])

  const totalSpent = purchaseData.reduce((s, p) => s + p.cost, 0)
  const totalItems = purchaseData.reduce((s, p) => s + p.qty, 0)

  const handleCSV = () => {
    downloadCSV('PurchasesReport.csv',
      ['Item', 'Category', 'Unit', 'Qty Bought', 'Total Spent', 'Purchase Events'],
      purchaseData.map(p => [p.name, p.category || '—', p.unit || 'pcs', p.qty, p.cost.toFixed(2), p.count])
    )
  }

  if (purchases.length === 0) return <EmptyState />

  return (
    <div className="an-tab-content">
      <KpiGrid>
        <KpiCard label="Total Spent" value={fmtCur(totalSpent, sym)} color="#ef4444" />
        <KpiCard label="Items Bought" value={fmtNum(totalItems)} color="#f59e0b" />
      </KpiGrid>

      <ReportSection>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Item</Th><Th right>Purchase Events</Th><Th right>Qty Bought</Th><Th right>Total Spent</Th></tr></thead>
            <tbody>
              {purchaseData.map((p, i) => (
                <tr key={i}>
                  <Td>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{p.category || '—'}</div>
                  </Td>
                  <Td right muted>{p.count}</Td>
                  <Td right bold>{p.qty} {p.unit || 'pcs'}</Td>
                  <Td right bold color="#ef4444">{fmtCur(p.cost, sym)}</Td>
                </tr>
              ))}
              {purchaseData.length > 0 && (
                <tr style={{ background: 'var(--bg-surface-2)' }}>
                  <Td bold>Total</Td>
                  <Td right bold>{fmtNum(purchaseData.reduce((s, p) => s + p.count, 0))}</Td>
                  <Td right bold>{fmtNum(totalItems)}</Td>
                  <Td right bold color="#ef4444">{fmtCur(totalSpent, sym)}</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ReportSection>

      <ExportBar onCSV={handleCSV} onPrint={() => window.print()} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════════
// REPORT 7 — CUSTOMER REPORT
// ════════════════════════════════════════════════════════════════════════════════
function CustomerReport({ currency }) {
  const sym = currency?.symbol || '₹'
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCustomers().then(list => { setCustomers(list || []); setLoading(false) })
  }, [])

  const ranked = useMemo(() => [...customers].sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0)).slice(0, 50), [customers])
  const totalUdhaar = useMemo(() => customers.reduce((s, c) => s + (c.udhaarBalance || 0), 0), [customers])

  const handleCSV = () => {
    downloadCSV('CustomerReport.csv',
      ['Name', 'Phone', 'Visits', 'Total Spent', 'Udhaar Balance'],
      ranked.map(c => [c.name, c.phone || '—', c.visitCount || 0, (c.totalSpent || 0).toFixed(2), (c.udhaarBalance || 0).toFixed(2)])
    )
  }

  if (loading) return <div className="an-tab-content"><SkeletonRows /></div>
  if (customers.length === 0) return <div className="an-tab-content"><EmptyState /></div>

  return (
    <div className="an-tab-content">
      <KpiGrid>
        <KpiCard label="Total Customers" value={customers.length} color="var(--brand-primary)" />
        <KpiCard label="Outstanding Udhaar" value={fmtCur(totalUdhaar, sym)} color="#f59e0b" />
      </KpiGrid>

      {totalUdhaar > 0 && (
        <NoticeBanner>Total outstanding Udhaar: <strong style={{ color: '#f59e0b' }}>{fmtCur(totalUdhaar, sym)}</strong></NoticeBanner>
      )}

      <ReportSection>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>#</Th><Th>Customer</Th><Th right>Visits</Th><Th right>Total Spent</Th><Th right>Udhaar</Th></tr></thead>
            <tbody>
              {ranked.map((c, i) => (
                <tr key={c.customerId}>
                  <Td muted>{i + 1}</Td>
                  <Td>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    {c.phone && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{c.phone}</div>}
                  </Td>
                  <Td right>{c.visitCount || 0}</Td>
                  <Td right bold>{fmtCur(c.totalSpent || 0, sym)}</Td>
                  <Td right color={c.udhaarBalance > 0 ? '#f59e0b' : 'var(--text-muted)'}>{c.udhaarBalance > 0 ? fmtCur(c.udhaarBalance, sym) : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportSection>

      <ExportBar onCSV={handleCSV} onPrint={() => window.print()} />
    </div>
  )
}

// ── Tab definitions (SVG icons only, no emojis) ───────────────────────────────
const TABS = [
  { id: 'daily',     label: 'Daily Summary',     icon: <Ic.ClockH s={15} />, needsDate: true  },
  { id: 'products',  label: 'Sales by Product',  icon: <Ic.Package s={15} />, needsDate: true  },
  { id: 'payment',   label: 'Payments',          icon: <Ic.Card s={15} />,    needsDate: true  },
  { id: 'pl',        label: 'Profit & Loss',     icon: <Ic.TrendUp s={15} />, needsDate: true  },
  { id: 'tax',       label: 'Tax Summary',       icon: <Ic.Receipt s={15} />, needsDate: true  },
  { id: 'purchases', label: 'Purchases',         icon: <Ic.Database s={15} />,needsDate: true  },
  { id: 'customers', label: 'Customers',         icon: <Ic.Users s={15} />,   needsDate: false },
]

// ════════════════════════════════════════════════════════════════════════════════
// MAIN REPORTS SCREEN
// ════════════════════════════════════════════════════════════════════════════════
export default function Reports({ onClose, currency }) {
  useBackButton(onClose)

  const [tab, setTab] = useState('daily')
  const [dateRange, setDateRange] = useState(() => computeQuick('today'))
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(false)

  // Tab bar scroll hint (same as Analytics)
  const tabBarRef = useRef(null)
  const [showScrollHint, setShowScrollHint] = useState(true)

  const handleTabScroll = useCallback(() => {
    if (!tabBarRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = tabBarRef.current
    setShowScrollHint(scrollLeft + clientWidth < scrollWidth - 5)
  }, [])

  useEffect(() => {
    handleTabScroll()
    window.addEventListener('resize', handleTabScroll)
    return () => window.removeEventListener('resize', handleTabScroll)
  }, [handleTabScroll, tab])

  const scrollTabsRight = () => {
    if (tabBarRef.current) tabBarRef.current.scrollBy({ left: 150, behavior: 'smooth' })
  }

  const currentTab = TABS.find(t => t.id === tab)

  // Fetch data when tab or date range changes
  const load = useCallback(async () => {
    if (!currentTab?.needsDate) { setOrders([]); setPurchases([]); return }
    setLoading(true)
    const [ords, purs] = await Promise.all([
      getAnalyticsData(dateRange.fromTs, dateRange.toTs),
      tab === 'pl' || tab === 'purchases' ? getPurchaseAnalyticsData(dateRange.fromTs, dateRange.toTs) : Promise.resolve([]),
    ])
    setOrders(ords)
    setPurchases(purs)
    setLoading(false)
  }, [tab, dateRange.fromTs, dateRange.toTs])

  useEffect(() => { load() }, [load])

  return (
    <div className="an-root">
      {/* ── Header — matches Analytics pattern ── */}
      <header className="or-header">
        <button className="or-back-btn" onClick={onClose} aria-label="Back">
          <Ic.Back s={20} />
        </button>
        <div className="or-header-title">
          <div className="an-header-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
            <Ic.FileText s={15} />
          </div>
          Reports
        </div>
        {currentTab?.needsDate && (
          <button className="or-date-filter-btn" onClick={() => setFilterDrawerOpen(true)}>
            <Ic.Calendar s={13} />
            <span>{dateRange.label}</span>
            <Ic.ChevD s={12} />
          </button>
        )}
      </header>

      {/* ── Date filter drawer — exact same as Analytics ── */}
      {filterDrawerOpen && (
        <DateFilterDrawer
          current={dateRange}
          onApply={setDateRange}
          onClose={() => setFilterDrawerOpen(false)}
        />
      )}

      {/* ── Tab bar — an-tab-container / an-tab-bar / an-tab-btn ── */}
      <div className="an-tab-container">
        <div className="an-tab-bar" ref={tabBarRef} onScroll={handleTabScroll}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`an-tab-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        {showScrollHint && (
          <div className="an-tab-scroll-hint">
            <button onClick={scrollTabsRight} style={{ background: 'none', border: 'none', cursor: 'pointer', pointerEvents: 'auto', display: 'flex', color: 'inherit', padding: '4px' }}>
              <Ic.ChevR s={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Body — an-body wraps scrollable content ── */}
      <div className="an-body">
        {loading ? (
          <div className="an-tab-content"><SkeletonRows count={5} /></div>
        ) : (
          <>
            {tab === 'daily'     && <DailySummaryReport    orders={orders}                    currency={currency} />}
            {tab === 'products'  && <SalesByProductReport  orders={orders}                    currency={currency} />}
            {tab === 'payment'   && <PaymentBreakdownReport orders={orders}                   currency={currency} />}
            {tab === 'pl'        && <ProfitLossReport       orders={orders} purchases={purchases} currency={currency} />}
            {tab === 'tax'       && <TaxSummaryReport       orders={orders}                    currency={currency} />}
            {tab === 'purchases' && <PurchasesReport        purchases={purchases}              currency={currency} />}
            {tab === 'customers' && <CustomerReport         currency={currency} />}
          </>
        )}
      </div>
    </div>
  )
}
