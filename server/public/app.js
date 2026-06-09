/* BRIDGE — Round 1 mobile scanner client.
 *
 * Flow: Login → Intro → Camera scanner. A decoded barcode is validated against
 * the shared part mapping (delivered by the server), shown on screen, and pushed
 * to the station laptop over Socket.IO so it ticks the part off in real time.
 */
(() => {
  'use strict'

  // --- Demo credentials (matches the laptop app's Operator / 123) -----------
  const DEMO_USER = 'operator'
  const DEMO_PASS = '123'

  // --- State ----------------------------------------------------------------
  let PARTS = {} // { PART_1: "Part 1", ... } — filled from server 'hello'
  const scannedCodes = new Set() // codes confirmed scanned (mirrors the station)
  let scanner = null // Html5Qrcode instance
  let scanning = false
  const recent = new Map() // code -> last-handled timestamp (debounce duplicates)
  const COOLDOWN_MS = 2500

  // --- Elements -------------------------------------------------------------
  const $ = (id) => document.getElementById(id)
  const views = { login: $('view-login'), intro: $('view-intro'), scanner: $('view-scanner') }
  const conn = $('conn')
  const connLabel = $('conn-label')

  function show(view) {
    for (const [name, el] of Object.entries(views)) el.classList.toggle('hidden', name !== view)
  }

  // --- Socket.IO ------------------------------------------------------------
  const socket = io() // same origin as this page (the mobile server)

  socket.on('connect', () => setConn(true))
  socket.on('disconnect', () => setConn(false))
  socket.on('connect_error', () => setConn(false))

  // Initial handshake: accepted mapping + any already-scanned parts.
  socket.on('hello', ({ parts, state }) => {
    PARTS = parts || {}
    renderIntroParts()
    if (Array.isArray(state)) state.forEach((r) => scannedCodes.add(r.code))
    updateCount()
  })

  // Broadcast whenever ANY device records a scan — keeps the count in sync too.
  socket.on('part-scanned', (rec) => {
    if (!rec) return
    scannedCodes.add(rec.code)
    updateCount()
  })

  // Station reset Round 1.
  socket.on('state', (state) => {
    scannedCodes.clear()
    if (Array.isArray(state)) state.forEach((r) => scannedCodes.add(r.code))
    updateCount()
  })

  function setConn(up) {
    conn.classList.toggle('conn--up', up)
    conn.classList.toggle('conn--down', !up)
    connLabel.textContent = up ? 'Connected' : 'Offline'
  }

  // --- Login ----------------------------------------------------------------
  $('login-form').addEventListener('submit', (e) => {
    e.preventDefault()
    const u = $('username').value.trim().toLowerCase()
    const p = $('password').value
    const err = $('login-error')
    if (u === DEMO_USER && p === DEMO_PASS) {
      err.classList.add('hidden')
      show('intro')
    } else {
      err.textContent = 'Incorrect operator ID or passcode.'
      err.classList.remove('hidden')
    }
  })

  // --- Intro ----------------------------------------------------------------
  function renderIntroParts() {
    const names = Object.values(PARTS)
    $('intro-count').textContent = String(names.length || 3)
    $('intro-parts').textContent = names.join(' · ')
  }

  $('start-btn').addEventListener('click', () => {
    show('scanner')
    startScanner()
  })

  $('back-btn').addEventListener('click', async () => {
    await stopScanner()
    show('intro')
  })

  $('retry-btn').addEventListener('click', () => {
    $('cam-error').classList.add('hidden')
    startScanner()
  })

  // --- Progress count (header only; the parts list lives on the laptop) -----
  function updateCount() {
    const codes = Object.keys(PARTS)
    const done = codes.filter((c) => scannedCodes.has(c)).length
    $('scan-count').textContent = `${done}/${codes.length || 3}`
  }

  // --- Result banner --------------------------------------------------------
  function setResult(kind, icon, text) {
    const el = $('result')
    el.className = 'result result--' + kind
    $('result-icon').textContent = icon
    $('result-text').textContent = text
  }

  function buzz(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms) } catch (_) {}
  }

  // --- Scanner --------------------------------------------------------------
  function supportedFormats() {
    // Restrict to the formats we actually use → faster, fewer false reads.
    const F = window.Html5QrcodeSupportedFormats
    if (!F) return undefined
    return [F.CODE_128, F.CODE_39, F.EAN_13, F.UPC_A, F.QR_CODE]
  }

  async function startScanner() {
    if (scanning) return
    $('cam-error').classList.add('hidden')
    try {
      scanner = new window.Html5Qrcode('reader', {
        formatsToSupport: supportedFormats(),
        verbose: false,
      })
      await scanner.start(
        { facingMode: 'environment' }, // rear camera
        { fps: 12, aspectRatio: 0.75 }, // full-frame scan (our own frame is decorative)
        onDecoded,
        () => {}, // per-frame "not found" — ignore, fires constantly
      )
      scanning = true
      setResult('idle', '⎙', 'Ready — point at a barcode')
    } catch (err) {
      showCameraError(err)
    }
  }

  async function stopScanner() {
    if (scanner && scanning) {
      try { await scanner.stop() } catch (_) {}
      try { await scanner.clear() } catch (_) {}
    }
    scanning = false
    scanner = null
  }

  function showCameraError(err) {
    scanning = false
    const msg = String((err && (err.message || err.name)) || err || 'Camera unavailable.')
    let friendly = 'Could not start the camera.'
    if (/permission|denied|NotAllowed/i.test(msg)) friendly = 'Camera permission was denied.'
    else if (/NotFound|Requested device/i.test(msg)) friendly = 'No camera was found on this device.'
    else if (/secure|https|getUserMedia|undefined/i.test(msg)) friendly = 'Camera needs a secure (https) connection.'
    else if (/NotReadable|in use|Track/i.test(msg)) friendly = 'The camera is in use by another app.'
    $('cam-error-msg').textContent = friendly
    $('cam-error').classList.remove('hidden')
  }

  // Called for every successful decode (fires repeatedly while a code is in view).
  function onDecoded(decodedText) {
    const code = String(decodedText || '').trim()
    const now = Date.now()

    // Debounce: ignore the same code if seen very recently.
    const last = recent.get(code) || 0
    if (now - last < COOLDOWN_MS) return
    recent.set(code, now)

    const part = PARTS[code]
    if (!part) {
      // Not one of our part barcodes — reject, do NOT update the station.
      buzz([40, 60, 40])
      setResult('bad', '⛔', 'Incorrect barcode')
      return
    }

    // Optimistic local feedback; the server confirms via 'part-scanned'.
    scannedCodes.add(code)
    updateCount()
    buzz(90)
    setResult('ok', '✓', `${part} Scanned`)

    // Push to the station laptop. Ack just refines the on-screen message.
    socket.emit('scan', { code }, (res) => {
      if (res && res.ok === false) setResult('bad', '⛔', 'Incorrect barcode')
    })
  }

  // --- Boot -----------------------------------------------------------------
  show('login')
  updateCount()
})()
