// tesseract.js is loaded with a dynamic import() the first time we actually need
// to recognise a frame. That keeps the ~2 MB worker + wasm core out of the
// initial bundle so it never blocks first paint.
//
// The worker type is derived from createWorker's return so we never depend on a
// named type export.
type TesseractWorker = Awaited<ReturnType<typeof import('tesseract.js').createWorker>>

let workerPromise: Promise<TesseractWorker> | null = null

async function getWorker(): Promise<TesseractWorker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('eng')
      // We only ever read part numbers, so constrain the engine to digits — this
      // sharply improves accuracy and speed on the camera feed.
      await worker.setParameters({ tessedit_char_whitelist: '0123456789' })
      return worker
    })()
  }
  return workerPromise
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Run OCR on a captured frame and return only the digits found, concatenated.
 * Races the recognition against a timeout so a slow model load / hung worker can
 * never wedge the verification flow — the caller treats a thrown error as a
 * signal to fall back to Demo Mode.
 */
export async function recognizeDigits(
  source: HTMLCanvasElement,
  timeoutMs = 9000,
): Promise<string> {
  let timer: ReturnType<typeof setTimeout> | undefined

  const work = (async () => {
    const worker = await getWorker()
    const result = await worker.recognize(source)
    return result.data.text.replace(/\D+/g, '')
  })()

  const timeout = (async () => {
    await new Promise<void>((_, reject) => {
      timer = setTimeout(() => reject(new Error('OCR timed out')), timeoutMs)
    })
    return '' as string
  })()

  try {
    return await Promise.race([work, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/**
 * Tolerant substring match of detected digits against the expected part number.
 * The camera frequently reads stray digits around the target, so "detected
 * contains expected" is the primary test; for longer serials we also accept a
 * single dropped edge digit.
 */
export function digitsMatch(detected: string, expected: string): boolean {
  if (!detected || !expected) return false
  if (detected.includes(expected)) return true
  if (expected.length >= 6) {
    return detected.includes(expected.slice(1)) || detected.includes(expected.slice(0, -1))
  }
  return false
}

/** Release the worker (e.g. on teardown). Safe to call when never initialised. */
export async function disposeOcr(): Promise<void> {
  if (!workerPromise) return
  const pending = workerPromise
  workerPromise = null
  try {
    const worker = await pending
    await worker.terminate()
  } catch {
    // already gone / failed to load — nothing to clean up
  }
}

export { delay }
