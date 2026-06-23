import { useState, useEffect, Fragment, useRef } from 'react'
import { useBackButton } from './useBackButton.js'
import { dbClearAll, dbGet, injectStressTestData } from './db.js'
import { useAlert } from './AlertDialog.jsx'

// ── Greeting ──
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── SVG Icon set ──
const Icon = {
  POS:       (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  Analytics: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Reports:   (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Inventory: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Staff:     (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Customers: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Business:  (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9.5" y1="14.5" x2="14.5" y2="14.5"/></svg>,
  Settings:  (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Moon:      (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Sun:       (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Volume:    (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>,
  VolumeX:   (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>,
  Back:      (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  X:         (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  ChevR:     (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevL:     (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  Rocket:    (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
  Reset:     (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>,
  Warn:      (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  OrderRec:  (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>,
  Camera:    (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
  Bell:      (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Database:  (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Download:  (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  ExtLink:   (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  FAQ:       (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Doc:       (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Lock:      (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Box:       (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Globe:     (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Pencil:    (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Mailbox:   (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Phone:     (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Message:   (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
}

// ── Tool definitions ──
const TOOLS = [
  { id: 'business',  name: 'Business Profile', desc: 'Setup info, menu & categories', Icon: Icon.Business,  color: '#6366f1', bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', active: true },
  { id: 'records',   name: 'Order Records',    desc: 'View, edit & export all orders', Icon: Icon.OrderRec,  color: '#10b981', bg: 'linear-gradient(135deg,#10b981,#059669)', active: true },
  { id: 'analytics', name: 'Analytics',        desc: 'Sales trends & insights',        Icon: Icon.Analytics,  color: '#0ea5e9', bg: 'linear-gradient(135deg,#0ea5e9,#2dd4bf)', active: true },
  { id: 'reports',   name: 'Reports',           desc: 'Daily, weekly & monthly',        Icon: Icon.Reports,    color: '#f59e0b', bg: 'linear-gradient(135deg,#f59e0b,#ef4444)', active: false },
  { id: 'inventory', name: 'Inventory',         desc: 'Stock, purchases & suppliers',   Icon: Icon.Inventory,  color: '#ec4899', bg: 'linear-gradient(135deg,#ec4899,#f43f5e)', active: true },
  { id: 'staff',     name: 'Staff',             desc: 'Team roles & shifts',            Icon: Icon.Staff,      color: '#06b6d4', bg: 'linear-gradient(135deg,#06b6d4,#0284c7)', active: false },
  { id: 'customers', name: 'Customers',         desc: 'Contacts, CRM & Udhaar',          Icon: Icon.Customers,  color: '#0891b2', bg: 'linear-gradient(135deg,#0891b2,#0d9488)', active: true },
]

// ── Full-Screen Settings ──
const SETTINGS_SECTIONS = [
  {
    id: 'appearance',
    label: 'Appearance',
    icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    color: '#6366f1',
  },
  {
    id: 'sound',
    label: 'Sound & Audio',
    icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>,
    color: '#0ea5e9',
  },
  {
    id: 'billing',
    label: 'Billing & Region',
    icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    color: '#10b981',
  },
  {
    id: 'permissions',
    label: 'Permissions',
    icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    color: '#f59e0b',
  },
  {
    id: 'data',
    label: 'Data & Storage',
    icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
    color: '#ec4899',
  },
  {
    id: 'about',
    label: 'About',
    icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    color: '#8b5cf6',
  },
  {
    id: 'help',
    label: 'Help & Legal',
    icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    color: '#06b6d4',
  },
]

function PermRow({ icon: IconCmp, label, desc, state, onAllow }) {
  const isGranted = state === 'granted'
  const isDenied = state === 'denied'
  return (
    <div className="hns-perm-row">
      <div className="hns-perm-info">
        {IconCmp && <div className="hns-perm-icon"><IconCmp /></div>}
        <div>
          <div className="hns-perm-label">{label}</div>
          <div className="hns-perm-desc">{desc}</div>
        </div>
      </div>
      <button
        className={`hns-perm-btn ${isGranted ? 'granted' : isDenied ? 'denied' : ''}`}
        onClick={onAllow}
        disabled={isDenied}
      >
        {isGranted ? '✓ Granted' : isDenied ? 'Denied' : 'Allow'}
      </button>
    </div>
  )
}

function HomeSettings({ theme, onToggleTheme, currency, onCurrency, currencies, onClose }) {
  useBackButton(onClose)
  const [activeSection, setActiveSection] = useState('appearance')
  const [resetStep, setResetStep] = useState(0)
  const { alert: showAlert, confirm: showConfirm } = useAlert()
  
  // Lock body scroll when settings modal is open
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
    }
  }, [])
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const tabRef = useRef(null)

  const handleTabScroll = () => {
    if (tabRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1)
    }
  }

  useEffect(() => {
    handleTabScroll()
    window.addEventListener('resize', handleTabScroll)
    return () => window.removeEventListener('resize', handleTabScroll)
  }, [])

  const [lang, setLang] = useState(localStorage.getItem('pos_lang') || 'en')
  const [perms, setPerms] = useState({
    camera: 'prompt',
    notifications: 'prompt',
    sound: localStorage.getItem('perm_sound') || 'prompt',
    files: localStorage.getItem('perm_files') || 'prompt',
    downloads: localStorage.getItem('perm_downloads') || 'prompt',
    popups: localStorage.getItem('perm_popups') || 'prompt'
  })
  const [volume, setVolume] = useState(() => {
    const val = localStorage.getItem('mn-volume')
    if (localStorage.getItem('mn-sound') === 'disabled') return 0
    return val !== null ? parseInt(val, 10) : 100
  })

  const handleVolumeChange = (e) => {
    const val = parseInt(e.target.value, 10)
    setVolume(val)
    localStorage.setItem('mn-volume', val)
    if (val === 0) localStorage.setItem('mn-sound', 'disabled')
    else localStorage.removeItem('mn-sound')
  }

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
        showAlert("Sound enabled successfully!", { type: 'success' });
      } else if (name === 'files') {
        if (navigator.storage && navigator.storage.persist) {
          const granted = await navigator.storage.persist();
          if (granted) {
            localStorage.setItem('perm_files', 'granted');
            setPerms(prev => ({ ...prev, files: 'granted' }));
            showAlert("Persistent storage granted!", { type: 'success' });
          } else {
            showAlert("Persistent storage was denied. Manage via browser site settings.", { type: 'danger' });
          }
        } else {
          showAlert("File permissions are handled automatically when you select a file.", { type: 'info' });
        }
      } else if (name === 'downloads') {
        const a1 = document.createElement('a'); a1.href = 'data:text/plain;charset=utf-8,dummy'; a1.download = 'dummy1.txt';
        const a2 = document.createElement('a'); a2.href = 'data:text/plain;charset=utf-8,dummy'; a2.download = 'dummy2.txt';
        a1.click(); setTimeout(() => a2.click(), 100);
        localStorage.setItem('perm_downloads', 'granted');
        setPerms(prev => ({ ...prev, downloads: 'granted' }));
        showAlert("Multiple downloads triggered. If blocked, allow from address bar.", { type: 'info' });
      } else if (name === 'popups') {
        localStorage.setItem('perm_popups', 'granted');
        setPerms(prev => ({ ...prev, popups: 'granted' }));
        setTimeout(() => {
          const w = window.open('about:blank', '_blank', 'width=100,height=100');
          if (!w || w.closed || typeof w.closed === 'undefined') {
            showAlert("Pop-up blocked! Allow pop-ups in your browser address bar.", { type: 'warning' });
          } else { w.close(); showAlert("Pop-ups are already allowed!", { type: 'success' }); }
        }, 1000);
      }
      if (['camera', 'notifications'].includes(name)) {
        const p = await navigator.permissions.query({ name })
        setPerms(prev => ({ ...prev, [name]: p.state }))
      }
    } catch (e) {
      if (e.name === 'NotFoundError') showAlert(`No ${name} device found.`, { type: 'danger' })
      else if (e.name === 'NotAllowedError') showAlert(`${name} permission denied by browser.`, { type: 'danger' })
      else showAlert(`Failed: ` + e.message, { type: 'danger' })
    }
  }

  const handleReset = async () => {
    if (resetStep === 2) return
    const ok = await showConfirm(
      'This will permanently clear all your business data, products, and settings. This cannot be undone.',
      { title: 'Reset App Data?', type: 'danger', confirmText: 'Yes, Reset Everything', cancelText: 'Cancel', confirmWord: 'RESET' }
    )
    if (!ok) return
    setResetStep(2)
    await dbClearAll()
    localStorage.clear()
    setTimeout(() => window.location.reload(), 1200)
  }

  const activeInfo = SETTINGS_SECTIONS.find(s => s.id === activeSection)

  const renderContent = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div className="hns-content-area">
            <div className="hns-section-title">Display</div>
            <div className="hns-card">
              <div className="hns-row">
                <div className="hns-row-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {theme === 'dark' ? <Icon.Moon /> : <Icon.Sun />}
                </div>
                <div className="hns-row-info">
                  <div className="hns-row-label">Theme</div>
                  <div className="hns-row-desc">{theme === 'dark' ? 'Dark mode active' : 'Light mode active'}</div>
                </div>
                <button className={`hns-toggle ${theme === 'dark' ? 'on' : ''}`} onClick={onToggleTheme} role="switch" aria-checked={theme === 'dark'}>
                  <span className="hns-toggle-knob">{theme === 'dark' ? <Icon.Moon /> : <Icon.Sun />}</span>
                </button>
              </div>
            </div>

            <div className="hns-section-title" style={{ marginTop: 24 }}>Localization</div>
            <div className="hns-card">
              <div className="hns-row hns-row-col">
                <div className="hns-row-head">
                  <div className="hns-row-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  </div>
                  <div className="hns-row-info">
                    <div className="hns-row-label">Language</div>
                    <div className="hns-row-desc">Display language for the POS interface</div>
                  </div>
                </div>
                <select className="hns-select" value={lang} onChange={e => { setLang(e.target.value); localStorage.setItem('pos_lang', e.target.value); }}>
                  <option value="en">🇬🇧 English</option>
                  <option value="hi" disabled>🇮🇳 हिन्दी (Coming Soon)</option>
                  <option value="es" disabled>🇪🇸 Español (Coming Soon)</option>
                  <option value="fr" disabled>🇫🇷 Français (Coming Soon)</option>
                  <option value="ar" disabled>🇸🇦 العربية (Coming Soon)</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 'sound':
        return (
          <div className="hns-content-area">
            <div className="hns-section-title">Volume</div>
            <div className="hns-card">
              <div className="hns-row hns-row-col">
                <div className="hns-row-head">
                  <div className="hns-row-icon" style={{ background: 'linear-gradient(135deg,#0ea5e9,#2dd4bf)' }}>
                    {volume === 0 ? <Icon.VolumeX /> : <Icon.Volume />}
                  </div>
                  <div className="hns-row-info">
                    <div className="hns-row-label">Sound Effects Volume</div>
                    <div className="hns-row-desc">Controls alerts, chimes & checkout sounds</div>
                  </div>
                  <span className="hns-vol-pct">{volume}%</span>
                </div>
                <div className="hns-vol-slider-wrap">
                  <span className="hns-vol-icon-sm"><Icon.VolumeX /></span>
                  <input
                    type="range" min="0" max="100" value={volume}
                    onChange={handleVolumeChange}
                    className="hns-slider"
                  />
                  <span className="hns-vol-icon-sm"><Icon.Volume /></span>
                </div>
                <div className="hns-vol-steps">
                  {[0, 25, 50, 75, 100].map(v => (
                    <button key={v} className={`hns-vol-step ${volume === v ? 'active' : ''}`} onClick={() => handleVolumeChange({ target: { value: v } })}>
                      {v === 0 ? 'Off' : `${v}%`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="hns-section-title" style={{ marginTop: 24 }}>Sound Preview</div>
            <div className="hns-card">
              <div className="hns-sound-grid">
                {[
                  { label: 'Add Item', type: 'add', desc: 'When item is added to cart' },
                  { label: 'Remove Item', type: 'remove', desc: 'When item is removed' },
                  { label: 'Checkout', type: 'checkout', desc: 'On successful order' },
                ].map(s => (
                  <div key={s.type} className="hns-sound-item">
                    <div className="hns-sound-info">
                      <span className="hns-sound-name">{s.label}</span>
                      <span className="hns-sound-desc">{s.desc}</span>
                    </div>
                    <button className="hns-sound-btn" onClick={() => {
                      const AudioContext = window.AudioContext || window.webkitAudioContext
                      if (!AudioContext || volume === 0) return
                      const ctx = new AudioContext()
                      const osc = ctx.createOscillator()
                      const gain = ctx.createGain()
                      const vol = volume / 100
                      osc.connect(gain); gain.connect(ctx.destination)
                      if (s.type === 'add') {
                        osc.type = 'sine'; osc.frequency.setValueAtTime(440, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1)
                        gain.gain.setValueAtTime(0.1 * vol, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01 * vol, ctx.currentTime + 0.1)
                        osc.start(); osc.stop(ctx.currentTime + 0.1)
                      } else if (s.type === 'remove') {
                        osc.type = 'sine'; osc.frequency.setValueAtTime(300, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1)
                        gain.gain.setValueAtTime(0.1 * vol, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01 * vol, ctx.currentTime + 0.1)
                        osc.start(); osc.stop(ctx.currentTime + 0.1)
                      } else {
                        osc.type = 'triangle'; osc.frequency.setValueAtTime(440, ctx.currentTime); osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.12); osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.24)
                        gain.gain.setValueAtTime(0.1 * vol, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.01 * vol, ctx.currentTime + 0.36)
                        osc.start(); osc.stop(ctx.currentTime + 0.36)
                      }
                    }}>
                      <span className="hns-sound-play">▶</span>
                      Test
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'billing':
        return (
          <div className="hns-content-area">
            <div className="hns-section-title">Currency</div>
            <div className="hns-card">
              <div className="hns-row hns-row-col">
                <div className="hns-row-head">
                  <div className="hns-row-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <div className="hns-row-info">
                    <div className="hns-row-label">Billing Currency</div>
                    <div className="hns-row-desc">Default currency for invoices & billing</div>
                  </div>
                </div>
                <div className="hns-currency-grid">
                  {currencies.map(c => (
                    <button
                      key={c.code}
                      className={`hns-currency-btn ${currency.code === c.code ? 'active' : ''}`}
                      onClick={() => onCurrency(c)}
                    >
                      <span className="hns-currency-symbol">{c.symbol}</span>
                      <span className="hns-currency-code">{c.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="hns-section-title" style={{ marginTop: 24 }}>Tax</div>
            <div className="hns-card hns-coming-soon-card">
              <div className="hns-cs-badge">Coming Soon</div>
              <div className="hns-cs-title">Tax Configuration</div>
              <div className="hns-cs-desc">Set default tax rates, GST slabs & tax-inclusive pricing for your region.</div>
            </div>

            <div className="hns-section-title" style={{ marginTop: 24 }}>Invoice</div>
            <div className="hns-card hns-coming-soon-card">
              <div className="hns-cs-badge">Coming Soon</div>
              <div className="hns-cs-title">Invoice Customization</div>
              <div className="hns-cs-desc">Custom logo, header, footer & receipt templates.</div>
            </div>
          </div>
        )

      case 'permissions':
        return (
          <div className="hns-content-area">
            <div className="hns-section-title">Browser Permissions</div>
            <div className="hns-perm-info-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Manage what ManSula Nexus can access on your device. Denied permissions must be reset from browser site settings.
            </div>
            <div className="hns-card">
              <PermRow icon={Icon.Camera} label="Camera" desc="For barcode & QR scanning at checkout" state={perms.camera} onAllow={() => requestPerm('camera')} />
              <PermRow icon={Icon.Bell} label="Notifications" desc="For order alerts & background updates" state={perms.notifications} onAllow={() => requestPerm('notifications')} />
              <PermRow icon={Icon.Volume} label="Sound" desc="For chimes, alerts & checkout sounds" state={perms.sound} onAllow={() => requestPerm('sound')} />
              <PermRow icon={Icon.Database} label="Persistent Storage" desc="Prevents browser from clearing app data" state={perms.files} onAllow={() => requestPerm('files')} />
              <PermRow icon={Icon.Download} label="Auto Downloads" desc="For saving reports & backup exports" state={perms.downloads} onAllow={() => requestPerm('downloads')} />
              <PermRow icon={Icon.ExtLink} label="Pop-ups & Redirects" desc="For printing receipts & external links" state={perms.popups} onAllow={() => requestPerm('popups')} />
            </div>
          </div>
        )

      case 'data':
        return (
          <div className="hns-content-area">
            <div className="hns-section-title">Backup & Restore</div>
            <div className="hns-card hns-coming-soon-card">
              <div className="hns-cs-badge">Coming Soon</div>
              <div className="hns-cs-title">Cloud Backup</div>
              <div className="hns-cs-desc">Automatically sync your data to the cloud and restore from any device.</div>
            </div>

            <div className="hns-section-title" style={{ marginTop: 24 }}>Danger Zone</div>
            <div className="hns-danger-card">
              <div className="hns-danger-row">
                <div>
                  <div className="hns-danger-label">Reset App Data</div>
                  <div className="hns-danger-desc">Permanently wipes all orders, products, settings & customer data. Cannot be undone.</div>
                </div>
                <button
                  className={`hns-danger-btn ${resetStep === 2 ? 'done' : ''}`}
                  onClick={handleReset}
                  disabled={resetStep === 2}
                >
                  {resetStep !== 2 ? <><Icon.Reset /> Reset All</> : '↺ Reloading…'}
                </button>
              </div>
            </div>
          </div>
        )

      case 'about':
        return (
          <div className="hns-content-area">
            <div className="hns-about-hero">
              <div className="hns-about-logo-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              </div>
              <div className="hns-about-name">ManSula Nexus</div>
              <div className="hns-about-version">v1.6.0-alpha · POS & Business Suite</div>
            </div>

            <div className="hns-section-title">App Info</div>
            <div className="hns-card">
              {[
                { label: 'Version', value: 'v1.6.0-alpha' },
                { label: 'Build', value: 'PWA · Offline-ready' },
                { label: 'Storage', value: 'IndexedDB (Local)' },
                { label: 'Framework', value: 'React + Vite' },
                { label: 'Environment', value: 'Production' },
              ].map(({ label, value }) => (
                <div key={label} className="hns-info-row">
                  <span className="hns-info-label">{label}</span>
                  <span className="hns-info-value">{value}</span>
                </div>
              ))}
            </div>

            <div className="hns-section-title" style={{ marginTop: 24 }}>Legal</div>
            <div className="hns-card">
              <div className="hns-legal-text">
                ManSula Nexus is a local-first point-of-sale application. All data is stored on this device only and never transmitted to any server. Use of this software is at your own discretion.
              </div>
            </div>
          </div>
        )

      case 'help':
        return <HelpContent />

      default: return null
    }
  }

  return (
    <div className="hns-overlay" onClick={onClose}>
      <div className="hns-root" onClick={e => e.stopPropagation()} role="dialog" aria-label="Settings">
        
        {/* ── TOP HEADER BAR ── */}
        <header className="hns-topbar">
          <div className="hns-topbar-left">
            <button className="hns-topbar-back" onClick={onClose} aria-label="Back">
              <Icon.Back />
            </button>
            <div className="hns-topbar-heading"><Icon.Settings /> Settings</div>
            <div className="hns-topbar-divider" />
            <div className="hns-topbar-section">{activeInfo?.label}</div>
          </div>
        </header>

        {/* ── BODY (Sidebar + Main) ── */}
        <div className="hns-body-wrapper">
          {/* ── Tab Bar ── */}
          <div className="an-tab-container" style={{ borderBottom: '1px solid var(--border-color)', borderRight: 'none' }}>
            <div className="an-tab-bar" ref={tabRef} onScroll={handleTabScroll}>
              {SETTINGS_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  className={`an-tab-btn ${activeSection === s.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(s.id)}
                >
                  <s.icon style={{ width: 15, height: 15 }} />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
            {canScrollRight && (
              <div className="an-tab-scroll-hint">
                <Icon.ChevR style={{ width: 16, height: 16 }} />
              </div>
            )}
            {canScrollLeft && (
              <div className="an-tab-scroll-hint left">
                <Icon.ChevL style={{ width: 16, height: 16 }} />
              </div>
            )}
          </div>

          {/* ── Main Content ── */}
          <div className="hns-main">
            <div className="hns-main-body">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function HelpContent() {
  const [openFaq, setOpenFaq] = useState(null)
  const [helpTab, setHelpTab] = useState('faq')
  const [faqSearch, setFaqSearch] = useState('')
  const [showSupportSheet, setShowSupportSheet] = useState(false)
  const faqs = [
    { q: 'How do I add items to a sale?', a: 'Open the POS from the home screen. Tap any item from your menu to add it to the current order. You can adjust quantities using the +/− buttons on the cart.' },
    { q: 'How do I create a new product/menu item?', a: 'Go to Business Profile → Menu. Tap the + button to add a new item. Fill in the name, price, and category, then save.' },
    { q: 'What is Udhaar?', a: 'Udhaar is a credit/debit tracking system. When a customer pays later, select "Udhaar" at checkout and link it to a customer profile. Track dues in the Customers section.' },
    { q: 'How do I edit or delete a past order?', a: 'Open Order Records, find the order, and tap the edit icon. Change the date/time, or tap "Edit in POS" to modify items. To delete, tap the trash icon.' },
    { q: 'How do I export my data and reports?', a: 'Go to Order Records and tap the export icon (top right). You can export a JSON backup or open the data export modal.' },
    { q: 'Is my data safe if I close the browser?', a: 'Yes. All data is stored in your browser\'s IndexedDB and persists across sessions. Enable Persistent Storage from Permissions settings for extra protection.' },
    { q: 'How do I reset the order counter to #1?', a: 'Go to Order Records → Export/Data modal → Wipe Order Records. This clears all saved orders and resets the counter back to #1.' },
    { q: 'How do I track inventory?', a: 'Open the Inventory tool from the home screen. Add stock, log purchases from suppliers, and the system tracks current stock levels automatically.' },
    { q: 'Can I use this app offline?', a: 'Yes! ManSula Nexus is a Progressive Web App (PWA) and works fully offline once loaded. All data stays on your device.' },
    { q: 'How do I install this as an app on my phone?', a: 'On Android (Chrome): tap the three dots → Install app. On iOS (Safari): tap Share → Add to Home Screen. The app will work just like a native app.' },
    { q: 'Can multiple people use the same account?', a: 'Currently, ManSula Nexus stores data locally per browser/device. Multi-device sync and staff accounts are planned for a future update.' },
    { q: 'How do I change the currency?', a: 'Go to Settings → Billing & Region. Select your preferred currency from the available options. It applies instantly across the POS.' },
  ]
  return (
    <div className="hns-content-area">
      <div className="hns-help-tabs">
        {[
          { id: 'faq', label: <><Icon.FAQ style={{width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom'}}/> FAQ</> },
          { id: 'terms', label: <><Icon.Doc style={{width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom'}}/> Terms of Use</> },
          { id: 'privacy', label: <><Icon.Lock style={{width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom'}}/> Privacy Policy</> },
        ].map(t => (
          <button key={t.id} className={`hns-help-tab ${helpTab === t.id ? 'active' : ''}`} onClick={() => setHelpTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {helpTab === 'faq' && (
        <div className="hns-faq-list">
          <div className="hns-section-title" style={{ marginBottom: 12 }}>Frequently Asked Questions</div>
          <input
            type="search"
            placeholder="Search FAQs..."
            value={faqSearch}
            onChange={(e) => { setFaqSearch(e.target.value); setOpenFaq(null); }}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface-2)',
              marginBottom: '16px',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
          {faqs.filter(f => f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase())).map((f, i) => (
            <div key={i} className={`hns-faq-item ${openFaq === i ? 'open' : ''}`}>
              <button className="hns-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{f.q}</span>
                <span className="hns-faq-chevron">{openFaq === i ? '▲' : '▼'}</span>
              </button>
              {openFaq === i && <div className="hns-faq-a">{f.a}</div>}
            </div>
          ))}
          {faqs.filter(f => f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase())).length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No FAQs found matching "{faqSearch}"
            </div>
          )}
          <div style={{ marginTop: 24, padding: '20px 0', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>Can't find what you're looking for?</p>
            <button 
              className="hns-support-trigger-btn"
              onClick={() => setShowSupportSheet(true)}
            >
              <Icon.Mailbox style={{ width: 18, height: 18 }} /> Contact Support
            </button>
          </div>
        </div>
      )}

      {showSupportSheet && (
        <div className="hns-support-sheet-overlay" onClick={() => setShowSupportSheet(false)}>
          <div className="hns-support-sheet" onClick={e => e.stopPropagation()}>
            <div className="hns-support-sheet-drag" />
            <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '1.2rem', textAlign: 'center' }}>Contact Support</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 0 }}>Choose how you'd like to reach us.</p>
            <div className="hns-support-list">
              <button className="hns-support-list-btn whatsapp" onClick={() => { setShowSupportSheet(false); window.open('https://wa.me/919876543210', '_blank'); }}>
                <div className="icon"><Icon.Message style={{ width: 22, height: 22 }} /></div>
                <span>WhatsApp Support</span>
              </button>
              <button className="hns-support-list-btn call" onClick={() => { setShowSupportSheet(false); window.location.href = 'tel:+919876543210'; }}>
                <div className="icon"><Icon.Phone style={{ width: 22, height: 22 }} /></div>
                <span>Call Us</span>
              </button>
              <button className="hns-support-list-btn email" onClick={() => { setShowSupportSheet(false); window.location.href = 'mailto:support@mansulanexus.com?subject=Support%20Request'; }}>
                <div className="icon"><Icon.Mailbox style={{ width: 22, height: 22 }} /></div>
                <span>Email Support</span>
              </button>
            </div>
            <button className="hns-support-sheet-cancel" onClick={() => setShowSupportSheet(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {helpTab === 'terms' && (
        <div className="hns-legal-card">
          <div className="hns-legal-section-title"><Icon.Doc style={{width: 18, height: 18, marginRight: 8, display: 'inline-block', verticalAlign: 'text-bottom'}}/> Terms of Use</div>
          <div className="hns-legal-body">
            <p><strong>Last updated:</strong> June 2026</p>
            <p>By using ManSula Nexus ("the App"), you agree to the following terms and conditions. Please read them carefully.</p>
            <div className="hns-legal-h">1. Acceptable Use</div>
            <p>You may use this App for lawful business purposes only. You are responsible for all data entered into the system, including product prices, customer records, and transaction history.</p>
            <div className="hns-legal-h">2. Data Responsibility</div>
            <p>All data is stored locally on your device using browser storage (IndexedDB). The developers are not responsible for any data loss due to browser clearing, device failure, or accidental resets. We strongly recommend enabling Persistent Storage in the Permissions section.</p>
            <div className="hns-legal-h">3. No Warranty</div>
            <p>The App is provided "as is" without any warranty, express or implied. The developers do not guarantee uninterrupted or error-free operation. The App may be updated, modified, or discontinued at any time.</p>
            <div className="hns-legal-h">4. Limitation of Liability</div>
            <p>The developers shall not be liable for any indirect, incidental, special, or consequential damages arising from your use or inability to use the App, including but not limited to business losses, data loss, or revenue loss.</p>
            <div className="hns-legal-h">5. Intellectual Property</div>
            <p>ManSula Nexus and its UI, design, and code are the property of the developer. You may not copy, redistribute, or reverse-engineer any part of the application without explicit written consent.</p>
            <div className="hns-legal-h">6. Changes to Terms</div>
            <p>We may update these Terms from time to time. Continued use of the App after updates constitutes your acceptance of the revised terms. Major changes will be communicated through an in-app notice.</p>
          </div>
        </div>
      )}

      {helpTab === 'privacy' && (
        <div className="hns-legal-card">
          <div className="hns-legal-section-title"><Icon.Lock style={{width: 18, height: 18, marginRight: 8, display: 'inline-block', verticalAlign: 'text-bottom'}}/> Privacy Policy</div>
          <div className="hns-legal-body">
            <p><strong>Last updated:</strong> June 2026</p>
            <p>ManSula Nexus is designed with <strong>privacy-first principles</strong>. We do not collect, store, or transmit any of your personal or business data to external servers.</p>
            <div className="hns-legal-h"><Icon.Box style={{width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom'}}/> Data Storage</div>
            <p>All data — including orders, customer records, inventory, products, and settings — is stored entirely on <strong>your device</strong> using browser IndexedDB and localStorage. No data is ever sent to any external server or cloud service.</p>
            <div className="hns-legal-h"><Icon.Globe style={{width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom'}}/> Network Usage</div>
            <p>The App loads fonts (Outfit) from Google Fonts on first launch. No analytics, tracking scripts, cookies, advertising SDKs, or third-party monitoring services are included in this application.</p>
            <div className="hns-legal-h"><Icon.Camera style={{width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom'}}/> Camera Access</div>
            <p>If you grant camera access, it is used exclusively for barcode/QR scanning within the POS screen. No images are captured, stored, or transmitted. Camera access can be revoked from your browser's site settings at any time.</p>
            <div className="hns-legal-h"><Icon.Bell style={{width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom'}}/> Notifications</div>
            <p>Notification permission is entirely optional. It is only used to display local in-app alerts for order updates. No push notifications are sent through any external service or server.</p>
            <div className="hns-legal-h"><Icon.Database style={{width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom'}}/> Persistent Storage</div>
            <p>Enabling Persistent Storage requests that your browser protect app data from being automatically cleared. This is a local browser permission — no data leaves your device.</p>
            <div className="hns-legal-h"><Icon.Pencil style={{width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom'}}/> Your Control</div>
            <p>You have full control over all your data. Use the "Reset App Data" option in Data & Storage settings to permanently and irreversibly delete all data from your device at any time.</p>
            <div className="hns-legal-h"><Icon.Mailbox style={{width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom'}}/> Contact</div>
            <p>For privacy-related questions or concerns, please reach out to the developer through the app's official channel or support contact.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Home({ onLaunch, theme, onToggleTheme, currency, onCurrency, currencies }) {
  const [time, setTime] = useState(new Date())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const { alert: showAlert, confirm: showConfirm } = useAlert()

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
    const ok = await showConfirm(
      'This will inject 10,000 fake orders into your database to stress test the UI. Proceed?',
      { title: 'Inject Stress Data?', type: 'warning', confirmText: 'Yes, Inject', cancelText: 'Cancel' }
    )
    if (ok) {
      setStressing(true)
      const num = await injectStressTestData(10000)
      setStressing(false)
      if (num > 0) showAlert(`Successfully injected ${num} orders! Open Order Records to see the load.`, { type: 'success' })
      else showAlert('Stress test failed.', { type: 'danger' })
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
