import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

export type CameraStatus =
  | 'idle' // not requested (e.g. Manual Mode on)
  | 'starting' // permission prompt / device warm-up
  | 'ready' // streaming
  | 'denied' // user/ policy blocked access
  | 'unsupported' // getUserMedia unavailable (insecure context / old browser)
  | 'error' // no device or unknown failure

export interface CameraController {
  videoRef: RefObject<HTMLVideoElement>
  status: CameraStatus
  /** Human-readable reason when status is denied/unsupported/error. */
  error: string | null
  /** Grab the current video frame as a canvas, or null if not ready. */
  capture: () => HTMLCanvasElement | null
  /** Re-attempt access after a failure. */
  retry: () => void
}

/**
 * Thin wrapper over getUserMedia. Starts the stream while `enabled` is true,
 * tears it down on cleanup, and exposes a frame-capture helper for OCR.
 */
export function useCamera(enabled: boolean): CameraController {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => setAttempt((a) => a + 1), [])

  useEffect(() => {
    if (!enabled) {
      setStatus('idle')
      setError(null)
      return
    }

    let cancelled = false

    const start = async (): Promise<void> => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('unsupported')
        setError('Camera API unavailable. Run locally over https/localhost, or switch to Manual Mode.')
        return
      }

      setStatus('starting')
      setError(null)

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          // Some browsers reject play() if interrupted — that is non-fatal here.
          await video.play().catch(() => undefined)
        }
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        const name = err instanceof DOMException ? err.name : ''
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setStatus('denied')
          setError('Camera blocked. Run locally over https/localhost, or switch to Manual Mode.')
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError') {
          setStatus('error')
          setError('No camera device found. Switch to Manual Mode to continue.')
        } else {
          setStatus('error')
          setError('Camera unavailable. Switch to Manual Mode to continue.')
        }
      }
    }

    void start()

    return () => {
      cancelled = true
      const stream = streamRef.current
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      const video = videoRef.current
      if (video) video.srcObject = null
    }
  }, [enabled, attempt])

  const capture = useCallback((): HTMLCanvasElement | null => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return null

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas
  }, [])

  return { videoRef, status, error, capture, retry }
}
