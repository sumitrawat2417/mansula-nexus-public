const fs = require('fs')

let code = fs.readFileSync('src/Analytics.jsx', 'utf8')

// 1. Imports
code = code.replace(
  "import { getAnalyticsData, getCustomers, getUdhaarByCustomer } from './db.js'",
  "import { getAnalyticsData, getPurchaseAnalyticsData, getCustomers, getUdhaarByCustomer } from './db.js'"
)

// 2. Icon Wallet
code = code.replace(
  "Avg:       ({ s=16 }) => <svg width={s} height={s} viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\"><line x1=\"18\" y1=\"20\" x2=\"18\" y2=\"10\"/><line x1=\"12\" y1=\"20\" x2=\"12\" y2=\"4\"/><line x1=\"6\" y1=\"20\" x2=\"6\" y2=\"14\"/></svg>,",
  "Avg:       ({ s=16 }) => <svg width={s} height={s} viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\"><line x1=\"18\" y1=\"20\" x2=\"18\" y2=\"10\"/><line x1=\"12\" y1=\"20\" x2=\"12\" y2=\"4\"/><line x1=\"6\" y1=\"20\" x2=\"6\" y2=\"14\"/></svg>,\n  Wallet:    ({ s=16 }) => <svg width={s} height={s} viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\"><path d=\"M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4\"/><path d=\"M4 6v12c0 1.1.9 2 2 2h14v-4\"/><path d=\"M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z\"/></svg>,"
)

// 3. computeAnalytics empty
code = code.replace(
  "function computeAnalytics(orders) {",
  "function computeAnalytics(orders, purchases = []) {"
)
code = code.replace(
  "paymentCounts: {}, paymentRevenue: {}, topItemsByRevenue: [], topItemsByQty: []",
  "paymentCounts: {}, paymentRevenue: {}, topItemsByRevenue: [], topItemsByQty: [],\n    totalExpenses: 0, netProfit: 0, expensesByCategory: {}, topExpenseCategory: '-', expensesByDay: {}"
)
code = code.replace(
  "if (!orders || orders.length === 0) return empty",
  "if ((!orders || orders.length === 0) && (!purchases || purchases.length === 0)) return empty"
)

// 4. computeAnalytics return logic
const oldReturnLogic = `    for (const item of (order.items || [])) {
      if (!itemMap[item.name]) itemMap[item.name] = { qty: 0, revenue: 0, emoji: item.emoji || '📦' }
      itemMap[item.name].qty     += item.qty || 1
      itemMap[item.name].revenue += (item.price || 0) * (item.qty || 1)
    }
  }

  const topPay = Object.entries(paymentCounts).sort((a,b) => b[1]-a[1])[0]
  const items  = Object.entries(itemMap).map(([name, data]) => ({ name, ...data }))

  return {
    totalRevenue, orderCount: orders.length, avgOrder: orders.length > 0 ? totalRevenue / orders.length : 0,
    topPayMethod: topPay?.[0] || '-',
    revenueByDay, ordersByHour, ordersByDOW, paymentCounts, paymentRevenue,
    topItemsByRevenue: [...items].sort((a,b) => b.revenue-a.revenue).slice(0,10),
    topItemsByQty:     [...items].sort((a,b) => b.qty-a.qty).slice(0,10),
  }
}`

const newReturnLogic = `    for (const item of (order.items || [])) {
      if (!itemMap[item.name]) itemMap[item.name] = { qty: 0, revenue: 0, emoji: item.emoji || '📦' }
      itemMap[item.name].qty     += item.qty || 1
      itemMap[item.name].revenue += (item.price || 0) * (item.qty || 1)
    }
  }

  let totalExpenses = 0
  const expensesByCategory = {}
  const expensesByDay = {}
  for (const p of purchases) {
    const total = p.totalAmount || 0
    totalExpenses += total
    
    const d = new Date(p.purchasedAt)
    const dayKey = \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}-\${String(d.getDate()).padStart(2,'0')}\`
    expensesByDay[dayKey] = (expensesByDay[dayKey] || 0) + total

    if (p.items) {
      for (const item of p.items) {
        const cat = item.category || 'Uncategorized'
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (item.qty * item.costPerUnit)
      }
    }
  }

  const netProfit = totalRevenue - totalExpenses
  
  const sortedExpenseCats = Object.entries(expensesByCategory).sort((a,b) => b[1] - a[1])
  const topExpenseCategory = sortedExpenseCats.length > 0 ? sortedExpenseCats[0][0] : '-'

  const topPay = Object.entries(paymentCounts).sort((a,b) => b[1]-a[1])[0]
  const items  = Object.entries(itemMap).map(([name, data]) => ({ name, ...data }))

  return {
    totalRevenue, orderCount: orders.length, avgOrder: orders.length > 0 ? totalRevenue / orders.length : 0,
    topPayMethod: topPay?.[0] || '-',
    revenueByDay, ordersByHour, ordersByDOW, paymentCounts, paymentRevenue,
    topItemsByRevenue: [...items].sort((a,b) => b.revenue-a.revenue).slice(0,10),
    topItemsByQty:     [...items].sort((a,b) => b.qty-a.qty).slice(0,10),
    totalExpenses, netProfit, expensesByCategory, topExpenseCategory, expensesByDay
  }
}`
code = code.replace(oldReturnLogic, newReturnLogic)

