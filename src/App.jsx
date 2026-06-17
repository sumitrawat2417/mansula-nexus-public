import { useState, useEffect } from 'react'
import Home from './Home.jsx'
import POS from './POS.jsx'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [theme, setTheme] = useState(() => localStorage.getItem('mn-theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('mn-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  if (screen === 'pos') {
    return <POS onExit={() => setScreen('home')} />
  }

  return (
    <Home
      onLaunch={setScreen}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  )
}
