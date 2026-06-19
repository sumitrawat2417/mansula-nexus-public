import { useState, useEffect } from 'react'
import { dbClearAll, dbGet, injectStressTestData } from './db.js'

// ── Greeting ──
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── SVG Icon set ──
const Icon = {
  POS:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  Analytics: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Reports:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Inventory: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Staff:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Customers: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Business:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9.5" y1="14.5" x2="14.5" y2="14.5"/></svg>,
  Settings:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Moon:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Sun:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  X:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  ChevR:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Rocket:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
  Reset:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>,
  Warn:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  OrderRec:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>,
}

// ── Tool definitions ──
const TOOLS = [
  { id: 'business',  name: 'Business Profile', desc: 'Setup info, menu & categories', Icon: Icon.Business,  color: '#6366f1', bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', active: true },
  { id: 'records',   name: 'Order Records',    desc: 'View, edit & export all orders', Icon: Icon.OrderRec,  color: '#10b981', bg: 'linear-gradient(135deg,#10b981,#059669)', active: true },
  { id: 'analytics', name: 'Analytics',        desc: 'Sales trends & insights',        Icon: Icon.Analytics,  color: '#0ea5e9', bg: 'linear-gradient(135deg,#0ea5e9,#2dd4bf)', active: false },
  { id: 'reports',   name: 'Reports',           desc: 'Daily, weekly & monthly',        Icon: Icon.Reports,    color: '#f59e0b', bg: 'linear-gradient(135deg,#f59e0b,#ef4444)', active: false },
  { id: 'inventory', name: 'Inventory',         desc: 'Stock & supplier mgmt',          Icon: Icon.Inventory,  color: '#ec4899', bg: 'linear-gradient(135deg,#ec4899,#f43f5e)', active: false },
  { id: 'staff',     name: 'Staff',             desc: 'Team roles & shifts',            Icon: Icon.Staff,      color: '#06b6d4', bg: 'linear-gradient(135deg,#06b6d4,#0284c7)', active: false },
  { id: 'customers', name: 'Customers',         desc: 'Udhaar ledger & CRM',            Icon: Icon.Customers,  color: '#64748b', bg: 'linear-gradient(135deg,#64748b,#475569)', active: false },
]

// ── Home Settings Modal ──
function HomeSettings({ theme, onToggleTheme, currency, onCurrency, currencies, onClose }) {
  const [resetStep, setResetStep] = useState(0) // 0=idle 1=confirm 2=done
  const [lang, setLang] = useState(localStorage.getItem('pos_lang') || 'en')
  const [showPerms, setShowPerms] = useState(false)
  const [perms, setPerms] = useState({ 
    camera: 'prompt', 
    notifications: 'prompt',
    sound: localStorage.getItem('perm_sound') || 'prompt',
    files: localStorage.getItem('perm_files') || 'prompt',
    downloads: localStorage.getItem('perm_downloads') || 'prompt',
    popups: localStorage.getItem('perm_popups') || 'prompt'
  })

  useEffect(() => {
    const check = async (name) => {
      try {
        const p = await navigator.permissions.query({ name })
        setPerms(prev => ({ ...prev, [name]: p.state }))
        p.onchange = () => setPerms(prev => ({ ...prev, [name]: p.state }))
      } catch (e) { }
    }
    check('camera')
    check('microphone')
    check('notifications')
  }, [])

  const requestPerm = async (name) => {
    try {
      if (name === 'camera') {
        const s = await navigator.mediaDevices.getUserMedia({ video: true })
        s.getTracks().forEach(t => t.stop())
      } else if (name === 'notifications') {
        const p = await Notification.requestPermission()
        setPerms(prev => ({ ...prev, notifications: p }))
      } else if (name === 'sound') {
        // Play silent sound to register interaction & allow future autoplay
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(ctx.destination);
        const osc = ctx.createOscillator();
        osc.connect(gainNode);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
        localStorage.setItem('perm_sound', 'granted');
        setPerms(prev => ({ ...prev, sound: 'granted' }));
        alert("Sound enabled successfully! Your browser has registered this interaction to allow future audio.");
      } else if (name === 'files') {
        if (navigator.storage && navigator.storage.persist) {
          const granted = await navigator.storage.persist();
          if (granted) {
            localStorage.setItem('perm_files', 'granted');
            setPerms(prev => ({ ...prev, files: 'granted' }));
            alert("Persistent storage access has been granted by the browser!");
          } else {
            alert("Persistent storage was denied. Please manage this via the browser's site settings.");
          }
        } else {
          alert("File permissions are handled automatically when you select a file.");
        }
      } else if (name === 'downloads') {
        // Trigger multiple downloads to prompt the browser's Automatic Downloads block
        const a1 = document.createElement('a');
        a1.href = 'data:text/plain;charset=utf-8,dummy';
        a1.download = 'dummy1.txt';
        const a2 = document.createElement('a');
        a2.href = 'data:text/plain;charset=utf-8,dummy';
        a2.download = 'dummy2.txt';
        a1.click();
        setTimeout(() => a2.click(), 100);
        localStorage.setItem('perm_downloads', 'granted');
        setPerms(prev => ({ ...prev, downloads: 'granted' }));
        alert("We requested multiple dummy downloads. If your browser blocks the second one, please click the download block icon in your address bar and choose 'Always allow'.");
      } else if (name === 'popups') {
        // Trigger async popup to prompt the popup blocker
        localStorage.setItem('perm_popups', 'granted');
        setPerms(prev => ({ ...prev, popups: 'granted' }));
        setTimeout(() => {
          const w = window.open('about:blank', '_blank', 'width=100,height=100');
          if (!w || w.closed || typeof w.closed === 'undefined') {
            alert("Pop-up blocked! Please check the address bar for the pop-up blocker icon (red X) and select 'Always allow pop-ups and redirects from this site'.");
          } else {
            w.close();
            alert("Pop-ups are already allowed by your browser!");
          }
        }, 1000);
        alert("Attempting to open a popup. Please wait 1 second...");
      }

      // Re-check
      if (['camera', 'notifications'].includes(name)) {
        const p = await navigator.permissions.query({ name })
        setPerms(prev => ({ ...prev, [name]: p.state }))
      }
    } catch (e) {
      console.error(e)
      if (e.name === 'NotFoundError') {
        alert(`No ${name} device was found on this system. Please connect one to grant permissions.`)
      } else if (e.name === 'NotAllowedError') {
        alert(`Permission to access the ${name} was denied by the browser settings.`)
      } else {
        alert(`Failed to request ${name} permission: ` + e.message)
      }
    }
  }

  const handleReset = async () => {
    if (resetStep === 0) { setResetStep(1); return }
    // Confirmed — clear IDB + localStorage
    await dbClearAll()
    localStorage.clear()
    setResetStep(2)
    setTimeout(() => window.location.reload(), 1200)
  }

  return (
    <div className="hn-settings-overlay" onClick={onClose}>
      <div className="hn-settings-modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Home Settings">
        <div className="hn-settings-handle" />
        <div className="hn-settings-header">
          <div className="hn-settings-title">
            <span className="hn-settings-title-icon"><Icon.Settings /></span>
            Settings
          </div>
          <button className="hn-settings-close" onClick={onClose} aria-label="Close"><Icon.X /></button>
        </div>

        <div className="hn-settings-body">
          {/* Theme */}
          <div className="hn-srow">
            <div className="hn-srow-info">
              <div className="hn-srow-label">Appearance</div>
              <div className="hn-srow-desc">{theme === 'dark' ? 'Dark mode active' : 'Light mode active'}</div>
            </div>
            <button
              className={`hn-toggle ${theme === 'dark' ? 'on' : ''}`}
              onClick={onToggleTheme}
              role="switch"
              aria-checked={theme === 'dark'}
            >
              <span className="hn-toggle-knob">
                {theme === 'dark' ? <Icon.Moon /> : <Icon.Sun />}
              </span>
            </button>
          </div>

          {/* Currency */}
          <div className="hn-srow" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
            <div className="hn-srow-info">
              <div className="hn-srow-label">Currency</div>
              <div className="hn-srow-desc">Billing currency for the POS</div>
            </div>
            <select
              className="hn-sselect"
              value={currency.code}
              onChange={e => onCurrency(currencies.find(c => c.code === e.target.value))}
            >
              {currencies.map(c => <option key={c.code} value={c.code}>{c.code} — {c.symbol}</option>)}
            </select>
          </div>

          {/* Language */}
          <div className="hn-srow" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
            <div className="hn-srow-info">
              <div className="hn-srow-label">Language</div>
              <div className="hn-srow-desc">Display language for the POS interface</div>
            </div>
            <select
              className="hn-sselect"
              value={lang}
              onChange={e => {
                setLang(e.target.value);
                localStorage.setItem('pos_lang', e.target.value);
              }}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="hi">हिन्दी</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          {/* App Permissions */}
          <div className="hn-srow" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
            <div 
              className="hn-srow-info" 
              style={{ marginBottom: 4, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => setShowPerms(!showPerms)}
            >
              <div>
                <div className="hn-srow-label">App Permissions</div>
                <div className="hn-srow-desc">Manage system access for POS features</div>
              </div>
              <div style={{ transform: showPerms ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
            
            {showPerms && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {/* Camera */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle, rgba(0,0,0,0.03))', padding: '10px 14px', borderRadius: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Camera</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>For barcode scanning</div>
                  </div>
                  <button 
                    onClick={() => requestPerm('camera')}
                    disabled={perms.camera === 'denied'}
                    style={{ background: perms.camera === 'granted' ? '#10b981' : (perms.camera === 'denied' ? 'var(--border-color)' : 'var(--brand-primary)'), color: perms.camera === 'denied' ? 'var(--text-tertiary)' : '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, cursor: perms.camera === 'denied' ? 'not-allowed' : 'pointer', minWidth: 70 }}>
                    {perms.camera === 'granted' ? 'Granted' : perms.camera === 'denied' ? 'Denied' : 'Allow'}
                  </button>
                </div>

                {/* Notifications */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle, rgba(0,0,0,0.03))', padding: '10px 14px', borderRadius: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>For order alerts & updates</div>
                  </div>
                  <button 
                    onClick={() => requestPerm('notifications')}
                    disabled={perms.notifications === 'denied'}
                    style={{ background: perms.notifications === 'granted' ? '#10b981' : (perms.notifications === 'denied' ? 'var(--border-color)' : 'var(--brand-primary)'), color: perms.notifications === 'denied' ? 'var(--text-tertiary)' : '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, cursor: perms.notifications === 'denied' ? 'not-allowed' : 'pointer', minWidth: 70 }}>
                    {perms.notifications === 'granted' ? 'Granted' : perms.notifications === 'denied' ? 'Denied' : 'Allow'}
                  </button>
                </div>

                {/* Sound */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle, rgba(0,0,0,0.03))', padding: '10px 14px', borderRadius: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Sound</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>For order chimes & alerts</div>
                  </div>
                  <button 
                    onClick={() => requestPerm('sound')}
                    style={{ background: perms.sound === 'granted' ? '#10b981' : 'var(--brand-primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', minWidth: 70 }}>
                    {perms.sound === 'granted' ? 'Granted' : 'Allow'}
                  </button>
                </div>

                {/* Automatic downloads */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle, rgba(0,0,0,0.03))', padding: '10px 14px', borderRadius: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Automatic Downloads</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>For saving backups & receipts</div>
                  </div>
                  <button 
                    onClick={() => requestPerm('downloads')}
                    style={{ background: perms.downloads === 'granted' ? '#10b981' : 'var(--brand-primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', minWidth: 70 }}>
                    {perms.downloads === 'granted' ? 'Granted' : 'Allow'}
                  </button>
                </div>

                {/* Pop-ups and redirects */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle, rgba(0,0,0,0.03))', padding: '10px 14px', borderRadius: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Pop-ups & Redirects</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>For printing & external links</div>
                  </div>
                  <button 
                    onClick={() => requestPerm('popups')}
                    style={{ background: perms.popups === 'granted' ? '#10b981' : 'var(--brand-primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', minWidth: 70 }}>
                    {perms.popups === 'granted' ? 'Granted' : 'Allow'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reset */}
          <div className="hn-srow hn-srow-reset">
            <div className="hn-srow-info">
              <div className="hn-srow-label hn-srow-label-danger">Reset App Data</div>
              <div className="hn-srow-desc">Clears all settings, products & saved data</div>
            </div>
            <button
              className={`hn-reset-btn ${resetStep === 1 ? 'confirm' : ''} ${resetStep === 2 ? 'done' : ''}`}
              onClick={handleReset}
            >
              {resetStep === 0 && <><Icon.Reset /> Reset</>}
              {resetStep === 1 && <><Icon.Warn /> Confirm?</>}
              {resetStep === 2 && '↺ Reloading…'}
            </button>
          </div>

          {resetStep === 1 && (
            <div className="hn-reset-warning">
              ⚠️ This will permanently clear all your business data, products, and settings. This cannot be undone.
              <button className="hn-reset-cancel" onClick={() => setResetStep(0)}>Cancel</button>
            </div>
          )}

          {/* About */}
          <div className="hn-settings-about">
            <div className="hn-about-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            </div>
            <div>
              <div className="hn-about-name">ManSula Nexus</div>
              <div className="hn-about-ver">v1.6.0-alpha · POS &amp; Business Suite</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home({ onLaunch, theme, onToggleTheme, currency, onCurrency, currencies }) {
  const [time, setTime] = useState(new Date())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [businessName, setBusinessName] = useState('')

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000)
    dbGet('mn-business').then(b => {
      if (b && b.name) setBusinessName(b.name)
    })
    return () => clearInterval(t)
  }, [])

  const greeting = getGreeting()
  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  const [stressing, setStressing] = useState(false)

  const handleStressTest = async () => {
    if (confirm('This will inject 10,000 fake orders into your database to stress test the UI. Proceed?')) {
      setStressing(true)
      const num = await injectStressTestData(10000)
      setStressing(false)
      if (num > 0) alert(`Successfully injected ${num} orders! Open Order Records to see the load.`)
      else alert('Stress test failed.')
    }
  }

  return (
    <div className="hn-root">
      {settingsOpen && (
        <HomeSettings
          theme={theme}
          onToggleTheme={onToggleTheme}
          currency={currency}
          onCurrency={onCurrency}
          currencies={currencies}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* ── Topbar ── */}
      <header className="hn-topbar">
        <div className="hn-topbar-brand">
          <div className="hn-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <div>
            <div className="hn-brand-main">ManSula</div>
            <div className="hn-brand-sub">Nexus</div>
          </div>
        </div>
        <button className="hn-settings-btn" onClick={() => setSettingsOpen(true)} aria-label="Settings">
          <Icon.Settings />
        </button>
      </header>

      {/* ── Hero ── */}
      <div className="hn-hero">
        <div className="hn-hero-orb hn-hero-orb-1" />
        <div className="hn-hero-orb hn-hero-orb-2" />
        <div className="hn-hero-content">
          <div className="hn-time-pill">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {timeStr} · {dateStr}
          </div>
          <h1 className="hn-greeting">{greeting}{businessName ? `, ${businessName}` : ''}</h1>
          <p className="hn-tagline">Your business hub is ready</p>
        </div>
      </div>

      {/* ── POS Launch Card ── */}
      <div className="hn-body">
        <div
          className="hn-pos-card"
          onClick={() => onLaunch('pos')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onLaunch('pos')}
          aria-label="Launch Point of Sale"
        >
          <div className="hn-pos-card-bg" />
          <div className="hn-pos-card-content">
            <div className="hn-pos-icon-wrap">
              <Icon.Rocket />
            </div>
            <div className="hn-pos-info">
              <div className="hn-pos-label">Point of Sale</div>
              <div className="hn-pos-desc">Billing, orders &amp; checkout</div>
            </div>
            <div className="hn-pos-launch-pill">
              Launch
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
          <div className="hn-pos-dots">
            {[...Array(12)].map((_, i) => <span key={i} className="hn-pos-dot" />)}
          </div>
        </div>

        {/* ── Tools Grid ── */}
        <div className="hn-tools-section">
          <div className="hn-tools-heading">More Tools</div>
          <div className="hn-tools-grid">
            {TOOLS.map(tool => (
              <div
                key={tool.id}
                className={`hn-tool-card ${tool.active ? 'hn-tool-active' : 'hn-tool-soon'}`}
                onClick={tool.active ? () => onLaunch(tool.id) : undefined}
                role={tool.active ? 'button' : undefined}
                tabIndex={tool.active ? 0 : undefined}
                onKeyDown={tool.active ? e => e.key === 'Enter' && onLaunch(tool.id) : undefined}
                aria-label={tool.active ? `Open ${tool.name}` : `${tool.name} — Coming Soon`}
              >
                <div className="hn-tool-icon" style={{ background: tool.bg }}>
                  <tool.Icon />
                </div>
                <div className="hn-tool-name">{tool.name}</div>
                <div className="hn-tool-desc">{tool.desc}</div>
                {tool.active
                  ? <span className="hn-tool-open-pill">Open <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>
                  : <span className="hn-soon-pill">Soon</span>
                }
              </div>
            ))}
          </div>

          <button 
            className="or-btn-ghost" 
            style={{ width: '100%', marginTop: '20px', color: 'var(--text-muted)' }}
            onClick={handleStressTest}
            disabled={stressing}
          >
            {stressing ? 'Injecting 10,000 orders...' : '⚙️ Run Stress Test (10k Orders)'}
          </button>
        </div>

        <div className="hn-footer">
          <div className="hn-footer-text">ManSula Nexus · v1.6.0-alpha</div>
        </div>
      </div>
    </div>
  )
}
