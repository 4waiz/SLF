import type { AssemblyStep } from '../types'

// Station / operator identity. In production these come from the sign-in /
// work-order context.
export const OPERATOR = 'OP-014 · Awaiz Ahmed'
export const STATION_ID = 'STN-DRN-02'
export const WORK_ORDER = 'WO-2026-0488'

// The 7 assembly stages for a 5" FPV drone build.
// `pn` is the digit string the camera must OCR-match. `accent` tints the inline
// SVG part figure. Only the canopy stage carries a `colors` palette.
//
// To attach a real assembly clip, set `videoSrc` on a step (see README); with no
// `videoSrc` the VideoContainer renders its styled placeholder.
export const steps: AssemblyStep[] = [
  {
    id: 'frame',
    name: 'Carbon Frame',
    code: 'Carbon Frame · FR-2207',
    pn: '2207',
    qty: '1 Qt',
    instruction:
      'Seat the carbon-fibre X-frame on the assembly jig and align the arm bolt-holes to the fixture pins.',
    accent: '#22d3c5',
    fig: 'frame',
  },
  {
    id: 'motors',
    name: 'Brushless Motors',
    code: 'Brushless Motors · MT-2306',
    pn: '2306',
    qty: '4 Qt',
    instruction:
      'Mount the four 2306 brushless motors to the arm ends and torque each screw to 0.6 Nm in a cross pattern.',
    accent: '#5ec8ff',
    fig: 'motor',
  },
  {
    id: 'esc',
    name: 'ESC 4-in-1',
    code: 'ESC 4-in-1 · ES-4045',
    pn: '4045',
    qty: '1 Qt',
    instruction:
      'Fit the 45 A 4-in-1 ESC into the lower stack and route the motor phase leads to pads M1–M4.',
    accent: '#b388ff',
    fig: 'esc',
  },
  {
    id: 'fc',
    name: 'Flight Controller',
    code: 'Flight Controller · FC-7710',
    pn: '7710',
    qty: '1 Qt',
    instruction:
      'Stack the F7 flight controller onto the soft-mount grommets with the heading arrow facing forward.',
    accent: '#22d3c5',
    fig: 'fc',
  },
  {
    id: 'props',
    name: 'Propellers',
    code: 'Propellers · PR-5143',
    pn: '5143',
    qty: '4 Qt',
    instruction:
      'Install the 5-inch tri-blade propellers, matching each blade rotation direction to its motor.',
    accent: '#7cf2c9',
    fig: 'prop',
  },
  {
    id: 'battery',
    name: 'Li-Po Battery 2000 mAh',
    code: 'Li-Po 2000 mAh · 39234001',
    pn: '39234001',
    qty: '1 Qt',
    instruction:
      'Insert the 4S 2000 mAh Li-Po into the chassis cradle and secure it with the battery strap.',
    accent: '#f4b740',
    fig: 'batt',
  },
  {
    id: 'canopy',
    name: 'Canopy / Body',
    code: 'Canopy / Body · CN-9920',
    pn: '9920',
    qty: '1 Qt',
    instruction:
      'Clip the canopy over the stack, confirm the camera window is clear, then select the body finish colour.',
    accent: '#8a94a6',
    fig: 'canopy',
    colors: [
      { name: 'Carbon Black', hex: '#1b1b1f' },
      { name: 'Racing Red', hex: '#c0392b' },
      { name: 'Cobalt Blue', hex: '#2c6fb0' },
      { name: 'Signal Lime', hex: '#9ad12c' },
    ],
  },
]
