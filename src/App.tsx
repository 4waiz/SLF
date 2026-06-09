import { useState } from 'react'
import type { DroneColorId } from './types'
import { LoginScreen } from './components/LoginScreen'
import { IntroScreen } from './components/IntroScreen'
import { RoundsHub } from './components/RoundsHub'
import { AssemblyStation } from './components/AssemblyStation'

// login → home → rounds (Round 1 mobile scan + launch Round 2) → station (Round 2)
type View = 'login' | 'home' | 'rounds' | 'station'

export default function App() {
  const [view, setView] = useState<View>('login')
  const [color, setColor] = useState<DroneColorId>('blue')
  // Which round the station opens in — chosen on the Rounds hub.
  const [stationRound, setStationRound] = useState<1 | 2>(1)

  return (
    <div className="app">
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-grain" aria-hidden="true" />

      {view === 'login' && <LoginScreen onLogin={() => setView('home')} />}
      {view === 'home' && (
        <IntroScreen
          onStart={(c) => {
            setColor(c)
            setView('rounds')
          }}
        />
      )}
      {view === 'rounds' && (
        <RoundsHub
          onStartRound={(r) => {
            setStationRound(r)
            setView('station')
          }}
          onBack={() => setView('home')}
        />
      )}
      {view === 'station' && (
        <AssemblyStation initialColor={color} initialRound={stationRound} onExit={() => setView('rounds')} />
      )}
    </div>
  )
}
