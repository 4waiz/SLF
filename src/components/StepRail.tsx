import type { AssemblyStep } from '../types'

interface StepRailProps {
  steps: AssemblyStep[]
  completed: boolean[]
  activeIndex: number
  onSelect: (index: number) => void
}

/**
 * Left rail vertical stepper. Completed stages are re-openable; the current
 * frontier is active; everything ahead is locked and non-interactive.
 */
export function StepRail({ steps, completed, activeIndex, onSelect }: StepRailProps) {
  const frontier = completed.findIndex((c) => !c) // -1 once every stage is done

  return (
    <nav className="rail step-rail" aria-label="Assembly stages">
      <header className="rail-head">
        <span className="rail-kicker">Stages</span>
        <h2 className="rail-title">Quad Drone Build</h2>
      </header>

      <ol className="step-list">
        {steps.map((step, i) => {
          const done = completed[i]
          const isFrontier = i === frontier
          const active = i === activeIndex
          const locked = !done && !isFrontier
          const clickable = done || isFrontier

          const classes = ['step-item']
          if (done) classes.push('is-done')
          if (active) classes.push('is-active')
          if (locked) classes.push('is-locked')

          return (
            <li key={step.id} className={classes.join(' ')}>
              <button
                type="button"
                className="step-btn"
                onClick={() => {
                  if (clickable) onSelect(i)
                }}
                disabled={!clickable}
                aria-current={active ? 'step' : undefined}
              >
                <span className="step-marker">
                  {done ? (
                    <span className="step-check">✓</span>
                  ) : locked ? (
                    <svg className="step-lock" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M7 11V8a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <rect x="5" y="11" width="14" height="9" rx="2.5" fill="currentColor" />
                    </svg>
                  ) : (
                    <span className="step-num">{i + 1}</span>
                  )}
                </span>

                <span className="step-text">
                  <span className="step-name">{step.name}</span>
                  <span className="step-code mono">{step.code.split(' · ')[1] ?? step.code}</span>
                </span>

                <span className="step-state" aria-hidden="true">
                  {done ? 'Done' : active ? 'Active' : locked ? 'Locked' : 'Ready'}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
