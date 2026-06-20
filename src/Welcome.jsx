import { useState, useEffect } from 'react'

// ── Web Audio Synthesizer (Premium Chimes) ──
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'reveal') {
      // Soft high chime for logo reveal
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1) // A6
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 1.5)
    } else if (type === 'burst') {
      // Magical burst for glow
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(440, ctx.currentTime) // A4
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5) // A5
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 2)
    }
  } catch (e) {
    // Browsers will block audio if there was no user interaction yet, fail silently.
  }
}

export default function Welcome({ onComplete }) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    // Stage sequence for animations
    const t1 = setTimeout(() => { setStage(1); playSound('reveal'); }, 300)   // Fade in logo
    const t2 = setTimeout(() => { setStage(2); }, 1200)                       // Slide up text
    const t3 = setTimeout(() => { setStage(3); playSound('burst'); }, 2500)   // Glow burst
    const t4 = setTimeout(() => { setStage(4); }, 3800)                       // Exit animation
    const t5 = setTimeout(() => onComplete(), 4400)                           // Unmount

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
              <div className="wel-loader-fill" />
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
