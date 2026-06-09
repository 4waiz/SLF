import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { DroneColorId, VerificationRecord, VerificationSource } from '../types'
import { steps, OPERATOR, STATION_ID, WORK_ORDER, DRONE_COLORS } from '../data/steps'
import { recordsService } from '../lib/records'
import { playOk, playHelp, playProblem, playFinish, playError } from '../lib/sound'
import { StepRail } from './StepRail'
import { StageSection } from './StageSection'
import { TraceabilityLog } from './TraceabilityLog'
import { CompletionCard } from './CompletionCard'
import { RoundIntermission } from './RoundIntermission'
import { Lightbox } from './Lightbox'
import { VerificationModal } from './VisionVerification'
import { useStationScan } from '../lib/mobileLink'

interface AssemblyStationProps {
  /** Colour-way chosen in the build-start pop-up. */
  initialColor: DroneColorId
  /** Which round to run: 1 = mobile barcode scan, 2 = laptop camera/OCR. */
  initialRound: 1 | 2
  onExit: () => void
}

const UNIT_SERIAL = `BRG-DRN-${WORK_ORDER.slice(-4)}-01`

type Toast = { kind: 'error' | 'warn' | 'info'; text: string } | null
type MediaTarget = { index: number; slide: number } | null

/**
 * Assembly station: a single-page production form. Every stage is laid out
 * top-to-bottom as its own section (matching the reference MES); finishing one
 * section advances the highlight to the next and scrolls it into view. The ☰
 * drawer holds the stage list + traceability log; the green/amber/red Poka-yoke
 * controls (OK · Help · Problem) live in the top bar; Finish sits in the footer.
 */
