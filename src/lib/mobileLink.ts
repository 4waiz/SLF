// Shared link to the Round 1 mobile-scanning server (server/mobile-server.mjs).
//
// One Socket.IO connection is reused across the app (the connect-gate on the
// Rounds hub and the scan-driven verification in the station), so screens stay
// in sync without re-handshaking.
//
// The server runs on HTTPS :3001 with a self-signed cert. From the laptop the
// browser must trust it once — open https://localhost:3001 and accept the
// warning if the link never connects.
import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

/** Port the mobile server listens on (keep in sync with MOBILE_PORT there). */
export const MOBILE_PORT = 3001

/** The part the station currently expects the phone to scan. */
export interface ScanTarget {
  pn: string
  name: string
  index: number // 0-based step index
  total: number
}

/** Payload broadcast when a scan matches the expected part. */
export interface VerifiedEvent {
  ok: true
  pn: string
  name: string
  index: number
}

export function mobileServerUrl(): string {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  return `https://${host}:${MOBILE_PORT}`
}

let socket: Socket | null = null

/** Lazily create (once) and return the shared socket. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(mobileServerUrl(), { reconnection: true, reconnectionDelay: 1500 })
  }
  return socket
}

/**
 * Connect-gate state for the Rounds hub: is the server reachable, has a phone
 * signed in, and what URL/QR should we show.
 */
export function useMobileLink() {
  const [connected, setConnected] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [urls, setUrls] = useState<string[]>([])

  useEffect(() => {
    const s = getSocket()
    setConnected(s.connected)

    const onConnect = () => {
      setConnected(true)
      s.emit('sync') // refresh state on (re)connect
    }
    const onDisconnect = () => setConnected(false)
    const onHello = (p: { urls?: string[]; mobileSignedIn?: boolean }) => {
      if (Array.isArray(p?.urls)) setUrls(p.urls)
      setSignedIn(!!p?.mobileSignedIn)
    }
    const onStatus = (p: { signedIn?: boolean }) => setSignedIn(!!p?.signedIn)

    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)
    s.on('hello', onHello)
    s.on('mobile-status', onStatus)
    // Mounted on an already-open socket (e.g. returning to the hub) → re-sync.
    if (s.connected) s.emit('sync')
    return () => {
      s.off('connect', onConnect)
      s.off('disconnect', onDisconnect)
      s.off('hello', onHello)
      s.off('mobile-status', onStatus)
    }
  }, [])

  return { connected, signedIn, urls, serverUrl: mobileServerUrl() }
}

/**
 * Station-side scan link for Round 1. Drives the phone by publishing the part it
 * expects (`setTarget`) and fires `onVerified(pn)` when the phone scans a match.
 */
export function useStationScan(onVerified: (pn: string) => void) {
  const [connected, setConnected] = useState(false)
  const cb = useRef(onVerified)
  cb.current = onVerified

  useEffect(() => {
    const s = getSocket()
    setConnected(s.connected)

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    const onVer = (rec: VerifiedEvent) => {
      if (rec?.ok && rec.pn) cb.current(rec.pn)
    }

    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)
    s.on('verified', onVer)
    return () => {
      s.off('connect', onConnect)
      s.off('disconnect', onDisconnect)
      s.off('verified', onVer)
    }
  }, [])

  const setTarget = (t: ScanTarget | null) => getSocket().emit('set-target', t)
  const reset = () => getSocket().emit('reset')

  return { connected, setTarget, reset }
}
