import { useState, useEffect } from 'react'
import Welcome from './Welcome.jsx'
import Home from './Home.jsx'
import POS from './POS.jsx'
import BusinessProfile from './BusinessProfile.jsx'
import OrderRecords from './OrderRecords.jsx'
import Agreement from './Agreement.jsx'
import Inventory from './Inventory.jsx'
import Customers from './Customers.jsx'
import Analytics from './Analytics.jsx'
import Staff from './Staff.jsx'
import BackupRestore from './BackupRestore.jsx'
import { AlertProvider, useAlert } from './AlertDialog.jsx'
import ReloadPrompt from './ReloadPrompt.jsx'
import { APP_NAME } from './appInfo.js'
import { dbGet } from './db.js'

function ThemeModal({ onConfirm, onChangeTheme, currentTheme }) {
  return (
    <div className="mn-theme-modal-overlay">
      <div className="mn-theme-modal">
        <h2>Choose Your Theme</h2>
        <p>You can change this later in settings.</p>
        <div className="mn-theme-options">
          <button
            className={`mn-theme-btn ${currentTheme === 'light' ? 'active' : ''}`}
            onClick={() => onChangeTheme('light')}
          >
            <div className="mn-theme-preview light-preview">
              <div className="p-header" />
              <div className="p-card" />
              <div className="p-card" />
            </div>
            <span>Light</span>
          </button>
          <button
            className={`mn-theme-btn ${currentTheme === 'dark' ? 'active' : ''}`}
            onClick={() => onChangeTheme('dark')}
          >
            <div className="mn-theme-preview dark-preview">
              <div className="p-header" />
              <div className="p-card" />
              <div className="p-card" />
            </div>
            <span>Dark</span>
          </button>
        </div>
        <div style={{ marginTop: '24px' }}>
          <button
            className="bp-btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1.05rem', borderRadius: '12px' }}
            onClick={onConfirm}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

function OfflineBanner({ onDismiss }) {
  const { alert } = useAlert()

  const handleShowInfo = (e) => {
    e.stopPropagation()
    alert(
      `${APP_NAME} is a fully capable Progressive Web App. All your orders, inventory, and settings are saved locally to your device. You can continue using the POS seamlessly without internet. Your data will sync automatically when you reconnect.`,
      { title: 'Offline Mode Active', type: 'info', confirmText: 'Got it' }
    ).then(() => onDismiss())
  }

  return (
    <div className="mn-offline-banner" onClick={handleShowInfo}>
      <div className="mn-offline-icon">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="2" x2="22" y2="22" /><path d="M8.5 16.5a5 5 0 0 1 7 0" /><path d="M2 8.82a15 15 0 0 1 4.17-2.65" /><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.82" /><path d="M5.33 12.68a10 10 0 0 1 2.37-1.39" /><path d="M14.67 10c2.3.62 4.4 1.83 6 3.5" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>
      </div>
      <div className="mn-offline-text">
        <strong>Working Offline</strong> — Your data is securely saved.
      </div>
      <button className="mn-offline-close" onClick={handleShowInfo} aria-label="Learn More">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>
  )
}

function InstallBanner({ onInstall, onDismiss }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '420px',
      zIndex: 999999,
      animation: 'mn-install-slide-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both',
    }}>
      {/* Outer glow */}
      <div style={{
        borderRadius: '22px',
        background: 'var(--bg-surface, #ffffff)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(108,61,229,0.12)',
        overflow: 'hidden',
      }}>
        {/* Top accent line */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, #6c3de5, #8b5cf6, #a78bfa)', borderRadius: '22px 22px 0 0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px 16px' }}>
          {/* App icon badge */}
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6c3de5, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(108,61,229,0.35)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary, #1a1a2e)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              Add MS BOS to Home Screen
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary, #6b7280)', marginTop: '3px', lineHeight: 1.35 }}>
              Install for fast, offline access
            </div>
          </div>

          {/* Install CTA */}
          <button
            onClick={(e) => { e.stopPropagation(); onInstall(e); }}
            style={{
              background: 'linear-gradient(135deg, #6c3de5, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '9px 16px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px rgba(108,61,229,0.4)',
              flexShrink: 0,
              transition: 'opacity 0.15s, transform 0.15s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Install
          </button>

          {/* Dismiss ✕ */}
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(e); }}
            aria-label="Dismiss"
            style={{
              background: 'transparent',
              border: 'none',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary, #9ca3af)',
              cursor: 'pointer',
              borderRadius: '50%',
              flexShrink: 0,
              padding: 0,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = 'var(--text-primary, #1a1a2e)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary, #9ca3af)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
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

import { sendLocalNotification, getNotificationPermission } from './notificationUtils.js'

const AGREEMENT_KEY = 'mn-agreement-accepted'

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [screen, setScreen] = useState('home')
  const [editingRecord, setEditingRecord] = useState(null)
  const [agreed, setAgreed] = useState(() => localStorage.getItem(AGREEMENT_KEY) === 'true')
  const [hasPickedTheme, setHasPickedTheme] = useState(() => localStorage.getItem('mn-has-picked-theme') === 'true')
  const [onboardingStep, setOnboardingStep] = useState(null)
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
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showInstallInfo, setShowInstallInfo] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstallApp = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation()
    if (!deferredPrompt) {
      setShowInstallBanner(false)
      return
    }
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setShowInstallBanner(false)
    setDeferredPrompt(null)
  }

  const handleDismissBanner = (e) => {
    if (e && e.stopPropagation) e.stopPropagation()
    setShowInstallBanner(false)
    setShowInstallInfo(true)
  }

  useEffect(() => {
    // Check if business profile is setup
    dbGet('mn-business').then(b => {
      if (!b || !b.name) {
        setOnboardingStep('spotlight-business')
      }
    })

    // Background interval to check for daily backup (runs every 1 hour)
    const checkBackupInterval = setInterval(() => {
      if (getNotificationPermission() !== 'granted') return
      
      const lastBackupDate = localStorage.getItem('mn-last-backup-date')
      const today = new Date().toDateString()
      
      // If we haven't backed up today, and it's past 18:00 (6 PM)
      if (lastBackupDate !== today && new Date().getHours() >= 18) {
        const lastNotified = localStorage.getItem('mn-backup-notified-date')
        if (lastNotified !== today) {
          sendLocalNotification('🛡️ Backup Recommended', {
            body: 'You haven\'t backed up your data today. Take a secure snapshot now.',
            tag: 'daily-backup'
          })
          localStorage.setItem('mn-backup-notified-date', today)
        }
      }
    }, 1000 * 60 * 60) // every hour

    return () => clearInterval(checkBackupInterval)
  }, [])

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

  const toggleTheme = (t) => {
    if (typeof t === 'string') setTheme(t)
    else setTheme(curr => curr === 'light' ? 'dark' : 'light')
  }

  const handleAcceptAgreement = () => {
    localStorage.setItem(AGREEMENT_KEY, 'true')
    setAgreed(true)
  }

  const handleWelcomeComplete = () => {
    setShowWelcome(false)
  }

  const handleThemeConfirm = () => {
    setHasPickedTheme(true)
    localStorage.setItem('mn-has-picked-theme', 'true')
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
      return (
        <BusinessProfile
          onClose={() => setScreen('home')}
          taxRateObj={taxRateObj}
          onTaxRate={setTaxRateObj}
          taxRates={TAX_RATES}
          onboardingStep={onboardingStep}
          setOnboardingStep={setOnboardingStep}
        />
      )
    }

    if (screen === 'records') {
      return (
        <OrderRecords
          onClose={() => setScreen('home')}
          currency={currency}
          onEdit={(record) => { setEditingRecord(record); setScreen('pos'); }}
          onNavigate={setScreen}
        />
      )
    }

    if (screen === 'inventory') {
      return <Inventory onClose={() => setScreen('home')} />
    }

    if (screen === 'customers') {
      return <Customers onClose={() => setScreen('home')} onNavigate={setScreen} />
    }

    if (screen === 'analytics') {
      return <Analytics onClose={() => setScreen('home')} currency={currency} />
    }

    if (screen === 'staff') {
      return <Staff onClose={() => setScreen('home')} />
    }

    if (screen === 'backup') {
      return <BackupRestore onClose={() => setScreen('home')} />
    }

    return (
      <Home
        onLaunch={setScreen}
        theme={theme}
        onToggleTheme={toggleTheme}
        currency={currency}
        onCurrency={setCurrency}
        currencies={CURRENCIES}
        onboardingStep={onboardingStep}
        setOnboardingStep={setOnboardingStep}
      />
    )
  }

  return (
    <AlertProvider>
      <style>{`
        @keyframes mn-install-slide-in {
          from { opacity: 0; transform: translateX(-50%) translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1); }
        }
        @keyframes mn-modal-fade-in {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
      {agreed && !hasPickedTheme && (
        <ThemeModal onConfirm={handleThemeConfirm} onChangeTheme={setTheme} currentTheme={theme} />
      )}
      {renderScreen()}
      {!isOnline && !dismissOffline && (
        <OfflineBanner onDismiss={() => setDismissOffline(true)} />
      )}
      {!showWelcome && agreed && showInstallBanner && (
        <InstallBanner
          onInstall={handleInstallApp}
          onDismiss={handleDismissBanner}
        />
      )}
      {showInstallInfo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000000, padding: '24px' }} onClick={() => setShowInstallInfo(false)}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '24px', padding: '32px 24px 24px', maxWidth: '340px', width: '100%', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.25)', animation: 'mn-modal-fade-in 0.3s ease both' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #6c3de5, #8b5cf6)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(108, 61, 229, 0.35)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            </div>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>Install ManSula BOS</h3>
            <p style={{ margin: '0 0 24px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>ManSula BOS works best as an installed app. Tap your browser's menu and choose <strong>"Add to Home Screen"</strong> for a faster, full-screen experience — no internet needed!</p>
            <button onClick={() => setShowInstallInfo(false)} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #6c3de5, #8b5cf6)', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 20px rgba(108, 61, 229, 0.4)' }}>Got it</button>
          </div>
        </div>
      )}
      <ReloadPrompt />
    </AlertProvider>
  )
}
