import { useState, useEffect } from 'react'

// ── Audio Boot Up Sound ──
// High quality, energetic MP3 to ensure cross-browser compatibility
const bootSound = new Audio('https://www.myinstants.com/media/sounds/ps1-startup.mp3')
bootSound.volume = 0.6

export default function Welcome({ onComplete }) {
  const [stage, setStage] = useState(-1) // -1 means waiting for user click

  const handleStart = () => {
    setStage(0)
    
    // Guaranteed to play because it's directly inside a click handler
    bootSound.play().catch(e => console.warn('Audio play failed:', e))

    // Stage sequence for animations
    const t1 = setTimeout(() => { setStage(1) }, 300)   // Fade in logo
    const t2 = setTimeout(() => { setStage(2) }, 1200)  // Slide up text
    const t3 = setTimeout(() => { setStage(3) }, 2500)  // Glow burst
    const t4 = setTimeout(() => { setStage(4) }, 4800)  // Exit animation (extended for sound)
    const t5 = setTimeout(() => onComplete(), 5400)     // Unmount
  }

  if (stage === -1) {
    return (
      <div className="wel-root">
        <div className="wel-grid" />
        <button className="wel-init-btn" onClick={handleStart}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          INITIALIZE SYSTEM
        </button>
      </div>
    )
  }

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
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G" style={{ width: '36px', height: '36px' }} />
          </div>
        </div>

        {/* Text */}
        <div className="wel-text-wrap">
          <h1 className={`wel-title ${stage >= 2 ? 'show' : ''}`}>
            <span className="wel-word">ManSula</span>
            <span className="wel-word wel-highlight">Nexus</span>
          </h1>
          
          <div className={`wel-subtitle-wrap ${stage >= 2 ? 'show' : ''}`}>
            <p className="wel-subtitle" style={{ fontSize: '0.85rem' }}>Empowering Commerce with Smart Technology</p>
            <div className="wel-loader-bar">
              <div className="wel-loader-fill" style={{ animationDuration: '4.5s' }} />
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
