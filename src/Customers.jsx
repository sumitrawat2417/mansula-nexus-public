import { useState, useEffect } from 'react'
import { getCustomers, saveCustomer, dbGet } from './db.js'
import './App.css'

// Standard icon set reused
const I = {
  Back: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  WhatsApp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>,
  ChevronDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  ChevronUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
  Save: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Udhaar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
}

const fmt = (val, currencyCode = 'INR') => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(val || 0)
}

function getTag(ordersCount) {
  const count = ordersCount || 0
  if (count >= 15) return { label: 'VIP', class: 'tag-vip' }
  if (count >= 5) return { label: 'Regular', class: 'tag-regular' }
  return { label: 'Occasional', class: 'tag-occasional' }
}

export default function Customers({ onBack }) {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all, top, vip, udhaar
  const [expandedId, setExpandedId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCust, setNewCust] = useState({ name: '', phone: '', notes: '' })
  const [currency, setCurrency] = useState('INR')

  useEffect(() => {
    loadData()
    dbGet('pos_settings_v1').then(res => {
      if (res && res.currency) setCurrency(res.currency)
    })
  }, [])

  const loadData = async () => {
    const list = await getCustomers()
    setCustomers(list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)))
  }

  const handleAddCustomer = async (e) => {
    e.preventDefault()
    if (!newCust.name || !newCust.phone) return
    const cust = {
      id: `CUST-${Date.now()}`,
      name: newCust.name.trim(),
      phone: newCust.phone.trim(),
      notes: newCust.notes.trim(),
      ordersCount: 0,
      totalSpent: 0,
      creditBalance: 0,
      lastOrders: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    await saveCustomer(cust)
    setShowAddModal(false)
    setNewCust({ name: '', phone: '', notes: '' })
    loadData()
  }

  const handleSettleUdhaar = async (customer) => {
    if (!window.confirm(`Settle Udhaar balance of ${fmt(customer.creditBalance, currency)} for ${customer.name}?`)) return
    const updated = { ...customer, creditBalance: 0, updatedAt: Date.now() }
    await saveCustomer(updated)
    loadData()
  }

  const handleUpdateNotes = async (customer, newNotes) => {
    const updated = { ...customer, notes: newNotes, updatedAt: Date.now() }
    await saveCustomer(updated)
    loadData()
  }

  const openWhatsApp = async (customer) => {
    const bizSettings = await dbGet('business_profile_v1')
    const bizName = bizSettings?.name || 'ManSula Nexus'
    const msg = `Hello ${customer.name}! Thank you for visiting ${bizName}.`
    const phone = customer.phone.replace(/\D/g, '')
    // Assuming Indian numbers if no country code provided
    const finalPhone = phone.length === 10 ? `91${phone}` : phone
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  let filtered = customers.filter(c => {
    if (!search) return true
    const s = search.toLowerCase()
    return c.name.toLowerCase().includes(s) || c.phone.includes(s)
  })

  if (filter === 'top') filtered = filtered.sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
  if (filter === 'vip') filtered = filtered.filter(c => (c.ordersCount || 0) >= 15)
  if (filter === 'udhaar') filtered = filtered.filter(c => (c.creditBalance || 0) > 0)

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="icon-btn" onClick={onBack}><I.Back s={24} /></button>
        <h2>Customers CRM</h2>
      </div>

      <div className="customers-container">
        {/* Top Bar */}
        <div className="crm-topbar">
          <div className="crm-search">
            <I.Search />
            <input 
              type="text" 
              placeholder="Search customers by name or phone..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="primary-btn" onClick={() => setShowAddModal(true)}>
            <I.Plus /> Add Customer
          </button>
        </div>

        {/* Filter Chips */}
        <div className="crm-filters">
          {['all', 'top', 'vip', 'udhaar'].map(f => (
            <button 
              key={f}
              className={`crm-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' && 'All Customers'}
              {f === 'top' && 'Top Spenders'}
              {f === 'vip' && 'VIPs Only'}
              {f === 'udhaar' && 'Udhaar Pending'}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="crm-list">
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.6 }}>
              <I.Udhaar />
              <p style={{ marginTop: 10 }}>No customers found.</p>
            </div>
          ) : (
            filtered.map(c => {
              const tag = getTag(c.ordersCount)
              const isExpanded = expandedId === c.id
              return (
                <div key={c.id} className={`crm-card ${isExpanded ? 'expanded' : ''}`}>
                  <div className="crm-card-header" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                    <div className="crm-info">
                      <h3>{c.name}</h3>
                      <span className="crm-phone">{c.phone}</span>
                    </div>
                    
                    <div className="crm-metrics">
                      <span className={`crm-tag ${tag.class}`}>{tag.label}</span>
                      <div className="crm-stats">
                        <small>Spent</small>
                        <strong>{fmt(c.totalSpent, currency)}</strong>
                      </div>
                      {c.creditBalance > 0 && (
                        <div className="crm-stats udhaar-stat">
                          <small>Udhaar</small>
                          <strong>{fmt(c.creditBalance, currency)}</strong>
                        </div>
                      )}
                      <div className="crm-expand-icon">
                        {isExpanded ? <I.ChevronUp /> : <I.ChevronDown />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="crm-card-body">
                      <div className="crm-grid">
                        <div className="crm-notes-section">
                          <h4>Customer Preferences & Notes</h4>
                          <textarea 
                            defaultValue={c.notes}
                            placeholder="Add preferences like 'Always extra spicy'..."
                            onBlur={(e) => handleUpdateNotes(c, e.target.value)}
                          />
                        </div>
                        <div className="crm-history-section">
                          <h4>Last 5 Purchases</h4>
                          {(!c.lastOrders || c.lastOrders.length === 0) ? (
                            <p className="no-history">No purchase history yet.</p>
                          ) : (
                            <ul className="crm-history-list">
                              {c.lastOrders.map((o, i) => (
                                <li key={i}>
                                  <span>{new Date(o.date).toLocaleDateString()}</span>
                                  <span>{o.itemsCount} items</span>
                                  <strong>{fmt(o.total, currency)}</strong>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      <div className="crm-actions">
                        <button className="whatsapp-btn" onClick={() => openWhatsApp(c)}>
                          <I.WhatsApp /> Message on WhatsApp
                        </button>
                        {c.creditBalance > 0 && (
                          <button className="settle-btn" onClick={() => handleSettleUdhaar(c)}>
                            <I.Save /> Settle Udhaar ({fmt(c.creditBalance, currency)})
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Add New Customer</h3>
            <form onSubmit={handleAddCustomer}>
              <div className="form-group">
                <label>Name</label>
                <input 
                  autoFocus 
                  required 
                  placeholder="e.g. Rahul Sharma"
                  value={newCust.name} 
                  onChange={e => setNewCust({...newCust, name: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  required 
                  type="tel" 
                  placeholder="e.g. 9876543210"
                  value={newCust.phone} 
                  onChange={e => setNewCust({...newCust, phone: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea 
                  rows={3} 
                  placeholder="Any specific preferences or udhaar terms..."
                  value={newCust.notes} 
                  onChange={e => setNewCust({...newCust, notes: e.target.value})} 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
