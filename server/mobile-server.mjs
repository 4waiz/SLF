// ---------------------------------------------------------------------------
// BRIDGE — Round 1 mobile scanning server
// ---------------------------------------------------------------------------
// A small, self-contained HTTPS + Socket.IO server that turns a phone into a
// barcode reader for the assembly station. It is intentionally separate from the
// Vite dev server (which serves the laptop app on :5173) so the existing app is
// untouched — this is purely additive.
//
//   node server/mobile-server.mjs       (or: npm run mobile)
//
// Why HTTPS with a self-signed cert?
//   Phone browsers only grant camera access (getUserMedia) on a secure origin —
//   https:// or localhost. Over a LAN IP that means we must serve https. The
//   cert is self-signed, so the phone shows a one-time "not private" warning;
//   tap through it (Advanced → proceed) and the camera works.
// ---------------------------------------------------------------------------
import express from 'express'
import https from 'node:https'
import os from 'node:os'
import { Server as SocketServer } from 'socket.io'
import selfsigned from 'selfsigned'
import bwipjs from 'bwip-js'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

// Port for the mobile server. Kept distinct from Vite's 5173 so nothing clashes.
const PORT = Number(process.env.MOBILE_PORT) || 3001

// One source of truth for accepted barcodes, shared with the laptop app and the
// barcode generator (shared/parts.json).
const PARTS = JSON.parse(await readFile(join(root, 'shared', 'parts.json'), 'utf8'))

// --- LAN address discovery -------------------------------------------------
// List every non-internal IPv4 so we can print a URL the phone can reach.
function lanIPv4s() {
  const out = []
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const i of ifaces ?? []) {
      if (i.family === 'IPv4' && !i.internal) out.push(i.address)
    }
  }
  return out
}

// --- TLS cert (cached so the phone only has to trust it once) ---------------
async function loadOrCreateCert() {
  const dir = join(here, '.cert')
  const keyPath = join(dir, 'key.pem')
  const certPath = join(dir, 'cert.pem')
  if (existsSync(keyPath) && existsSync(certPath)) {
    return { key: await readFile(keyPath), cert: await readFile(certPath) }
  }
  // Bind the cert to localhost + every LAN IP so the SAN matches the URL used.
  const altNames = [
    { type: 2, value: 'localhost' },
    { type: 7, ip: '127.0.0.1' },
    ...lanIPv4s().map((ip) => ({ type: 7, ip })),
  ]
  // selfsigned v5 returns a Promise.
  const pems = await selfsigned.generate([{ name: 'commonName', value: 'BRIDGE Mobile Scanner' }], {
    days: 825,
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [{ name: 'subjectAltName', altNames }],
  })
  await mkdir(dir, { recursive: true })
  await writeFile(keyPath, pems.private)
  await writeFile(certPath, pems.cert)
  return { key: pems.private, cert: pems.cert }
}

// --- Round 1 live state (in-memory; resets when the server restarts) ---------
// The laptop station drives the flow: it sets the current `target` (the part it
// expects next), and the phone scans barcodes. A scan is accepted only if it
// matches the target's part number (sequential verification). Late-joining
// clients get the full state on connect.
let target = null // { pn, name, index, total } | null  — set by the laptop
const verified = new Set() // pns verified in Round 1
const signedInPhones = new Set() // socket ids of phones that have signed in

function statePayload() {
  return {
    target,
    verified: [...verified],
    mobileSignedIn: signedInPhones.size > 0,
    phoneCount: signedInPhones.size,
  }
}

// Decide what happens when the phone reports a decoded value.
//   { ok:true, pn, name }                       — matched the expected part
//   { ok:false, reason:'unknown' }              — not one of our barcodes
//   { ok:false, reason:'no-target' }            — station hasn't asked for a part
//   { ok:false, reason:'wrong-part', expected } — valid barcode, wrong sequence
function evaluateScan(raw) {
  const code = String(raw ?? '').trim()
  if (!PARTS[code]) return { ok: false, reason: 'unknown' }
  if (!target) return { ok: false, reason: 'no-target' }
  if (code !== String(target.pn)) {
    return { ok: false, reason: 'wrong-part', expected: target.name, expectedPn: target.pn }
  }
  verified.add(code)
  return { ok: true, pn: code, name: PARTS[code], index: target.index }
}

// --- HTTP app ---------------------------------------------------------------
const app = express()
app.use(express.json())

