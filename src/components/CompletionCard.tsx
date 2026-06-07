interface CompletionCardProps {
  stageCount: number
  unitSerial: string
  onRestart: () => void
}

/**
 * Overlay shown when all stages are verified. Summarises the build and serialises
 * the finished unit, then offers a clean reset.
 */
export function CompletionCard({ stageCount, unitSerial, onRestart }: CompletionCardProps) {
  return (
    <div className="completion-overlay" role="dialog" aria-modal="true" aria-label="Build verified">
      <div className="completion-card">
        <div className="completion-glow" aria-hidden="true" />

        <span className="completion-check" aria-hidden="true">
          <svg viewBox="0 0 72 72" fill="none">
            <circle className="cc-ring" cx="36" cy="36" r="32" stroke="currentColor" strokeWidth="3" pathLength={1} />
            <path className="cc-tick" d="M22 37 L32 47 L51 26" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
          </svg>
        </span>

        <h2 className="completion-title">Build Verified</h2>
        <p className="completion-summary mono">
          {stageCount}/{stageCount} stages · 0 defects · 1 unit serialised
        </p>

        <div className="completion-serial">
          <span className="completion-serial-label">Unit Serial</span>
          <strong className="completion-serial-value mono">{unitSerial}</strong>
        </div>

        <button type="button" className="completion-btn" onClick={onRestart}>
          Start New Build
        </button>
      </div>
    </div>
  )
}
