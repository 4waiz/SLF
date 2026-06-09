import { forwardRef, useState } from 'react'
import type { AssemblyStep, DroneColorId, VerificationRecord } from '../types'
import { PartImage } from './PartImage'

interface StageSectionProps {
  step: AssemblyStep
  index: number
  /** Part picked / verified (checkbox ticked or OCR passed). */
  completed: boolean
  /** The current frontier section the operator should be working on. */
  active: boolean
  /** Round 1 = verify by mobile barcode scan; Round 2 = laptop camera/OCR. */
  round: 1 | 2
  record?: VerificationRecord
  /** The colour-way being built — selects which part render to show. */
  color: DroneColorId
  /** Manual tick / untick of the BOM checkbox. */
  onToggleCheck: (checked: boolean) => void
  /** Opens the camera/OCR pop-up for this section (Round 2 only). */
  onVerify: () => void
  /** Opens the media lightbox at the given slide (0 = image, 1 = clip). */
  onOpenMedia: (slide: number) => void
}

/**
 * One section of the single-page production form. Top-to-bottom:
 * numbered title + status icon → light media band (part render + clip thumb) →
 * description (collapsible) → BOM row with tick-box → camera/OCR verify row.
 * Matches the reference MES section card; the part image follows the colour the
 * operator chose at build-start.
 */
export const StageSection = forwardRef<HTMLElement, StageSectionProps>(function StageSection(
  { step, index, completed, active, round, record, color, onToggleCheck, onVerify, onOpenMedia },
  ref,
) {
  // Round 1 verifies by mobile scan (no laptop camera). The active, not-yet-done
  // part is the one the phone should scan next.
  const awaitingScan = round === 1 && active && !completed
  const [showDesc, setShowDesc] = useState(true)
  const sku = step.code.split(' · ')[1] ?? step.code

  const classes = ['psection']
  if (completed) classes.push('is-done')
  if (active) classes.push('is-active')

  return (
    <article
      ref={ref}
      id={`section-${index}`}
      className={classes.join(' ')}
      aria-label={`Section ${index + 1}: ${step.name}`}
    >
      {/* Title + status */}
      <header className="psection-head">
        <h2 className="psection-title">
          {index + 1}) {step.name}
        </h2>
        <span className={`psection-status${completed ? ' is-done' : ''}`} aria-hidden="true">
          {completed ? (
            <svg viewBox="0 0 24 24">
              <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <path d="M6 3 h12 M6 21 h12 M7 3 c0 5 4 6 5 9 c1 -3 5 -4 5 -9 M7 21 c0 -5 4 -6 5 -9 c1 3 5 4 5 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </header>

      <div className="psection-body">
        {/* Media band — part render + assembly clip thumbnail */}
        <div className="media-band">
          <button type="button" className="media-thumb" onClick={() => onOpenMedia(0)} aria-label={`Open reference image for ${step.name}`}>
            <PartImage img={step.img} color={color} alt={step.name} />
            <span className="media-tag mono">REF</span>
          </button>
          <button type="button" className="media-thumb media-video" onClick={() => onOpenMedia(1)} aria-label={`Play assembly clip for ${step.name}`}>
            <PartImage img={step.img} color={color} alt="" className="is-dim" />
            <span className="media-play" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M8 5.5 L8 18.5 L19 12 Z" fill="currentColor" />
              </svg>
            </span>
          </button>
        </div>

        {/* Description (collapsible like the reference) */}
        {showDesc && <p className="psection-desc">{step.instruction}</p>}
        <button type="button" className="desc-toggle" onClick={() => setShowDesc((v) => !v)}>
          {showDesc ? 'Hide Description' : 'Show Description'}
        </button>

        {/* BOM row — tick-box marks the part as picked (Poka-yoke) */}
        <button
          type="button"
          className={`bom-row${completed ? ' is-verified' : ''}`}
          onClick={() => onToggleCheck(!completed)}
          aria-pressed={completed}
        >
          <span className={`bom-check${completed ? ' is-checked' : ''}`} aria-hidden="true">
            {completed && (
              <svg viewBox="0 0 24 24">
                <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span className="bom-thumb">
            <PartImage img={step.img} color={color} alt={step.name} />
          </span>
          <span className="bom-info">
            <span className="bom-name">{step.name}</span>
            <span className="bom-code mono">
              {sku} {step.name}
            </span>
          </span>
          <span className="bom-qty mono">{step.qty}</span>
        </button>

        {/* Verify row — Round 1: mobile barcode scan · Round 2: laptop camera/OCR */}
        <div className="verify-block">
          <div className={`serial-field${completed ? ' is-ok' : ''}`}>
            <span className="serial-icon" aria-hidden="true">
              {round === 1 ? (
                <svg viewBox="0 0 24 24">
                  <rect x="6" y="3" width="12" height="18" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M10 6 h4 M11 18 h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="6" width="18" height="13" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 6 L9.5 3.5 L14.5 3.5 L16 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <circle cx="12" cy="12.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              )}
            </span>
            <div className="serial-content">
              <span className="serial-label">{round === 1 ? 'Mobile scan' : 'Detected serial'}</span>
              <span className="serial-value mono">
                {completed && record
                  ? record.serial
                  : round === 1
                    ? awaitingScan
                      ? 'Waiting for phone scan…'
                      : 'Scan in order'
                    : 'Not scanned yet'}
              </span>
            </div>
            {completed && record && <span className={`serial-source src-${record.source.toLowerCase()}`}>{record.source}</span>}
          </div>

          {round === 1 ? (
            // Round 1: status only — verification arrives from the phone (no click).
            <div
              className={`scan-status-btn${completed ? ' is-done' : awaitingScan ? ' is-armed' : ''}`}
              aria-live="polite"
            >
              <span className="verify-btn-icon" aria-hidden="true">
                {completed ? '✓' : awaitingScan ? <span className="scan-pulse" /> : '⦿'}
              </span>
              {completed ? 'Verified by mobile' : 'Verify using Mobile Scanner'}
            </div>
          ) : (
            // Round 2: the existing laptop camera / OCR pop-up.
            <button type="button" className={`verify-btn${completed ? ' is-done' : ''}`} onClick={onVerify}>
              <span className="verify-btn-icon" aria-hidden="true">
                {completed ? '↻' : '⦿'}
              </span>
              {completed ? 'Re-scan' : 'Verify Part'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
})
