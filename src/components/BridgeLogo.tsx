interface BridgeLogoProps {
  className?: string
}

// Vertical suspenders: [x, cableTopY]. The bottoms all land on the deck (y=148).
// Top y-values trace the draped main cable so the drop lengths read naturally.
const SUSPENDERS: Array<[number, number]> = [
  [60, 103],
  [100, 66],
  [170, 68],
  [200, 86],
  [230, 94],
  [240, 95],
  [250, 94],
  [280, 86],
  [310, 68],
  [380, 66],
  [420, 103],
]

const DECK_Y = 148

/**
 * Animated cable-stayed / suspension bridge mark for BRIDGE.
 * On mount each stroke draws in (towers → deck → main cable → suspenders),
 * then the whole figure breathes with a soft teal glow.
 */
export function BridgeLogo({ className }: BridgeLogoProps) {
  return (
    <svg
      viewBox="0 0 480 210"
      className={`bridge-logo${className ? ` ${className}` : ''}`}
      role="img"
      aria-label="BRIDGE — suspension bridge mark"
      fill="none"
    >
      <g className="bl-glow">
        {/* Deck */}
        <line className="bl-draw bl-deck" x1="24" y1={DECK_Y} x2="456" y2={DECK_Y} pathLength={1} style={{ animationDelay: '0.25s' }} />
        <line className="bl-draw bl-deck-thin" x1="28" y1={DECK_Y + 8} x2="452" y2={DECK_Y + 8} pathLength={1} style={{ animationDelay: '0.35s' }} />

        {/* Towers */}
        <line className="bl-draw bl-tower" x1="140" y1="174" x2="140" y2="38" pathLength={1} style={{ animationDelay: '0s' }} />
        <line className="bl-draw bl-tower" x1="340" y1="174" x2="340" y2="38" pathLength={1} style={{ animationDelay: '0.1s' }} />

        {/* Draped main cable: anchor → tower → mid-span sag → tower → anchor */}
        <path
          className="bl-draw bl-cable"
          d="M 24 148 Q 78 72 140 40 Q 240 150 340 40 Q 402 72 456 148"
          pathLength={1}
          style={{ animationDelay: '0.5s' }}
        />

        {/* Vertical suspenders */}
        {SUSPENDERS.map(([x, topY], i) => (
          <line
            key={x}
            className="bl-draw bl-susp"
            x1={x}
            y1={topY}
            x2={x}
            y2={DECK_Y}
            pathLength={1}
            style={{ animationDelay: `${(0.95 + i * 0.05).toFixed(2)}s` }}
          />
        ))}

        {/* Tower-top anchor nodes */}
        <circle className="bl-node" cx="140" cy="40" r="4.5" />
        <circle className="bl-node" cx="340" cy="40" r="4.5" />
      </g>
    </svg>
  )
}
