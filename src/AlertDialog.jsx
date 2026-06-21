import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

// ══════════════════════════════════════════════════════════════════
// ALERT DIALOG SYSTEM — Premium in-app replacement for alert/confirm
// ══════════════════════════════════════════════════════════════════

const AlertContext = createContext(null)

const ICONS = {
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  danger: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
}

const COLORS = {
  info:    { icon: '#6366f1', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.2)',  confirm: '#6366f1', confirmHover: '#4f46e5' },
  success: { icon: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)',  confirm: '#10b981', confirmHover: '#059669' },
  warning: { icon: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)',  confirm: '#f59e0b', confirmHover: '#d97706' },
  danger:  { icon: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',   confirm: '#ef4444', confirmHover: '#dc2626' },
}

function AlertDialogModal({ dialog, onResolve }) {
  const confirmBtnRef = useRef(null)
  const cancelBtnRef = useRef(null)
  const { type = 'info', title, message, confirmText = 'OK', cancelText = 'Cancel', isConfirm } = dialog
  const c = COLORS[type] || COLORS.info

  useEffect(() => {
    // Focus confirm button after animation
    const t = setTimeout(() => {
      if (isConfirm && cancelBtnRef.current) cancelBtnRef.current.focus()
      else if (confirmBtnRef.current) confirmBtnRef.current.focus()
    }, 50)
    return () => clearTimeout(t)
  }, [isConfirm])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { if (isConfirm) onResolve(false) }
      if (e.key === 'Enter') { if (!isConfirm) onResolve(true) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isConfirm, onResolve])

  return (
    <div className="ald-overlay" onClick={isConfirm ? undefined : () => onResolve(true)}>
      <div className="ald-card" onClick={e => e.stopPropagation()}>
        {/* Icon */}
        <div className="ald-icon-wrap" style={{ background: c.bg, border: `1.5px solid ${c.border}`, color: c.icon }}>
          {ICONS[type]}
        </div>

        {/* Content */}
        <div className="ald-content">
          {title && <div className="ald-title">{title}</div>}
          <div className="ald-message">{message}</div>
        </div>

        {/* Actions */}
        <div className={`ald-actions ${isConfirm ? 'ald-actions-row' : 'ald-actions-center'}`}>
          {isConfirm && (
            <button
              ref={cancelBtnRef}
              className="ald-btn ald-btn-ghost"
              onClick={() => onResolve(false)}
            >
              {cancelText}
            </button>
          )}
          <button
            ref={confirmBtnRef}
            className="ald-btn ald-btn-confirm"
            style={{ background: c.confirm }}
            onMouseOver={e => e.currentTarget.style.background = c.confirmHover}
            onMouseOut={e => e.currentTarget.style.background = c.confirm}
            onClick={() => onResolve(true)}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AlertProvider({ children }) {
  const [dialogs, setDialogs] = useState([])

  const show = useCallback((dialog) => {
    return new Promise((resolve) => {
      const id = Date.now() + Math.random()
      setDialogs(prev => [...prev, { ...dialog, id, resolve }])
    })
  }, [])

  const handleResolve = useCallback((id, value) => {
    setDialogs(prev => prev.filter(d => d.id !== id))
    // Find the dialog and call its resolve
    setDialogs(prev => {
      const dialog = prev.find(d => d.id === id)
      if (dialog) dialog.resolve(value)
      return prev.filter(d => d.id !== id)
    })
  }, [])

  // Separate resolve logic to avoid state update issues
  const resolveMap = useRef({})
  
  const show2 = useCallback((dialog) => {
    return new Promise((resolve) => {
      const id = Date.now() + Math.random()
      resolveMap.current[id] = resolve
      setDialogs(prev => [...prev, { ...dialog, id }])
    })
  }, [])

  const handleResolve2 = useCallback((id, value) => {
    const resolver = resolveMap.current[id]
    if (resolver) {
      delete resolveMap.current[id]
      resolver(value)
    }
    setDialogs(prev => prev.filter(d => d.id !== id))
  }, [])

  const alert = useCallback((message, { title, type = 'info', confirmText = 'Got it' } = {}) => {
    return show2({ message, title, type, confirmText, isConfirm: false })
  }, [show2])

  const confirm = useCallback((message, { title, type = 'danger', confirmText = 'Confirm', cancelText = 'Cancel' } = {}) => {
    return show2({ message, title, type, confirmText, cancelText, isConfirm: true })
  }, [show2])

  return (
    <AlertContext.Provider value={{ alert, confirm }}>
      {children}
      {dialogs.map(dialog => (
        <AlertDialogModal
          key={dialog.id}
          dialog={dialog}
          onResolve={(value) => handleResolve2(dialog.id, value)}
        />
      ))}
    </AlertContext.Provider>
  )
}

export function useAlert() {
  const ctx = useContext(AlertContext)
  if (!ctx) throw new Error('useAlert must be used within AlertProvider')
  return ctx
}
