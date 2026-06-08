import { useEffect, useState } from 'react'
import type { AssemblyStep, DroneColorId } from '../types'
import { PartImage } from './PartImage'

interface LightboxProps {
  step: AssemblyStep
  /** The colour-way being built — selects which part render to show. */
  color: DroneColorId
  /** 0 = reference image, 1 = assembly clip. */
  startSlide?: number
  onClose: () => void
}

const ZOOM_MIN = 1
const ZOOM_MAX = 2.5
const ZOOM_STEP = 0.25

/**
 * Full-screen media viewer (matches the reference MES gallery): a large stage on
 * the left, a thumbnail strip + ▶ toggle top-right, page counter, prev/next, and
 * a red CLOSE. Two slides per stage — the reference image and the assembly clip.
 */
export function Lightbox({ step, color, startSlide = 0, onClose }: LightboxProps) {
  const slides = ['image', 'video'] as const
  const [slide, setSlide] = useState(Math.min(startSlide, slides.length - 1))
  const [zoom, setZoom] = useState(1)

  const go = (next: number) => {
    setSlide((next + slides.length) % slides.length)
    setZoom(1)
  }

  // Keyboard: Esc closes, arrows page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(slide + 1)
      else if (e.key === 'ArrowLeft') go(slide - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slide, onClose])

  const isImage = slides[slide] === 'image'

  return (
    <div className="lb" role="dialog" aria-modal="true" aria-label={`${step.name} media`}>
      <div className="lb-stage">
        {isImage ? (
          <div className="lb-image" style={{ transform: `scale(${zoom})` }}>
            <PartImage img={step.img} color={color} alt={step.name} />
          </div>
        ) : step.videoSrc ? (
          <video className="lb-video" controls autoPlay playsInline src={step.videoSrc}>
            Your browser does not support embedded video.
          </video>
        ) : (
          <div className="lb-video-ph">
            <span className="lb-play-lg" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M8 5.5 L8 18.5 L19 12 Z" fill="currentColor" />
              </svg>
            </span>
            <span className="lb-video-meta">Assembly walkthrough · {step.name}</span>
          </div>
        )}

        {isImage && (
          <div className="lb-zoom">
            <button type="button" onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))} aria-label="Zoom out" disabled={zoom <= ZOOM_MIN}>
              −
            </button>
            <button type="button" onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))} aria-label="Zoom in" disabled={zoom >= ZOOM_MAX}>
              +
            </button>
          </div>
        )}

        <span className="lb-count mono">
          {slide + 1} / {slides.length}
        </span>
      </div>

      <aside className="lb-side">
        <div className="lb-thumbs">
          <button type="button" className={`lb-thumb${isImage ? ' is-active' : ''}`} onClick={() => go(0)} aria-label="Reference image">
            <PartImage img={step.img} color={color} alt={step.name} />
          </button>
          <button type="button" className={`lb-thumb lb-thumb-video${!isImage ? ' is-active' : ''}`} onClick={() => go(1)} aria-label="Assembly clip">
            <span className="lb-thumb-play" aria-hidden="true">▶</span>
          </button>
        </div>

        <div className="lb-controls">
          <div className="lb-nav">
            <button type="button" className="lb-arrow" onClick={() => go(slide - 1)} aria-label="Previous">
              ←
            </button>
            <button type="button" className="lb-arrow is-primary" onClick={() => go(slide + 1)} aria-label="Next">
              →
            </button>
          </div>
          <button type="button" className="lb-close" onClick={onClose}>
            ✕ CLOSE
          </button>
        </div>
      </aside>
    </div>
  )
}
