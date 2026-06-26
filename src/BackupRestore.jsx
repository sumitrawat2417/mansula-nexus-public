import React, { useRef, useState, useEffect } from 'react'
import { dbClearAll, exportUltimateBackup, restoreUltimateBackup } from './db.js'
import { useBackButton } from './useBackButton.js'
import { useAlert } from './AlertDialog.jsx'
import { requestNotificationPermission, getNotificationPermission, sendLocalNotification } from './notificationUtils.js'

const Ic = {
  Close: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
  Download: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Upload: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Trash: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>,
  Check: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  Shield: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Bell: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
}

export default function BackupRestore({ onClose }) {
  useBackButton(onClose)
  const { alert: showAlert, confirm: showConfirm } = useAlert()
  const [resetStep, setResetStep] = useState(0)
  const [notifPerm, setNotifPerm] = useState(getNotificationPermission())
  const fileInputRef = useRef(null)
  
  const lastBackup = localStorage.getItem('mn-last-backup-date')

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission()
    setNotifPerm(getNotificationPermission())
    if (granted) {
      showAlert('Push notifications enabled successfully.', { type: 'success' })
    } else {
      showAlert('Notification permission denied or blocked by browser settings.', { type: 'warning' })
    }
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
    
    // Update last backup date
    const today = new Date().toDateString()
    localStorage.setItem('mn-last-backup-date', today)
    
    showAlert('Backup exported successfully.', { type: 'success' })
  }

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

  const handleWipeData = async () => {
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

  return (
    <div className="bp-root">
      {/* Header */}
      <header className="bp-header">
        <div className="bp-header-title">
          <div className="bp-header-main">Backup & Restore</div>
        </div>
        <button className="bp-back-btn" onClick={onClose} disabled={resetStep > 0}>
          <Ic.Close />
        </button>
      </header>

      <div className="bp-body">
        {/* Status Panel */}
          <div style={{ background: 'linear-gradient(135deg, #6c3de5, #8b5cf6)', borderRadius: '20px', padding: '24px', color: '#fff', boxShadow: '0 12px 32px rgba(108, 61, 229, 0.25)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1, transform: 'scale(3)' }}><Ic.Shield /></div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>System Status</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
                {lastBackup === new Date().toDateString() ? 'Data is secure today.' : 'Backup recommended.'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '10px', width: 'fit-content', backdropFilter: 'blur(10px)' }}>
                <span style={{ width: 16, height: 16, display: 'flex' }}><Ic.Check /></span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Last Backup: {lastBackup ? new Date(lastBackup).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '8px', color: 'var(--text-primary)' }}>System Preferences</div>

          {/* Notifications Card */}
          <div className="bp-backup-card" style={{ marginBottom: 0 }}>
            <div className="bp-backup-card-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--brand-primary)' }}>
              <Ic.Bell />
            </div>
            <div className="bp-backup-card-info">
              <div className="bp-backup-card-title">Push Notifications</div>
              <div className="bp-backup-card-desc">Get native reminders for daily backups and when new app updates are available.</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button 
                className={notifPerm === 'granted' ? "bp-btn-outline" : "bp-btn-primary"} 
                onClick={handleEnableNotifications}
                disabled={notifPerm === 'granted' || resetStep > 0}
                style={notifPerm === 'granted' ? { flex: 1, color: '#10b981', borderColor: '#10b981', background: 'rgba(16, 185, 129, 0.08)', cursor: 'default' } : { flex: 1 }}
              >
                {notifPerm === 'granted' ? 'Enabled' : 'Enable Notifications'}
              </button>
              {notifPerm === 'granted' && (
                <button 
                  className="bp-btn-ghost" 
                  onClick={() => sendLocalNotification('Test Notification', { body: 'Notifications are working perfectly!' })}
                  disabled={resetStep > 0}
                >
                  Test
                </button>
              )}
            </div>
          </div>

          <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '8px', color: 'var(--text-primary)' }}>Data Operations</div>

          {/* Export Card */}
          <div className="bp-backup-card bp-backup-export" style={{ marginBottom: 0 }}>
            <div className="bp-backup-card-icon"><Ic.Download /></div>
            <div className="bp-backup-card-info">
              <div className="bp-backup-card-title">Create Ultimate Backup</div>
              <div className="bp-backup-card-desc">Downloads a full snapshot <code>.msbos</code> file of your entire system.</div>
            </div>
            <button 
              className="bp-btn-primary" 
              onClick={handleBackupExport}
              disabled={resetStep > 0}
            >
              <Ic.Download /> Download Now
            </button>
          </div>

          {/* Restore Card */}
          <div className="bp-backup-card bp-backup-import" style={{ marginBottom: 0 }}>
            <div className="bp-backup-card-icon"><Ic.Upload /></div>
            <div className="bp-backup-card-info">
              <div className="bp-backup-card-title">Restore Ultimate Backup</div>
              <div className="bp-backup-card-desc">Upload a previously saved <code>.msbos</code> or <code>.json</code> file to overwrite and restore your data.</div>
            </div>
            <input type="file" accept=".json,.msbos" style={{ display: 'none' }} ref={fileInputRef} onChange={handleBackupRestore} />
            <button 
              className="bp-btn-outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={resetStep > 0}
            >
              <Ic.Upload /> Select Backup File
            </button>
          </div>

          {/* Wipe Card */}
          <div className="bp-backup-card" style={{ marginBottom: 0, borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239,68,68,0.02)' }}>
            <div className="bp-backup-card-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}><Ic.Trash /></div>
            <div className="bp-backup-card-info">
              <div className="bp-backup-card-title" style={{ color: '#ef4444' }}>Danger Zone</div>
              <div className="bp-backup-card-desc">Permanently delete all your business data, products, and settings. Cannot be undone.</div>
            </div>
            <button 
              className="bp-btn-outline" 
              onClick={handleWipeData}
              disabled={resetStep > 0}
              style={{ color: '#ef4444', borderColor: '#ef4444', background: 'rgba(239, 68, 68, 0.08)' }}
            >
              <Ic.Trash style={{ width: 14, height: 14 }} /> Reset All Data
            </button>
          </div>

      </div>
      
      {resetStep === 2 && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>
          Processing... Please wait.
        </div>
      )}
    </div>
  )
}
