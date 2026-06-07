import type { AssemblyStep } from '../types'

interface VideoContainerProps {
  step: AssemblyStep
}

/**
 * Assembly-clip player. Renders a real <video controls> when the step carries a
 * `videoSrc`, otherwise a styled placeholder with a play affordance and a subtle
 * scanline texture. Mounted directly BELOW the Vision Verification block.
 */
export function VideoContainer({ step }: VideoContainerProps) {
  return (
    <section className="vc">
      <header className="vc-head">
        <span className="vc-label">Assembly Clip</span>
        <span className="vc-stage-name">{step.name}</span>
      </header>

      {step.videoSrc ? (
        <video className="vc-video" controls preload="metadata" playsInline src={step.videoSrc}>
          Your browser does not support embedded video.
        </video>
      ) : (
        <div className="vc-placeholder" role="img" aria-label={`Assembly clip placeholder for ${step.name}`}>
          <div className="vc-scanlines" aria-hidden="true" />
          <button type="button" className="vc-play" aria-label="Play assembly walkthrough">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.5 L8 18.5 L19 12 Z" fill="currentColor" />
            </svg>
          </button>
          <div className="vc-meta">
            <span className="vc-meta-title">Assembly walkthrough</span>
            <span className="vc-meta-sub">Video guide for this stage</span>
          </div>
          <span className="vc-timecode">00:00 / 00:00</span>
        </div>
      )}
    </section>
  )
}
