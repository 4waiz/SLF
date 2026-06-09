// Domain model for the BRIDGE assembly station.
// Kept intentionally small and serialisable so records can move 1:1 to a REST
// payload when the in-browser store is swapped for the NestJS/PostgreSQL backend.

/** The three body colour-ways the operator can build. Maps to the image folder
 *  `public/drone-parts/<id>/`. `hex` themes the station UI to the chosen colour. */
export type DroneColorId = 'blue' | 'orange' | 'grey'

export interface DroneColor {
  id: DroneColorId
  name: string // "Cobalt Blue"
  hex: string // accent used to tint the station UI
}

export interface AssemblyStep {
  id: string
  name: string // "Drone main frame / center plate"
  code: string // "Main Frame · FRM-1001"
  pn: string // expected number to OCR-match, e.g. "1001"
  qty: string // "4 Qt"
  instruction: string
  /** Part-image key — resolves to /drone-parts/<color>/<img>.png */
  img: string
  videoSrc?: string // optional mp4 path; placeholder if absent
}

// SCAN = verified by the Round 1 mobile barcode scanner; OCR/MANUAL = Round 2.
export type VerificationSource = 'OCR' | 'MANUAL' | 'SCAN'

export interface VerificationRecord {
  stepId: string
  stepName: string
  serial: string
  source: VerificationSource
  color?: string
  timestamp: number
}
