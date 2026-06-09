interface RoundIntermissionProps {
  partCount: number
  onBackToRounds: () => void
  onReview: () => void
}

/**
 * Shown when all parts pass Round 1 (mobile barcode scan). The two rounds are
 * independent, so this hands control back to the Rounds hub where Round 2
 * (laptop camera / OCR) can be started.
 */
export function RoundIntermission({ partCount, onBackToRounds, onReview }: RoundIntermissionProps) {
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
          Both rounds are independent. Head back to the hub to start <b>Round 2 — Laptop Scan</b>
          whenever you're ready.
        </p>

        <button type="button" className="completion-btn" onClick={onBackToRounds}>
          Back to Rounds →
        </button>
        <button type="button" className="intermission-review" onClick={onReview}>
          Stay and review Round 1
        </button>
      </div>
    </div>
  )
}
