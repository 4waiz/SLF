import type { AssemblyStep, VerificationRecord } from '../types'
import { PartFigure } from './PartFigure'
import { VideoContainer } from './VideoContainer'

interface InstructionPanelProps {
  step: AssemblyStep
  index: number
  total: number
  verified: boolean
  record?: VerificationRecord
  selectedColorName: string
  onSelectColor: (name: string) => void
  /** Opens the camera verification pop-up. */
  onVerify: () => void
  onConfirm: () => void
}

/**
 * Plain-white production form for one stage. Top-to-bottom:
 * numbered title → reference image → BOM row (checkbox ticks on verify) →
 * instruction → (canopy colour) → serial + Verify Part (opens the camera
 * pop-up) → VIDEO → Confirm & Continue.
 */
export function InstructionPanel({
  step,
  index,
  total,
  verified,
  record,
  selectedColorName,
  onSelectColor,
  onVerify,
  onConfirm,
}: InstructionPanelProps) {
  const selectedColor = step.colors?.find((c) => c.name === selectedColorName)
  const figAccent = selectedColor?.hex ?? step.accent
  const sku = step.code.split(' · ')[1] ?? step.code

  return (
    <article className="form" aria-label={`Stage ${index + 1}: ${step.name}`}>
      {/* 1 · Stage number + title */}
      <h2 className="form-step-title">
        {index + 1}) {step.name}
      </h2>

      {/* 2 · Reference image */}
      <div className="ref-stage">
        <PartFigure kind={step.fig} accent={figAccent} className="ref-fig" />
        <span className="ref-tag">REF · {sku}</span>
      </div>

      {/* 3 · Part / BOM row */}
      <div className={`bom-row${verified ? ' is-verified' : ''}`}>
        <span
          className={`bom-check${verified ? ' is-checked' : ''}`}
          role="checkbox"
          aria-checked={verified}
          aria-label={verified ? 'Part verified' : 'Part not yet verified'}
        >
          {verified && (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <div className="bom-thumb">
          <PartFigure kind={step.fig} accent={figAccent} />
        </div>
        <div className="bom-info">
          <span className="bom-name">{step.name}</span>
          <span className="bom-code mono">{sku}</span>
        </div>
        <span className="bom-qty mono">{step.qty}</span>
      </div>

      {/* 4 · Instruction */}
      <p className="form-instruction">{step.instruction}</p>

      {/* 5 · Colour picker (canopy stage only) */}
      {step.colors && (
        <div className="color-picker">
          <span className="cp-label">Body finish</span>
          <div className="cp-swatches">
            {step.colors.map((c) => {
              const isSelected = c.name === selectedColorName
              return (
                <button
                  key={c.name}
                  type="button"
                  className={`cp-swatch${isSelected ? ' is-selected' : ''}`}
                  onClick={() => onSelectColor(c.name)}
                  aria-pressed={isSelected}
                >
                  <span className="cp-chip" style={{ background: c.hex }} />
                  <span className="cp-name">{c.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 6 · Serial + Verify Part (opens the camera pop-up) */}
      <div className="verify-block">
        <div className={`serial-field${verified ? ' is-ok' : ''}`}>
          <span className="serial-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="6" width="18" height="13" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 6 L9.5 3.5 L14.5 3.5 L16 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <circle cx="12" cy="12.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </span>
          <div className="serial-content">
            <span className="serial-label">Detected serial</span>
            <span className="serial-value mono">{verified && record ? record.serial : 'Not scanned yet'}</span>
          </div>
          {verified && record && <span className={`serial-source src-${record.source.toLowerCase()}`}>{record.source}</span>}
        </div>
        <button type="button" className={`verify-btn${verified ? ' is-done' : ''}`} onClick={onVerify}>
          <span className="verify-btn-icon" aria-hidden="true">
            {verified ? '↻' : '⦿'}
          </span>
          {verified ? 'Re-scan' : 'Verify Part'}
        </button>
      </div>

      {/* 7 · Video — directly below the verification block (required placement) */}
      <VideoContainer step={step} />

      {/* 8 · Confirm & Continue */}
      <div className="confirm-row">
        <span className="confirm-progress mono">
          Stage {index + 1} of {total}
        </span>
        <button type="button" className="confirm-btn" disabled={!verified} onClick={onConfirm}>
          Confirm &amp; Continue
          <span className="confirm-arrow" aria-hidden="true">
            →
          </span>
        </button>
      </div>
      {!verified && <p className="confirm-hint">Verify the part to unlock “Confirm &amp; Continue”.</p>}
    </article>
  )
}
