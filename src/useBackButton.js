import { useEffect } from 'react'

const activeModals = []

export function useBackButton(onBack) {
  useEffect(() => {
    if (!onBack) return

    const modalId = Math.random().toString(36).substr(2, 9)
    window.history.pushState({ modalId }, '')
    activeModals.push(modalId)

    const handlePopState = (e) => {
      if (e.__mn_handled) return
      // Only trigger onBack if this modal is at the top of the stack
      if (activeModals[activeModals.length - 1] === modalId) {
        e.__mn_handled = true
        activeModals.pop()
        onBack()
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      
      // Remove from active tracking if it wasn't popped by the back button
      const idx = activeModals.indexOf(modalId)
      if (idx > -1) {
        activeModals.splice(idx, 1)
      }
    }
  }, [onBack])
}
