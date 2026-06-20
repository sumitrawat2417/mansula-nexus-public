// ── Mansula Nexus — IndexedDB persistence layer v3 ──
// - 'kv' store: generic key-value (settings, products, suppliers, etc.)
// - 'orders' store: completed order records, indexed by date
// - 'inventory' store: live stock items, indexed by productId
// - 'purchases' store: supplier purchase logs, indexed by purchasedAt

const DB_NAME = 'mansula-nexus'
const DB_VERSION = 4

let _db = null

function openDB() {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      // v1: kv store
      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv', { keyPath: 'k' })
      }
      // v2: orders store — keyed by orderId, indexed by completedAt (timestamp)
      if (!db.objectStoreNames.contains('orders')) {
        const store = db.createObjectStore('orders', { keyPath: 'orderId' })
        store.createIndex('completedAt', 'completedAt', { unique: false })
        store.createIndex('monthKey', 'monthKey', { unique: false })
      }
      // v3: inventory store — keyed by id (matches menu item id or standalone)
      if (!db.objectStoreNames.contains('inventory')) {
        const invStore = db.createObjectStore('inventory', { keyPath: 'id' })
        invStore.createIndex('category', 'category', { unique: false })
        invStore.createIndex('lowStock', 'isLowStock', { unique: false })
      }
      // v3: purchases store — keyed by purchaseId
      if (!db.objectStoreNames.contains('purchases')) {
        const purStore = db.createObjectStore('purchases', { keyPath: 'purchaseId' })
        purStore.createIndex('purchasedAt', 'purchasedAt', { unique: false })
        purStore.createIndex('supplierId', 'supplierId', { unique: false })
        purStore.createIndex('monthKey', 'monthKey', { unique: false })
      }
    }
    req.onsuccess = (e) => {
      _db = e.target.result
      resolve(_db)
    }
    req.onerror = () => reject(req.error)
  })
}

// ── Generic KV store ──
export async function dbGet(key) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('kv', 'readonly')
      const req = tx.objectStore('kv').get(key)
      req.onsuccess = () => resolve(req.result?.v ?? null)
      req.onerror = () => resolve(null)
    })
  } catch {
    try { return JSON.parse(localStorage.getItem(key)) } catch { return null }
  }
}

export async function dbSet(key, value) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('kv', 'readwrite')
      tx.objectStore('kv').put({ k: key, v: value })
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
      const tx = db.transaction('kv', 'readwrite')
      tx.objectStore('kv').delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch { }
}

export async function dbClearAll() {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(['kv', 'orders'], 'readwrite')
      tx.objectStore('kv').clear()
      tx.objectStore('orders').clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch { }
}

// ── Orders store ──