export function AssemblyStation({ initialColor, initialRound, onExit }: AssemblyStationProps) {
  const [records, setRecords] = useState<VerificationRecord[]>([])
  const [colorId, setColorId] = useState<DroneColorId>(initialColor)
  const [hydrated, setHydrated] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [verifyIndex, setVerifyIndex] = useState<number | null>(null)
  const [media, setMedia] = useState<MediaTarget>(null)
  const [toast, setToast] = useState<Toast>(null)
  const [finishMenuOpen, setFinishMenuOpen] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  // Round 1 = mobile barcode scan; Round 2 = laptop camera/OCR. The round is
  // chosen on the hub and fixed for this visit (the two rounds are independent).
  const round = initialRound
  const [r1Reviewing, setR1Reviewing] = useState(false) // dismissed the Round-1 done overlay

  const scrollRef = useRef<HTMLElement>(null)
  const sectionRefs = useRef<(HTMLElement | null)[]>([])
  const prevActive = useRef<number | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Each round chosen from the hub is a fresh pass. Records are keyed by stepId,
  // so the two rounds can't coexist in the store — start this round clean.
  useEffect(() => {
    let alive = true
    recordsService
      .clear()
      .catch(() => undefined)
      .finally(() => {
        if (alive) {
          setRecords([])
          setHydrated(true)
        }
      })
    return () => {
      alive = false
    }
  }, [])

  const color = DRONE_COLORS.find((c) => c.id === colorId) ?? DRONE_COLORS[0]

  const completed = useMemo(
    () => steps.map((s) => records.some((r) => r.stepId === s.id)),
    [records],
  )
  const doneCount = completed.filter(Boolean).length
  const allDone = hydrated && doneCount === steps.length
  const firstIncomplete = completed.findIndex((c) => !c)
  const activeIndex = firstIncomplete === -1 ? steps.length - 1 : firstIncomplete
  const progressPct = `${(doneCount / steps.length) * 100}%`
  const formId = `${WORK_ORDER}.ASSY-${String(activeIndex + 1).padStart(2, '0')}`

  // When the frontier moves (a section just completed, or a partial build is
  // restored), bring the new section into view — "finish one, continue to the
  // next on the same page". We only scroll on an actual change, never on first
  // mount, so the form header stays put on a fresh load.
  useEffect(() => {
    if (prevActive.current === null) {
      prevActive.current = activeIndex
      return
    }
    if (activeIndex === prevActive.current) return
    prevActive.current = activeIndex
    if (!allDone) {
      sectionRefs.current[activeIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [activeIndex, allDone])

  // Auto-dismiss toasts.
  useEffect(() => {
    if (!toast) return
    toastTimer.current = setTimeout(() => setToast(null), 4500)
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [toast])

  const addRecord = (index: number, serial: string, source: VerificationSource) => {
    const step = steps[index]
    const record: VerificationRecord = {
      stepId: step.id,
      stepName: step.name,
      serial,
      source,
      color: color.name,
      timestamp: Date.now(),
    }
    setRecords((prev) => [...prev.filter((r) => r.stepId !== step.id), record])
    void recordsService.add(record).catch(() => undefined)
  }

  const removeRecord = (index: number) => {
    const step = steps[index]
    setRecords((prev) => prev.filter((r) => r.stepId !== step.id))
    void recordsService.remove(step.id).catch(() => undefined)
  }

  // Manual tick-box: tick records a MANUAL verification, untick drops it.
  const handleToggleCheck = (index: number, checked: boolean) => {
    if (checked) addRecord(index, steps[index].pn, 'MANUAL')
    else removeRecord(index)
  }

  // ---- Round 1: mobile barcode scan -------------------------------------
  // A phone scan that matched the expected part arrives here → record it as
  // SCAN-verified, which ticks the part green and advances the frontier.
  const handleScanVerified = (pn: string) => {
    if (round !== 1) return
    const index = steps.findIndex((s) => s.pn === pn)
    if (index === -1 || completed[index]) return
    addRecord(index, pn, 'SCAN')
  }
  const { connected: scanConnected, setTarget, reset: resetScan } = useStationScan(handleScanVerified)

  // Publish the part the phone should scan next (Round 1 only). Cleared in
  // Round 2 / once complete so the phone shows the right prompt.
  useEffect(() => {
    if (!hydrated) return
    if (round !== 1 || allDone) {
      setTarget(null)
      return
    }
    const s = steps[activeIndex]
    setTarget({ pn: s.pn, name: s.name, index: activeIndex, total: steps.length })
    // setTarget emits over the shared socket and is stable; deps intentionally minimal.
  }, [round, activeIndex, allDone, hydrated]) // eslint-disable-line react-hooks/exhaustive-deps

  // Let the Round-1 done overlay reappear if a finished part is later unticked.
  useEffect(() => {
    if (!allDone && r1Reviewing) setR1Reviewing(false)
  }, [allDone, r1Reviewing])

  // Camera/OCR pass for the section whose pop-up is open.
  const handlePass = (serial: string, source: VerificationSource) => {
    if (verifyIndex == null) return
    addRecord(verifyIndex, serial, source)
  }

  const scrollToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSelectStage = (index: number) => {
    setMenuOpen(false)
    // Defer so the drawer-close transition doesn't fight the scroll.
    setTimeout(() => scrollToSection(index), 80)
  }

  // ---- Poka-yoke controls -------------------------------------------------
  const handleOK = () => {
    if (allDone) {
      handleFinish() // plays the finish fanfare itself
      return
    }
    playOk()
    setToast({ kind: 'info', text: `Continue with ${activeIndex + 1}) ${steps[activeIndex].name}` })
    scrollToSection(activeIndex)
  }

  const handleHelp = () => {
    playHelp()
    setToast({ kind: 'warn', text: 'Help requested — a line supervisor has been notified.' })
  }

  const handleProblem = () => {
    playProblem()
    setToast({ kind: 'error', text: `Problem reported on ${activeIndex + 1}) ${steps[activeIndex].name} — line flagged for support.` })
  }

  const handleFinish = () => {
    setFinishMenuOpen(false)
    const missing = completed.findIndex((c) => !c)
    if (missing !== -1) {
      playError()
      const how = round === 1 ? 'Scan' : 'Verify'
      setToast({ kind: 'error', text: `${how} ${missing + 1}) ${steps[missing].name} to continue` })
      scrollToSection(missing)
      return
    }
    playFinish()
    if (round === 1) setR1Reviewing(false) // surface the Round-1 "complete" overlay
    else setShowCompletion(true)
  }

  const handleRestart = () => {
    if (round === 1) resetScan()
    void recordsService.clear().catch(() => undefined)
    setRecords([])
    setColorId(initialColor)
    setR1Reviewing(false)
    setShowCompletion(false)
    setMenuOpen(false)
    setFinishMenuOpen(false)
    prevActive.current = null
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      className="station"
      style={
        {
          ['--accent']: color.hex,
          ['--accent-2']: color.hex,
          ['--accent-weak']: `${color.hex}1f`,
        } as CSSProperties
      }
    >
      {/* Top bar — hamburger · breadcrumb · Poka-yoke (OK / Help / Problem) */}
      <header className="topbar">
        <button type="button" className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>
        <nav className="crumb" aria-label="Breadcrumb">
          <span className="crumb-wo mono">{WORK_ORDER}</span>
          <span className="crumb-icon" aria-hidden="true">🚁</span>
          <span className="crumb-sep">›</span>
          <span className="crumb-mid">Drone Line</span>
          <span className="crumb-sep">›</span>
          <span className="crumb-cur">
            <span className="crumb-swatch" style={{ background: color.hex }} aria-hidden="true" />
            {color.name} Build
          </span>
        </nav>
        <div className="poka" role="group" aria-label="Poka-yoke controls">
          <button type="button" className="poka-btn poka-ok" onClick={handleOK}>
            <span className="poka-dot" aria-hidden="true" />
            OK
          </button>
          <button type="button" className="poka-btn poka-help" onClick={handleHelp}>
            <span className="poka-dot" aria-hidden="true" />
            Help
          </button>
          <button type="button" className="poka-btn poka-problem" onClick={handleProblem}>
            <span className="poka-dot" aria-hidden="true" />
            Problem
          </button>
        </div>
      </header>

      {/* Toast / andon banner */}
      {toast && (
        <div className={`toast toast-${toast.kind}`} role="status">
          <span className="toast-mark" aria-hidden="true">
            {toast.kind === 'error' ? '⚠' : toast.kind === 'warn' ? 'ℹ' : '✓'}
          </span>
          <span className="toast-text">{toast.text}</span>
          <button type="button" className="toast-close" onClick={() => setToast(null)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      {/* Single-page production form */}
      <main className="form-scroll" ref={scrollRef}>
        <div className="formbar">
          <div className="formbar-id-wrap">
            <span className="formbar-id mono">{formId}</span>
            <span className="formbar-name"> / Drone Production Form</span>
          </div>
          <div className="formbar-right">
            <span className={`formbar-round r${round}`}>
              Round {round} · {round === 1 ? 'Mobile Scan' : 'Laptop Scan'}
            </span>
            {round === 1 && (
              <span className={`formbar-link ${scanConnected ? 'is-up' : 'is-down'}`} title="Phone scanner link">
                <span className="formbar-link-dot" aria-hidden="true" />
                {scanConnected ? 'Phone linked' : 'Phone offline'}
              </span>
            )}
            <span className="formbar-count mono">{doneCount}/{steps.length}</span>
            <span className="formbar-badge">
              {STATION_ID}
              <span className="formbar-caret" aria-hidden="true">▾</span>
            </span>
          </div>
        </div>

        <div className="psheet">
          {steps.map((step, i) => (
            <StageSection
              key={step.id}
              ref={(el) => {
                sectionRefs.current[i] = el
              }}
              step={step}
              index={i}
              completed={completed[i]}
              active={hydrated && !allDone && i === activeIndex}
              round={round}
              record={records.find((r) => r.stepId === step.id)}
              color={colorId}
              onToggleCheck={(checked) => handleToggleCheck(i, checked)}
              onVerify={() => setVerifyIndex(i)}
              onOpenMedia={(slide) => setMedia({ index: i, slide })}
            />
          ))}
        </div>
      </main>

      {/* Footer — Finish (with caret menu) */}
      <footer className="station-foot">
        <span className="foot-progress mono">
          {doneCount} of {steps.length} sections complete
        </span>
        <div className="finish-wrap">
          <button type="button" className="finish-btn" onClick={handleFinish}>
            <span className="finish-icon" aria-hidden="true">🔒</span>
            Finish
          </button>
          <button
            type="button"
            className="finish-caret"
            onClick={() => setFinishMenuOpen((v) => !v)}
            aria-label="More finish options"
            aria-expanded={finishMenuOpen}
          >
            ▾
          </button>
          {finishMenuOpen && (
            <div className="finish-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { setFinishMenuOpen(false); onExit() }}>
                Save &amp; exit
              </button>
              <button type="button" role="menuitem" onClick={handleRestart}>
                Restart build
              </button>
            </div>
          )}
        </div>
      </footer>

      {/* ☰ Drawer: stage list + traceability log */}
      <div className={`drawer-scrim${menuOpen ? ' is-open' : ''}`} onClick={() => setMenuOpen(false)} aria-hidden="true" />
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

        <div className="drawer-scroll">
          <StepRail steps={steps} completed={completed} activeIndex={activeIndex} onSelect={handleSelectStage} />
          <TraceabilityLog records={records} operator={OPERATOR} />
        </div>

        <button type="button" className="drawer-exit" onClick={onExit}>
          Exit to home
        </button>
      </aside>

      {/* Media lightbox */}
      {media && (
        <Lightbox
          step={steps[media.index]}
          color={colorId}
          startSlide={media.slide}
          onClose={() => setMedia(null)}
        />
      )}

      {/* Camera verification pop-up */}
      {verifyIndex != null && (
        <VerificationModal step={steps[verifyIndex]} onPass={handlePass} onClose={() => setVerifyIndex(null)} />
      )}

      {/* Round 1 complete → back to the hub to pick Round 2 */}
      {round === 1 && allDone && !r1Reviewing && (
        <RoundIntermission
          partCount={steps.length}
          onBackToRounds={onExit}
          onReview={() => setR1Reviewing(true)}
        />
      )}

      {/* Final completion (after Round 2) */}
      {showCompletion && allDone && round === 2 && (
        <CompletionCard stageCount={steps.length} unitSerial={UNIT_SERIAL} onRestart={handleRestart} />
      )}
    </div>
  )
}