// 5. OverviewTab KPI Grid
const oldGrid = `<div className="an-kpi-grid">
        <KPICard icon={<span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{sym}</span>} label="Revenue" rawValue={stats.totalRevenue}
          prevValue={prevStats?.totalRevenue} sparkData={sparkRevenue} color={BRAND}
          formatFn={(v) => \`\${sym}\${fmtK(v)}\`} hideTrend={dateRange?.label === 'Today'} />
        <KPICard icon={<Ic.Orders/>} label="Orders" rawValue={stats.orderCount}
          prevValue={prevStats?.orderCount} color={BRAND_GREEN}
          formatFn={(v) => fmt(v)} hideTrend={dateRange?.label === 'Today'} />
        <KPICard icon={<span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{sym}</span>} label="Avg Order" rawValue={stats.avgOrder}
          prevValue={prevStats?.avgOrder} color={BRAND_AMBER}
          formatFn={(v) => \`\${sym}\${fmtK(v)}\`} hideTrend={dateRange?.label === 'Today'} />
        <KPICard icon={stats.topPayMethod?.toLowerCase() === 'cash' ? <Ic.Cash/> : <Ic.Pay/>} label="Top Payment" rawValue={0}
          color="#8b5cf6" formatFn={() => PAYMENT_LABEL[stats.topPayMethod] || stats.topPayMethod} />
      </div>`
const newGrid = `<div className="an-kpi-grid">
        <KPICard icon={<span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{sym}</span>} label="Net Profit" rawValue={stats.netProfit}
          prevValue={prevStats?.netProfit} color={stats.netProfit >= 0 ? '#10b981' : '#ef4444'}
          formatFn={(v) => v < 0 ? \`-\${sym}\${fmtK(Math.abs(v))}\` : \`\${sym}\${fmtK(v)}\`} hideTrend={dateRange?.label === 'Today'} />
        <KPICard icon={<Ic.Wallet/>} label="Expenses" rawValue={stats.totalExpenses}
          prevValue={prevStats?.totalExpenses} color="#ef4444"
          formatFn={(v) => \`\${sym}\${fmtK(v)}\`} hideTrend={dateRange?.label === 'Today'} />
        <KPICard icon={<span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{sym}</span>} label="Revenue" rawValue={stats.totalRevenue}
          prevValue={prevStats?.totalRevenue} sparkData={sparkRevenue} color={BRAND}
          formatFn={(v) => \`\${sym}\${fmtK(v)}\`} hideTrend={dateRange?.label === 'Today'} />
        <KPICard icon={<Ic.Orders/>} label="Orders" rawValue={stats.orderCount}
          prevValue={prevStats?.orderCount} color={BRAND_GREEN}
          formatFn={(v) => fmt(v)} hideTrend={dateRange?.label === 'Today'} />
        <KPICard icon={<span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{sym}</span>} label="Avg Order" rawValue={stats.avgOrder}
          prevValue={prevStats?.avgOrder} color={BRAND_AMBER}
          formatFn={(v) => \`\${sym}\${fmtK(v)}\`} hideTrend={dateRange?.label === 'Today'} />
        <KPICard icon={stats.topPayMethod?.toLowerCase() === 'cash' ? <Ic.Cash/> : <Ic.Pay/>} label="Top Payment" rawValue={0}
          color="#8b5cf6" formatFn={() => PAYMENT_LABEL[stats.topPayMethod] || stats.topPayMethod} />
      </div>`
code = code.replace(oldGrid, newGrid)

// 6. TABS
code = code.replace(
  "{ id: 'customers', label: 'Customers',  icon: <Ic.Users s={15}/> },",
  "{ id: 'customers', label: 'Customers',  icon: <Ic.Users s={15}/> },\n  { id: 'expenses',  label: 'Expenses',   icon: <Ic.Wallet s={15}/> },"
)

