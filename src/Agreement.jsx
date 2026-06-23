import { useState } from 'react'

// ── Icons ──
const Ic = {
  Shield:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  ChevDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Check:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Lock:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  CreditCard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  FileText: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Eye:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Rocket:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
}

// ── Agreement clause data ──
const CLAUSES = [
  {
    id: 'data',
    icon: Ic.Lock,
    title: 'Your Data Ownership',
    subtitle: 'Local-first architecture',
    color: '#6366f1',
    content: `All business profiles, order histories, menu items, and inventory data are stored exclusively on the local storage of your device using IndexedDB. ManSula Nexus does not transmit, harvest, or replicate any of your business data to external cloud servers at any point.

ManSula Technologies & ManSula DivLabs shall bear no liability for any data loss arising from physical device damage, theft, accidental app data clearance, browser cache purging, or operating system updates that affect local storage. The user is solely responsible for regularly utilising the in-app JSON backup and restore functionality to safeguard their business data.

By accepting these terms, the user acknowledges that data persistence is entirely dependent on the integrity of the local device and its storage subsystems.`,
  },
  {
    id: 'payments',
    icon: Ic.CreditCard,
    title: 'Payment & UPI Disclaimer',
    subtitle: 'Transaction liability',
    color: '#10b981',
    content: `ManSula Nexus functions strictly as a display interface that generates dynamic UPI QR strings and formatted payment requests. The platform is not a registered payment gateway, payment aggregator, banking correspondent, or financial institution as defined under the Payment and Settlement Systems Act, 2007.

ManSula Technologies & ManSula DivLabs assumes zero liability for failed UPI transactions, incorrect payment settlements, banking network outages, incorrect amount entries by the merchant, or any revenue loss resulting from payment processing failures by third-party UPI service providers (e.g., PhonePe, Google Pay, Paytm, BHIM).

The merchant acknowledges that all payment confirmations must be independently verified through their respective banking application or UPI service provider.`,
  },
  {
    id: 'tax',
    icon: Ic.FileText,
    title: 'Regulatory & Tax Compliance',
    subtitle: 'GST, FSSAI & licensing',
    color: '#f59e0b',
    content: `Tax slabs, GST rates, GSTIN numbers, and all regulatory details entered within the application are configured entirely by the merchant. ManSula Nexus assumes no liability for inaccuracies, miscalculations, or misinformation regarding applied taxes, invoicing errors, or non-compliance with applicable tax laws.

The merchant is solely responsible for ensuring compliance with all applicable central, state, and local regulations, including but not limited to: Goods and Services Tax (GST) filing obligations, Food Safety and Standards Authority of India (FSSAI) licensing requirements, Shop and Establishment Act registrations, and any other trade-specific regulatory mandates.

ManSula Technologies & ManSula DivLabs do not provide tax advisory, legal counsel, or regulatory compliance consulting services.`,
  },
  {
    id: 'privacy',
    icon: Ic.Eye,
    title: 'Privacy Policy',
    subtitle: 'Zero data collection',
    color: '#8b5cf6',
    content: `ManSula Nexus is an offline-first application. We do not harvest, transmit, or store your business data or your customers' data on any external cloud servers. Complete data ownership and privacy remain isolated on your local hardware.

The application does not employ analytics trackers, advertising SDKs, third-party cookies, or behavioural profiling mechanisms. No personally identifiable information (PII) of the merchant or their customers is collected, processed, or shared with any third party.

In compliance with the Digital Personal Data Protection Act (DPDPA) 2023, this application processes personal data only on the user's local device, with no cross-border data transfer. The merchant retains full rights as both the Data Principal and Data Fiduciary for all information entered into the application.

The only external network requests made by the application are: (a) fetching QR code images from a public QR generation API using the merchant's self-entered UPI ID, and (b) loading web font assets for the user interface.`,
  },
]

// ── Success Sound (Synthesized) ──
const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    
    const playNote = (freq, startTime, duration) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
      
      osc.start(startTime)
      osc.stop(startTime + duration)
    }

    playNote(880, ctx.currentTime, 0.15)          // A5
    playNote(1108.73, ctx.currentTime + 0.1, 0.4) // C#6
  } catch (e) {
    // Ignore audio failures silently
  }
}

export default function Agreement({ onAccept }) {
  const [expanded, setExpanded] = useState(null)
  const [agreed, setAgreed] = useState(false)
  const [launching, setLaunching] = useState(false)

  const toggle = (id) => setExpanded(prev => prev === id ? null : id)

  const handleLaunch = () => {
    if (!agreed) return
    setLaunching(true)
    playSuccessSound()
    setTimeout(() => onAccept(), 600)
  }

  return (
    <div className={`agr-root ${launching ? 'agr-exit' : ''}`}>
      {/* Decorative background */}
      <div className="agr-bg-orb agr-bg-orb-1" />
      <div className="agr-bg-orb agr-bg-orb-2" />
      <div className="agr-bg-orb agr-bg-orb-3" />

      <div className="agr-container">
        {/* Header */}
        <header className="agr-header">
          <div className="agr-logo-wrap">
            <div className="agr-logo-circle">
              <Ic.Shield />
            </div>
          </div>
          <h1 className="agr-title">Welcome to ManSula Nexus</h1>
          <p className="agr-subtitle">Before we begin, please review and accept our terms</p>
          <div className="agr-version-pill">DPDPA 2023 Compliant · v1.0</div>
        </header>

        {/* Accordion clauses */}
        <div className="agr-clauses">
          {CLAUSES.map((clause) => {
            const isOpen = expanded === clause.id
            return (
              <div key={clause.id} className={`agr-clause ${isOpen ? 'open' : ''}`}>
                <button className="agr-clause-header" onClick={() => toggle(clause.id)}>
                  <div className="agr-clause-icon" style={{ background: `${clause.color}18`, color: clause.color }}>
                    <clause.icon />
                  </div>
                  <div className="agr-clause-info">
                    <div className="agr-clause-title">{clause.title}</div>
                    <div className="agr-clause-sub">{clause.subtitle}</div>
                  </div>
                  <div className={`agr-clause-chevron ${isOpen ? 'rotated' : ''}`}>
                    <Ic.ChevDown />
                  </div>
                </button>
                <div className={`agr-clause-body ${isOpen ? 'expanded' : ''}`}>
                  <div className="agr-clause-content">
                    {clause.content.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Consent footer */}
        <div className="agr-footer">
          <label className="agr-checkbox-label" onClick={() => setAgreed(a => !a)}>
            <div className={`agr-checkbox ${agreed ? 'checked' : ''}`}>
              {agreed && <Ic.Check />}
            </div>
            <span>
              I have read and agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong> of ManSula Nexus by ManSula Technologies & ManSula DivLabs.
            </span>
          </label>

          <button
            className={`agr-launch-btn ${agreed ? 'active' : ''}`}
            disabled={!agreed}
            onClick={handleLaunch}
          >
            <Ic.Rocket />
            {launching ? 'Launching…' : 'Launch Dashboard'}
          </button>

          <p className="agr-footer-note">
            By proceeding, you confirm compliance with the Digital Personal Data Protection Act (DPDPA) 2023.
          </p>
        </div>
      </div>
    </div>
  )
}
