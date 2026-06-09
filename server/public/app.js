/* BRIDGE — Round 1 mobile scanner client.
 *
 * Flow: Login → Intro → Camera scanner. The laptop station drives the sequence:
 * it publishes the part it expects next (the "target"), shown here as
 * "Now scan: <part>". A decoded barcode is sent to the server, which accepts it
 * only if it matches that target (sequential). The laptop then ticks the part
 * green and advances; the new target shows up here automatically.
 */
(() => {
  'use strict'

  // Demo credentials (matches the laptop app's Operator / 123).
  const DEMO_USER = 'operator'
  const DEMO_PASS = '123'

  // --- State ----------------------------------------------------------------
  let PARTS = {} // { "1001": "Main frame …", … } — from server 'hello'
  let target = null // { pn, name, index, total } — the part to scan next
  const verified = new Set() // pns verified so far (for the progress count)
  let scanner = null
  let scanning = false
  const recent = new Map() // code -> last-handled ts (debounce duplicate reads)
  const COOLDOWN_MS = 2200

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

  socket.on('hello', (p) => {
    PARTS = p?.parts || {}
    if (Array.isArray(p?.verified)) p.verified.forEach((c) => verified.add(c))
    target = p?.target || null
    renderTarget()
    updateCount()
  })
  socket.on('target', (t) => {
    target = t || null
    renderTarget()
  })
  socket.on('verified', (rec) => {
    if (rec?.pn) verified.add(rec.pn)
    updateCount()
  })
  socket.on('round-reset', () => {
    verified.clear()
    target = null
    renderTarget()
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
      socket.emit('signed-in') // unlocks the laptop's "Proceed" gate
      show('intro')
    } else {
      err.textContent = 'Incorrect operator ID or passcode.'
      err.classList.remove('hidden')
    }
  })

  // --- Intro ----------------------------------------------------------------
  $('intro-count').textContent = '26'
  $('start-btn').addEventListener('click', () => {
    show('scanner')
    renderTarget()
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

  // --- Status displays ------------------------------------------------------
  function total() {
    return Object.keys(PARTS).length || 26
  }
  function updateCount() {
    $('scan-count').textContent = `${verified.size}/${total()}`
  }
  function renderTarget() {
    const el = $('scan-target')
    if (!el) return
    if (!target) {
      const done = verified.size >= total() && total() > 0
      el.textContent = done ? 'All parts scanned ✓' : 'Waiting for the station…'
      el.className = 'scan-target idle'
      return
    }
    el.innerHTML =
      `<span class="scan-target-label">Now scan</span>` +
      `<span class="scan-target-name">${target.name}</span>` +
      `<span class="scan-target-pos mono">${(target.index | 0) + 1} / ${target.total}</span>`
    el.className = 'scan-target'
  }

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
    const F = window.Html5QrcodeSupportedFormats
    if (!F) return undefined
    return [F.CODE_128, F.CODE_39, F.EAN_13, F.UPC_A, F.QR_CODE]
  }

  async function startScanner() {
    if (scanning) return
    $('cam-error').classList.add('hidden')
    try {
      scanner = new window.Html5Qrcode('reader', { formatsToSupport: supportedFormats(), verbose: false })
      await scanner.start(
        { facingMode: 'environment' }, // rear camera
        { fps: 12 }, // full-frame scan (our frame overlay is decorative)
        onDecoded,
        () => {}, // per-frame "not found" — ignore
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
    const last = recent.get(code) || 0
    if (now - last < COOLDOWN_MS) return
    recent.set(code, now)

    // The server decides (sequential match against the station's target).
    socket.emit('scan', { code }, (res) => {
      if (res && res.ok) {
        buzz(90)
        setResult('ok', '✓', `${res.name} Scanned`)
      } else if (res && res.reason === 'wrong-part') {
        buzz([40, 60, 40])
        setResult('bad', '⛔', `Wrong part — scan ${res.expected}`)
      } else if (res && res.reason === 'no-target') {
        setResult('warn', '⏳', 'Waiting for the station…')
      } else {
        buzz([40, 60, 40])
        setResult('bad', '⛔', 'Incorrect barcode')
      }
    })
  }

  // --- Boot -----------------------------------------------------------------
  show('login')
  updateCount()
  renderTarget()
})()