// 7. State & Load
const oldState = `  const [orders, setOrders]         = useState([])
  const [prevOrders, setPrevOrders] = useState([])
  const [loading, setLoading]       = useState(true)`
const newState = `  const [orders, setOrders]         = useState([])
  const [prevOrders, setPrevOrders] = useState([])
  const [purchases, setPurchases]   = useState([])
  const [prevPurchases, setPrevPurchases] = useState([])
  const [loading, setLoading]       = useState(true)`
code = code.replace(oldState, newState)

const oldLoad = `  const load = useCallback(async () => {
    setLoading(true)
    const duration = to - from
    const [curr, prev] = await Promise.all([
      getAnalyticsData(from, to),
      getAnalyticsData(from - duration, from - 1)
    ])
    setOrders(curr)
    setPrevOrders(prev)
    setLoading(false)
  }, [from, to])`
const newLoad = `  const load = useCallback(async () => {
    setLoading(true)
    const duration = to - from
    const [curr, prev, currPurchases, prevPurchasesData] = await Promise.all([
      getAnalyticsData(from, to),
      getAnalyticsData(from - duration, from - 1),
      getPurchaseAnalyticsData(from, to),
      getPurchaseAnalyticsData(from - duration, from - 1)
    ])
    setOrders(curr)
    setPrevOrders(prev)
    setPurchases(currPurchases)
    setPrevPurchases(prevPurchasesData)
    setLoading(false)
  }, [from, to])`
code = code.replace(oldLoad, newLoad)

const oldProps = `  const stats     = useMemo(() => computeAnalytics(orders), [orders])
  const prevStats = useMemo(() => computeAnalytics(prevOrders), [prevOrders])

  const tabProps = { orders, stats, prevStats, from, to, currency, granularity, dateRange }`
const newProps = `  const stats     = useMemo(() => computeAnalytics(orders, purchases), [orders, purchases])
  const prevStats = useMemo(() => computeAnalytics(prevOrders, prevPurchases), [prevOrders, prevPurchases])

  const tabProps = { orders, purchases, stats, prevStats, from, to, currency, granularity, dateRange }`
code = code.replace(oldProps, newProps)

const oldTabContent = `{tab === 'customers' && <CustomersTab {...tabProps}/>}`
const newTabContent = `{tab === 'customers' && <CustomersTab {...tabProps}/>}\n            {tab === 'expenses'  && <ExpensesTab  {...tabProps}/>}`
code = code.replace(oldTabContent, newTabContent)

// 8. ExpensesTab component
const expensesTabCode = \`
// ─── TAB: Expenses ────────────────────────────────────────────────────────────
function ExpensesTab({ purchases, stats, prevStats, from, to, currency, granularity }) {
  const sym = currency?.symbol || '₹'
  const fmtCurrency = (v) => \`\${sym}\${fmtK(v)}\`

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

  return (
    <div className="an-tab-content">
      <div className="an-compare-row">
        <div className={\`an-compare-item \${expensesChange > 0 ? 'down' : 'up'}\`}>
          <div className="an-compare-val">{fmtCurrency(stats.totalExpenses)}</div>
          <div className="an-compare-label">Total Expenses</div>
          {prevStats && (
            <div className="an-compare-delta">
              {expensesChange > 0 ? <Ic.TrendUp/> : <Ic.TrendDown/>}
              {Math.abs(expensesChange).toFixed(1)}% vs prev period
            </div>
          )}
        </div>
      </div>

      <ChartCard title={granularity === 'hour' ? 'Expenses by Hour' : granularity === 'week' ? 'Weekly Expenses' : granularity === 'month' ? 'Monthly Expenses' : 'Daily Expenses'} subtitle={\`\${purchases?.length || 0} purchase logs\`}>
        <AreaChart data={expensesTimeSeries} color="#ef4444"/>
      </ChartCard>

      <ChartCard title="Expenses by Category" subtitle="Where is the money going?">
        {catData.length > 0 ? (
          <div className="an-pay-methods">
            <PieChart data={catData}/>
            <div className="an-pay-legend">
              {catData.map(d => (
                <div key={d.label} className="an-pay-legend-item">
                  <div className="an-pay-legend-dot" style={{ background: d.color }}/>
                  <div className="an-pay-legend-name">{d.label}</div>
                  <div className="an-pay-legend-pct">{Math.round((d.value / Math.max(1, stats.totalExpenses)) * 100)}%</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="an-chart-empty"><span>No expenses</span></div>
        )}
      </ChartCard>
    </div>
  )
}
\`
code = code.replace('// ─── TAB: AI Insights', expensesTabCode + '\\n// ─── TAB: AI Insights')

fs.writeFileSync('src/Analytics.jsx', code)
console.log('done')
