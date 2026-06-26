import React, { useRef, useState, useEffect } from 'react'
import { dbClearAll, exportUltimateBackup, restoreUltimateBackup } from './db.js'
import { useBackButton } from './useBackButton.js'
import { useAlert } from './AlertDialog.jsx'
import { requestNotificationPermission, getNotificationPermission, sendLocalNotification } from './notificationUtils.js'

// ── Icons ──────────────────────────────────────────────────────────────────────
const Ic = {
  ChevL:    (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  Shield:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Download: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Upload:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Trash:    (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Check:    (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Alert:    (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Bell:     (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Clock:    (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Zap:      (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
}

// ── Small reusable row-style action item ───────────────────────────────────────
function ActionRow({ icon, iconBg, iconColor, title, desc, children, danger }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      background: 'var(--bg-surface)',
      borderRadius: 14,
      border: `1px solid ${danger ? 'rgba(239,68,68,0.18)' : 'var(--border-color)'}`,
      transition: 'border-color 0.18s',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: iconBg || 'rgba(99,102,241,0.1)',
        color: iconColor || 'var(--brand-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {React.cloneElement(icon, { style: { width: 17, height: 17 } })}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.82rem', fontWeight: 700,
          color: danger ? '#ef4444' : 'var(--text-primary)',
          marginBottom: 1,
        }}>{title}</div>
        <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{desc}</div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

// ── Pill button ────────────────────────────────────────────────────────────────
function Pill({ onClick, disabled, color = '#6366f1', outline, children, small }) {
  const pad = small ? '6px 12px' : '7px 14px'
  const fs = small ? '0.72rem' : '0.76rem'
  if (outline) {
    return (
      <button onClick={onClick} disabled={disabled} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: pad, borderRadius: 100, border: `1.5px solid ${color}`,
        background: `${color}12`, color, fontWeight: 700, fontSize: fs,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}>{children}</button>
    )
  }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: pad, borderRadius: 100, border: 'none',
      background: color, color: '#fff', fontWeight: 700, fontSize: fs,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s', whiteSpace: 'nowrap',
      boxShadow: `0 4px 14px ${color}40`,
    }}>{children}</button>
  )
}

// ── Section Label ──────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'var(--text-muted)', paddingLeft: 2,
    }}>{children}</div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function BackupRestore({ onClose }) {
  useBackButton(onClose)
  const { alert: showAlert, confirm: showConfirm } = useAlert()
  const [resetStep, setResetStep] = useState(0)
  const [notifPerm, setNotifPerm] = useState(getNotificationPermission())
  const fileInputRef = useRef(null)

  const rawLastBackup = localStorage.getItem('mn-last-backup-date')
  // rawLastBackup is stored as new Date().toDateString() — a string like "Thu Jun 26 2025"
  const isBackedUpToday = rawLastBackup === new Date().toDateString()

  const lastBackupDisplay = rawLastBackup
    ? (() => {
        const d = new Date(rawLastBackup)
        if (isNaN(d.getTime())) return rawLastBackup
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      })()
    : null

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission()
    setNotifPerm(getNotificationPermission())
    if (!granted) showAlert('Notification permission denied or blocked by browser settings.', { type: 'warning' })
  }

  const handleBackupExport = async () => {
    const blob = await exportUltimateBackup()
    if (!blob) { showAlert('Failed to export backup.', { type: 'danger' }); return }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const d = new Date()
    const dStr = String(d.getDate()).padStart(2, '0') + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + d.getFullYear()
    a.download = `MansulaBOS_FullBackup_${dStr}.msbos`
    a.click()
    URL.revokeObjectURL(url)
    localStorage.setItem('mn-last-backup-date', new Date().toDateString())
    showAlert('Backup exported successfully!', { type: 'success' })
  }

  const handleBackupRestore = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const ok = await showConfirm(
      'Restoring will COMPLETELY OVERWRITE all your current data. This cannot be undone.',
      { title: 'Restore Backup?', type: 'danger', confirmText: 'Yes, Overwrite Everything', cancelText: 'Cancel', confirmWord: 'RESTORE' }
    )
    if (!ok) return
    setResetStep(2)
    const success = await restoreUltimateBackup(file)
    if (success) { setTimeout(() => window.location.reload(), 800) }
    else { setResetStep(0); showAlert('Failed to restore. Invalid or corrupted file.', { type: 'danger' }) }
  }

  const handleWipeData = async () => {
    const ok = await showConfirm(
      'This will permanently clear all your business data, products, and settings.',
      { title: 'Reset App Data?', type: 'danger', confirmText: 'Yes, Reset Everything', cancelText: 'Cancel', confirmWord: 'RESET' }
    )
    if (!ok) return
    setResetStep(2)
    await dbClearAll()
    localStorage.clear()
    setTimeout(() => window.location.reload(), 1200)
  }

  const statusGreen = isBackedUpToday
  const statusBg = statusGreen
    ? 'linear-gradient(130deg, #059669 0%, #10b981 100%)'
    : 'linear-gradient(130deg, #b45309 0%, #f59e0b 100%)'
  const statusGlow = statusGreen
    ? '0 8px 24px rgba(16,185,129,0.28)'
    : '0 8px 24px rgba(245,158,11,0.28)'

  return (
    <div className="bp-root">

      {/* ── Header ── */}
      <header className="or-header">
        <button className="or-back-btn" onClick={onClose} disabled={resetStep > 0}>
          <Ic.ChevL style={{ width: 20, height: 20 }} />
        </button>
        <div className="or-header-title">
          <Ic.Shield style={{ width: 17, height: 17 }} /> Backup &amp; Restore
        </div>
      </header>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Status Card ── */}
        <div style={{
          background: statusBg,
          borderRadius: 18,
          padding: '16px 18px',
          color: '#fff',
          boxShadow: statusGlow,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* decorative bg icon */}
          <div style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.08 }}>
            <Ic.Shield style={{ width: 90, height: 90 }} />
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* status badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: '#fff',
                boxShadow: statusGreen ? '0 0 0 3px rgba(255,255,255,0.3)' : '0 0 0 3px rgba(255,255,255,0.3)',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.9 }}>
                {statusGreen ? 'System Secure' : 'Action Required'}
              </span>
            </div>

            <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 10, lineHeight: 1.2 }}>
              {statusGreen ? 'Your data is backed up today ✓' : 'Backup your data now'}
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(8px)',
                padding: '5px 10px', borderRadius: 20,
                fontSize: '0.73rem', fontWeight: 600,
              }}>
                <Ic.Clock style={{ width: 12, height: 12 }} />
                {lastBackupDisplay ? `Last: ${lastBackupDisplay}` : 'Never backed up'}
              </div>
              {statusGreen && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(8px)',
                  padding: '5px 10px', borderRadius: 20,
                  fontSize: '0.73rem', fontWeight: 600,
                }}>
                  <Ic.Check style={{ width: 12, height: 12 }} />
                  Backed up today
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── System Preferences ── */}
        <SectionLabel>System Preferences</SectionLabel>

        <ActionRow
          icon={<Ic.Bell />}
          iconBg="rgba(99,102,241,0.1)"
          iconColor="var(--brand-primary)"
          title="Push Notifications"
          desc="Daily backup reminders and app update alerts."
        >
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {notifPerm === 'granted' ? (
              <>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: '0.71rem', fontWeight: 700,
                  color: '#10b981', padding: '4px 10px',
                  border: '1.5px solid rgba(16,185,129,0.35)',
                  borderRadius: 100, background: 'rgba(16,185,129,0.08)',
                }}>
                  <Ic.Check style={{ width: 11, height: 11 }} /> On
                </span>
                <Pill small outline color="#6366f1" onClick={() => sendLocalNotification('Mansula BOS', { body: '🔔 Notifications are working perfectly!' })} disabled={resetStep > 0}>
                  Test
                </Pill>
              </>
            ) : (
              <Pill small color="#6366f1" onClick={handleEnableNotifications} disabled={resetStep > 0}>
                Enable
              </Pill>
            )}
          </div>
        </ActionRow>

        {/* ── Data Operations ── */}
        <SectionLabel>Data Operations</SectionLabel>

        {/* Create Backup */}
        <ActionRow
          icon={<Ic.Download />}
          iconBg="rgba(99,102,241,0.1)"
          iconColor="#6366f1"
          title="Create Full Backup"
          desc={<>Downloads a <code style={{ fontFamily: 'monospace', fontSize: '0.9em', background: 'var(--bg-surface-2)', padding: '1px 4px', borderRadius: 4, color: 'var(--brand-primary)' }}>.msbos</code> snapshot of your entire system.</>}
        >
          <Pill color="#6366f1" onClick={handleBackupExport} disabled={resetStep > 0}>
            <Ic.Download style={{ width: 13, height: 13 }} /> Download
          </Pill>
        </ActionRow>

        {/* Restore Backup */}
        <ActionRow
          icon={<Ic.Upload />}
          iconBg="rgba(16,185,129,0.1)"
          iconColor="#10b981"
          title="Restore from Backup"
          desc={<>Upload a <code style={{ fontFamily: 'monospace', fontSize: '0.9em', background: 'var(--bg-surface-2)', padding: '1px 4px', borderRadius: 4, color: '#10b981' }}>.msbos</code> or <code style={{ fontFamily: 'monospace', fontSize: '0.9em', background: 'var(--bg-surface-2)', padding: '1px 4px', borderRadius: 4, color: '#10b981' }}>.json</code> file to restore all data.</>}
        >
          <input type="file" accept=".json,.msbos" style={{ display: 'none' }} ref={fileInputRef} onChange={handleBackupRestore} />
          <Pill outline color="#10b981" onClick={() => fileInputRef.current?.click()} disabled={resetStep > 0}>
            <Ic.Upload style={{ width: 13, height: 13 }} /> Select
          </Pill>
        </ActionRow>

        {/* ── Danger Zone ── */}
        <SectionLabel>Danger Zone</SectionLabel>

        <ActionRow
          danger
          icon={<Ic.Trash />}
          iconBg="rgba(239,68,68,0.1)"
          iconColor="#ef4444"
          title="Reset All Data"
          desc="Permanently delete all business data, products, and settings."
        >
          <Pill outline color="#ef4444" onClick={handleWipeData} disabled={resetStep > 0}>
            <Ic.Alert style={{ width: 12, height: 12 }} /> Reset
          </Pill>
        </ActionRow>

        {/* ── Tip ── */}
        <div style={{
          display: 'flex', gap: 10, padding: '10px 12px',
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: 12, alignItems: 'flex-start',
        }}>
          <Ic.Zap style={{ width: 14, height: 14, color: 'var(--brand-primary)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Pro Tip:</strong> Take a full backup before switching devices or clearing browser storage. Your <code style={{ fontFamily: 'monospace', fontSize: '0.9em', background: 'var(--bg-surface-2)', padding: '1px 4px', borderRadius: 4, color: 'var(--brand-primary)' }}>.msbos</code> file contains everything — products, orders, settings, customers, and inventory.
          </div>
        </div>

      </div>

      {/* ── Processing overlay ── */}
      {resetStep === 2 && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          zIndex: 10000, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: '#fff', gap: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.2)',
            borderTopColor: '#fff',
            animation: 'spin 0.7s linear infinite',
          }} />
          <div style={{ fontSize: '1rem', fontWeight: 700 }}>Processing… please wait</div>
        </div>
      )}
    </div>
  )
}
