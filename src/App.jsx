import { useState, useEffect } from 'react'
import Welcome from './Welcome.jsx'
import Home from './Home.jsx'
import POS from './POS.jsx'
import BusinessProfile from './BusinessProfile.jsx'
import OrderRecords from './OrderRecords.jsx'
import Agreement from './Agreement.jsx'
import Inventory from './Inventory.jsx'
import Customers from './Customers.jsx'
import { AlertProvider, useAlert } from './AlertDialog.jsx'

function OfflineBanner({ onDismiss }) {
  const { alert } = useAlert()

  const handleShowInfo = (e) => {
    e.stopPropagation()
    alert(
      "ManSula Nexus is a fully capable Progressive Web App. All your orders, inventory, and settings are saved locally to your device. You can continue using the POS seamlessly without internet. Your data will sync automatically when you reconnect.",
      { title: 'Offline Mode Active', type: 'info', confirmText: 'Got it' }
    ).then(() => onDismiss())
  }

  return (
    <div className="mn-offline-banner" onClick={handleShowInfo}>
      <div className="mn-offline-icon">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="2" x2="22" y2="22"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.82"/><path d="M5.33 12.68a10 10 0 0 1 2.37-1.39"/><path d="M14.67 10c2.3.62 4.4 1.83 6 3.5"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
      </div>
      <div className="mn-offline-text">
        <strong>Working Offline</strong> — Your data is securely saved.
      </div>
      <button className="mn-offline-close" onClick={handleShowInfo} aria-label="Learn More">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>
  )
}

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
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('mn-theme')
    if (stored) return stored
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
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

  const renderScreen = () => {
    // ── Gate 1: Cinematic Splash Screen ──
    if (showWelcome) {
      return <Welcome onComplete={handleWelcomeComplete} />
    }

    // ── Gate 2: Show agreement on first launch ──
    if (!agreed) {
      return <Agreement onAccept={handleAcceptAgreement} />
    }

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
      return (
        <OrderRecords
          onClose={() => setScreen('home')}
          currency={currency}
          onEdit={(record) => { setEditingRecord(record); setScreen('pos'); }}
        />
      )
    }

    if (screen === 'inventory') {
      return <Inventory onClose={() => setScreen('home')} />
    }

    if (screen === 'customers') {
      return <Customers onClose={() => setScreen('home')} />
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

  return (
    <AlertProvider>
      {renderScreen()}
      {!isOnline && !dismissOffline && (
        <OfflineBanner onDismiss={() => setDismissOffline(true)} />
      )}
    </AlertProvider>
  )
}
