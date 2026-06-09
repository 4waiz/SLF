import { useState } from 'react'
import { useMobileLink, MOBILE_PORT } from '../lib/mobileLink'
import { steps } from '../data/steps'

interface RoundsHubProps {
  /** Enter the station (Round 1) once the phone is linked. */
  onProceed: () => void
  /** Back to the home / product screen. */
  onBack: () => void
}

/**
 * Connect gate shown after sign-in. Round 1 turns the phone into the barcode
 * scanner, so the operator must connect + sign in on the phone here first —
 * "Proceed" stays disabled until a phone has signed in. After that:
 *   Round 1 — scan each of the 26 parts with the phone.
 *   Round 2 — re-verify each part with the laptop camera (the existing flow).
 */
export function RoundsHub({ onProceed, onBack }: RoundsHubProps) {
  const { connected, signedIn, urls, serverUrl } = useMobileLink()
  const [qrFailed, setQrFailed] = useState(false)

  const phoneUrl = urls[0]
  const status = !connected ? 'down' : signedIn ? 'ready' : 'waiting'
  const statusText =
    status === 'down'
      ? 'Waiting for the scan server…'
      : status === 'waiting'
        ? 'Waiting for phone sign-in…'
        : 'Phone signed in — ready to start'

  return (
    <div className="rounds">
      <div className="intro-aurora" aria-hidden="true" />

      <header className="rounds-head">
        <img src="/animated%20logo.gif" alt="BRIDGE" className="brand-img rounds-logo" />
        <p className="subtitle">SLF · Two-Round Verification</p>
      </header>

      <main className="gate">
        <section className="gate-card">
          <span className="round-kicker">Step 1 · Connect</span>
          <h2 className="round-title">Connect your phone</h2>
          <p className="round-desc">
            Round 1 uses your phone as the barcode scanner. Open the link, sign in on the phone, then
            press Proceed.
          </p>

          {/* QR + URL to open the scanner on the phone */}
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
                Same Wi-Fi · accept the one-time security warning · sign in (Operator / 123).
              </span>
            </div>
          </div>

          {/* Link status — gates the Proceed button */}
          <div className={`gate-status is-${status}`} role="status">
            <span className="gate-status-dot" />
            {statusText}
          </div>

          <button type="button" className="round-open-btn" disabled={!signedIn} onClick={onProceed}>
            {signedIn ? 'Proceed to Round 1 →' : 'Sign in on the phone to continue'}
          </button>

          {/* What the two rounds are */}
          <ol className="gate-rounds">
            <li>
              <span className="gate-round-no">1</span>
              <span>
                <b>Mobile Barcode Scan</b> — scan each of the {steps.length} parts with your phone.
              </span>
            </li>
            <li>
              <span className="gate-round-no">2</span>
              <span>
                <b>Laptop Scan</b> — re-verify each part with the laptop camera (existing flow).
              </span>
            </li>
          </ol>
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