// Save a single completed order record
export async function saveOrderRecord(order) {
  try {
    const db = await openDB()
    const now = order.completedAt || Date.now()
    const d = new Date(now)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` // e.g. "2026-06"

    const record = {
      orderId: order.id,
      monthKey,
      completedAt: now,
      createdAt: order.createdAt instanceof Date ? order.createdAt.getTime() : order.createdAt,
      items: order.items,
      subtotal: order.items.reduce((s, i) => s + i.price * i.qty, 0),
      discountType: order.discountType || 'none',
      discountAmt: order.discountAmt || 0,
      deliveryCharge: order.deliveryCharge || 0,
      total: order.total || 0,
      paymentMode: order.paymentMode || 'cash',
      paymentDetails: order.paymentDetails || null,
      taxLabel: order.taxLabel || '',
      taxAmt: order.taxAmt || 0,
    }

    return new Promise((resolve) => {
      const tx = db.transaction('orders', 'readwrite')
      tx.objectStore('orders').put(record)
      tx.oncomplete = () => resolve(record)
      tx.onerror = () => resolve(null)
    })
  } catch { return null }
}

// Get orders by date range (using completedAt index), with pagination and optional search
// Returns { records: [...], total: N, hasMore: bool }
export async function getOrdersByDateRange({ fromTs, toTs, paymentMode, search, sortDesc = true, offset = 0, limit = 50 }) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('orders', 'readonly')
      const index = tx.objectStore('orders').index('completedAt')
      const range = IDBKeyRange.bound(fromTs, toTs)
      const direction = sortDesc ? 'prev' : 'next'
      const results = []
      let totalMatch = 0
      let skipped = 0
      const searchLower = search ? search.toLowerCase() : ''

      const req = index.openCursor(range, direction)
      req.onsuccess = (e) => {
        const cursor = e.target.result
        if (!cursor) {
          resolve({ records: results, total: totalMatch, hasMore: (offset + results.length) < totalMatch })
          return
        }
        const r = cursor.value
        // Apply filters
        const matchPayment = !paymentMode || paymentMode === 'all' || r.paymentMode === paymentMode
        const matchSearch = !searchLower || r.orderId.toLowerCase().includes(searchLower) ||
          (r.items || []).some(i => i.name.toLowerCase().includes(searchLower))
        
        if (matchPayment && matchSearch) {
          totalMatch++
          if (skipped < offset) {
            skipped++
          } else if (results.length < limit) {
            results.push(r)
          }
        }
        cursor.continue()
      }
      req.onerror = () => resolve({ records: [], total: 0, hasMore: false })
    })
  } catch { return { records: [], total: 0, hasMore: false } }
}

// Get aggregate stats for a date range (count + total revenue) efficiently
export async function getStatsForDateRange({ fromTs, toTs, paymentMode, search }) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('orders', 'readonly')
      const index = tx.objectStore('orders').index('completedAt')
      const range = IDBKeyRange.bound(fromTs, toTs)
      const searchLower = search ? search.toLowerCase() : ''
      let count = 0, revenue = 0, payCounts = {}

      const req = index.openCursor(range)
      req.onsuccess = (e) => {
        const cursor = e.target.result
        if (!cursor) {
          const topPayment = Object.entries(payCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
          resolve({ count, revenue, avg: count > 0 ? revenue / count : 0, topPayment })
          return
        }
        const r = cursor.value
        const matchPayment = !paymentMode || paymentMode === 'all' || r.paymentMode === paymentMode
        const matchSearch = !searchLower || r.orderId.toLowerCase().includes(searchLower) ||
          (r.items || []).some(i => i.name.toLowerCase().includes(searchLower))
        if (matchPayment && matchSearch) {
          count++
          revenue += (r.total || 0)
          payCounts[r.paymentMode] = (payCounts[r.paymentMode] || 0) + 1
        }
        cursor.continue()
      }
      req.onerror = () => resolve({ count: 0, revenue: 0, avg: 0, topPayment: '—' })
    })
  } catch { return { count: 0, revenue: 0, avg: 0, topPayment: '—' } }
}

// Legacy: Get all order records (kept for CSV export)
export async function getAllOrderRecords() {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('orders', 'readonly')
      const req = tx.objectStore('orders').getAll()
      req.onsuccess = () => {
        const records = (req.result || []).sort((a, b) => b.completedAt - a.completedAt)
        resolve(records)
      }
      req.onerror = () => resolve([])
    })
  } catch { return [] }
}

// Get orders for a specific month key e.g. "2026-06"
export async function getOrdersByMonth(monthKey) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('orders', 'readonly')
      const index = tx.objectStore('orders').index('monthKey')
      const req = index.getAll(IDBKeyRange.only(monthKey))
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => resolve([])
    })
  } catch { return [] }
}

// Backup all orders as a JSON file
export async function exportOrdersBackup() {
  try {
    const records = await getAllOrderRecords()
    const jsonStr = JSON.stringify(records)
    return new Blob([jsonStr], { type: 'application/json' })
  } catch (err) {
    console.error('Backup failed:', err)
    return null
  }
}

// Restore orders from a JSON file
export async function restoreOrdersBackup(file) {
  try {
    const jsonStr = await file.text()
    
    const records = JSON.parse(jsonStr)
    if (!Array.isArray(records)) throw new Error('Invalid backup format')
    
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('orders', 'readwrite')
      const store = tx.objectStore('orders')
      let count = 0
      records.forEach(r => {
        store.put(r)
        count++
      })
      tx.oncomplete = () => resolve(count)
      tx.onerror = () => resolve(-1)
    })
  } catch (err) {
    console.error('Restore failed:', err)
    return -1
  }
}

// Delete all order records (reset to 1)
export async function clearAllOrderRecords() {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('orders', 'readwrite')
      tx.objectStore('orders').clear()
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
    })
  } catch { return false }
}

// Delete a single order record by orderId
export async function deleteOrderRecord(orderId) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('orders', 'readwrite')
      tx.objectStore('orders').delete(orderId)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
    })
  } catch { return false }
}

// Update a single order record (for edits)
export async function updateOrderRecord(orderId, patch) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('orders', 'readwrite')
      const store = tx.objectStore('orders')
      const getReq = store.get(orderId)
      getReq.onsuccess = () => {
        if (!getReq.result) { resolve(false); return }
        const updated = { ...getReq.result, ...patch }
        store.put(updated)
        tx.oncomplete = () => resolve(true)
      }
      tx.onerror = () => resolve(false)
    })
  } catch { return false }
}

// Get the next order number for the current month
export async function getNextOrderNum(monthKey) {
  try {
    const db = await openDB()
    const maxCompletedNum = await new Promise((resolve) => {
      const tx = db.transaction('orders', 'readonly')
      const index = tx.objectStore('orders').index('monthKey')
      const req = index.getAll(IDBKeyRange.only(monthKey))
      req.onsuccess = () => {
        let max = 0
        for (const record of (req.result || [])) {
          if (record.orderId && record.orderId.includes('-')) {
             const num = parseInt(record.orderId.split('-')[0], 10)
             if (!isNaN(num) && num > max) max = num
          }
        }
        resolve(max)
      }
      req.onerror = () => resolve(0)
    })

    const activeOrders = await dbGet('mn-active-orders') || []
    let maxActiveNum = 0
    for (const o of activeOrders) {
      const d = new Date(o.createdAt)
      const orderMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (orderMonthKey === monthKey && o.id && !o.id.startsWith('T') && o.id.includes('-')) {
         const num = parseInt(o.id.split('-')[0], 10)
         if (!isNaN(num) && num > maxActiveNum) {
           maxActiveNum = num
         }
      }
    }

    return Math.max(maxCompletedNum, maxActiveNum) + 1
  } catch { return 1 }
}

// Get approximate storage usage in bytes
export async function getStorageEstimate() {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const { usage, quota } = await navigator.storage.estimate()
      return { usage: usage || 0, quota: quota || 0 }
    }
  } catch { }
  return { usage: 0, quota: 0 }
}

// ── Stress Testing ──
export async function injectStressTestData(numOrders = 10000) {
  try {
    const rawMenu = await dbGet('mn-menu') || []
    const fallbackProducts = [
      { id: 'f1', name: 'Margherita Pizza', price: 299, emoji: '🍕' },
      { id: 'f2', name: 'Cheese Burger', price: 149, emoji: '🍔' },
      { id: 'f3', name: 'Cold Coffee', price: 120, emoji: '🥤' },
      { id: 'f4', name: 'French Fries', price: 99, emoji: '🍟' },
      { id: 'f5', name: 'Chicken Pasta', price: 249, emoji: '🍝' },
      { id: 'f6', name: 'Tacos (2pcs)', price: 180, emoji: '🌮' },
      { id: 'f7', name: 'Chocolate Shake', price: 150, emoji: '🧋' },
      { id: 'f8', name: 'Veg Wrap', price: 130, emoji: '🌯' }
    ]
    // Filter actual products, ignoring empty categories
    let products = rawMenu.flatMap(c => c.items || [])
    if (products.length === 0) products = fallbackProducts

    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('orders', 'readwrite')
      const store = tx.objectStore('orders')
      
      const now = Date.now()
      let injected = 0

      for (let i = 1; i <= numOrders; i++) {
        // Randomly pick 1 to 5 distinct products for this order
        const orderItemsCount = Math.floor(Math.random() * 5) + 1
        const shuffledProducts = [...products].sort(() => 0.5 - Math.random())
        const selectedProducts = shuffledProducts.slice(0, orderItemsCount)

        let subtotal = 0
        const orderItems = selectedProducts.map(p => {
          const qty = Math.floor(Math.random() * 4) + 1 // 1 to 4 quantity
          const price = parseFloat(p.price || p.basePrice || 100)
          subtotal += price * qty
          return {
            id: p.id,
            name: p.name,
            price: price,
            qty: qty,
            emoji: p.emoji || '🍽️'
          }
        })

        const fakeDate = now - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000) // random within last 90 days
        const fakeD = new Date(fakeDate)
        const fakeMonthKey = `${fakeD.getFullYear()}-${String(fakeD.getMonth() + 1).padStart(2, '0')}`
        const rando = Math.random()
        const paymentMode = rando > 0.6 ? 'upi' : rando > 0.2 ? 'cash' : 'card'

        store.put({
          orderId: `ST-${i}-${Date.now() + i}`, 
          monthKey: fakeMonthKey,
          completedAt: fakeDate,
          createdAt: fakeDate - 60000,
          items: orderItems,
          subtotal: subtotal,
          discountType: 'none',
          discountAmt: 0,
          deliveryCharge: 0,
          total: subtotal, // simple total without tax/discount for stress test
          paymentMode: paymentMode,
          paymentDetails: null,
          taxLabel: '',
          taxAmt: 0,
          note: Math.random() > 0.8 ? 'Stress test generated' : ''
        })
        injected++
      }
      
      tx.oncomplete = () => resolve(injected)
      tx.onerror = () => resolve(-1)
    })
  } catch { return -1 }
}

// ════════════════════════════════════════════════════════════════════
// INVENTORY STORE — v3
// ════════════════════════════════════════════════════════════════════

export async function getInventoryItems() {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('inventory', 'readonly')
      const req = tx.objectStore('inventory').getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => resolve([])
    })
  } catch { return [] }
}

export async function getInventoryItem(id) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('inventory', 'readonly')
      const req = tx.objectStore('inventory').get(id)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => resolve(null)
    })
  } catch { return null }
}

export async function saveInventoryItem(item) {
  try {
    const db = await openDB()
    const record = {
      ...item,
      isLowStock: (item.currentQty ?? 0) <= (item.lowStockThreshold ?? 5),
      updatedAt: Date.now(),
      createdAt: item.createdAt || Date.now(),
    }
    return new Promise((resolve) => {
      const tx = db.transaction('inventory', 'readwrite')
      tx.objectStore('inventory').put(record)
      tx.oncomplete = () => resolve(record)
      tx.onerror = () => resolve(null)
    })
  } catch { return null }
}

export async function deleteInventoryItem(id) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('inventory', 'readwrite')
      tx.objectStore('inventory').delete(id)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
    })
  } catch { return false }
}

export async function adjustInventoryStock(id, delta) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('inventory', 'readwrite')
      const store = tx.objectStore('inventory')
      const getReq = store.get(id)
      getReq.onsuccess = () => {
        const item = getReq.result
        if (!item) { resolve(false); return }
        const newQty = Math.max(0, (item.currentQty || 0) + delta)
        const updated = { ...item, currentQty: newQty, isLowStock: newQty <= (item.lowStockThreshold || 5), updatedAt: Date.now() }
        store.put(updated)
        tx.oncomplete = () => resolve(updated)
      }
      tx.onerror = () => resolve(false)
    })
  } catch { return false }
}

export async function logWastage(itemId, entry) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('inventory', 'readwrite')
      const store = tx.objectStore('inventory')
      const getReq = store.get(itemId)
      getReq.onsuccess = () => {
        const item = getReq.result
        if (!item) { resolve(false); return }
        const wastageLog = item.wastageLog || []
        wastageLog.unshift({ ...entry, loggedAt: Date.now() })
        const newQty = Math.max(0, (item.currentQty || 0) - (entry.qty || 0))
        const updated = { ...item, currentQty: newQty, isLowStock: newQty <= (item.lowStockThreshold || 5), wastageLog, updatedAt: Date.now() }
        store.put(updated)
        tx.oncomplete = () => resolve(updated)
      }
      tx.onerror = () => resolve(false)
    })
  } catch { return false }
}

// ════════════════════════════════════════════════════════════════════
// PURCHASES STORE — v3
// ════════════════════════════════════════════════════════════════════

function genPurchaseId() {
  const d = new Date()
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
  return `PUR-${ym}-${Date.now().toString(36).toUpperCase()}`
}

export async function savePurchaseLog(log) {
  try {
    const db = await openDB()
    const now = Date.now()
    const d = new Date(log.purchasedAt || now)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const record = { ...log, purchaseId: log.purchaseId || genPurchaseId(), monthKey, purchasedAt: log.purchasedAt || now, createdAt: now }

    await new Promise((resolve) => {
      const tx = db.transaction('purchases', 'readwrite')
      tx.objectStore('purchases').put(record)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })

    // Auto-increment inventory
    for (const li of (record.items || [])) {
      if (!li.productId) continue
      const invItem = await getInventoryItem(li.productId)
      if (invItem) {
        const updated = await adjustInventoryStock(li.productId, li.qty || 0)
        if (updated && li.costPerUnit > 0) {
          await saveInventoryItem({ ...updated, costPrice: li.costPerUnit })
        }
      } else {
        await saveInventoryItem({
          id: li.productId, name: li.productName, category: li.category || '',
          emoji: li.emoji || '📦', unit: li.unit || 'pcs',
          currentQty: li.qty || 0, lowStockThreshold: 5,
          costPrice: li.costPerUnit || 0, sellingPrice: li.sellingPrice || 0,
          isMenuLinked: false, wastageLog: [], createdAt: now,
        })
      }
    }

    // Update supplier spend
    if (record.supplierId) {
      await updateSupplierSpend(record.supplierId, record.totalAmount || 0)
    }

    return record
  } catch (e) { console.error('savePurchaseLog:', e); return null }
}

export async function getPurchaseLogs() {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('purchases', 'readonly')
      const req = tx.objectStore('purchases').getAll()
      req.onsuccess = () => resolve((req.result || []).sort((a, b) => b.purchasedAt - a.purchasedAt))
      req.onerror = () => resolve([])
    })
  } catch { return [] }
}

export async function getPurchasesByMonth(monthKey) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('purchases', 'readonly')
      const index = tx.objectStore('purchases').index('monthKey')
      const req = index.getAll(IDBKeyRange.only(monthKey))
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => resolve([])
    })
  } catch { return [] }
}

export async function deletePurchaseLog(purchaseId) {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('purchases', 'readwrite')
      tx.objectStore('purchases').delete(purchaseId)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => resolve(false)
    })
  } catch { return false }
}

// ════════════════════════════════════════════════════════════════════
// SUPPLIERS — KV store 'mn-suppliers'
// ════════════════════════════════════════════════════════════════════

export async function getSuppliers() {
  return (await dbGet('mn-suppliers')) || []
}

export async function saveSupplier(supplier) {
  const suppliers = await getSuppliers()
  const idx = suppliers.findIndex(s => s.id === supplier.id)
  const record = { ...supplier, updatedAt: Date.now(), createdAt: supplier.createdAt || Date.now() }
  if (idx >= 0) suppliers[idx] = record
  else suppliers.push(record)
  await dbSet('mn-suppliers', suppliers)
  return record
}

export async function deleteSupplier(id) {
  const suppliers = await getSuppliers()
  await dbSet('mn-suppliers', suppliers.filter(s => s.id !== id))
  return true
}

export async function updateSupplierSpend(supplierId, amount) {
  const suppliers = await getSuppliers()
  const s = suppliers.find(s => s.id === supplierId)
  if (s) {
    s.totalSpend = (s.totalSpend || 0) + amount
    s.lastPurchaseAt = Date.now()
    await dbSet('mn-suppliers', suppliers)
  }
}