// Open CORS — the laptop app (http://localhost:5173) is a different origin and
// needs to read these endpoints / open the socket.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

// Static mobile UI (login → intro → scanner) lives in server/public.
app.use(express.static(join(here, 'public')))

app.get('/api/parts', (_req, res) => res.json(PARTS))
app.get('/api/state', (_req, res) => res.json(statePayload()))
app.get('/api/info', (_req, res) => res.json({ port: PORT, urls: urls() }))
app.get('/healthz', (_req, res) => res.json({ ok: true }))

// A QR code of the phone-reachable URL, so the laptop can show "scan to open"
// instead of making you type an IP. Defaults to the first LAN URL.
app.get('/qr', async (req, res) => {
  const target = String(req.query.url || urls()[0] || `https://localhost:${PORT}`)
  try {
    const png = await bwipjs.toBuffer({ bcid: 'qrcode', text: target, scale: 4, padding: 8 })
    res.type('png').send(png)
  } catch {
    res.sendStatus(500)
  }
})

// REST fallback for a scan (the socket path is primary).
app.post('/api/scan', (req, res) => {
  const result = evaluateScan(req.body?.code)
  if (result.ok) io.emit('verified', result)
  res.status(result.ok ? 200 : 422).json(result)
})

// --- HTTPS + Socket.IO ------------------------------------------------------
const { key, cert } = await loadOrCreateCert()
const httpServer = https.createServer({ key, cert }, app)
const io = new SocketServer(httpServer, { cors: { origin: '*' } })

function broadcastMobileStatus() {
  io.emit('mobile-status', { signedIn: signedInPhones.size > 0, count: signedInPhones.size })
}

function helloPayload() {
  return { urls: urls(), parts: PARTS, ...statePayload() }
}

io.on('connection', (socket) => {
  // Tell the just-connected client everything it needs to render immediately.
  socket.emit('hello', helloPayload())

  // A client that mounts on an already-open socket (e.g. navigating back to the
  // hub) can re-request the current state instead of waiting for a reconnect.
  socket.on('sync', () => socket.emit('hello', helloPayload()))

  // Phone signals it has signed in → unlocks the laptop's "Proceed" gate.
  socket.on('signed-in', () => {
    signedInPhones.add(socket.id)
    broadcastMobileStatus()
  })

  // Laptop sets the part it currently expects (or null). Phones show this hint.
  socket.on('set-target', (t) => {
    target = t && t.pn != null ? t : null
    io.emit('target', target)
  })

  // Phone reports a decoded barcode → sequential match against the target.
  socket.on('scan', (payload, ack) => {
    const result = evaluateScan(payload?.code)
    if (result.ok) io.emit('verified', result) // → laptop ticks the part, advances
    if (typeof ack === 'function') ack(result)
  })

  // Laptop clears Round 1 (e.g. restart, or moving to Round 2).
  socket.on('reset', () => {
    verified.clear()
    target = null
    io.emit('round-reset', statePayload())
  })

  socket.on('disconnect', () => {
    if (signedInPhones.delete(socket.id)) broadcastMobileStatus()
  })
})

function urls() {
  return lanIPv4s().map((ip) => `https://${ip}:${PORT}`)
}

httpServer.listen(PORT, '0.0.0.0', () => {
  const lan = urls()
  const line = '─'.repeat(54)
  console.log(`\n${line}`)
  console.log('  BRIDGE · Round 1 mobile scanner is running')
  console.log(line)
  console.log('  Open this on your phone (same Wi-Fi), accept the')
  console.log('  one-time security warning, then sign in & scan:\n')
  if (lan.length) lan.forEach((u) => console.log(`     →  ${u}`))
  else console.log('     (no LAN address found — check your Wi-Fi connection)')
  console.log(`\n  On the laptop, the app connects automatically.`)
  console.log(`  If parts don't tick, open  https://localhost:${PORT}  once`)
  console.log('  in this browser and accept the warning, then reload.')
  console.log(`${line}\n`)
})

// Fail with a clear, actionable message instead of an unhandled crash when the
// port is taken (usually a previous instance still running).
httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  ⚠  Port ${PORT} is already in use — a mobile server is probably`)
    console.error('     still running. Close it, or pick another port:')
    console.error(`        PowerShell:  $env:MOBILE_PORT=3002; npm run mobile`)
    console.error(`        bash:        MOBILE_PORT=3002 npm run mobile\n`)
  } else {
    console.error('  Mobile server error:', err.message)
  }
  process.exit(1)
})
