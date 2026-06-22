import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useBackButton } from './useBackButton.js'
import { useAlert } from './AlertDialog.jsx'
import { getAnalyticsData, getPurchaseAnalyticsData, getCustomers, getUdhaarByCustomer } from './db.js'
import DateFilterDrawer, { computeQuick } from './DateFilterDrawer.jsx'

// ─── Icon Set ────────────────────────────────────────────────────────────────
const Ic = {
  Back: ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
  Wave: ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  TrendUp: ({ s = 14 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
  TrendDown: ({ s = 14 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>,
  Revenue: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  Orders: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>,
  Avg: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  Wallet: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" /></svg>,
  Lock: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  Pay: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
  Cash: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" ry="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>,
  Package: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
  Users: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  Brain: ({ s = 32 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" /><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" /><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" /><path d="M17.599 6.5a3 3 0 0 0 .399-1.375" /><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" /><path d="M3.477 10.896a4 4 0 0 1 .585-.396" /><path d="M19.938 10.5a4 4 0 0 1 .585.396" /><path d="M6 18a4 4 0 0 1-1.967-.516" /><path d="M19.967 17.484A4 4 0 0 1 18 18" /></svg>,
  Bell: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  Sparkles: ({ s = 20 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>,
  Clock: ({ s = 14 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  Target: ({ s = 14 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  Calend: ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  Trophy: ({ s = 16 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>,
  Warning: ({ s = 14 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  Zap: ({ s = 14 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  ChevD: ({ s = 13 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
  ChevR: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>,
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PAYMENT_COLOR = { cash: '#10b981', upi: '#6366f1', card: '#0ea5e9', udhaar: '#f59e0b', split: '#8b5cf6', other: '#64748b' }
const PAYMENT_LABEL = { cash: 'Cash', upi: 'UPI', card: 'Card', udhaar: 'Udhaar', split: 'Split', other: 'Other' }
const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`)
const BRAND = '#6366f1'
const BRAND_GREEN = '#10b981'
const BRAND_AMBER = '#f59e0b'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
const fmtCur = (n, sym = '₹') => `${sym}${fmt(n)}`
const fmtKStr = (n) => n >= 100000 ? `${(n / 100000).toFixed(2)}L` : n >= 1000 ? `${(n / 1000).toFixed(2)}K` : fmt(n)
const fmtCurKStr = (n, sym = '₹') => `${sym}${fmtKStr(n)}`

function ClickableAmount({ value, prefix = '', suffix = '', as: Component = 'span' }) {
  const [show, setShow] = React.useState(false)
  const targetRef = React.useRef(null)

  React.useEffect(() => {
    if (!show) return
    const hide = () => setShow(false)
    setTimeout(() => {
      window.addEventListener('click', hide, { once: true })
      window.addEventListener('close-tooltips', hide, { once: true })
    }, 10)
    return () => {
      window.removeEventListener('click', hide)
      window.removeEventListener('close-tooltips', hide)
    }
  }, [show])

  if (typeof value !== 'number' || value < 1000) return <Component>{prefix}{fmt(value)}{suffix}</Component>

  return (
    <>
      <Component
        ref={targetRef}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!show) window.dispatchEvent(new CustomEvent('close-tooltips'))
          setShow(!show)
        }}
        style={{ cursor: 'pointer' }}
      >
        {`${prefix}${fmtKStr(value)}${suffix}`}
      </Component>
      {show && targetRef.current && createPortal(
        <div
          style={{
            position: 'fixed',
            top: targetRef.current.getBoundingClientRect().top - 34,
            left: targetRef.current.getBoundingClientRect().left + (targetRef.current.getBoundingClientRect().width / 2),
            transform: 'translateX(-50%)',
            background: '#1e293b',
            color: '#ffffff',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            zIndex: 99999,
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          {`${prefix}${fmt(value)}${suffix}`}
        </div>,
        document.body
      )}
    </>
  )
}
const toDateStr = (d) => d.toISOString().slice(0, 10)

function getGranularity(from, to) {
  const days = (to - from) / 86400000
  if (days <= 1.5) return 'hour'
  if (days <= 31) return 'day'
  if (days <= 93) return 'week'
  return 'month'
}

function computeAnalytics(orders, purchases = []) {
  const empty = {
    totalRevenue: 0, orderCount: 0, avgOrder: 0, topPayMethod: '-',
    revenueByDay: {}, ordersByHour: new Array(24).fill(0), ordersByDOW: new Array(7).fill(0),
    paymentCounts: {}, paymentRevenue: {}, topItemsByRevenue: [], topItemsByQty: [],
    totalExpenses: 0, netProfit: 0, expensesByCategory: {}, topExpenseCategory: '-', expensesByDay: {}, topExpenseItems: [], topExpenseItemsByQty: []
  }
  if ((!orders || orders.length === 0) && (!purchases || purchases.length === 0)) return empty

  const revenueByDay = {}, ordersByHour = new Array(24).fill(0), ordersByDOW = new Array(7).fill(0)
  const paymentCounts = {}, paymentRevenue = {}, itemMap = {}
  let totalRevenue = 0

  for (const order of orders) {
    const d = new Date(order.completedAt)
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const total = order.total || 0

    revenueByDay[dayKey] = (revenueByDay[dayKey] || 0) + total
    ordersByHour[d.getHours()]++
    ordersByDOW[d.getDay()]++

    const pm = order.paymentMode || 'other'
    paymentCounts[pm] = (paymentCounts[pm] || 0) + 1
    paymentRevenue[pm] = (paymentRevenue[pm] || 0) + total
    totalRevenue += total

    for (const item of (order.items || [])) {
      if (!itemMap[item.name]) itemMap[item.name] = { qty: 0, revenue: 0, emoji: item.emoji || '📦' }
      itemMap[item.name].qty += item.qty || 1
      itemMap[item.name].revenue += (item.price || 0) * (item.qty || 1)
    }
  }

  let totalExpenses = 0
  const expensesByCategory = {}
  const expensesByDay = {}
  const expensesByItem = {}
  for (const p of purchases) {
    const total = p.totalAmount || 0
    totalExpenses += total

    const d = new Date(p.purchasedAt)
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    expensesByDay[dayKey] = (expensesByDay[dayKey] || 0) + total

    if (p.items) {
      for (const item of p.items) {
        const cat = item.category || 'Uncategorized'
        const cost = Number(item.lineTotal) || (Number(item.qty) * Number(item.costPerUnit)) || 0
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + cost

        const name = item.productName || item.name || 'Unknown Item'
        if (!expensesByItem[name]) expensesByItem[name] = { name, cost: 0, qty: 0, unit: item.unit || 'pcs', emoji: item.emoji || '' }
        expensesByItem[name].cost += cost
        expensesByItem[name].qty += Number(item.qty) || 0
      }
    }
  }

  const netProfit = totalRevenue - totalExpenses

  const sortedExpenseCats = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])
  const topExpenseCategory = sortedExpenseCats.length > 0 ? sortedExpenseCats[0][0] : '-'

  const topExpenseItems = Object.values(expensesByItem)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10)
    .map(d => ({ ...d, value: d.cost }))

  const topExpenseItemsByQty = Object.values(expensesByItem)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10)
    .map(d => ({ ...d, value: d.qty }))

  const topPay = Object.entries(paymentCounts).sort((a, b) => b[1] - a[1])[0]
  const items = Object.entries(itemMap).map(([name, data]) => ({ name, ...data }))

  return {
    totalRevenue, orderCount: orders.length, avgOrder: orders.length > 0 ? totalRevenue / orders.length : 0,
    topPayMethod: topPay?.[0] || '-',
    revenueByDay, ordersByHour, ordersByDOW, paymentCounts, paymentRevenue,
    topItemsByRevenue: [...items].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    topItemsByQty: [...items].sort((a, b) => b.qty - a.qty).slice(0, 10),
    totalExpenses, netProfit, expensesByCategory, topExpenseCategory, expensesByDay, topExpenseItems, topExpenseItemsByQty
  }
}

function buildTimeSeries(revenueByDay, from, to, granularity) {
  const series = []
  if (granularity === 'hour') {
    const revenueByHour = new Array(24).fill(0)
    for (const [key, val] of Object.entries(revenueByDay)) {
      // In hourly mode, revenueByDay is not per-hour, so we handle this separately
      revenueByHour[0] = (revenueByHour[0] || 0) + val
    }
    // Will be overridden by dedicated buildHourlySeries below
    return []
  }
  if (granularity === 'day') {
    const cur = new Date(from); cur.setHours(0, 0, 0, 0)
    const end = new Date(to)
    while (cur <= end) {
      const key = toDateStr(cur)
      const label = cur.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      series.push({ label, value: revenueByDay[key] || 0 })
      cur.setDate(cur.getDate() + 1)
    }
    return series
  }
  if (granularity === 'week') {
    const cur = new Date(from); cur.setHours(0, 0, 0, 0)
    // Align to Monday
    cur.setDate(cur.getDate() - ((cur.getDay() + 6) % 7))
    const end = new Date(to)
    while (cur <= end) {
      const weekEnd = new Date(cur); weekEnd.setDate(weekEnd.getDate() + 6)
      let weekRevenue = 0
      const iterDay = new Date(cur)
      while (iterDay <= weekEnd && iterDay <= end) {
        weekRevenue += revenueByDay[toDateStr(iterDay)] || 0
        iterDay.setDate(iterDay.getDate() + 1)
      }
      const label = `${cur.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`
      series.push({ label, value: weekRevenue })
      cur.setDate(cur.getDate() + 7)
    }
    return series
  }
  if (granularity === 'month') {
    const cur = new Date(from); cur.setDate(1); cur.setHours(0, 0, 0, 0)
    const end = new Date(to)
    while (cur <= end) {
      const year = cur.getFullYear(), month = cur.getMonth()
      let monthRevenue = 0
      const iterDay = new Date(cur)
      while (iterDay.getMonth() === month && iterDay.getFullYear() === year) {
        monthRevenue += revenueByDay[toDateStr(iterDay)] || 0
        iterDay.setDate(iterDay.getDate() + 1)
      }
      const label = cur.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      series.push({ label, value: monthRevenue })
      cur.setMonth(cur.getMonth() + 1)
    }
    return series
  }
  return series
}

function buildHourlySeries(orders, from, to) {
  const revenueByHour = new Array(24).fill(0)
  for (const order of orders) {
    const h = new Date(order.completedAt).getHours()
    revenueByHour[h] += order.total || 0
  }
  const endHour = new Date(to).getHours()
  const isToday = (new Date(to) - new Date(from)) < 86400001
  const maxH = isToday ? endHour + 1 : 24
  return Array.from({ length: maxH }, (_, h) => ({
    label: HOUR_LABELS[h], value: revenueByHour[h]
  })).filter(d => d.value > 0 || true)
}

function pctChange(curr, prev) {
  if (!prev || prev === 0) return curr > 0 ? 100 : 0
  return ((curr - prev) / prev) * 100
}

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0)
  const rafRef = useRef(null)
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(eased * target))
      if (p < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])
  return value
}

// ─── SparkLine ────────────────────────────────────────────────────────────────
function SparkLine({ data, color = BRAND, height = 36, width = 80 }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />
  const max = Math.max(...data, 1), min = Math.min(...data, 0)
  const range = max - min || 1
  const W = 100, H = 40, pad = 2
  const toX = (i) => pad + (i / (data.length - 1)) * (W - 2 * pad)
  const toY = (v) => pad + (1 - (v - min) / range) * (H - 2 * pad)
  const pts = data.map((v, i) => ({ x: toX(i), y: toY(v) }))
  let line = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2
    line += ` C ${cpx} ${pts[i - 1].y} ${cpx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`
  }
  const area = `${line} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`
  const gId = `sp${Math.random().toString(36).slice(2, 7)}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// ─── AreaChart ────────────────────────────────────────────────────────────────
function AreaChart({ data, color = BRAND, formatValue, formatLabel, emptyMsg = 'No data for this period', amPmRegions = false }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)
  const [key, setKey] = useState(0)

  useEffect(() => { setKey(k => k + 1) }, [data])

  const fmtV = formatValue || ((v) => <ClickableAmount value={v} />)
  const fmtL = formatLabel || ((l) => l)

  if (!data || data.length === 0) return (
    <div className="an-chart-empty"><span>{emptyMsg}</span></div>
  )

  const W = 400, H = 160
  const pL = 42, pR = 10, pT = 18, pB = 28
  const cW = W - pL - pR, cH = H - pT - pB

  const vals = data.map(d => d.value)
  const maxV = Math.max(...vals, 1), minV = 0
  const range = maxV - minV || 1

  const toX = (i) => pL + (i / Math.max(data.length - 1, 1)) * cW
  const toY = (v) => pT + (1 - (v - minV) / range) * cH

  const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.value), ...d }))
  let linePath = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2
    linePath += ` C ${cpx} ${pts[i - 1].y} ${cpx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`
  }
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${pT + cH} L ${pts[0].x} ${pT + cH} Z`

  const gridLevels = [0.25, 0.5, 0.75, 1.0]
  const step = Math.max(1, Math.floor(data.length / 6))

  const gId = `ac${Math.random().toString(36).slice(2, 7)}`

  const handlePointer = (e) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const svgX = ((clientX - rect.left) / rect.width) * W
    const rawIdx = (svgX - pL) / cW * (data.length - 1)
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(rawIdx)))
    const pct = (clientX - rect.left) / rect.width * 100
    setTooltip({ idx, pt: pts[idx], pct: Math.min(88, Math.max(5, pct)) })
  }

  return (
    <div className="an-chart-wrap" style={{ position: 'relative' }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="an-chart-svg"
        onMouseMove={handlePointer} onMouseLeave={() => setTooltip(null)}
        onTouchMove={handlePointer} onTouchEnd={() => setTimeout(() => setTooltip(null), 1500)}
        style={{ display: 'block', width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id={gId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {amPmRegions && data.length > 0 && (() => {
          const noonIdx = 12
          const hasPM = data.length > noonIdx
          const amStart = toX(0)
          const amEnd = hasPM ? toX(noonIdx) : toX(data.length - 1)
          const amW = Math.max(0, amEnd - amStart)
          const pmStart = hasPM ? toX(noonIdx) : 0
          const pmEnd = toX(data.length - 1)
          const pmW = Math.max(0, pmEnd - pmStart)

          return (
            <g className="an-chart-regions">
              {amW > 0 && (
                <>
                  <rect x={amStart} y={pT} width={amW} height={cH} fill="#64748b" opacity="0.08" rx="4" />
                  <text x={amStart + amW / 2} y={12} fontSize="9" fill="#64748b" textAnchor="middle" fontWeight="bold" letterSpacing="1">AM</text>
                </>
              )}
              {pmW > 0 && (
                <>
                  <rect x={pmStart} y={pT} width={pmW} height={cH} fill="#eab308" opacity="0.12" rx="4" />
                  <text x={pmStart + pmW / 2} y={12} fontSize="9" fill="#eab308" textAnchor="middle" fontWeight="bold" letterSpacing="1">PM</text>
                </>
              )}
            </g>
          )
        })()}

        {/* Grid lines */}
        {gridLevels.map(t => {
          const gY = pT + (1 - t) * cH
          return (
            <g key={t}>
              <line x1={pL} y1={gY} x2={W - pR} y2={gY} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4,4" />
              <text x={pL - 4} y={gY + 3.5} fontSize="8.5" fill="var(--text-muted)" textAnchor="end" fontFamily="Outfit, sans-serif">
                {fmtV(minV + t * range)}
              </text>
            </g>
          )
        })}

        {/* Base line */}
        <line x1={pL} y1={pT + cH} x2={W - pR} y2={pT + cH} stroke="var(--border-color)" strokeWidth="1" />

        {/* Area fill */}
        <path key={`a-${key}`} d={areaPath} fill={`url(#${gId})`} className="an-area-anim" />

        {/* Line */}
        <path key={`l-${key}`} d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" className="an-line-anim" />

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % step !== 0 && i !== data.length - 1) return null
          return (
            <text key={i} x={toX(i)} y={H - 6} fontSize="8.5" fill="var(--text-muted)" textAnchor="middle" fontFamily="Outfit, sans-serif">
              {fmtL(d.label)}
            </text>
          )
        })}

        {/* Tooltip crosshair */}
        {tooltip && (
          <>
            <line x1={tooltip.pt.x} y1={pT} x2={tooltip.pt.x} y2={pT + cH} stroke={color} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.5" />
            <circle cx={tooltip.pt.x} cy={tooltip.pt.y} r="5" fill={color} stroke="var(--bg-surface)" strokeWidth="2.5" />
          </>
        )}
      </svg>

      {/* Floating tooltip */}
      {tooltip && (
        <div className="an-tooltip" style={{ left: `${tooltip.pct}%` }}>
          <div className="an-tt-label">{fmtL(data[tooltip.idx].label)}</div>
          <div className="an-tt-value" style={{ color }}>{fmtV(data[tooltip.idx].value)}</div>
        </div>
      )}
    </div>
  )
}

// ─── BarChart (vertical) ──────────────────────────────────────────────────────
function BarChart({ data, color = BRAND, formatValue, barLabel, maxBars = 24, forceLabels, amPmRegions = false }) {
  const fmtV = formatValue || ((v) => <ClickableAmount value={v} />)
  const visible = data ? data.slice(0, maxBars) : []
  if (!visible || visible.length === 0) return <div className="an-chart-empty"><span>No data</span></div>

  const W = 400, H = 150
  const pL = 5, pR = 5, pT = 20, pB = 24
  const cW = W - pL - pR, cH = H - pT - pB
  const maxV = Math.max(...visible.map(d => d.value), 1)
  const barW = (cW / visible.length) * 0.7
  const gap = (cW / visible.length) * 0.3

  const showLabels = forceLabels || visible.length <= 12
  const regionW = 12 * (barW + gap)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
      {amPmRegions && visible.length === 24 && (
        <g className="an-chart-regions">
          <rect x={pL} y={pT} width={regionW} height={cH} fill="#64748b" opacity="0.08" rx="4" />
          <text x={pL + regionW / 2} y={12} fontSize="9" fill="#64748b" textAnchor="middle" fontWeight="bold" letterSpacing="1">AM</text>

          <rect x={pL + regionW} y={pT} width={regionW} height={cH} fill="#eab308" opacity="0.12" rx="4" />
          <text x={pL + regionW + regionW / 2} y={12} fontSize="9" fill="#eab308" textAnchor="middle" fontWeight="bold" letterSpacing="1">PM</text>
        </g>
      )}
      {visible.map((d, i) => {
        const barH = Math.max(2, (d.value / maxV) * cH)
        const x = pL + i * (barW + gap) + gap / 2
        const y = pT + cH - barH
        const delay = i * 0.02
        return (
          <g key={i}>
            <rect
              x={x} y={y} width={barW} height={barH}
              rx="3" ry="3" fill={color}
              style={{ transformBox: 'fill-box', transformOrigin: 'bottom', animation: `anBarGrow 0.45s ${delay}s cubic-bezier(0.34,1.56,0.64,1) both`, opacity: d.value === 0 ? 0.15 : 0.9 }}
            />
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 3} fontSize="7.5" fill="var(--text-secondary)" textAnchor="middle" fontFamily="Outfit, sans-serif">
                {fmtV(d.value)}
              </text>
            )}
            {showLabels && (
              <text x={x + barW / 2} y={H - 6} fontSize="7.5" fill="var(--text-muted)" textAnchor="middle" fontFamily="Outfit, sans-serif">
                {d.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── HorizontalBarChart ───────────────────────────────────────────────────────
function HorizontalBarChart({ data, color = BRAND, formatValue }) {
  const fmtV = formatValue || ((v) => fmtCur(v))
  if (!data || data.length === 0) return <div className="an-chart-empty"><span>No items sold</span></div>
  const maxV = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="an-hbar-list">
      {data.map((d, i) => {
        const pct = (d.value / maxV) * 100
        const delay = i * 0.04
        return (
          <div key={i} className="an-hbar-row">
            <div className="an-hbar-label" title={d.name}>
              {d.emoji ? <span style={{ marginRight: 4 }}>{d.emoji}</span> : null}
              <span className="an-hbar-name">{d.name}</span>
            </div>
            <div className="an-hbar-track">
              <div
                className="an-hbar-fill"
                style={{
                  width: `${pct}%`,
                  background: color,
                  animationDelay: `${delay}s`,
                  opacity: 0.85 + (i === 0 ? 0.15 : 0)
                }}
              />
            </div>
            <div className="an-hbar-value">{fmtV(d.value)}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── DonutChart ───────────────────────────────────────────────────────────────
function DonutChart({ segments, centerLabel, centerSub }) {
  if (!segments || segments.length === 0 || segments.every(s => s.value === 0)) {
    return <div className="an-chart-empty"><span>No payment data</span></div>
  }
  const total = segments.reduce((s, sg) => s + sg.value, 0)
  if (total === 0) return <div className="an-chart-empty"><span>No payment data</span></div>

  const SIZE = 160, CX = 80, CY = 80, R = 60, INNER_R = 38
  const toRad = (deg) => (deg * Math.PI) / 180
  const getPoint = (angle, r) => ({ x: CX + r * Math.cos(toRad(angle)), y: CY + r * Math.sin(toRad(angle)) })

  const buildArc = (startA, endA, color) => {
    if (endA - startA >= 359.99) {
      // Full circle
      return (
        <>
          <circle cx={CX} cy={CY} r={R} fill={color} opacity="0.9" />
          <circle cx={CX} cy={CY} r={INNER_R} fill="var(--bg-surface)" />
        </>
      )
    }
    const s = getPoint(startA, R), e = getPoint(endA, R)
    const si = getPoint(endA, INNER_R), ei = getPoint(startA, INNER_R)
    const large = endA - startA > 180 ? 1 : 0
    return <path d={`M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y} L ${si.x} ${si.y} A ${INNER_R} ${INNER_R} 0 ${large} 0 ${ei.x} ${ei.y} Z`} fill={color} opacity="0.92" />
  }

  let startAngle = -90
  const arcs = segments.filter(s => s.value > 0).map((seg) => {
    const angle = (seg.value / total) * 360
    const arc = { ...seg, startAngle, endAngle: startAngle + angle }
    startAngle += angle
    return arc
  })

  return (
    <div className="an-donut-wrap">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: 'visible' }}>
        {arcs.map((arc, i) => (
          <g key={i} style={{ animation: `anDonutSeg 0.6s ${i * 0.1}s ease both` }}>
            {buildArc(arc.startAngle, arc.endAngle, arc.color)}
          </g>
        ))}
        {/* Center */}
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--text-primary)" fontFamily="Outfit, sans-serif">
          {centerLabel || `${Math.round((arcs[0]?.value / total) * 100)}%`}
        </text>
        <text x={CX} y={CY + 11} textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontFamily="Outfit, sans-serif">
          {centerSub || arcs[0]?.label || ''}
        </text>
      </svg>

      <div className="an-donut-legend">
        {arcs.map((seg, i) => (
          <div key={i} className="an-donut-leg-item">
            <div className="an-donut-leg-dot" style={{ background: seg.color }} />
            <span className="an-donut-leg-label">{seg.label}</span>
            <span className="an-donut-leg-pct">{Math.round((seg.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── KPICard ──────────────────────────────────────────────────────────────────
function KPICard({ icon, label, value, unit = '', rawValue, prevValue, sparkData, color = BRAND, formatFn, hideTrend }) {
  const display = useCountUp(Math.round(rawValue || 0))
  const fmtFn = formatFn || ((v) => `${unit}${fmt(v)}`)
  const change = prevValue != null ? pctChange(rawValue, prevValue) : null
  const isUp = change !== null ? change >= 0 : null

  return (
    <div className="an-kpi-card">
      <div className="an-kpi-top">
        <div className="an-kpi-icon" style={{ color, background: `${color}18` }}>{icon}</div>
        {!hideTrend && change !== null && (
          <div className={`an-kpi-badge ${isUp ? 'up' : 'down'}`}>
            {isUp ? <Ic.TrendUp /> : <Ic.TrendDown />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="an-kpi-value">{fmtFn(display)}</div>
      <div className="an-kpi-label">{label}</div>
      {sparkData && sparkData.length > 1 && (
        <div className="an-kpi-spark">
          <SparkLine data={sparkData} color={color} width={90} height={32} />
        </div>
      )}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ h = 20, w = '100%', radius = 8, style }) {
  return <div className="an-skeleton" style={{ height: h, width: w, borderRadius: radius, ...style }} />
}

function SkeletonTab() {
  return (
    <div className="an-tab-content" style={{ gap: 16 }}>
      <div className="an-kpi-grid">
        {[0, 1, 2, 3].map(i => <div key={i} className="an-kpi-card"><Skeleton h={90} /></div>)}
      </div>
      <div className="an-chart-card">
        <Skeleton h={16} w="40%" style={{ marginBottom: 12 }} />
        <Skeleton h={160} />
      </div>
      <div className="an-chart-card">
        <Skeleton h={16} w="40%" style={{ marginBottom: 12 }} />
        <Skeleton h={120} />
      </div>
    </div>
  )
}

// ─── Chart Card Wrapper ───────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children, action }) {
  return (
    <div className="an-chart-card">
      <div className="an-chart-card-header">
        <div>
          <div className="an-chart-title">{title}</div>
          {subtitle && <div className="an-chart-subtitle">{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ─── Insight Row ──────────────────────────────────────────────────────────────
function InsightRow({ icon, label, value, sub, color }) {
  return (
    <div className="an-insight-row">
      <div className="an-insight-icon" style={{ color: color || 'var(--brand-primary)', background: `${color || 'var(--brand-primary)'}18` }}>
        {icon}
      </div>
      <div className="an-insight-info">
        <div className="an-insight-label">{label}</div>
        {sub && <div className="an-insight-sub">{sub}</div>}
      </div>
      <div className="an-insight-value" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

// ─── TAB: Overview ────────────────────────────────────────────────────────────
function OverviewTab({ orders, stats, prevStats, from, to, currency, granularity, dateRange }) {
  const sym = currency?.symbol || '₹'
  const fmtCurrency = (v) => <ClickableAmount value={v} prefix={sym} />

  // Build revenue time series
  const timeSeries = useMemo(() => {
    if (granularity === 'hour') return buildHourlySeries(orders, from, to)
    return buildTimeSeries(stats.revenueByDay, from, to, granularity)
  }, [orders, stats.revenueByDay, from, to, granularity])

  // Sparklines (daily revenue for last 7 points of the series)
  const sparkRevenue = useMemo(() => timeSeries.slice(-7).map(d => d.value), [timeSeries])

  // Payment segments for donut
  const paymentSegments = useMemo(() => {
    return Object.entries(stats.paymentRevenue || {})
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([mode, rev]) => ({
        label: PAYMENT_LABEL[mode] || mode,
        value: rev,
        color: PAYMENT_COLOR[mode] || '#64748b'
      }))
  }, [stats.paymentRevenue])

  // Peak hour
  const peakHour = useMemo(() => {
    const max = Math.max(...stats.ordersByHour)
    if (max === 0) return null
    const h = stats.ordersByHour.indexOf(max)
    return { hour: HOUR_LABELS[h], count: max }
  }, [stats.ordersByHour])

  // Best day
  const bestDay = useMemo(() => {
    const entries = Object.entries(stats.revenueByDay)
    if (!entries.length) return null
    const [key, val] = entries.sort((a, b) => b[1] - a[1])[0]
    return { date: new Date(key + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }), value: val }
  }, [stats.revenueByDay])

  return (
    <div className="an-tab-content">
      {/* KPI Grid */}
      <div className="an-kpi-grid">
        <KPICard icon={<span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{sym}</span>} label="Net Profit" rawValue={stats.netProfit}
          prevValue={prevStats?.netProfit} color={stats.netProfit >= 0 ? '#10b981' : '#ef4444'}
          formatFn={(v) => v < 0 ? <ClickableAmount value={Math.abs(v)} prefix={`-${sym}`} /> : <ClickableAmount value={v} prefix={sym} />} hideTrend={dateRange?.label === 'Today'} />
        <KPICard icon={<Ic.Wallet />} label="Expenses" rawValue={stats.totalExpenses}
          prevValue={prevStats?.totalExpenses} color="#ef4444"
          formatFn={(v) => <ClickableAmount value={v} prefix={sym} />} hideTrend={dateRange?.label === 'Today'} />
        <KPICard icon={<span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{sym}</span>} label="Revenue" rawValue={stats.totalRevenue}
          prevValue={prevStats?.totalRevenue} sparkData={sparkRevenue} color={BRAND}
          formatFn={(v) => <ClickableAmount value={v} prefix={sym} />} hideTrend={dateRange?.label === 'Today'} />
        <KPICard icon={<Ic.Orders />} label="Orders" rawValue={stats.orderCount}
          prevValue={prevStats?.orderCount} color={BRAND_GREEN}
          formatFn={(v) => fmt(v)} hideTrend={dateRange?.label === 'Today'} />
        <KPICard icon={<span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{sym}</span>} label="Avg Order" rawValue={stats.avgOrder}
          prevValue={prevStats?.avgOrder} color={BRAND_AMBER}
          formatFn={(v) => <ClickableAmount value={v} prefix={sym} />} hideTrend={dateRange?.label === 'Today'} />
        <KPICard icon={stats.topPayMethod?.toLowerCase() === 'cash' ? <Ic.Cash /> : <Ic.Pay />} label="Top Payment" rawValue={0}
          color="#8b5cf6" formatFn={() => PAYMENT_LABEL[stats.topPayMethod] || stats.topPayMethod} />
      </div>

      {/* Revenue Chart */}
      <ChartCard
        title={granularity === 'hour' ? 'Revenue by Hour' : granularity === 'week' ? 'Weekly Revenue' : granularity === 'month' ? 'Monthly Revenue' : 'Daily Revenue'}
        subtitle={`${orders.length} orders in period`}
      >
        <AreaChart data={timeSeries} color={BRAND} formatValue={fmtCurrency} emptyMsg="No orders in this period" amPmRegions={granularity === 'hour'} />
      </ChartCard>

      {/* Payment Breakdown + Insights */}
      <div className="an-two-col">
        <ChartCard title="Payment Methods">
          <DonutChart segments={paymentSegments} centerLabel={PAYMENT_LABEL[stats.topPayMethod] || '—'} centerSub="top method" />
        </ChartCard>

        <div className="an-insights-stack">
          {peakHour && (
            <InsightRow icon={<Ic.Clock />} label="Peak Hour" value={peakHour.hour} sub={`${peakHour.count} orders`} color="#f59e0b" />
          )}
          {bestDay && (
            <InsightRow icon={<Ic.Trophy />} label="Best Day" value={fmtCurrency(bestDay.value)} sub={bestDay.date} color={BRAND} />
          )}
          {stats.topItemsByRevenue[0] && (
            <InsightRow icon={<Ic.Package />} label="Top Item" value={fmtCurrency(stats.topItemsByRevenue[0].revenue)} sub={stats.topItemsByRevenue[0].name} color={BRAND_GREEN} />
          )}
          {stats.orderCount === 0 && (
            <InsightRow icon={<Ic.Warning />} label="No Data" value="—" sub="No orders in period" color="#64748b" />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── TAB: Revenue ─────────────────────────────────────────────────────────────
function RevenueTab({ orders, stats, prevStats, from, to, currency, granularity }) {
  const sym = currency?.symbol || '₹'
  const fmtCurrency = (v) => <ClickableAmount value={v} prefix={sym} />

  const timeSeries = useMemo(() => {
    if (granularity === 'hour') return buildHourlySeries(orders, from, to)
    return buildTimeSeries(stats.revenueByDay, from, to, granularity)
  }, [orders, stats.revenueByDay, from, to, granularity])

  const revenueChange = pctChange(stats.totalRevenue, prevStats?.totalRevenue)
  const orderChange = pctChange(stats.orderCount, prevStats?.orderCount)

  const bestDay = useMemo(() => {
    const entries = Object.entries(stats.revenueByDay)
    if (!entries.length) return null
    const [key, val] = entries.sort((a, b) => b[1] - a[1])[0]
    return { label: new Date(key + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }), value: val }
  }, [stats.revenueByDay])

  const worstDay = useMemo(() => {
    const entries = Object.entries(stats.revenueByDay).filter(([, v]) => v > 0)
    if (!entries.length) return null
    const [key, val] = entries.sort((a, b) => a[1] - b[1])[0]
    return { label: new Date(key + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }), value: val }
  }, [stats.revenueByDay])

  return (
    <div className="an-tab-content">
      {/* Comparison row */}
      <div className="an-compare-row">
        <div className={`an-compare-item ${revenueChange >= 0 ? 'up' : 'down'}`}>
          <div className="an-compare-val">{fmtCurrency(stats.totalRevenue)}</div>
          <div className="an-compare-label">Revenue</div>
          {prevStats && (
            <div className="an-compare-delta">
              {revenueChange >= 0 ? <Ic.TrendUp /> : <Ic.TrendDown />}
              {Math.abs(revenueChange).toFixed(1)}% vs prev period
            </div>
          )}
        </div>
        <div className={`an-compare-item ${orderChange >= 0 ? 'up' : 'down'}`}>
          <div className="an-compare-val">{fmt(stats.orderCount)}</div>
          <div className="an-compare-label">Orders</div>
          {prevStats && (
            <div className="an-compare-delta">
              {orderChange >= 0 ? <Ic.TrendUp /> : <Ic.TrendDown />}
              {Math.abs(orderChange).toFixed(1)}% vs prev period
            </div>
          )}
        </div>
        <div className="an-compare-item">
          <div className="an-compare-val">{fmtCurrency(stats.avgOrder)}</div>
          <div className="an-compare-label">Avg Order</div>
          <div className="an-compare-delta" style={{ color: 'var(--text-muted)' }}>per transaction</div>
        </div>
      </div>

      {/* Revenue area chart */}
      <ChartCard title="Revenue Trend" subtitle={granularity === 'hour' ? 'By hour' : granularity === 'month' ? 'By month' : 'By day'}>
        <AreaChart data={timeSeries} color={BRAND} formatValue={fmtCurrency} emptyMsg="No revenue data" amPmRegions={granularity === 'hour'} />
      </ChartCard>

      {/* Best / Worst days */}
      {(bestDay || worstDay) && (
        <div className="an-two-col">
          {bestDay && (
            <div className="an-stat-callout an-callout-green">
              <div className="an-callout-label">Best Day</div>
              <div className="an-callout-val">{fmtCurrency(bestDay.value)}</div>
              <div className="an-callout-sub">{bestDay.label}</div>
            </div>
          )}
          {worstDay && (
            <div className="an-stat-callout an-callout-amber">
              <div className="an-callout-label">Lowest Day</div>
              <div className="an-callout-val">{fmtCurrency(worstDay.value)}</div>
              <div className="an-callout-sub">{worstDay.label}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── TAB: Orders ──────────────────────────────────────────────────────────────
function OrdersTab({ orders, stats, prevStats, from, to, currency, granularity }) {
  const sym = currency?.symbol || '₹'

  // Order count time series
  const orderTimeSeries = useMemo(() => {
    if (!orders || orders.length === 0) return []
    const countByDay = {}
    for (const order of orders) {
      const d = new Date(order.completedAt)
      const key = toDateStr(d)
      countByDay[key] = (countByDay[key] || 0) + 1
    }
    if (granularity === 'hour') {
      const countByHour = new Array(24).fill(0)
      for (const order of orders) countByHour[new Date(order.completedAt).getHours()]++
      const endH = new Date(to).getHours() + 1
      const maxH = (to - from) < 86400001 ? endH : 24
      return Array.from({ length: maxH }, (_, h) => ({ label: HOUR_LABELS[h], value: countByHour[h] }))
    }
    // Build day series
    const cur = new Date(from); cur.setHours(0, 0, 0, 0)
    const end = new Date(to)
    const series = []
    while (cur <= end) {
      series.push({ label: cur.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), value: countByDay[toDateStr(cur)] || 0 })
      cur.setDate(cur.getDate() + 1)
    }
    return series
  }, [orders, from, to, granularity])

  // DOW bars
  const dowData = useMemo(() =>
    DOW_LABELS.map((label, i) => ({ label, value: stats.ordersByDOW[i] }))
    , [stats.ordersByDOW])

  // Hour bars (grouped: show every 2 hours or full)
  const hourData = useMemo(() =>
    Array.from({ length: 24 }).map((_, i) => ({ label: (i % 12 === 0 ? 12 : i % 12).toString(), value: stats.ordersByHour[i] }))
    , [stats.ordersByHour])

  // Peak analysis
  const peakDOW = DOW_LABELS[stats.ordersByDOW.indexOf(Math.max(...stats.ordersByDOW))]
  const peakH = stats.ordersByHour.indexOf(Math.max(...stats.ordersByHour))
  const slowH = stats.ordersByHour.reduce((min, v, i, arr) => v > 0 && (arr[min] === 0 || v < arr[min]) ? i : min, 0)

  return (
    <div className="an-tab-content">
      {/* Order Volume Chart */}
      <ChartCard title="Order Volume" subtitle={`${stats.orderCount} total orders`}>
        <AreaChart data={orderTimeSeries} color={BRAND_GREEN} formatValue={(v) => Math.round(v).toString()} emptyMsg="No orders in this period" />
      </ChartCard>

      {/* Day of Week */}
      <ChartCard title="Orders by Day of Week" subtitle="Which day is busiest?">
        <BarChart data={dowData} color={BRAND} formatValue={(v) => Math.round(v).toString()} />
      </ChartCard>

      {/* Hour of Day */}
      <ChartCard title="Orders by Hour of Day" subtitle="When do orders come in?">
        <BarChart data={hourData} color="#8b5cf6" formatValue={(v) => Math.round(v).toString()} maxBars={24} forceLabels={true} amPmRegions={true} />
      </ChartCard>

      {/* Peak insights */}
      {stats.orderCount > 0 && (
        <div className="an-insights-stack">
          <InsightRow icon={<Ic.Zap />} label="Peak Day" value={peakDOW} sub={`${Math.max(...stats.ordersByDOW)} orders on avg`} color="#f59e0b" />
          {stats.ordersByHour[peakH] > 0 && (
            <InsightRow icon={<Ic.Clock />} label="Peak Hour" value={HOUR_LABELS[peakH]} sub={`${stats.ordersByHour[peakH]} orders`} color={BRAND} />
          )}
          {stats.ordersByHour[slowH] > 0 && (
            <InsightRow icon={<Ic.Target />} label="Avg Order Value" value={<ClickableAmount value={stats.avgOrder} prefix={sym} />} sub="per transaction" color={BRAND_GREEN} />
          )}
        </div>
      )}
    </div>
  )
}

// ─── TAB: Products ────────────────────────────────────────────────────────────
function ProductsTab({ stats, currency }) {
  const sym = currency?.symbol || '₹'
  const [view, setView] = useState('revenue')

  const data = view === 'revenue'
    ? stats.topItemsByRevenue.map(i => ({ ...i, value: i.revenue }))
    : stats.topItemsByQty.map(i => ({ ...i, value: i.qty }))

  return (
    <div className="an-tab-content">
      <div className="an-seg-ctrl">
        <button className={`an-seg-btn ${view === 'revenue' ? 'active' : ''}`} onClick={() => setView('revenue')}>By Revenue</button>
        <button className={`an-seg-btn ${view === 'qty' ? 'active' : ''}`} onClick={() => setView('qty')}>By Quantity</button>
      </div>

      <ChartCard
        title={view === 'revenue' ? 'Top Items by Revenue' : 'Top Items by Quantity Sold'}
        subtitle="Top 10 performing items"
      >
        <HorizontalBarChart
          data={data}
          color={view === 'revenue' ? BRAND : BRAND_GREEN}
          formatValue={view === 'revenue' ? (v) => <ClickableAmount value={v} prefix={sym} /> : (v) => `×${fmt(v)}`}
        />
      </ChartCard>

      {/* Top 3 podium */}
      {data.length >= 3 && (
        <div className="an-podium">
          {data.slice(0, 3).map((item, i) => (
            <div key={i} className={`an-podium-item rank-${i + 1}`}>
              <div className="an-podium-rank">#{i + 1}</div>
              <div className="an-podium-emoji">{item.emoji || '—'}</div>
              <div className="an-podium-name">{item.name}</div>
              <div className="an-podium-val">
                {view === 'revenue' ? <ClickableAmount value={item.value} prefix={sym} /> : `×${fmt(item.value)}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TAB: Customers ───────────────────────────────────────────────────────────
function CustomersTab({ currency }) {
  const sym = currency?.symbol || '₹'
  const [loading, setLoading] = useState(true)
  const [custStats, setCustStats] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const customers = await getCustomers()
      let totalUdhaar = 0, outstandingUdhaar = 0, totalSpent = 0
      const topCustomers = []

      for (const c of customers) {
        totalSpent += c.totalSpent || 0
        if (c.udhaarBalance > 0) {
          totalUdhaar += c.udhaarBalance
          outstandingUdhaar += c.udhaarBalance
        }
        topCustomers.push({ name: c.name, phone: c.phone, spent: c.totalSpent || 0, udhaar: c.udhaarBalance || 0 })
      }

      topCustomers.sort((a, b) => b.spent - a.spent)

      if (!cancelled) {
        setCustStats({
          total: customers.length,
          withUdhaar: customers.filter(c => (c.udhaarBalance || 0) > 0).length,
          totalSpent, totalUdhaar, outstandingUdhaar,
          topCustomers: topCustomers.slice(0, 5),
          udhaarSegments: [
            { label: 'Outstanding', value: outstandingUdhaar, color: '#f59e0b' },
            { label: 'Cleared', value: Math.max(0, totalSpent - outstandingUdhaar), color: '#10b981' },
          ].filter(s => s.value > 0)
        })
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) return <SkeletonTab />
  if (!custStats) return <div className="an-chart-empty"><span>Failed to load customer data</span></div>

  return (
    <div className="an-tab-content">
      {/* KPI Grid */}
      <div className="an-kpi-grid">
        <KPICard icon={<Ic.Users />} label="Total Customers" rawValue={custStats.total} color={BRAND} formatFn={fmt} />
        <KPICard icon={<Ic.Pay />} label="Udhaar Customers" rawValue={custStats.withUdhaar} color={BRAND_AMBER} formatFn={fmt} />
        <KPICard icon={<span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{sym}</span>} label="Total Spend" rawValue={custStats.totalSpent} color={BRAND_GREEN} formatFn={(v) => <ClickableAmount value={v} prefix={sym} />} />
        <KPICard icon={<Ic.Warning />} label="Pending Udhaar" rawValue={custStats.outstandingUdhaar} color="#ef4444" formatFn={(v) => <ClickableAmount value={v} prefix={sym} />} />
      </div>

      {/* Udhaar Donut */}
      {custStats.udhaarSegments.length > 0 && (
        <ChartCard title="Udhaar Overview" subtitle="Outstanding vs cleared">
          <DonutChart segments={custStats.udhaarSegments} centerLabel={<ClickableAmount value={custStats.outstandingUdhaar} prefix={sym} as="tspan" />} centerSub="outstanding" />
        </ChartCard>
      )}

      {/* Top customers */}
      {custStats.topCustomers.length > 0 && (
        <ChartCard title="Top Customers" subtitle="By lifetime spend">
          <div className="an-cust-list">
            {custStats.topCustomers.map((c, i) => (
              <div key={i} className="an-cust-row">
                <div className="an-cust-rank">{i + 1}</div>
                <div className="an-cust-avatar">{c.name?.[0]?.toUpperCase() || '?'}</div>
                <div className="an-cust-info">
                  <div className="an-cust-name">{c.name}</div>
                  {c.udhaar > 0 && <div className="an-cust-udhaar">Udhaar: <ClickableAmount value={c.udhaar} prefix={sym} /></div>}
                </div>
                <div className="an-cust-spent"><ClickableAmount value={c.spent} prefix={sym} /></div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {custStats.total === 0 && (
        <div className="an-chart-empty" style={{ height: 200 }}>
          <Ic.Users s={40} />
          <span>No customers yet. Add customers via the Customers tool.</span>
        </div>
      )}
    </div>
  )
}

// ─── TAB: Expenses ────────────────────────────────────────────────────────────
function ExpensesTab({ purchases, stats, prevStats, from, to, currency, granularity, dateRange }) {
  const sym = currency?.symbol || '₹'
  const fmtCurrency = (v) => <ClickableAmount value={v} prefix={sym} />
  const [view, setView] = useState('cost')

  const expensesChange = pctChange(stats.totalExpenses, prevStats?.totalExpenses)

  const expensesTimeSeries = useMemo(() => {
    return buildTimeSeries(stats.expensesByDay || {}, from, to, granularity)
  }, [stats.expensesByDay, from, to, granularity])

  const catData = useMemo(() => {
    return Object.entries(stats.expensesByCategory || {})
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({
        label,
        value,
        color: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'][i % 8]
      }))
  }, [stats.expensesByCategory])

  const data = view === 'cost' ? stats.topExpenseItems : stats.topExpenseItemsByQty

  return (
    <div className="an-tab-content">
      <div className="an-compare-row" style={{ display: 'flex', gap: '16px' }}>
        <div className={`an-compare-item ${expensesChange > 0 ? 'down' : 'up'}`} style={{ flex: 1 }}>
          <div className="an-compare-val">{fmtCurrency(stats.totalExpenses)}</div>
          <div className="an-compare-label">Total Expenses</div>
          {prevStats && (
            <div className="an-compare-delta">
              {expensesChange > 0 ? <Ic.TrendDown /> : <Ic.TrendUp />}
              {Math.abs(expensesChange).toFixed(1)}% vs prev period
            </div>
          )}
        </div>
        <div className="an-compare-item" style={{ flex: 1 }}>
          <div className="an-compare-val">{fmt(purchases?.length || 0)}</div>
          <div className="an-compare-label">Purchase Logs</div>
        </div>
        <div className="an-compare-item" style={{ flex: 1 }}>
          <div className="an-compare-val">{fmtCurrency(purchases?.length > 0 ? stats.totalExpenses / purchases.length : 0)}</div>
          <div className="an-compare-label">Avg Purchase</div>
        </div>
      </div>

      <ChartCard title={granularity === 'hour' ? 'Expenses by Hour' : granularity === 'week' ? 'Weekly Expenses' : granularity === 'month' ? 'Monthly Expenses' : 'Daily Expenses'} subtitle={`${purchases?.length || 0} purchase logs`}>
        <AreaChart data={expensesTimeSeries} color="#ef4444" />
      </ChartCard>

      <ChartCard title="Expenses by Category" subtitle="Where is the money going?">
        {catData.length > 0 ? (
          <DonutChart segments={catData} centerLabel={fmtCurrency(stats.totalExpenses)} centerSub="expenses" />
        ) : (
          <div className="an-chart-empty"><span>No expenses</span></div>
        )}
      </ChartCard>

      <div className="an-seg-ctrl">
        <button className={`an-seg-btn ${view === 'cost' ? 'active' : ''}`} onClick={() => setView('cost')}>By Cost</button>
        <button className={`an-seg-btn ${view === 'qty' ? 'active' : ''}`} onClick={() => setView('qty')}>By Quantity</button>
      </div>

      <ChartCard title={view === 'cost' ? "Top Expense Items by Cost" : "Top Expense Items by Quantity"} subtitle="Highest consumption raw materials & items">
        {data?.length > 0 ? (
          <HorizontalBarChart
            data={data}
            formatValue={view === 'cost' ? fmtCurrency : (v) => fmt(v)}
            color={view === 'cost' ? "#ef4444" : "#10b981"}
          />
        ) : (
          <div className="an-chart-empty"><span>No items logged</span></div>
        )}
      </ChartCard>
    </div>
  )
}

// ─── TAB: AI Insights ─────────────────────────────────────────────────────────
function AIInsightsTab() {
  const { alert: showAlert } = useAlert()

  const handleNotify = () => {
    // Fake-door test — log interest counter to localStorage
    const count = parseInt(localStorage.getItem('mn-ai-interest') || '0') + 1
    localStorage.setItem('mn-ai-interest', String(count))
    showAlert(
      "Noted! We'll let you know the moment Nexus AI drops — our team is actively building the machine learning models behind it.",
      { title: 'You\'re on the list!', type: 'info', confirmText: 'Can\'t wait!' }
    )
  }

  const features = [
    { icon: <Ic.Wave s={16} />, text: 'Predict tomorrow\'s peak hours & demand' },
    { icon: <Ic.Warning s={16} />, text: 'Detect unusual sales patterns & anomalies' },
    { icon: <Ic.Package s={16} />, text: 'Smart inventory replenishment alerts' },
    { icon: <Ic.Revenue s={16} />, text: 'Monthly & quarterly revenue forecasting' },
    { icon: <Ic.Users s={16} />, text: 'Customer churn risk & lifetime value scoring' },
  ]

  return (
    <div className="an-ai-root">
      {/* Background decoration */}
      <div className="an-ai-bg-orb an-ai-orb-1" />
      <div className="an-ai-bg-orb an-ai-orb-2" />
      <div className="an-ai-bg-orb an-ai-orb-3" />

      {/* Main glass card */}
      <div className="an-ai-card">
        {/* AI badge */}
        <div className="an-ai-badge">
          <Ic.Sparkles s={13} />
          Powered by Nexus AI
        </div>

        {/* Lock icon */}
        <div className="an-ai-lock-wrap">
          <div className="an-ai-lock-glow" />
          <Ic.Lock s={52} />
        </div>

        {/* Title */}
        <div className="an-ai-title">AI Business Intelligence</div>
        <div className="an-ai-subtitle">Advanced analytics powered by machine learning — coming in the next major update.</div>

        {/* Blurred preview charts */}
        <div className="an-ai-preview">
          {[0, 1, 2].map(i => (
            <div key={i} className="an-ai-preview-card">
              <div className="an-ai-preview-line" />
              <div className="an-ai-preview-line" style={{ width: '70%', marginTop: 6 }} />
              <div className="an-ai-preview-chart" />
            </div>
          ))}
          <div className="an-ai-preview-blur" />
        </div>

        {/* Feature list */}
        <div className="an-ai-features">
          {features.map((f, i) => (
            <div key={i} className="an-ai-feature-item">
              <div className="an-ai-feature-icon">{f.icon}</div>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button className="an-ai-notify-btn" onClick={handleNotify}>
          <Ic.Bell s={15} />
          Notify Me When It's Ready
        </button>
      </div>
    </div>
  )
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview', icon: <Ic.Wave s={15} /> },
  { id: 'revenue', label: 'Revenue', icon: <Ic.Revenue s={15} /> },
  { id: 'orders', label: 'Orders', icon: <Ic.Orders s={15} /> },
  { id: 'products', label: 'Products', icon: <Ic.Package s={15} /> },
  { id: 'expenses', label: 'Expenses', icon: <Ic.Wallet s={15} /> },
  { id: 'customers', label: 'Customers', icon: <Ic.Users s={15} /> },
  { id: 'ai', label: 'AI Insights', icon: <Ic.Sparkles s={15} /> },
]

// ─── Main Analytics Component ─────────────────────────────────────────────────
export default function Analytics({ onClose, currency }) {
  useBackButton(onClose)

  const [tab, setTab] = useState('overview')
  const [dateRange, setDateRange] = useState(() => computeQuick('today'))
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [prevOrders, setPrevOrders] = useState([])
  const [purchases, setPurchases] = useState([])
  const [prevPurchases, setPrevPurchases] = useState([])
  const [loading, setLoading] = useState(true)

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
    if (tabBarRef.current) {
      tabBarRef.current.scrollBy({ left: 150, behavior: 'smooth' })
    }
  }

  const from = dateRange.fromTs
  const to = dateRange.toTs
  const granularity = useMemo(() => getGranularity(from, to), [from, to])

  const load = useCallback(async () => {
    setLoading(true)
    const duration = to - from
    const [currOrders, prevOrdersData, currPurchases, prevPurchasesData] = await Promise.all([
      getAnalyticsData(from, to),
      getAnalyticsData(from - duration, from - 1),
      getPurchaseAnalyticsData(from, to),
      getPurchaseAnalyticsData(from - duration, from - 1)
    ])
    setOrders(currOrders)
    setPrevOrders(prevOrdersData)
    setPurchases(currPurchases)
    setPrevPurchases(prevPurchasesData)
    setLoading(false)
  }, [from, to])

  useEffect(() => { load() }, [load])

  const stats = useMemo(() => computeAnalytics(orders, purchases), [orders, purchases])
  const prevStats = useMemo(() => computeAnalytics(prevOrders, prevPurchases), [prevOrders, prevPurchases])

  const tabProps = { orders, purchases, stats, prevStats, from, to, currency, granularity, dateRange }

  return (
    <div className="an-root">
      {/* Header */}
      <header className="or-header">
        <button className="or-back-btn" onClick={onClose} aria-label="Back"><Ic.Back s={20} /></button>
        <div className="or-header-title">
          <div className="an-header-icon"><Ic.Wave s={18} /></div>
          Analytics
        </div>
        {tab !== 'ai' && (
          <button className="or-date-filter-btn" onClick={() => setFilterDrawerOpen(true)}>
            <Ic.Calend s={13} />
            <span>{dateRange.label}</span>
            <Ic.ChevD s={12} />
          </button>
        )}
      </header>

      {filterDrawerOpen && (
        <DateFilterDrawer
          current={dateRange}
          onApply={setDateRange}
          onClose={() => setFilterDrawerOpen(false)}
        />
      )}



      {/* Tab Bar */}
      <div className="an-tab-container">
        <div className="an-tab-bar" ref={tabBarRef} onScroll={handleTabScroll}>
          {TABS.map(t => (
            <button key={t.id} className={`an-tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
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

      {/* Tab Content */}
      <div className="an-body">
        {tab === 'ai' ? (
          <AIInsightsTab />
        ) : loading ? (
          <SkeletonTab />
        ) : (
          <>
            {tab === 'overview' && <OverviewTab  {...tabProps} />}
            {tab === 'revenue' && <RevenueTab   {...tabProps} />}
            {tab === 'orders' && <OrdersTab    {...tabProps} />}
            {tab === 'products' && <ProductsTab stats={stats} currency={currency} />}
            {tab === 'customers' && <CustomersTab currency={currency} />}
            {tab === 'expenses' && <ExpensesTab  {...tabProps} />}
          </>
        )}
      </div>
    </div>
  )
}
