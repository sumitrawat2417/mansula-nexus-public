// ── Mansula Nexus — IndexedDB persistence layer ──
// Simple promise-based wrapper around IndexedDB.
// Falls back gracefully if IDB is unavailable.

const DB_NAME = 'mansula-nexus'
const DB_VERSION = 1
const STORE = 'kv'

let _db = null

function openDB() {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE, { keyPath: 'k' })
    }
    req.onsuccess = (e) => {
      _db = e.target.result
      resolve(_db)
    }
    req.onerror = () => reject(req.error)
  })
}

export async function dbGet(key) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(key)
      req.onsuccess = () => resolve(req.result?.v ?? null)
      req.onerror = () => resolve(null)
    })
  } catch {
    // Fallback: try localStorage
    try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
  }
}

export async function dbSet(key, value) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put({ k: key, v: value })
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { }
  }
}

export async function dbDelete(key) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch { }
}

export async function dbClearAll() {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch { }
}
