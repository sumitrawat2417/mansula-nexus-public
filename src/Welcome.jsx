import { useState, useEffect } from 'react'

// ── Web Audio Synthesizer (Premium Chimes) ──
const playSound = (type) => {
  if (localStorage.getItem('mn-sound') === 'disabled') return
  try {
    // Suppress console warning if user hasn't interacted yet
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()

    if (type === 'reveal') {
      // Energetic tech power-up sweep
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.type = 'square'
      // Fast pitch sweep up
      osc.frequency.setValueAtTime(150, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.15)
      
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)

    } else if (type === 'burst') {
      // Big energetic synth impact/chord (C Major 9)
      const frequencies = [261.63, 329.63, 392.00, 493.88, 587.33] // C4, E4, G4, B4, D5
      
      frequencies.forEach(freq => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const filter = ctx.createBiquadFilter()
        
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(freq, ctx.currentTime)
        
        // Classic electronic filter sweep down
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(5000, ctx.currentTime)
        filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 1.2)
        
        osc.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        
        // Punchy attack, long fade out
        gain.gain.setValueAtTime(0, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2)
        
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 2)
      })
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
