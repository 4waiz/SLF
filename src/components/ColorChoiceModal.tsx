import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { DroneColorId } from '../types'
import { DRONE_COLORS } from '../data/steps'
import { PartImage } from './PartImage'

interface ColorChoiceModalProps {
  /** Pre-selected swatch when the modal opens. */
  initial?: DroneColorId
  onConfirm: (color: DroneColorId) => void
  onClose: () => void
}

/**
 * Build-start pop-up: the operator picks which colour-way to assemble
 * (Blue / Orange / Grey). The full-drone render updates live to the choice, then
 * "Start build" hands the colour to the assembly station.
 */
export function ColorChoiceModal({ initial = 'blue', onConfirm, onClose }: ColorChoiceModalProps) {
  const [color, setColor] = useState<DroneColorId>(initial)
  const active = DRONE_COLORS.find((c) => c.id === color) ?? DRONE_COLORS[0]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'Enter') onConfirm(color)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [color, onConfirm, onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="cc-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Choose drone colour"
        onClick={(e) => e.stopPropagation()}
        style={{ ['--cc-accent']: active.hex } as CSSProperties}
      >
        <header className="cc-modal-head">
          <span className="cc-modal-kicker">Build Line A · Quad Drone</span>
          <h2 className="cc-modal-title">Choose a body colour</h2>
          <button type="button" className="cc-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="cc-preview">
          <div className="cc-preview-glow" aria-hidden="true" />
          <PartImage img="full_drone" color={color} alt={`${active.name} drone`} className="cc-preview-img" />
          <span className="cc-preview-name">{active.name}</span>
        </div>

        <div className="cc-swatch-row" role="radiogroup" aria-label="Body colour">
          {DRONE_COLORS.map((c) => {
            const selected = c.id === color
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`cc-swatch${selected ? ' is-selected' : ''}`}
                onClick={() => setColor(c.id)}
              >
                <span className="cc-swatch-chip" style={{ background: c.hex }} />
                <span className="cc-swatch-name">{c.name}</span>
              </button>
            )
          })}
        </div>

        <div className="cc-modal-foot">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="cc-start-btn" onClick={() => onConfirm(color)}>
            Start {active.name} build →
          </button>
        </div>
      </div>
    </div>
  )
}
