import { useEffect, useMemo, useRef, useState } from 'react'
import type { VerificationRecord, VerificationSource } from '../types'
import { steps, OPERATOR, STATION_ID, WORK_ORDER } from '../data/steps'
import { recordsService } from '../lib/records'
import { StepRail } from './StepRail'
import { InstructionPanel } from './InstructionPanel'
import { TraceabilityLog } from './TraceabilityLog'
import { CompletionCard } from './CompletionCard'
import { VerificationModal } from './VisionVerification'

interface AssemblyStationProps {
  onExit: () => void
}

const DEFAULT_COLOR = steps.find((s) => s.colors)?.colors?.[0]?.name ?? ''
const UNIT_SERIAL = `BRG-DRN-${WORK_ORDER.slice(-4)}-01`

/**
 * Assembly station: a plain-white, single-stage production form. The stage list
 * and traceability log live in the ☰ drawer (kept off-screen for an uncluttered
 * worker view); the camera verification is a pop-up opened from "Verify Part".
 */
export function AssemblyStation({ onExit }: AssemblyStationProps) {
  const [completed, setCompleted] = useState<boolean[]>(() => steps.map(() => false))
  const [activeIndex, setActiveIndex] = useState(0)
  const [records, setRecords] = useState<VerificationRecord[]>([])
  const [selectedColorName, setSelectedColorName] = useState<string>(DEFAULT_COLOR)
  const [hydrated, setHydrated] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const scrollRef = useRef<HTMLElement>(null)

  // Restore any in-progress build from IndexedDB on mount (survives reload).
  useEffect(() => {
    let alive = true
    recordsService
      .list()
      .then((recs) => {
        if (!alive) return
        setRecords(recs)
        const done = steps.map((s) => recs.some((r) => r.stepId === s.id))
        setCompleted(done)
        const restoredColor = recs.find((r) => r.color)?.color
        if (restoredColor) setSelectedColorName(restoredColor)
        const firstIncomplete = done.findIndex((d) => !d)
        setActiveIndex(firstIncomplete === -1 ? steps.length - 1 : firstIncomplete)
      })
      .catch(() => {
        // Unreadable store → start a fresh build.
      })
      .finally(() => {
        if (alive) setHydrated(true)
      })
    return () => {
      alive = false
    }
  }, [])

  // Snap the form back to the top whenever the stage changes.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [activeIndex])

  const activeStep = steps[activeIndex]
  const doneCount = completed.filter(Boolean).length
  const allDone = hydrated && doneCount === steps.length
  const progressPct = `${(doneCount / steps.length) * 100}%`
  const formId = `${WORK_ORDER}.ASSY-${String(activeIndex + 1).padStart(2, '0')}`

  const activeRecord = useMemo(
    () => records.find((r) => r.stepId === activeStep.id),
    [records, activeStep.id],
  )

  const handlePass = (serial: string, source: VerificationSource) => {
    const step = steps[activeIndex]
    const record: VerificationRecord = {
      stepId: step.id,
      stepName: step.name,
      serial,
      source,
      color: step.colors ? selectedColorName : undefined,
      timestamp: Date.now(),
    }
    setCompleted((prev) => prev.map((c, i) => (i === activeIndex ? true : c)))
    setRecords((prev) => [...prev.filter((r) => r.stepId !== step.id), record])
    void recordsService.add(record).catch(() => undefined)
  }

  const handleConfirm = () => {
    if (!completed[activeIndex]) return
    const next = activeIndex + 1
    if (next < steps.length) setActiveIndex(next)
  }

  const handleSelectStage = (i: number) => {
    setActiveIndex(i)
    setMenuOpen(false)
  }

  const handleRestart = () => {
    void recordsService.clear().catch(() => undefined)
    setRecords([])
    setCompleted(steps.map(() => false))
    setActiveIndex(0)
    setSelectedColorName(DEFAULT_COLOR)
    setMenuOpen(false)
  }

  return (
    <div className="station">
      {/* Top bar */}
      <header className="topbar">
        <button type="button" className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>
        <nav className="crumb" aria-label="Breadcrumb">
          <span className="crumb-wo mono">{WORK_ORDER}</span>
          <span className="crumb-sep">›</span>
          <span className="crumb-mid">Drone Line</span>
          <span className="crumb-sep">›</span>
          <span className="crumb-cur">Quad Build</span>
        </nav>
        <div className="topbar-right">
          <span className="topbar-stage mono">{doneCount}/{steps.length}</span>
          <button type="button" className="brand-btn" onClick={onExit} aria-label="Back to home">
            <img src="/darksvg.png" alt="BRIDGE" className="topbar-logo" />
          </button>
        </div>
      </header>

      {/* Single-stage production form */}
      <main className="form-scroll" ref={scrollRef}>
        <div className="formbar">
          <span className="formbar-id mono">{formId}</span>
          <span className="formbar-name"> / Drone Production Form</span>
        </div>

        <InstructionPanel
          key={activeStep.id}
          step={activeStep}
          index={activeIndex}
          total={steps.length}
          verified={completed[activeIndex]}
          record={activeRecord}
          selectedColorName={selectedColorName}
          onSelectColor={setSelectedColorName}
          onVerify={() => setVerifyOpen(true)}
          onConfirm={handleConfirm}
        />
      </main>

      {/* ☰ Drawer: stage list + traceability log */}
      <div
        className={`drawer-scrim${menuOpen ? ' is-open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <aside className={`drawer${menuOpen ? ' is-open' : ''}`} aria-hidden={!menuOpen}>
        <header className="drawer-head">
          <img src="/darksvg.png" alt="BRIDGE" className="drawer-logo" />
          <button type="button" className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            ✕
          </button>
        </header>

        <div className="drawer-meta">
          <span>{STATION_ID}</span>
          <span>·</span>
          <span>{OPERATOR}</span>
        </div>

        <section className="drawer-progress">
          <div className="dp-top">
            <span>Stage {Math.min(activeIndex + 1, steps.length)} of {steps.length}</span>
            <span className="mono">{doneCount}/{steps.length}</span>
          </div>
          <div className="dp-track">
            <div className="dp-fill" style={{ width: progressPct }} />
          </div>
        </section>

        <StepRail steps={steps} completed={completed} activeIndex={activeIndex} onSelect={handleSelectStage} />
        <TraceabilityLog records={records} operator={OPERATOR} />

        <button type="button" className="drawer-exit" onClick={onExit}>
          Exit to home
        </button>
      </aside>

      {/* Camera verification pop-up */}
      {verifyOpen && (
        <VerificationModal step={activeStep} onPass={handlePass} onClose={() => setVerifyOpen(false)} />
      )}

      {/* Completion */}
      {allDone && <CompletionCard stageCount={steps.length} unitSerial={UNIT_SERIAL} onRestart={handleRestart} />}
    </div>
  )
}
