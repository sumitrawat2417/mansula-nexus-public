import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered')
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!needRefresh && !offlineReady) {
    return null
  }

  return (
    <div className="mn-reload-prompt">
      <div className="mn-reload-header">
        <div className="mn-reload-icon">
          {needRefresh ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.13 15.57a10 10 0 1 0 4.44-12.83l-3.3 3.3"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          )}
        </div>
        <div className="mn-reload-text">
          {needRefresh ? (
            <>
              <strong>Nexus 1.2.0 available</strong>
              <p>Install now for the latest improvements.</p>
            </>
          ) : (
            <>
              <strong>Ready for Offline</strong>
              <p>The app is cached for offline use.</p>
            </>
          )}
        </div>
      </div>
      <div className="mn-reload-actions">
        {needRefresh && (
          <button className="mn-reload-btn install" onClick={() => updateServiceWorker(true)}>
            Update Now
          </button>
        )}
        <button className="mn-reload-btn close" onClick={close}>
          {needRefresh ? 'Not Now' : 'Got it'}
        </button>
      </div>
    </div>
  )
}
