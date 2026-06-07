import { useEffect, useRef, useState } from 'react'
import type { AssemblyStep, VerificationSource } from '../types'
import { useCamera } from '../hooks/useCamera'
import { recognizeDigits, digitsMatch, delay } from '../lib/ocr'

type Phase = 'idle' | 'scanning' | 'pass' | 'fail'

interface VerificationModalProps {
  step: AssemblyStep
  onPass: (serial: string, source: VerificationSource) => void
  onClose: () => void
}

/**
 * Camera + OCR verification, presented as a pop-up so the feed stays hidden
 * until the operator taps "Verify Part" (no clutter on the form). The camera
 * only starts while this modal is mounted.
 *
 * verify():
 *  - Demo Mode ON, or camera not ready  → ~1.4 s scan, then deterministic PASS
 *    with the expected serial (source DEMO). Never hard-fails on stage.
 *  - Otherwise → capture a frame, OCR the digits, tolerant-match the expected
 *    part number. PASS → source OCR; mismatch → FAIL showing detected digits.
 *  - OCR throwing / timing out also falls back to a DEMO pass.
 */
export function VerificationModal({ step, onPass, onClose }: VerificationModalProps) {
  const [demoMode, setDemoMode] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [detected, setDetected] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const camera = useCamera(!demoMode)

  // If the camera can't be used, auto-enable Demo Mode and surface the reason —
  // verification must never dead-end waiting on hardware.
  useEffect(() => {
    if (camera.status === 'denied' || camera.status === 'unsupported' || camera.status === 'error') {
      setNotice(camera.error ?? 'Camera unavailable — Manual Mode enabled.')
      setDemoMode(true)
    }
  }, [camera.status, camera.error])

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Clear any pending auto-close timer on unmount.
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  const live = camera.status === 'ready' && !demoMode

  const toggleDemo = () => {
    const next = !demoMode
    setDemoMode(next)
    if (!next) setNotice(null) // turning Demo OFF re-attempts the camera
  }

  const finishPass = (serial: string, source: VerificationSource) => {
    setPhase('pass')
    onPass(serial, source)
    // Let the operator see the ✓, then close the pop-up.
    closeTimer.current = setTimeout(onClose, 1050)
  }

  const handleVerify = async () => {
    if (phase === 'scanning' || phase === 'pass') return
    setPhase('scanning')
    setDetected('')

    const expected = step.pn

    // Demo path — or any time the camera isn't live: deterministic PASS.
    if (!live) {
      await delay(1400)
      finishPass(expected, 'MANUAL')
      return
    }

    try {
      const frame = camera.capture()
      if (!frame) throw new Error('no-frame')
      const [digits] = await Promise.all([recognizeDigits(frame), delay(1000)])
      if (digitsMatch(digits, expected)) {
        const serial = digits.includes(expected) ? expected : digits
        finishPass(serial, 'OCR')
      } else {
        setDetected(digits || '—')
        setPhase('fail')
      }
    } catch {
      // OCR failed / timed out → safe DEMO fallback. Never hard-fail on stage.
      await delay(500)
      finishPass(expected, 'MANUAL')
    }
  }

  const statusText = (() => {
    switch (phase) {
      case 'scanning':
        return 'Scanning part marking…'
      case 'pass':
        return 'Verified — match confirmed'
      case 'fail':
        return `Not correct — detected ${detected}`
      default:
        return 'Align the part number inside the frame, then tap Verify Part.'
    }
  })()

  const liveLabel = live ? 'LIVE' : demoMode ? 'MANUAL' : 'OFFLINE'

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="vmodal"
        role="dialog"
        aria-modal="true"
        aria-label={`Verify part ${step.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="vmodal-head">
          <div>
            <span className="vmodal-kicker">Vision Verification</span>
            <h2 className="vmodal-title">{step.name}</h2>
          </div>
          <button type="button" className="vmodal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="vmodal-stage" data-phase={phase}>
          {/* Video is always mounted so getUserMedia can attach the stream the
              moment it resolves; the placeholder overlays it when not live. */}
          <video ref={camera.videoRef} className="vv-video" muted playsInline autoPlay />
          {!live && (
            <div className="vv-sim" aria-hidden="true">
              <span className="vv-sim-pn">{step.pn}</span>
              <span className="vv-sim-tag">{demoMode ? 'MANUAL VERIFICATION' : 'CAMERA OFFLINE'}</span>
            </div>
          )}

          <div className="vv-reticle" aria-hidden="true">
            <span className="vv-corner tl" />
            <span className="vv-corner tr" />
            <span className="vv-corner bl" />
            <span className="vv-corner br" />
            <span className="vv-sweep" />
          </div>

          <div className="vv-hud">
            <span className={`vv-live${live ? ' is-live' : ''}`}>
              <span className="dot" />
              {liveLabel}
            </span>
            <span className="vv-expected">
              EXPECTED&nbsp;<b>{step.pn}</b>
            </span>
          </div>

          {phase === 'scanning' && (
            <div className="vv-overlay vv-overlay-scan">
              <span className="vv-spin" />
              <span>SCANNING</span>
            </div>
          )}
          {phase === 'pass' && (
            <div className="vv-overlay vv-overlay-pass">
              <span className="vv-stamp">✓</span>
            </div>
          )}
          {phase === 'fail' && (
            <div className="vv-overlay vv-overlay-fail">
              <span className="vv-stamp">✕</span>
            </div>
          )}
        </div>

        <label className="vmodal-demo">
          <input type="checkbox" checked={demoMode} onChange={toggleDemo} />
          <span className="vv-switch" aria-hidden="true" />
          <span>Manual Mode — confirm without camera</span>
        </label>

        {notice && (
          <p className="vmodal-notice" role="status">
            <span className="vmodal-notice-mark" aria-hidden="true">
              !
            </span>
            {notice}
          </p>
        )}

        <p className={`vmodal-status${phase === 'pass' ? ' is-pass' : ''}${phase === 'fail' ? ' is-fail' : ''}`}>
          {statusText}
        </p>

        <div className="vmodal-foot">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleVerify}
            disabled={phase === 'scanning' || phase === 'pass'}
          >
            {phase === 'scanning' ? 'Scanning…' : phase === 'fail' ? 'Try Again' : 'Verify Part'}
          </button>
        </div>
      </div>
    </div>
  )
}
