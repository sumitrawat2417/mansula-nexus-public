import { useState, useEffect } from 'react'

// ── Greeting helper ──
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── Tool definitions ──
const TOOLS = [
  {
    id: 'pos',
    name: 'Point of Sale',
    desc: 'Billing, orders & checkout',
    emoji: '🖥️',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    glow: 'rgba(99,102,241,0.35)',
    status: 'active',
    cta: 'Launch POS',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    desc: 'Sales trends & insights',
    emoji: '📊',
    gradient: 'linear-gradient(135deg, #0ea5e9, #2dd4bf)',
    glow: 'rgba(14,165,233,0.3)',
    status: 'soon',
  },
  {
    id: 'reports',
    name: 'Reports',
    desc: 'Daily, weekly & monthly',
    emoji: '📄',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    glow: 'rgba(16,185,129,0.3)',
    status: 'soon',
  },
  {
    id: 'inventory',
    name: 'Inventory',
    desc: 'Stock & supplier mgmt',
    emoji: '📦',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    glow: 'rgba(245,158,11,0.3)',
    status: 'soon',
  },
  {
    id: 'staff',
    name: 'Staff',
    desc: 'Team roles & shifts',
    emoji: '👥',
    gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    glow: 'rgba(236,72,153,0.3)',
    status: 'soon',
  },
  {
    id: 'customers',
    name: 'Customers',
    desc: 'Udhaar ledger & CRM',
    emoji: '🧾',
    gradient: 'linear-gradient(135deg, #06b6d4, #0284c7)',
    glow: 'rgba(6,182,212,0.3)',
    status: 'soon',
  },
  {
    id: 'menu',
    name: 'Menu Builder',
    desc: 'Products & categories',
    emoji: '🍽️',
    gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
    glow: 'rgba(167,139,250,0.3)',
    status: 'soon',
  },
  {
    id: 'settings',
    name: 'Settings',
    desc: 'App, billing & profile',
    emoji: '⚙️',
    gradient: 'linear-gradient(135deg, #6b7280, #374151)',
    glow: 'rgba(107,114,128,0.25)',
    status: 'soon',
  },
]

// ── Quick stat chips ──
function QuickStats() {
  // Placeholder data; replace with real persisted data when ready
  const stats = [
    { label: "Today's Sales", value: '—', icon: '💰' },
    { label: 'Orders', value: '—', icon: '📋' },
    { label: 'Avg. Order', value: '—', icon: '📈' },
  ]
  return (
    <div className="hn-stats-row">
      {stats.map(s => (
        <div key={s.label} className="hn-stat-chip">
          <span className="hn-stat-icon">{s.icon}</span>
          <div>
            <div className="hn-stat-value">{s.value}</div>
            <div className="hn-stat-label">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tool card ──
function ToolCard({ tool, onLaunch }) {
  const isActive = tool.status === 'active'

  return (
    <div
      className={`hn-tool-card ${isActive ? 'hn-tool-active' : 'hn-tool-soon'}`}
      style={{ '--tool-glow': tool.glow }}
      onClick={() => isActive && onLaunch(tool.id)}
      role={isActive ? 'button' : 'article'}
      tabIndex={isActive ? 0 : -1}
      onKeyDown={e => e.key === 'Enter' && isActive && onLaunch(tool.id)}
      aria-label={isActive ? `Launch ${tool.name}` : `${tool.name} — Coming Soon`}
    >
      <div className="hn-tool-icon-wrap" style={{ background: tool.gradient }}>
        <span className="hn-tool-emoji" aria-hidden="true">{tool.emoji}</span>
      </div>
      <div className="hn-tool-info">
        <div className="hn-tool-name">{tool.name}</div>
        <div className="hn-tool-desc">{tool.desc}</div>
      </div>
      {isActive ? (
        <div className="hn-tool-cta">
          <span className="hn-launch-btn">
            {tool.cta}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </div>
      ) : (
        <div className="hn-tool-cta">
          <span className="hn-soon-badge">Soon</span>
        </div>
      )}
    </div>
  )
}

// ── Main Home component ──
export default function Home({ onLaunch, theme, onToggleTheme }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const hour = time.getHours()
  const greeting = getGreeting()
  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="hn-root">
      {/* ── Top Bar ── */}
      <header className="hn-topbar">
        <div className="hn-topbar-brand">
          <div className="hn-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="hn-topbar-title">
            <span className="hn-brand-main">ManSula</span>
            <span className="hn-brand-sub">Nexus</span>
          </div>
        </div>
        <div className="hn-topbar-actions">
          <button
            className="hn-icon-btn"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
          <button className="hn-icon-btn hn-avatar-btn" aria-label="Profile">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </button>
        </div>
      </header>

      {/* ── Hero Greeting ── */}
      <div className="hn-hero">
        <div className="hn-hero-glow" aria-hidden="true" />
        <div className="hn-hero-glow hn-hero-glow-2" aria-hidden="true" />
        <div className="hn-hero-content">
          <div className="hn-time-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {timeStr} · {dateStr}
          </div>
          <h1 className="hn-greeting">
            {greeting}, Mansu <span aria-label="wave" role="img">
              {hour < 12 ? '🌤️' : hour < 17 ? '☀️' : '🌙'}
            </span>
          </h1>
          <p className="hn-tagline">Welcome back to your business hub</p>
          <QuickStats />
        </div>
      </div>

      {/* ── Tools Grid ── */}
      <div className="hn-body">
        <div className="hn-section-header">
          <h2 className="hn-section-title">Your Tools</h2>
          <span className="hn-section-badge">{TOOLS.filter(t => t.status === 'active').length} Active</span>
        </div>
        <div className="hn-tools-grid">
          {TOOLS.map(tool => (
            <ToolCard key={tool.id} tool={tool} onLaunch={onLaunch} />
          ))}
        </div>

        {/* Footer */}
        <div className="hn-footer">
          <div className="hn-footer-brand">ManSula Nexus</div>
          <div className="hn-footer-version">v1.6.0-alpha · POS &amp; Business Suite</div>
        </div>
      </div>
    </div>
  )
}
