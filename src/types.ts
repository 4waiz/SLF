// Domain model for the BRIDGE assembly station.
// Kept intentionally small and serialisable so records can move 1:1 to a REST
// payload when the in-browser store is swapped for the NestJS/PostgreSQL backend.

export type PartKind = 'frame' | 'motor' | 'esc' | 'fc' | 'prop' | 'batt' | 'canopy'

export interface ColorOption {
  name: string
  hex: string
}

export interface AssemblyStep {
  id: string
  name: string // "Carbon Frame"
  code: string // "Carbon Frame · FR-2207"
  pn: string // expected number to OCR-match, e.g. "2207"
  qty: string // "4 Qt"
  instruction: string
  accent: string // hex used to tint the SVG part figure
  fig: PartKind
  colors?: ColorOption[] // only the canopy stage
  videoSrc?: string // optional mp4 path; placeholder if absent
}

export type VerificationSource = 'OCR' | 'MANUAL'

export interface VerificationRecord {
  stepId: string
  stepName: string
  serial: string
  source: VerificationSource
  color?: string
  timestamp: number
}
