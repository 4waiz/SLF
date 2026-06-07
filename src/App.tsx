import { useState } from 'react'
import { LoginScreen } from './components/LoginScreen'
import { IntroScreen } from './components/IntroScreen'
import { AssemblyStation } from './components/AssemblyStation'

type View = 'login' | 'home' | 'station'

export default function App() {
  const [view, setView] = useState<View>('login')

  return (
    <div className="app">
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-grain" aria-hidden="true" />

      {view === 'login' && <LoginScreen onLogin={() => setView('home')} />}
      {view === 'home' && <IntroScreen onStart={() => setView('station')} />}
      {view === 'station' && <AssemblyStation onExit={() => setView('home')} />}
    </div>
  )
}
