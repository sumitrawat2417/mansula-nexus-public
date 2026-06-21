import { useState, useEffect } from 'react'
import Welcome from './Welcome.jsx'
import Home from './Home.jsx'
import POS from './POS.jsx'
import BusinessProfile from './BusinessProfile.jsx'
import OrderRecords from './OrderRecords.jsx'
import Agreement from './Agreement.jsx'
import Inventory from './Inventory.jsx'
import { AlertProvider } from './AlertDialog.jsx'

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

const AGREEMENT_KEY = 'mn-agreement-accepted'

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [screen, setScreen] = useState('home')
  const [editingRecord, setEditingRecord] = useState(null)
  const [agreed, setAgreed] = useState(() => localStorage.getItem(AGREEMENT_KEY) === 'true')
  const [theme, setTheme] = useState(() => localStorage.getItem('mn-theme') || 'light')
  const [currency, setCurrency] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mn-currency')) || CURRENCIES[0] } catch { return CURRENCIES[0] }
  })
  const [taxRateObj, setTaxRateObj] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mn-taxrate')) || TAX_RATES[0] } catch { return TAX_RATES[0] }
  })
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [dismissOffline, setDismissOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setDismissOffline(false)
    }
    const handleOffline = () => {
      setIsOnline(false)
      setDismissOffline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('mn-theme', theme)
  }, [theme])

  useEffect(() => { localStorage.setItem('mn-currency', JSON.stringify(currency)) }, [currency])
  useEffect(() => { localStorage.setItem('mn-taxrate', JSON.stringify(taxRateObj)) }, [taxRateObj])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  const handleAcceptAgreement = () => {
    localStorage.setItem(AGREEMENT_KEY, 'true')
    setAgreed(true)
  }

  const handleWelcomeComplete = () => {
    setShowWelcome(false)
  }

  // ── Gate 1: Cinematic Splash Screen ──
  if (showWelcome) {
    return <AlertProvider><Welcome onComplete={handleWelcomeComplete} /></AlertProvider>
  }

  // ── Gate 2: Show agreement on first launch ──
  if (!agreed) {
    return <AlertProvider><Agreement onAccept={handleAcceptAgreement} /></AlertProvider>
  }

  if (screen === 'pos') {
    return (
      <AlertProvider>
        <POS
          onExit={() => { setScreen('home'); setEditingRecord(null); }}
          currency={currency}
          taxRateObj={taxRateObj}
          editingRecord={editingRecord}
          onClearEditing={() => setEditingRecord(null)}
        />
      </AlertProvider>
    )
  }

  if (screen === 'business') {
    return <AlertProvider><BusinessProfile onClose={() => setScreen('home')} taxRateObj={taxRateObj} onTaxRate={setTaxRateObj} taxRates={TAX_RATES} /></AlertProvider>
  }

  if (screen === 'records') {
    return (
      <AlertProvider>
        <OrderRecords
          onClose={() => setScreen('home')}
          currency={currency}
          onEdit={(record) => { setEditingRecord(record); setScreen('pos'); }}
        />
      </AlertProvider>
    )
  }

  if (screen === 'inventory') {
    return <AlertProvider><Inventory onClose={() => setScreen('home')} /></AlertProvider>
  }

  return (
    <AlertProvider>
      <Home
        onLaunch={setScreen}
        theme={theme}
        onToggleTheme={toggleTheme}
        currency={currency}
        onCurrency={setCurrency}
        currencies={CURRENCIES}
      />
      {!isOnline && !dismissOffline && (
        <div className="mn-offline-banner">
          <div className="mn-offline-icon">⚡</div>
          <div className="mn-offline-text">
            <strong>Working Offline</strong> — Your data is securely saved.
          </div>
          <button className="mn-offline-close" onClick={() => setDismissOffline(true)} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}
    </AlertProvider>
  )
}
