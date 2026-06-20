import { useState, useEffect } from 'react'

export default function Welcome({ onComplete }) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    // Stage sequence for animations
    const t1 = setTimeout(() => setStage(1), 300)   // Fade in logo
    const t2 = setTimeout(() => setStage(2), 1200)  // Slide up text
    const t3 = setTimeout(() => setStage(3), 2500)  // Glow burst
    const t4 = setTimeout(() => setStage(4), 3800)  // Exit animation
    const t5 = setTimeout(() => onComplete(), 4400) // Unmount

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
    }
  }, [onComplete])

  return (
    <div className={`wel-root ${stage === 4 ? 'exit' : ''}`}>
      
      {/* ── Background Grid & Orbs ── */}
      <div className="wel-grid" />
      <div className={`wel-orb wel-orb-1 ${stage >= 1 ? 'active' : ''}`} />
      <div className={`wel-orb wel-orb-2 ${stage >= 1 ? 'active' : ''}`} />
      <div className={`wel-orb wel-orb-3 ${stage >= 3 ? 'burst' : ''}`} />

      {/* ── Main Content ── */}
      <div className="wel-content">
        
        {/* Logo */}
        <div className={`wel-logo-wrap ${stage >= 1 ? 'show' : ''} ${stage >= 3 ? 'glow' : ''}`}>
          <div className="wel-logo-ring wel-ring-outer" />
          <div className="wel-logo-ring wel-ring-inner" />
          <div className="wel-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="wel-text-wrap">
          <h1 className={`wel-title ${stage >= 2 ? 'show' : ''}`}>
            <span className="wel-word">ManSula</span>
            <span className="wel-word wel-highlight">Nexus</span>
          </h1>
          
          <div className={`wel-subtitle-wrap ${stage >= 2 ? 'show' : ''}`}>
            <p className="wel-subtitle">Enterprise POS & Billing</p>
            <div className="wel-loader-bar">
              <div className="wel-loader-fill" />
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
