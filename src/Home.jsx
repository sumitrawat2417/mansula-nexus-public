import { useState, useEffect, Fragment, useRef } from 'react'
import { useBackButton } from './useBackButton.js'
import { dbClearAll, dbGet, dbSet, injectStressTestData, exportUltimateBackup, restoreUltimateBackup } from './db.js'
import { useAlert } from './AlertDialog.jsx'
import { APP_VERSION, APP_BUILD_DATE, WHATS_NEW, ORG, LEGAL_LAST_UPDATED } from './appInfo.js'
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { avatarGrad, initials } from './Staff.jsx'

// ── Premium Feature Lock ──
const CAN_REORDER_TOOLS = true

function SortableToolCard({ tool, onLaunch, onboardingStep, setOnboardingStep }) {
  const isSpotlight = onboardingStep === 'spotlight-business' && tool.id === 'business'
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tool.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 99 : 'auto',
    position: 'relative'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`hn-tool-card ${tool.active ? 'hn-tool-active' : 'hn-tool-soon'} ${isSpotlight ? 'mn-spotlight-active' : ''}`}
      onClick={tool.active ? () => {
        if (isSpotlight) setOnboardingStep('spotlight-setup')
        onLaunch(tool.id)
      } : undefined}
      role={tool.active ? 'button' : undefined}
      tabIndex={tool.active ? 0 : undefined}
      onKeyDown={tool.active ? e => {
        if (e.key === 'Enter') {
          if (isSpotlight) setOnboardingStep('spotlight-setup')
          onLaunch(tool.id)
        }
      } : undefined}
      aria-label={tool.active ? `Open ${tool.name}` : `${tool.name} — Coming Soon`}
    >
      {CAN_REORDER_TOOLS && (
        <div
          className="hn-tool-drag-handle"
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
          style={{ position: 'absolute', top: 4, right: 4, padding: 8, cursor: 'grab', color: 'var(--text-muted)', touchAction: 'none' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="12" r="1.5" /><circle cx="9" cy="5" r="1.5" /><circle cx="9" cy="19" r="1.5" />
            <circle cx="15" cy="12" r="1.5" /><circle cx="15" cy="5" r="1.5" /><circle cx="15" cy="19" r="1.5" />
          </svg>
        </div>
      )}
      <div className="hn-tool-icon" style={{ background: tool.bg }}>
        <tool.Icon />
      </div>
      <div className="hn-tool-name">{tool.name}</div>
      <div className="hn-tool-desc">{tool.desc}</div>
      {tool.active
        ? <span className="hn-tool-open-pill">Open <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg></span>
        : <span className="hn-soon-pill">Soon</span>
      }
    </div>
  )
}

// ── Greeting ──
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── SVG Icon set ──
const Icon = {
  POS: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>,
  Analytics: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  Reports: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
  Inventory: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
  Staff: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  Customers: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  Business: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="12" x2="12" y2="17" /><line x1="9.5" y1="14.5" x2="14.5" y2="14.5" /></svg>,
  Settings: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  Moon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
  Sun: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>,
  Volume: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>,
  VolumeX: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>,
  Back: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
  X: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
  ChevR: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>,
  ChevL: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>,
  Rocket: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>,
  Reset: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.5" /></svg>,
  Warn: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  OrderRec: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="12" y2="17" /></svg>,
  Camera: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>,
  Bell: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  Database: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>,
  Download: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  ExtLink: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>,
  FAQ: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  Doc: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
  Lock: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  Cloud: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></svg>,
  Sparkles: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.29 1.29L3 12l5.8 1.9a2 2 0 0 1 1.29 1.29L12 21l1.9-5.8a2 2 0 0 1 1.29-1.29L21 12l-5.8-1.9a2 2 0 0 1-1.29-1.29L12 3z" /></svg>,
  User: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  Box: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
  Globe: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
  Pencil: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  Mailbox: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  Phone: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
  Message: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>,
}

