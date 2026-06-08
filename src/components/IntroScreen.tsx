import { useState } from 'react'
import type { DroneColorId } from '../types'
import { steps } from '../data/steps'
import { ColorChoiceModal } from './ColorChoiceModal'

interface IntroScreenProps {
  onStart: (color: DroneColorId) => void
}

/**
 * Post-login home: BRIDGE mark + the two product entries.
 * Logo → subtitle → buttons fade/rise in on a staggered timeline. Tapping
 * "Assemble Drone" opens the colour-choice pop-up before the build begins.
 */
export function IntroScreen({ onStart }: IntroScreenProps) {
  const [picking, setPicking] = useState(false)

  return (
    <div className="intro">
      <div className="intro-aurora" aria-hidden="true" />

      <main className="intro-stack">
        <img
          src="/darksvg.png"
          alt="BRIDGE"
          className="brand-img brand-lg intro-rise"
          style={{ animationDelay: '0.05s' }}
        />
        <p className="subtitle intro-rise" style={{ animationDelay: '0.3s' }}>
          SLF · Digital Work Instructions
        </p>

        <div className="intro-rise intro-actions" style={{ animationDelay: '0.55s' }}>
          <button type="button" className="product-btn is-primary" onClick={() => setPicking(true)}>
            <span className="product-btn-kicker">Build Line A</span>
            <span className="product-btn-title">Assemble Drone</span>
            <span className="product-btn-meta">{steps.length} parts · vision-verified</span>
          </button>

          <button type="button" className="product-btn is-locked" disabled aria-disabled="true">
            <span className="product-btn-badge">Coming soon</span>
            <span className="product-btn-kicker">Build Line B</span>
            <span className="product-btn-title">RC Racer</span>
            <span className="product-btn-meta">Not yet provisioned</span>
          </button>
        </div>

        <footer className="intro-rise intro-foot" style={{ animationDelay: '0.8s' }}>
          <span className="dot-live" />
          BRIDGE Station Platform · v1.0
        </footer>
      </main>

      {picking && (
        <ColorChoiceModal
          onConfirm={(color) => {
            setPicking(false)
            onStart(color)
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  )
}
