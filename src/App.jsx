import { useState, useEffect } from 'react'
import Home from './Home.jsx'
import POS from './POS.jsx'
import BusinessProfile from './BusinessProfile.jsx'
import OrderRecords from './OrderRecords.jsx'

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', rate: 1, decimals: 0 },
  { code: 'USD', symbol: '$', rate: 0.012, decimals: 2 },
  { code: 'EUR', symbol: '€', rate: 0.011, decimals: 2 },
  { code: 'GBP', symbol: '£', rate: 0.0095, decimals: 2 },
  { code: 'AUD', symbol: 'A$', rate: 0.018, decimals: 2 },
]

export const TAX_RATES = [
  { label: 'No Tax (0%)', value: 0 },
  { label: 'GST 5%', value: 0.05 },
  { label: 'GST 12%', value: 0.12 },
  { label: 'GST 18%', value: 0.18 },
  { label: 'GST 28%', value: 0.28 },
]

export default function App() {
  const [screen, setScreen] = useState('home')
  const [editingRecord, setEditingRecord] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('mn-theme') || 'light')
  const [currency, setCurrency] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mn-currency')) || CURRENCIES[0] } catch { return CURRENCIES[0] }
  })
  const [taxRateObj, setTaxRateObj] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mn-taxrate')) || TAX_RATES[0] } catch { return TAX_RATES[0] }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('mn-theme', theme)
  }, [theme])

  useEffect(() => { localStorage.setItem('mn-currency', JSON.stringify(currency)) }, [currency])
  useEffect(() => { localStorage.setItem('mn-taxrate', JSON.stringify(taxRateObj)) }, [taxRateObj])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  if (screen === 'pos') {
    return (
      <POS
        onExit={() => { setScreen('home'); setEditingRecord(null); }}
        currency={currency}
        taxRateObj={taxRateObj}
        editingRecord={editingRecord}
        onClearEditing={() => setEditingRecord(null)}
      />
    )
  }

  if (screen === 'business') {
    return <BusinessProfile onClose={() => setScreen('home')} taxRateObj={taxRateObj} onTaxRate={setTaxRateObj} taxRates={TAX_RATES} />
  }

  if (screen === 'records') {
    return <OrderRecords
             onClose={() => setScreen('home')}
             currency={currency}
             onEdit={(record) => { setEditingRecord(record); setScreen('pos'); }}
           />
  }

  return (
    <Home
      onLaunch={setScreen}
      theme={theme}
      onToggleTheme={toggleTheme}
      currency={currency}
      onCurrency={setCurrency}
      currencies={CURRENCIES}
    />
  )
}
