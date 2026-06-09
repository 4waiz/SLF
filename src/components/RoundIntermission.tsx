interface RoundIntermissionProps {
  partCount: number
  onStartRound2: () => void
  onReview: () => void
}

/**
 * Shown when all parts pass Round 1 (mobile barcode scan). Confirms the round
 * and hands off to Round 2 (laptop camera / OCR re-verification).
 */
export function RoundIntermission({ partCount, onStartRound2, onReview }: RoundIntermissionProps) {
  return (
    <div className="completion-overlay" role="dialog" aria-modal="true" aria-label="Round 1 complete">
      <div className="completion-card">
        <div className="completion-glow" aria-hidden="true" />

        <span className="completion-check" aria-hidden="true">
          <svg viewBox="0 0 72 72" fill="none">
            <circle className="cc-ring" cx="36" cy="36" r="32" stroke="currentColor" strokeWidth="3" pathLength={1} />
            <path className="cc-tick" d="M22 37 L32 47 L51 26" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
          </svg>
        </span>

        <span className="round-kicker">Round 1 complete</span>
        <h2 className="completion-title">Mobile Scan Verified</h2>
        <p className="completion-summary mono">{partCount}/{partCount} parts scanned by phone</p>

        <p className="intermission-note">
          Next: <b>Round 2 — Laptop Scan</b>. Re-verify each part with the laptop camera (OCR) or a
          manual tick.
        </p>

        <button type="button" className="completion-btn" onClick={onStartRound2}>
          Start Round 2 — Laptop Scan →
        </button>
        <button type="button" className="intermission-review" onClick={onReview}>
          Back to review Round 1
        </button>
      </div>
    </div>
  )
}
