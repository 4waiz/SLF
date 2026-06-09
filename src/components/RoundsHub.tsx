import { useState } from 'react'
import { useMobileLink, MOBILE_PORT } from '../lib/mobileLink'
import { steps } from '../data/steps'

interface RoundsHubProps {
  /** Open the station in the chosen round (1 = mobile scan, 2 = laptop scan). */
  onStartRound: (round: 1 | 2) => void
  /** Back to the home / product screen. */
  onBack: () => void
}

/**
 * Rounds hub — pick either round (they're independent passes over the 26 parts):
 *   Round 1 — Mobile Barcode Scan (needs a phone signed in; gated until then).
 *   Round 2 — Laptop Scan (the existing camera/OCR flow; no phone needed).
 */
export function RoundsHub({ onStartRound, onBack }: RoundsHubProps) {
  const { connected, signedIn, urls, serverUrl } = useMobileLink()
  const [qrFailed, setQrFailed] = useState(false)

  const phoneUrl = urls[0]
  const status = !connected ? 'down' : signedIn ? 'ready' : 'waiting'
  const statusText =
    status === 'down'
      ? 'Waiting for the scan server…'
      : status === 'waiting'
        ? 'Waiting for phone sign-in…'
        : 'Phone signed in — ready'

  return (
    <div className="rounds">
      <div className="intro-aurora" aria-hidden="true" />

      <header className="rounds-head">
        <img src="/animated%20logo.gif" alt="BRIDGE" className="brand-img rounds-logo" />
        <p className="subtitle">Vortex Production Line · Two-Round Verification</p>
      </header>

      <main className="rounds-two">
        {/* ============================ ROUND 1 ============================ */}
        <section className="round-card">
          <span className="round-kicker">Round 1</span>
          <h2 className="round-title">Mobile Barcode Scan</h2>
          <p className="round-desc">
            Use your phone as the scanner. The laptop shows each of the {steps.length} parts in turn;
            scan that part's barcode and it ticks off here.
          </p>

          {/* Connect the phone */}
          <div className="round-join">
            <div className="round-qr">
              {!qrFailed ? (
                <img
                  src={`${serverUrl}/qr`}
                  alt="QR code to open the mobile scanner"
                  onError={() => setQrFailed(true)}
                />
              ) : (
                <div className="round-qr-fallback">QR unavailable</div>
              )}
            </div>
            <div className="round-join-text">
              <span className="round-join-label">Open on your phone</span>
              <code className="round-url">{phoneUrl ?? `https://<laptop-ip>:${MOBILE_PORT}`}</code>
              <span className="round-join-hint">
                Same Wi-Fi · accept the warning · sign in (Operator / 123).
              </span>
            </div>
          </div>

          <div className={`gate-status is-${status}`} role="status">
            <span className="gate-status-dot" />
            {statusText}
          </div>

          <button
            type="button"
            className="round-open-btn"
            disabled={!signedIn}
            onClick={() => onStartRound(1)}
          >
            {signedIn ? 'Start Round 1 →' : 'Sign in on the phone to start'}
          </button>
        </section>

        {/* ============================ ROUND 2 ============================ */}
        <section className="round-card">
          <span className="round-kicker">Round 2</span>
          <h2 className="round-title">Laptop Scan</h2>
          <p className="round-desc">
            Verify each of the {steps.length} parts with the laptop camera (OCR) or a manual tick —
            the original on-screen flow. No phone needed.
          </p>

          <div className="round-r2-art" aria-hidden="true">
            <span className="round-r2-emoji">🖥️</span>
            <span className="round-r2-cap">Vision-verified assembly · {steps.length} steps</span>
          </div>

          <button type="button" className="round-open-btn is-alt" onClick={() => onStartRound(2)}>
            Start Round 2 →
          </button>
        </section>
      </main>

      <footer className="rounds-bottom">
        <button type="button" className="rounds-back" onClick={onBack}>
          ‹ Back
        </button>
      </footer>
    </div>
  )
}
