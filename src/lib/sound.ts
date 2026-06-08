// Poka-yoke feedback tones, synthesised with the Web Audio API so they ship
// with zero audio assets and stay crisp at any sample rate. Each control gets a
// distinct signature:
//   OK      → bright two-note rising chime (confirmation)
//   Help    → neutral mid "ping-ping" (attention / query)
//   Problem → harsh low descending buzzer (alert)

let ctx: AudioContext | null = null

function audioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!ctx) ctx = new Ctor()
  return ctx
}

interface Beep {
  freq: number
  /** seconds after the gesture */
  start: number
  dur: number
  type?: OscillatorType
  gain?: number
}

function play(beeps: Beep[]): void {
  try {
    const ac = audioCtx()
    if (!ac) return
    // A button press is a valid user gesture to (re)start a suspended context.
    if (ac.state === 'suspended') void ac.resume()

    const t0 = ac.currentTime
    for (const b of beeps) {
      const osc = ac.createOscillator()
      const g = ac.createGain()
      const at = t0 + b.start
      const peak = b.gain ?? 0.14

      osc.type = b.type ?? 'sine'
      osc.frequency.setValueAtTime(b.freq, at)

      // Tiny attack + exponential decay → a clean "beep" with no clicks.
      g.gain.setValueAtTime(0.0001, at)
      g.gain.exponentialRampToValueAtTime(peak, at + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, at + b.dur)

      osc.connect(g).connect(ac.destination)
      osc.start(at)
      osc.stop(at + b.dur + 0.02)
    }
  } catch {
    // Audio is best-effort — never let a beep break a button press.
  }
}

export function playOk(): void {
  play([
    { freq: 660, start: 0, dur: 0.12 },
    { freq: 988, start: 0.1, dur: 0.18 },
  ])
}

export function playHelp(): void {
  play([
    { freq: 540, start: 0, dur: 0.1, type: 'triangle' },
    { freq: 540, start: 0.15, dur: 0.12, type: 'triangle' },
  ])
}

export function playProblem(): void {
  play([
    { freq: 340, start: 0, dur: 0.18, type: 'square', gain: 0.11 },
    { freq: 196, start: 0.17, dur: 0.3, type: 'square', gain: 0.11 },
  ])
}

// Finish: a triumphant rising major arpeggio (C5–E5–G5–C6) when the build is
// signed off complete.
export function playFinish(): void {
  play([
    { freq: 523, start: 0, dur: 0.14 },
    { freq: 659, start: 0.12, dur: 0.14 },
    { freq: 784, start: 0.24, dur: 0.14 },
    { freq: 1047, start: 0.36, dur: 0.34, gain: 0.16 },
  ])
}

// Finish blocked: a short flat "denied" double-buzz when a section is still
// missing its material usage.
export function playError(): void {
  play([
    { freq: 220, start: 0, dur: 0.12, type: 'square', gain: 0.1 },
    { freq: 220, start: 0.16, dur: 0.16, type: 'square', gain: 0.1 },
  ])
}
