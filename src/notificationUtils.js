export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser.')
    return false
  }
  
  if (Notification.permission === 'granted') {
    return true
  }
  
  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (err) {
    console.error('Failed to request notification permission:', err)
    return false
  }
}

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function sendLocalNotification(title, options = {}) {
  if (getNotificationPermission() !== 'granted') return false

  const defaultOptions = {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    ...options
  }

  try {
    // Try to show via Service Worker for best mobile OS integration
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      if (reg && reg.showNotification) {
        await reg.showNotification(title, defaultOptions)
        return true
      }
    }
    
    // Fallback to standard Web Notification API for desktop
    new Notification(title, defaultOptions)
    return true
  } catch (err) {
    console.error('Failed to send local notification:', err)
    return false
  }
}
