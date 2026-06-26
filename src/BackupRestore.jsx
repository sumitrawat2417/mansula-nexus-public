import { useState, useRef, useEffect } from 'react'
import { useBackButton } from './useBackButton.js'
import { dbClearAll, exportUltimateBackup, restoreUltimateBackup } from './db.js'
import { useAlert } from './AlertDialog.jsx'

const Ic = {
  Close: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Upload: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  Shield: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
}

export default function BackupRestore({ onClose }) {
  useBackButton(onClose)
  const { showAlert, showConfirm } = useAlert()
  const [resetStep, setResetStep] = useState(0)
  const fileInputRef = useRef(null)
  
  const lastBackup = localStorage.getItem('mn-last-backup-date')

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
    <div className="pos-layout" style={{ background: 'var(--bg-main)' }}>
      {/* Header */}
      <div className="pos-header" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--brand-primary)', display: 'flex' }}><Ic.Shield /></span> 
          Backup & Restore
        </h2>
        <button className="bp-btn-outline" onClick={onClose} disabled={resetStep > 0} style={{ padding: '8px', border: 'none' }}>
          <Ic.Close />
        </button>
      </div>

      <div className="pos-scrollable" style={{ padding: '24px 16px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Status Panel */}
          <div style={{ background: 'linear-gradient(135deg, #6c3de5, #8b5cf6)', borderRadius: '20px', padding: '24px', color: '#fff', boxShadow: '0 12px 32px rgba(108, 61, 229, 0.25)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1, transform: 'scale(3)' }}><Ic.Shield /></div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>System Status</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '16px' }}>
                {lastBackup === new Date().toDateString() ? 'Data is secure today.' : 'Backup recommended.'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '10px', width: 'fit-content', backdropFilter: 'blur(10px)' }}>
                <span style={{ width: 16, height: 16 }}><Ic.Check /></span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Last Backup: {lastBackup ? new Date(lastBackup).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '10px' }}>Data Operations</div>

          {/* Export Card */}
          <div className="bp-backup-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(108, 61, 229, 0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ width: 24, height: 24, display: 'flex' }}><Ic.Download /></span>
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: 'var(--text-primary)' }}>Create Backup (.msbos)</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Download a complete snapshot of your products, settings, and order history.</p>
              </div>
            </div>
            <button 
              className="bp-btn-primary" 
              onClick={handleBackupExport}
              disabled={resetStep > 0}
              style={{ padding: '14px', borderRadius: '12px', fontSize: '0.95rem', display: 'flex', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(108, 61, 229, 0.3)' }}
            >
              <Ic.Download style={{ width: 18, height: 18 }} /> Download Backup Now
            </button>
          </div>

          {/* Restore Card */}
          <div className="bp-backup-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ width: 24, height: 24, display: 'flex' }}><Ic.Upload /></span>
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: 'var(--text-primary)' }}>Restore Backup</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Upload a previously saved `.msbos` or `.json` backup file to restore your data.</p>
              </div>
            </div>
            <input type="file" accept=".json,.msbos" style={{ display: 'none' }} ref={fileInputRef} onChange={handleBackupRestore} />
            <button 
              className="bp-btn-outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={resetStep > 0}
              style={{ padding: '14px', borderRadius: '12px', fontSize: '0.95rem', display: 'flex', justifyContent: 'center', gap: '8px', borderColor: '#10b981', color: '#10b981' }}
            >
              <Ic.Upload style={{ width: 18, height: 18 }} /> Select Backup File
            </button>
          </div>

          {/* Wipe Card */}
          <div className="bp-backup-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ width: 24, height: 24, display: 'flex' }}><Ic.Trash /></span>
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: '#ef4444' }}>Danger Zone</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Permanently delete all your business data, products, and settings from this device.</p>
              </div>
            </div>
            <button 
              className="bp-btn-danger" 
              onClick={handleWipeData}
              disabled={resetStep > 0}
              style={{ padding: '14px', borderRadius: '12px', fontSize: '0.95rem', display: 'flex', justifyContent: 'center', gap: '8px', background: 'transparent', borderColor: '#ef4444', color: '#ef4444' }}
            >
              <Ic.Trash style={{ width: 18, height: 18 }} /> Reset All Data
            </button>
          </div>

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
