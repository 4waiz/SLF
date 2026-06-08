import type { VerificationRecord } from '../types'
import { DRONE_COLORS } from '../data/steps'

interface TraceabilityLogProps {
  records: VerificationRecord[]
  operator: string
}

// Map body-colour names → hex so the log can render an accurate swatch.
const COLOR_HEX: Record<string, string> = Object.fromEntries(
  DRONE_COLORS.map((c) => [c.name, c.hex] as const),
)

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', { hour12: false })
}

/**
 * Right-rail live traceability log. Newest event on top. Each row carries
 * operator, stage, detected serial, OCR/DEMO source, optional colour, timestamp.
 */
export function TraceabilityLog({ records, operator }: TraceabilityLogProps) {
  const ordered = [...records].reverse()

  return (
    <section className={`rail trace-log${ordered.length === 0 ? ' is-empty' : ''}`} aria-label="Traceability log">
      <header className="rail-head">
        <span className="rail-kicker">Genealogy</span>
        <h2 className="rail-title">Traceability Log</h2>
        <p className="rail-sub mono">
          {records.length} {records.length === 1 ? 'event' : 'events'} · operator {operator}
        </p>
      </header>

      {ordered.length > 0 && (
        <ol className="log-list">
          {ordered.map((r) => (
            <li className="log-row" key={`${r.stepId}-${r.timestamp}`}>
              <div className="log-row-top">
                <span className="log-time mono">{formatTime(r.timestamp)}</span>
                <span className="log-stage">{r.stepName}</span>
                <span className={`log-src src-${r.source.toLowerCase()}`}>{r.source}</span>
              </div>
              <div className="log-row-bot">
                <span className="log-serial mono">{r.serial}</span>
                <span className="log-op mono">{operator}</span>
                {r.color && (
                  <span className="log-color">
                    <span className="log-swatch" style={{ background: COLOR_HEX[r.color] ?? '#8a94a6' }} aria-hidden="true" />
                    {r.color}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
