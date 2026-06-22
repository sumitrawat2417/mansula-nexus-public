import re

with open('src/POS.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add Icons
icons_to_add = """  Users: ({ s = 18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Calendar: ({ s = 15 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,"""

code = code.replace("  Check: ({ s = 16 })", icons_to_add + "\n  Check: ({ s = 16 })")

# 2. Rename state variables
code = code.replace("const [udhaarName, setUdhaarName]", "const [customerName, setCustomerName]")
code = code.replace("const [udhaarPhone, setUdhaarPhone]", "const [customerPhone, setCustomerPhone]")
code = code.replace("const [udhaarFocus, setUdhaarFocus]", "const [customerFocus, setCustomerFocus]")
code = code.replace("udhaarName", "customerName")
code = code.replace("udhaarPhone", "customerPhone")
code = code.replace("setUdhaarName", "setCustomerName")
code = code.replace("setUdhaarPhone", "setCustomerPhone")
code = code.replace("setUdhaarFocus", "setCustomerFocus")
code = code.replace("udhaarFocus", "customerFocus")

# 3. Add orderDate state
state_insertion = """  const [customerFocus, setCustomerFocus] = useState(false)
  const [orderDate, setOrderDate] = useState(null)
  const [showDatePicker, setShowDatePicker] = useState(false)"""
code = code.replace("  const [customerFocus, setCustomerFocus] = useState(false)", state_insertion)

# 4. Modify editingRecord initialization to pick up originalCompletedAt for orderDate
init_insertion = """        if (editingRecord.completedAt) setOrderDate(new Date(editingRecord.completedAt).toISOString().slice(0,16))
        if (editingRecord.customerDetails) {
          setCustomerName(editingRecord.customerDetails.name || '')
          setCustomerPhone(editingRecord.customerDetails.phone || '')
        }
        setDiscountType(editingRecord.discountAmt > 0 ? 'flat' : 'none')"""
code = code.replace("        setDiscountType(editingRecord.discountAmt > 0 ? 'flat' : 'none')", init_insertion)

# 5. Modify order processing to use orderDate if present, and save customer globally
pay_udhaar_mod = """
    // Process customer if provided
    let customerIdToLink = null;
    let customerNameToLink = null;
    let customerPhoneToLink = null;
    
    if (customerName.trim() || customerPhone.trim()) {
      const allCustomers = await getCustomers() || []
      let customer = customerPhone.trim() ? allCustomers.find(c => c.phone === customerPhone.trim()) : null
      if (!customer && customerName.trim()) {
        customer = allCustomers.find(c => c.name.toLowerCase() === customerName.trim().toLowerCase())
      }
      
      if (!customer) {
        customer = {
          customerId: 'cust-' + Date.now(),
          name: customerName.trim() || 'Customer ' + customerPhone.trim().slice(-4),
          phone: customerPhone.trim(),
          udhaarBalance: 0,
          createdAt: new Date().toISOString()
        }
        await saveCustomer(customer)
      } else if (customerPhone.trim() && !customer.phone) {
        customer.phone = customerPhone.trim()
        await saveCustomer(customer)
      }
      
      customerIdToLink = customer.customerId;
      customerNameToLink = customer.name;
      customerPhoneToLink = customer.phone;
    }

    if (paymentMode === 'udhaar' && !customerIdToLink) {
      showToast('Please enter customer details for Udhaar', 'error')
      setProcessing(false)
      return
    }

    const completedAtTimestamp = orderDate ? new Date(orderDate).getTime() : Date.now();
"""

code = code.replace("    if (paymentMode === 'udhaar') {", pay_udhaar_mod + "\n    if (paymentMode === 'udhaar') {")

# Remove the inline udhaar customer creation since we do it above
code = code.replace("""      const allCustomers = await getCustomers() || []
      let customer = customerPhone.trim() ? allCustomers.find(c => c.phone === customerPhone.trim()) : null
      if (!customer && customerName.trim()) {
        customer = allCustomers.find(c => c.name.toLowerCase() === customerName.trim().toLowerCase())
      }
      
      if (!customer) {
        customer = {
          customerId: 'cust-' + Date.now(),
          name: customerName.trim() || 'Customer ' + customerPhone.trim().slice(-4),
          phone: customerPhone.trim(),
          udhaarBalance: 0,
          createdAt: new Date().toISOString()
        }
        await saveCustomer(customer)
      } else if (customerPhone.trim() && !customer.phone) {
        customer.phone = customerPhone.trim()
        await saveCustomer(customer)
      }
      
      const newEntry = {""", """      const newEntry = {""")
code = code.replace("customerId: customer.customerId,", "customerId: customerIdToLink,")

# Update completedAt timestamp
code = code.replace("        completedAt: Date.now(),", """        completedAt: completedAtTimestamp,
        customerDetails: customerIdToLink ? { id: customerIdToLink, name: customerNameToLink, phone: customerPhoneToLink } : null,""")


# 6. Update Header with Date Editor
header_original = """            <div className="pos-order-id">
              {editingRecord ? `Editing Order #${editingRecord.orderId}` : `Current Order #${String(currentOrderId).padStart(3, '0')}`}
            </div>"""
header_new = """            <div className="pos-order-id" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {editingRecord ? `Editing Order #${editingRecord.orderId}` : `Current Order #${String(currentOrderId).padStart(3, '0')}`}
              {editingRecord && (
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px', color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  >
                    <I.Calendar s={12}/>
                    {orderDate ? new Date(orderDate).toLocaleString('en-IN', {day:'2-digit', month:'short', hour:'numeric', minute:'2-digit'}) : 'Edit Date'}
                  </button>
                  {showDatePicker && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: 8, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                      <input 
                        type="datetime-local" 
                        value={orderDate || new Date(editingRecord.completedAt).toISOString().slice(0,16)} 
                        onChange={(e) => { setOrderDate(e.target.value); setShowDatePicker(false); }}
                        style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px 10px', borderRadius: '4px' }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>"""
code = code.replace(header_original, header_new)

# 7. Customer UI replacement
ui_original = """                      {paymentMode === 'udhaar' && (
                        <div className="cash-calc-section" style={{ padding: '16px' }}>
                          <div className="cash-calc-label" style={{ fontSize: '0.85rem', marginBottom: 12 }}>Customer Details for Udhaar</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface-1)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                              <span style={{ padding: '12px 0 12px 16px', color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>+91</span>
                              <input 
                                type="tel"
                                placeholder="Phone Number *" 
                                value={customerPhone} 
                                onChange={handlePhoneChange} 
                                onFocus={() => setCustomerFocus(true)}
                                onBlur={() => setTimeout(() => setCustomerFocus(false), 200)}
                                style={{ padding: '12px 16px 12px 8px', background: 'transparent', border: 'none', fontSize: '1rem', width: '100%', color: 'var(--text-primary)', outline: 'none' }}
                              />
                            </div>
                            <input 
                              type="text" 
                              placeholder="Customer Name (Optional)" 
                              value={customerName} 
                              onChange={e => setCustomerName(e.target.value)} 
                              onFocus={() => setCustomerFocus(true)}
                              onBlur={() => setTimeout(() => setCustomerFocus(false), 200)}
                              style={{ padding: '12px 16px', background: 'var(--bg-surface-1)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '1rem', color: 'var(--text-primary)', outline: 'none' }}
                            />
                            
                            {customerFocus && filteredCusts.length > 0 && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-surface-1)', border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: 4, zIndex: 10, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                                {filteredCusts.map(c => (
                                  <div 
                                    key={c.customerId} 
                                    style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                                    onClick={() => {
                                      setCustomerName(c.name || '')
                                      setCustomerPhone(c.phone || '')
                                      setCustomerFocus(false)
                                    }}
                                  >
                                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                                    {c.phone && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>+91 {c.phone}</div>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}"""

customer_ui = """                      <div className="cash-calc-section" style={{ padding: '16px', background: 'linear-gradient(145deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.05) 100%)', border: '1px solid rgba(99,102,241,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                          <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '8px', padding: '6px' }}>
                            <I.Users s={16}/>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Customer Details</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Link customer for Udhaar or loyalty</div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
                          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden', transition: 'border-color 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                            <span style={{ padding: '12px 0 12px 16px', color: '#6366f1', fontSize: '0.95rem', fontWeight: 600 }}>+91</span>
                            <input 
                              type="tel"
                              placeholder="Phone Number (Required for Udhaar)" 
                              value={customerPhone} 
                              onChange={handlePhoneChange} 
                              onFocus={() => setCustomerFocus(true)}
                              onBlur={() => setTimeout(() => setCustomerFocus(false), 200)}
                              style={{ padding: '12px 16px 12px 8px', background: 'transparent', border: 'none', fontSize: '0.95rem', width: '100%', color: 'var(--text-primary)', outline: 'none' }}
                            />
                            {customerPhone.length >= 10 && <div style={{ paddingRight: 16, color: '#10b981' }}><I.Check s={16}/></div>}
                          </div>
                          
                          <input 
                            type="text" 
                            placeholder="Customer Name" 
                            value={customerName} 
                            onChange={e => setCustomerName(e.target.value)} 
                            onFocus={() => setCustomerFocus(true)}
                            onBlur={() => setTimeout(() => setCustomerFocus(false), 200)}
                            style={{ padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '0.95rem', color: 'var(--text-primary)', outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}
                          />
                          
                          {customerFocus && filteredCusts.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', marginTop: 8, zIndex: 100, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                              <div style={{ padding: '8px 12px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-surface-1)' }}>SUGGESTED CUSTOMERS</div>
                              {filteredCusts.map(c => (
                                <div 
                                  key={c.customerId} 
                                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}
                                  onMouseDown={(e) => {
                                    e.preventDefault() // prevent blur
                                    setCustomerName(c.name || '')
                                    setCustomerPhone(c.phone || '')
                                    setCustomerFocus(false)
                                  }}
                                >
                                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 600 }}>
                                    {(c.name || 'C')[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{c.name || 'Unknown'}</div>
                                    {c.phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>+91 {c.phone}</div>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>"""

code = code.replace(ui_original, customer_ui)


with open('src/POS.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
