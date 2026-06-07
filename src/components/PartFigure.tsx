import type { PartKind } from '../types'

interface PartFigureProps {
  kind: PartKind
  /** Tints the figure (the canopy stage passes the selected body colour). */
  accent: string
  className?: string
}

// Neutral detail colours for the light/white theme. `currentColor` carries the
// accent; these dark, low-alpha tones keep fine detail and outlines legible on
// the white production form.
const MUTE = 'rgba(15,23,42,0.32)'
const LIGHT = 'rgba(15,23,42,0.55)'

const LABELS: Record<PartKind, string> = {
  frame: 'Carbon X-frame',
  motor: 'Brushless motor',
  esc: '4-in-1 ESC board',
  fc: 'Flight controller board',
  prop: 'Propeller',
  batt: 'Li-Po battery pack',
  canopy: 'Canopy / body shell',
}

function Figure({ kind }: { kind: PartKind }) {
  switch (kind) {
    case 'frame':
      return (
        <>
          <g stroke="currentColor" strokeWidth={9} strokeLinecap="round">
            <line x1="48" y1="36" x2="192" y2="124" />
            <line x1="192" y1="36" x2="48" y2="124" />
          </g>
          {[
            [48, 36],
            [192, 36],
            [48, 124],
            [192, 124],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={14} fill="rgba(15,23,42,0.04)" stroke="currentColor" strokeWidth={4} />
          ))}
          <rect x="96" y="58" width="48" height="44" rx="8" fill="currentColor" fillOpacity={0.16} stroke="currentColor" strokeWidth={4} />
          <rect x="108" y="69" width="24" height="22" rx="4" stroke={MUTE} strokeWidth={2} />
        </>
      )
    case 'motor':
      return (
        <>
          <line x1="120" y1="18" x2="120" y2="40" stroke="currentColor" strokeWidth={4} strokeLinecap="round" />
          <rect x="76" y="44" width="88" height="70" rx="12" fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeWidth={4} />
          <ellipse cx="120" cy="44" rx="44" ry="13" fill="currentColor" fillOpacity={0.18} stroke="currentColor" strokeWidth={4} />
          <g stroke={MUTE} strokeWidth={3} strokeLinecap="round">
            <line x1="96" y1="58" x2="96" y2="102" />
            <line x1="108" y1="58" x2="108" y2="102" />
            <line x1="132" y1="58" x2="132" y2="102" />
            <line x1="144" y1="58" x2="144" y2="102" />
          </g>
          <ellipse cx="120" cy="112" rx="44" ry="12" stroke={MUTE} strokeWidth={2} />
          <line x1="92" y1="120" x2="148" y2="120" stroke="currentColor" strokeWidth={5} strokeLinecap="round" />
        </>
      )
    case 'esc':
      return (
        <>
          <rect x="48" y="32" width="144" height="96" rx="12" fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeWidth={4} />
          <rect x="104" y="64" width="32" height="32" rx="4" fill="currentColor" fillOpacity={0.24} stroke="currentColor" strokeWidth={3} />
          <circle cx="162" cy="56" r="11" fill="rgba(15,23,42,0.04)" stroke={MUTE} strokeWidth={3} />
          <g fill="rgba(15,23,42,0.04)" stroke={MUTE} strokeWidth={2}>
            <rect x="60" y="44" width="20" height="13" rx="2" />
            <rect x="60" y="103" width="20" height="13" rx="2" />
            <rect x="160" y="100" width="20" height="16" rx="2" />
          </g>
          <g fill="currentColor">
            <circle cx="58" cy="80" r="3.5" />
            <circle cx="72" cy="80" r="3.5" />
            <circle cx="168" cy="80" r="3.5" />
            <circle cx="182" cy="80" r="3.5" />
          </g>
          <g stroke={MUTE} strokeWidth={2}>
            <circle cx="60" cy="44" r="4" fill="none" />
            <circle cx="180" cy="44" r="4" fill="none" />
            <circle cx="60" cy="116" r="4" fill="none" />
            <circle cx="180" cy="116" r="4" fill="none" />
          </g>
        </>
      )
    case 'fc':
      return (
        <>
          <rect x="62" y="38" width="116" height="84" rx="12" fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeWidth={4} />
          <rect x="102" y="66" width="36" height="28" rx="4" fill="currentColor" fillOpacity={0.24} stroke="currentColor" strokeWidth={3} />
          <path d="M120 46 l9 14 l-18 0 z" fill="currentColor" />
          <g fill={MUTE}>
            {[74, 88, 102, 116, 130, 144, 158].map((x) => (
              <rect key={`t-${x}`} x={x} y="50" width="6" height="6" rx="1" />
            ))}
            {[74, 88, 102, 116, 130, 144, 158].map((x) => (
              <rect key={`b-${x}`} x={x} y="104" width="6" height="6" rx="1" />
            ))}
          </g>
          <g stroke={MUTE} strokeWidth={2} fill="none">
            <circle cx="70" cy="44" r="4" />
            <circle cx="170" cy="44" r="4" />
            <circle cx="70" cy="116" r="4" />
            <circle cx="170" cy="116" r="4" />
          </g>
        </>
      )
    case 'prop':
      return (
        <>
          <path
            d="M120 80 C 96 40, 52 36, 44 60 C 40 78, 80 86, 120 80 Z"
            fill="currentColor"
            fillOpacity={0.16}
            stroke="currentColor"
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <path
            d="M120 80 C 144 120, 188 124, 196 100 C 200 82, 160 74, 120 80 Z"
            fill="currentColor"
            fillOpacity={0.16}
            stroke="currentColor"
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <circle cx="120" cy="80" r="15" fill="currentColor" fillOpacity={0.28} stroke="currentColor" strokeWidth={4} />
          <circle cx="120" cy="80" r="4.5" fill={LIGHT} />
        </>
      )
    case 'batt':
      return (
        <>
          <rect x="54" y="44" width="124" height="74" rx="12" fill="currentColor" fillOpacity={0.12} stroke="currentColor" strokeWidth={4} />
          <rect x="54" y="74" width="124" height="15" fill="currentColor" fillOpacity={0.1} />
          <g stroke="currentColor" strokeOpacity={0.4} strokeWidth={2}>
            <line x1="95" y1="46" x2="95" y2="116" />
            <line x1="136" y1="46" x2="136" y2="116" />
          </g>
          <path d="M108 64 l-12 22 l10 0 l-6 18 l22 -28 l-11 0 l8 -12 z" fill="currentColor" fillOpacity={0.85} />
          <rect x="178" y="66" width="16" height="32" rx="3" fill="rgba(15,23,42,0.04)" stroke="currentColor" strokeWidth={3} />
          <path d="M194 74 q14 0 14 -10" stroke="currentColor" strokeWidth={3} fill="none" strokeLinecap="round" />
          <path d="M194 90 q14 0 14 10" stroke={MUTE} strokeWidth={3} fill="none" strokeLinecap="round" />
        </>
      )
    case 'canopy':
      return (
        <>
          <rect x="52" y="104" width="136" height="16" rx="6" fill="currentColor" fillOpacity={0.35} stroke={LIGHT} strokeWidth={3} />
          <path d="M64 106 Q70 50 120 48 Q170 50 176 106 Z" fill="currentColor" fillOpacity={0.85} stroke={LIGHT} strokeWidth={4} strokeLinejoin="round" />
          <path d="M82 100 Q88 64 118 58" stroke="rgba(255,255,255,0.45)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <circle cx="150" cy="86" r="9" fill="rgba(255,255,255,0.55)" stroke={LIGHT} strokeWidth={3} />
          <circle cx="150" cy="86" r="3" fill={LIGHT} />
          <g stroke="rgba(255,255,255,0.4)" strokeWidth={2} strokeLinecap="round">
            <line x1="92" y1="84" x2="104" y2="84" />
            <line x1="92" y1="92" x2="104" y2="92" />
          </g>
        </>
      )
    default:
      return null
  }
}

export function PartFigure({ kind, accent, className }: PartFigureProps) {
  return (
    <svg
      viewBox="0 0 240 160"
      className={`part-figure${className ? ` ${className}` : ''}`}
      style={{ color: accent }}
      role="img"
      aria-label={LABELS[kind]}
      fill="none"
    >
      <Figure kind={kind} />
    </svg>
  )
}