// ── Tool definitions ──
const TOOLS = [
  { id: 'business', name: 'Business Profile', desc: 'Setup info, menu & categories', Icon: Icon.Business, color: '#6366f1', bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', active: true },
  { id: 'records', name: 'Order Records', desc: 'View, edit & export all orders', Icon: Icon.OrderRec, color: '#10b981', bg: 'linear-gradient(135deg,#10b981,#059669)', active: true },
  { id: 'analytics', name: 'Analytics', desc: 'Sales trends & insights', Icon: Icon.Analytics, color: '#0ea5e9', bg: 'linear-gradient(135deg,#0ea5e9,#2dd4bf)', active: true },
  { id: 'reports', name: 'Reports', desc: 'Daily, weekly & monthly', Icon: Icon.Reports, color: '#f59e0b', bg: 'linear-gradient(135deg,#f59e0b,#ef4444)', active: false },
  { id: 'inventory', name: 'Inventory', desc: 'Stock, purchases & suppliers', Icon: Icon.Inventory, color: '#ec4899', bg: 'linear-gradient(135deg,#ec4899,#f43f5e)', active: true },
  { id: 'staff', name: 'Staff', desc: 'Team roles & shifts', Icon: Icon.Staff, color: '#06b6d4', bg: 'linear-gradient(135deg,#06b6d4,#0284c7)', active: true },
  { id: 'customers', name: 'Customers', desc: 'Contacts, CRM & Udhaar', Icon: Icon.Customers, color: '#0891b2', bg: 'linear-gradient(135deg,#0891b2,#0d9488)', active: true },
]

// ── Full-Screen Settings ──
const SETTINGS_SECTIONS = [
  {
    id: 'appearance',
    label: 'Appearance',
    icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
    color: '#6366f1',
  },
  {
    id: 'sound',
    label: 'Sound & Audio',
    icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>,
    color: '#0ea5e9',
  },
  {
    id: 'data',
    label: 'Data & Storage',
    icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>,
    color: '#ec4899',
  },
  {
    id: 'permissions',
    label: 'Permissions',
    icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
    color: '#f59e0b',
  },
  {
    id: 'about',
    label: 'About',
    icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
    color: '#8b5cf6',
  },
  {
    id: 'billing',
    label: 'Billing & Region',
    icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
    color: '#10b981',
  },
  {
    id: 'help',
    label: 'Help & Legal',
    icon: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
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
  const [expandedItem, setExpandedItem] = useState(null)
  const [storageUsed, setStorageUsed] = useState('< 1 MB')
  const [updateStatus, setUpdateStatus] = useState('uptodate')
  const [showThemeModal, setShowThemeModal] = useState(false)

  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        if (estimate.usage) {
          const mb = (estimate.usage / (1024 * 1024)).toFixed(2)
          setStorageUsed(mb >= 0.01 ? `${mb} MB` : '< 0.01 MB')
        }
      }).catch(console.error)
    }
  }, [])

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

  const handleBackupExport = async () => {
    const blob = await exportUltimateBackup()
    if (!blob) {
      showAlert('Failed to export ultimate backup.', { type: 'danger' })
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const d = new Date()
    const dStr = String(d.getDate()).padStart(2, '0') + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + d.getFullYear()
    a.download = `MansulaBOS_FullBackup_${dStr}.msbos`
    a.click()
    URL.revokeObjectURL(url)
    showAlert('Backup exported successfully.', { type: 'success' })
  }

  const fileInputRef = useRef(null)

  const handleBackupRestore = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // reset

    const ok = await showConfirm(
      'Restoring a backup will COMPLETELY OVERWRITE all your current business data, orders, and settings. This cannot be undone. Are you absolutely sure?',
      { title: 'Restore Ultimate Backup?', type: 'danger', confirmText: 'Yes, Overwrite Everything', cancelText: 'Cancel', confirmWord: 'RESTORE' }
    )
    if (!ok) return

    setResetStep(2) // Disable interactions
    const success = await restoreUltimateBackup(file)
    if (success) {
      setTimeout(() => window.location.reload(), 800)
    } else {
      setResetStep(0)
      showAlert('Failed to restore backup. Invalid or corrupted file.', { type: 'danger' })
    }
  }

  const activeInfo = SETTINGS_SECTIONS.find(s => s.id === activeSection)

  const renderContent = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div className="hns-content-area">
            <div className="hns-section-title">Display</div>
            <div className="hns-card">
              <div className="hns-row" style={{ cursor: 'pointer' }} onClick={() => setShowThemeModal(true)}>
                <div className="hns-row-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {theme === 'dark' ? <Icon.Moon /> : <Icon.Sun />}
                </div>
                <div className="hns-row-info">
                  <div className="hns-row-label">Theme</div>
                  <div className="hns-row-desc">{theme === 'dark' ? 'Dark mode active' : 'Light mode active'}</div>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </div>
              </div>
            </div>

            <div className="hns-section-title" style={{ marginTop: 24 }}>Localization</div>
            <div className="hns-card">
              <div className="hns-row hns-row-col">
                <div className="hns-row-head">
                  <div className="hns-row-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              Manage what ManSula BOS can access on your device. Denied permissions must be reset from browser site settings.
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
            <div className="hns-section-title">Ultimate Full Backup</div>
            <div className="hns-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>All-in-One Data Export</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Downloads a single backup file containing all your settings, order records, inventory, purchases, customers, and udhaar ledgers.
                  </div>
                </div>
                <button
                  className="bp-btn-primary"
                  onClick={handleBackupExport}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <Icon.Download style={{ width: 16, height: 16, marginRight: 6 }} /> Export Ultimate Backup
                </button>

                <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />

                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>Restore from Backup</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Select a previously exported ultimate backup file. This will safely overwrite your current data.
                  </div>
                </div>
                <input
                  type="file"
                  accept=".json,.msbos"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleBackupRestore}
                />
                <button
                  className="bp-btn-outline"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ alignSelf: 'flex-start' }}
                  disabled={resetStep === 2}
                >
                  <Icon.Cloud style={{ width: 16, height: 16, marginRight: 6 }} /> Restore Ultimate Backup
                </button>
              </div>
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
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
              </div>
              <div className="hns-about-name">ManSula BOS</div>
              <div className="hns-about-version">Business Operating System</div>
            </div>

            <div className="hns-section-title">Software Updates</div>
            <div className="hns-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>Current Version</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>{APP_VERSION}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {updateStatus === 'uptodate' && (
                    <button
                      style={{
                        padding: '8px 14px', fontSize: '0.75rem', borderRadius: '8px', fontWeight: 600,
                        border: 'none', cursor: 'pointer',
                        background: 'var(--bg-surface-2, rgba(99,102,241,0.08))',
                        color: 'var(--text-primary)',
                        transition: 'transform 0.15s ease',
                      }}
                      onClick={() => {
                        setUpdateStatus('checking')
                        const minWait = new Promise(r => setTimeout(r, 1000))
                        if ('serviceWorker' in navigator) {
                          navigator.serviceWorker.ready.then(reg => {
                            reg.update().then(() => {
                              minWait.then(() => {
                                if (reg.waiting) {
                                  setUpdateStatus('available')
                                } else if (reg.installing) {
                                  reg.installing.addEventListener('statechange', (e) => {
                                    if (e.target.state === 'installed') setUpdateStatus('available')
                                  })
                                } else {
                                  setUpdateStatus('uptodate')
                                }
                              })
                            }).catch(() => minWait.then(() => setUpdateStatus('uptodate')))
                          })
                        } else {
                          minWait.then(() => setUpdateStatus('uptodate'))
                        }
                      }}
                      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      Check for Updates
                    </button>
                  )}

                  {updateStatus === 'checking' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                      Checking...
                    </div>
                  )}

                  {updateStatus === 'available' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontSize: '0.75rem', fontWeight: 600 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                        Update Available
                      </div>
                      <button
                        style={{
                          padding: '6px 14px', fontSize: '0.75rem', borderRadius: '6px', fontWeight: 600,
                          border: 'none', cursor: 'pointer',
                          background: 'var(--brand-primary)',
                          color: '#fff',
                        }}
                        onClick={() => {
                          if ('serviceWorker' in navigator) {
                            navigator.serviceWorker.getRegistration().then(reg => {
                              if (reg && reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' })
                            })
                          }
                          setTimeout(() => window.location.reload(), 300)
                        }}
                      >
                        Install Update
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="hns-section-title" style={{ marginTop: 24 }}>App Info</div>
            <div className="hns-card">
              {[
                { label: 'Build', value: 'PWA · Offline-ready' },
                { label: 'Last Updated', value: APP_BUILD_DATE },
                { label: 'Storage Used', value: storageUsed },
              ].map(({ label, value }) => (
                <div key={label} className="hns-info-row">
                  <span className="hns-info-label">{label}</span>
                  <span className="hns-info-value">{value}</span>
                </div>
              ))}
            </div>

            <div className="hns-section-title" style={{ marginTop: 24 }}>What's New</div>
            <div className="hns-card" style={{ padding: '0' }}>
              {WHATS_NEW.map(({ icon: iconType, label, detail }, i, arr) => {
                const iconMap = {
                  analytics: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
                  lightning: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
                  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
                  star: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
                  wrench: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>,
                }
                const isOpen = expandedItem === i
                return (
                  <div key={label} style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    {/* Header row — always visible */}
                    <button
                      onClick={() => setExpandedItem(isOpen ? null : i)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{
                        flexShrink: 0, width: 26, height: 26, borderRadius: 7,
                        background: 'var(--bg-surface-2, rgba(99,102,241,0.07))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{iconMap[iconType] ?? iconMap.check}</div>
                      <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>{label}</span>
                      <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      ><polyline points="6 9 12 15 18 9" /></svg>
                    </button>
                    {/* Expandable detail */}
                    {isOpen && (
                      <div style={{
                        padding: '0 16px 14px 52px',
                        fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.6',
                        animation: 'slideDown 0.2s ease',
                      }}>
                        {detail}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="hns-section-title" style={{ marginTop: 24 }}>Legal</div>
            <div className="hns-card" style={{ padding: '16px' }}>
              <div className="hns-legal-text" style={{ marginBottom: 16 }}>
                ManSula BOS is an offline-first Business Operating System. Business data remains under your control. Review the Terms of Service and Privacy Policy for complete information.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <a href="https://mansulabos.netlify.app/terms.html" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>Terms of Service</a>
                <a href="https://mansulabos.netlify.app/privacy.html" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a>
              </div>
            </div>

            <div className="hns-section-title" style={{ marginTop: 24 }}>Organisation</div>
            <div className="hns-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{ORG.name}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ORG.tagline}</div>
                <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500 }}>Website</span>
                  <a href={ORG.website} target="_blank" rel="noreferrer"
                    style={{ fontSize: '0.76rem', color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>
                    mansulatech.netlify.app
                  </a>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500 }}>Support</span>
                  <a href={`mailto:${ORG.support}`}
                    style={{ fontSize: '0.76rem', color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>
                    {ORG.support}
                  </a>
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 4px 8px', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {ORG.copyright}<br />
              ManSula BOS {APP_VERSION}
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
      {showThemeModal && (
        <SettingsThemeModal 
          currentTheme={theme} 
          onChangeTheme={onToggleTheme} 
          onClose={() => setShowThemeModal(false)} 
        />
      )}
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
    { q: 'How do I export my data and reports?', a: 'Go to Order Records and tap the export icon (top right). You can export a backup or open the data export modal.' },
    { q: 'Is my data safe if I close the browser?', a: 'Yes. All data is stored in your browser\'s IndexedDB and persists across sessions. Enable Persistent Storage from Permissions settings for extra protection.' },
    { q: 'How do I reset the order counter to #1?', a: 'Go to Order Records → Export/Data modal → Wipe Order Records. This clears all saved orders and resets the counter back to #1.' },
    { q: 'How do I track inventory?', a: 'Open the Inventory tool from the home screen. Add stock, log purchases from suppliers, and the system tracks current stock levels automatically.' },
    { q: 'Can I use this app offline?', a: 'Yes! ManSula BOS is a Progressive Web App (PWA) and works fully offline once loaded. All data stays on your device.' },
    { q: 'How do I install this as an app on my phone?', a: 'On Android (Chrome): tap the three dots → Install app. On iOS (Safari): tap Share → Add to Home Screen. The app will work just like a native app.' },
    { q: 'Can multiple people use the same account?', a: 'Currently, ManSula BOS stores data locally per browser/device. Multi-device sync and staff accounts are planned for a future update.' },
    { q: 'How do I change the currency?', a: 'Go to Settings → Billing & Region. Select your preferred currency from the available options. It applies instantly across the POS.' },
  ]
  return (
    <div className="hn-container">
      <div className="hn-header">
        <div className="hns-help-tabs">
          {[
            { id: 'faq', label: <><Icon.FAQ style={{ width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom' }} /> FAQ</> },
            { id: 'terms', label: <><Icon.Doc style={{ width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom' }} /> Terms of Use</> },
            { id: 'privacy', label: <><Icon.Lock style={{ width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom' }} /> Privacy Policy</> },
          ].map(t => (
            <button key={t.id} className={`hns-help-tab ${helpTab === t.id ? 'active' : ''}`} onClick={() => setHelpTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
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
              <button className="hns-support-list-btn whatsapp" onClick={() => { setShowSupportSheet(false); window.open('https://wa.me/919818013446', '_blank'); }}>
                <div className="icon"><Icon.Message style={{ width: 22, height: 22 }} /></div>
                <span>WhatsApp Support</span>
              </button>
              <button className="hns-support-list-btn call" onClick={() => { setShowSupportSheet(false); window.location.href = 'tel:+919818013446'; }}>
                <div className="icon"><Icon.Phone style={{ width: 22, height: 22 }} /></div>
                <span>Call Us</span>
              </button>
              <button className="hns-support-list-btn email" onClick={() => { setShowSupportSheet(false); window.location.href = 'mailto:mansula.rwt@gmail.com?subject=Support%20Request'; }}>
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
          <div className="hns-legal-section-title"><Icon.Doc style={{ width: 18, height: 18, marginRight: 8, display: 'inline-block', verticalAlign: 'text-bottom' }} /> Terms of Use</div>
          <div className="hns-legal-body">
            <p><strong>Last updated:</strong> {LEGAL_LAST_UPDATED}</p>
            <p>ManSula BOS is an offline-first Business Operating System (BOS) that helps businesses manage sales, inventory, customers, staff, analytics, reporting, and operations from a unified platform. By using ManSula BOS ("the BOS"), you agree to the following terms and conditions. Please read them carefully.</p>

            <div className="hns-legal-h">1. License Grant</div>
            <p>ManSula Technologies & ManSula DivLabs grant you a limited, non-exclusive, non-transferable, revocable license to use ManSula BOS in accordance with these Terms.</p>

            <div className="hns-legal-h">2. Acceptable Use</div>
            <p>You may use this BOS for lawful business purposes only. You are responsible for all data entered into the system, including product prices, customer records, and transaction history.</p>

            <div className="hns-legal-h">3. Accounts & Cloud Services</div>
            <p>Certain features may require an account, internet connectivity, cloud storage, or subscription. Users are responsible for maintaining the security of their credentials and account access.</p>

            <div className="hns-legal-h">4. Data Responsibility</div>
            <p>Users are responsible for maintaining accurate business records and backups. While ManSula BOS may provide backup, export, synchronization, or cloud-storage features, ManSula Technologies & ManSula DivLabs cannot guarantee recovery of lost, corrupted, or deleted data.</p>

            <div className="hns-legal-h">5. Reports & Analytics</div>
            <p>Reports, dashboards, analytics, forecasts, summaries, and recommendations are provided for informational purposes only and may contain inaccuracies. Users are solely responsible for validating information before making business decisions.</p>

            <div className="hns-legal-h">6. AI Features</div>
            <p>AI-generated content, recommendations, forecasts, summaries, and insights are provided as assistance tools only and should not be considered professional, legal, tax, accounting, or financial advice.</p>

            <div className="hns-legal-h">7. Financial Compliance</div>
            <p>Users remain solely responsible for maintaining financial records and complying with applicable tax, accounting, invoicing, labor, and regulatory requirements.</p>

            <div className="hns-legal-h">8. No Warranty</div>
            <p>The BOS is provided "as is" without any warranty, express or implied. ManSula Technologies & ManSula DivLabs do not guarantee uninterrupted or error-free operation. The BOS may be updated, modified, or discontinued at any time.</p>

            <div className="hns-legal-h">9. Limitation of Liability</div>
            <p>ManSula Technologies & ManSula DivLabs shall not be liable for any indirect, incidental, special, or consequential damages arising from your use or inability to use the BOS, including but not limited to business losses, data loss, or revenue loss.</p>

            <div className="hns-legal-h">10. Intellectual Property</div>
            <p>ManSula BOS and its UI, design, and code are the property of ManSula Technologies & ManSula DivLabs. You may not copy, redistribute, or reverse-engineer any part of the application without explicit written consent.</p>

            <div className="hns-legal-h">11. Subscriptions & Paid Features</div>
            <p>Certain features may require a paid subscription or one-time purchase. Pricing, billing terms, and feature availability may change from time to time.</p>

            <div className="hns-legal-h">12. Feature Availability</div>
            <p>Features may be modified, restricted, suspended, or discontinued at any time without prior notice.</p>

            <div className="hns-legal-h">13. Termination</div>
            <p>We reserve the right to suspend or terminate access to online services for violations of these Terms or misuse of the platform.</p>

            <div className="hns-legal-h">14. Changes to Terms</div>
            <p>We may update these Terms from time to time. Continued use of the BOS after updates constitutes your acceptance of the revised terms. Major changes will be communicated through an in-app notice.</p>

            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-surface-2)', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px', marginTop: 0 }}>For the complete, legally-binding document, please visit our official website.</p>
              <a href="https://mansulabos.netlify.app/terms.html" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>Read Full Terms &amp; Conditions ↗</a>
            </div>
          </div>
        </div>
      )}

      {helpTab === 'privacy' && (
        <div className="hns-legal-card">
          <div className="hns-legal-section-title"><Icon.Lock style={{ width: 18, height: 18, marginRight: 8, display: 'inline-block', verticalAlign: 'text-bottom' }} /> Privacy Policy</div>
          <div className="hns-legal-body">
            <p><strong>Last updated:</strong> {LEGAL_LAST_UPDATED}</p>
            <p>ManSula BOS is designed with privacy-first principles. Business data is stored locally on your device by default. Certain future features, such as cloud backup, synchronization, account services, or AI-powered functionality, may require data processing and will be clearly disclosed when enabled.</p>

            <div className="hns-legal-h"><Icon.Box style={{ width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom' }} /> Data Storage</div>
            <p>All data — including orders, customer records, inventory, products, and settings — is stored locally on <strong>your device</strong> using browser IndexedDB and localStorage by default.</p>

            <div className="hns-legal-h"><Icon.Cloud style={{ width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom' }} /> Cloud Services</div>
            <p>If cloud-based features are enabled, selected data may be securely transmitted and stored on servers operated by ManSula Technologies or trusted service providers for the purpose of providing those services.</p>

            <div className="hns-legal-h"><Icon.Sparkles style={{ width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom' }} /> AI Services</div>
            <p>Certain AI-powered features may process user-provided information to generate insights, recommendations, summaries, or forecasts. Data processing requirements will be disclosed before such features are used.</p>

            <div className="hns-legal-h"><Icon.User style={{ width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom' }} /> Account Information</div>
            <p>If account-based services are introduced, information such as name, email address, subscription details, and authentication data may be collected to provide access to those services.</p>

            <div className="hns-legal-h"><Icon.Database style={{ width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom' }} /> Diagnostics</div>
            <p>Optional diagnostic information may be collected to improve reliability, troubleshoot issues, and enhance application performance.</p>

            <div className="hns-legal-h"><Icon.Globe style={{ width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom' }} /> Data Processing Locations</div>
            <p>Cloud-hosted data may be processed or stored in regions outside the user's country depending on the infrastructure used to provide services.</p>

            <div className="hns-legal-h"><Icon.Lock style={{ width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom' }} /> Security & Retention</div>
            <p>Reasonable measures are taken to protect data; however, no storage system or transmission method can be guaranteed completely secure. Data stored through cloud services may be retained for as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements.</p>

            <div className="hns-legal-h"><Icon.Camera style={{ width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom' }} /> Camera Access</div>
            <p>If you grant camera access, it is used exclusively for barcode/QR scanning within the POS screen. No images are captured, stored, or transmitted. Camera access can be revoked from your browser's site settings at any time.</p>

            <div className="hns-legal-h"><Icon.Pencil style={{ width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom' }} /> Your Control</div>
            <p>You have full control over all your data. Use the "Reset App Data" option in Data & Storage settings to permanently and irreversibly delete all data from your device at any time.</p>

            <div className="hns-legal-h"><Icon.Mailbox style={{ width: 16, height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom' }} /> Contact</div>
            <p>For privacy-related questions or concerns, please reach out to ManSula Support through the app's official channels.</p>

            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-surface-2)', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px', marginTop: 0 }}>For the complete, legally-binding privacy details, please visit our official website.</p>
              <a href="https://mansulabos.netlify.app/privacy.html" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>Read Full Privacy Policy ↗</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Home({
  onLaunch,
  theme, onToggleTheme,
  currency, onCurrency, currencies,
  onboardingStep, setOnboardingStep
}) {
  const [time, setTime] = useState(new Date())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [businessLogo, setBusinessLogo] = useState('')
  const { alert: showAlert, confirm: showConfirm } = useAlert()

  const [toolsOrder, setToolsOrder] = useState([])
  const [orderedTools, setOrderedTools] = useState(TOOLS)

  useEffect(() => {
    dbGet('mn-tools-order').then(savedOrder => {
      if (savedOrder && Array.isArray(savedOrder) && savedOrder.length > 0) {
        setToolsOrder(savedOrder)
      } else {
        setToolsOrder(TOOLS.map(t => t.id))
      }
    })
  }, [])

  useEffect(() => {
    if (toolsOrder.length === 0) return
    const ordered = toolsOrder.map(id => TOOLS.find(t => t.id === id)).filter(Boolean)
    TOOLS.forEach(t => {
      if (!ordered.some(ot => ot.id === t.id)) ordered.push(t)
    })
    setOrderedTools(ordered)
  }, [toolsOrder])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 2 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 0, tolerance: 5 } })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setOrderedTools(items => {
        const oldIndex = items.findIndex(t => t.id === active.id)
        const newIndex = items.findIndex(t => t.id === over.id)
        const newArray = arrayMove(items, oldIndex, newIndex)
        dbSet('mn-tools-order', newArray.map(t => t.id))
        return newArray
      })
    }
  }

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000)
    dbGet('mn-business').then(b => {
      if (b && b.name) setBusinessName(b.name)
      if (b && b.logo) setBusinessLogo(b.logo)
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

  const handleLaunch = (toolId) => {
    onLaunch(toolId)
  }

  return (
    <div className="hn-root">
      {onboardingStep === 'spotlight-business' && (
        <div className="mn-spotlight-overlay">
          <button className="mn-skip-tutorial-btn" onClick={() => setOnboardingStep(null)}>Skip Tutorial</button>
        </div>
      )}
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
              <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <div>
            <div className="hn-brand-main">ManSula</div>
            <div className="hn-brand-sub">Business OS</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>          <button className="hn-settings-btn" onClick={() => setSettingsOpen(true)} aria-label="Settings">
          <Icon.Settings />
        </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="hn-hero">
        <div className="hn-hero-orb hn-hero-orb-1" />
        <div className="hn-hero-orb hn-hero-orb-2" />
        <div className="hn-hero-content">
          <div className="hn-time-pill">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            {timeStr} · {dateStr}
          </div>
          <h1 className="hn-greeting">{greeting}{businessName ? `, ${businessName}` : ''}{businessLogo ? ` ${businessLogo}` : ''}</h1>
          <p className="hn-tagline">Your business hub is ready</p>
        </div>
      </div>

      {/* ── POS Launch Card ── */}
      <div className="hn-body">
        <div
          className="hn-pos-card"
          onClick={() => handleLaunch('pos')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && handleLaunch('pos')}
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
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={orderedTools.map(t => t.id)} strategy={rectSortingStrategy}>
                {orderedTools.map(tool => (
                  <SortableToolCard
                    key={tool.id}
                    tool={tool}
                    onLaunch={handleLaunch}
                    onboardingStep={onboardingStep}
                    setOnboardingStep={setOnboardingStep}
                  />
                ))}
              </SortableContext>
            </DndContext>
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
          <div className="hn-footer-text" style={{ lineHeight: '1.5' }}>
            ManSula BOS · {APP_VERSION}<br />
            {ORG?.copyright || `© 2024 - ${new Date().getFullYear()} ManSula Technologies. All rights reserved.`}
          </div>
        </div>

        <SeoFooter />
      </div>
    </div>
  )
}

function SeoFooter() {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="hn-seo-footer" style={{ marginTop: '40px', padding: '20px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.6', borderTop: '1px solid var(--border-color)' }}>
      <div 
        style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '4px 12px', borderRadius: '20px', background: 'transparent' }} 
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ fontWeight: 600 }}>About ManSula BOS</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      
      {expanded && (
        <div style={{ marginTop: '16px', opacity: 1, transition: 'opacity 0.3s' }}>
          <p>
            <strong>ManSula BOS</strong> is a premium <strong>Business Operating System</strong> and <strong>POS Software</strong> designed for modern merchants. Whether you need reliable <strong>Inventory Management Software</strong> or fast <strong>Billing Software</strong>, ManSula provides a comprehensive <strong>Business Management Software</strong> suite.
          </p>
          <p style={{ marginTop: '8px' }}>
            Built as an <strong>Offline POS Software</strong>, it works seamlessly without internet. Perfect as a <strong>Retail Management System</strong> or a <strong>Restaurant POS</strong>. Take control of your operations with advanced <strong>Inventory Tracking</strong>, seamless <strong>Customer Management</strong>, and powerful <strong>Business Analytics</strong>.
          </p>
        </div>
      )}
    </div>
  )
}

function SettingsThemeModal({ onClose, onChangeTheme, currentTheme }) {
  return (
    <div className="mn-theme-modal-overlay" style={{ zIndex: 999999 }} onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="mn-theme-modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ color: 'var(--text-primary)' }}>Choose Your Theme</h2>
        <div className="mn-theme-options">
          <button
            type="button"
            className={`mn-theme-btn ${currentTheme === 'light' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onChangeTheme('light'); }}
          >
            <div className="mn-theme-preview light-preview">
              <div className="p-header" />
              <div className="p-card" />
              <div className="p-card" />
            </div>
            <span style={{ color: 'var(--text-primary)' }}>Light</span>
          </button>
          <button
            type="button"
            className={`mn-theme-btn ${currentTheme === 'dark' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onChangeTheme('dark'); }}
          >
            <div className="mn-theme-preview dark-preview">
              <div className="p-header" />
              <div className="p-card" />
              <div className="p-card" />
            </div>
            <span style={{ color: 'var(--text-primary)' }}>Dark</span>
          </button>
        </div>
        <div style={{ marginTop: '24px' }}>
          <button 
            type="button"
            className="bp-btn-primary" 
            style={{ width: '100%', padding: '14px', fontSize: '1.05rem', borderRadius: '12px' }} 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
