# BRIDGE — Digital Work Instructions

A touchscreen **digital work-instructions station** for a smart learning factory.
It replaces paper assembly manuals: an operator follows on-screen steps to
assemble a drone, and **each part is verified by the laptop camera (OCR) before
the operator can continue**. Built for a ministry demonstration — polished,
production-grade, and runnable offline in **Demo Mode** with no camera.

> Brand: **BRIDGE** · *Smart Factory · Digital Work Instructions*

---

## Quick start

Requires **Node 18+**.

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`).

```bash
npm run build      # type-checks (strict) then builds for production
npm run preview    # serves the production build
npm run typecheck  # type-check only
```

### A note on the camera

`navigator.mediaDevices.getUserMedia` only works in a **secure context** —
`http://localhost` (the dev server) or an `https://` origin. If the camera is
blocked or unavailable, the station shows an inline notice and **auto-enables
Demo Mode** so the flow never dead-ends. You can also flip **Demo Mode** on
manually from the Vision Verification block at any time.

---

## Two-round verification

The **Rounds hub** offers two **independent** passes over the 26 parts of the
Drone Production Form — pick either:

- **Round 1 — Mobile Barcode Scan:** your phone is the scanner. The laptop shows
  the part it expects; you scan that part's barcode; it turns green and the
  station advances to the next — **in order**. Scanning the wrong part or an
  unknown barcode is rejected on the phone. (Gated: enabled once a phone signs
  in.)
- **Round 2 — Laptop Scan:** the **existing** on-screen camera/OCR flow
  (unchanged) — no phone needed.

Each round you open from the hub is a **fresh pass**; finishing one returns you
to the hub to choose the other.

### Run it

```bash
npm install
npm run dev:all      # laptop app (:5173) + mobile scan server (:3001) together
```

Or run them separately in two terminals: `npm run dev` and `npm run mobile`.
Open the laptop app at `http://localhost:5173`, sign in (**Operator / 123**),
choose a colour → you land on the **Rounds** connect-gate.

> **One-time cert trust (laptop):** the mobile server uses a self-signed HTTPS
> cert so phone cameras work. If the gate shows *"Waiting for the scan server…"*,
> open **https://localhost:3001** once in the laptop browser, accept the warning,
> then reload the app.

### Choose a round

The hub shows two cards. **Round 2** starts immediately (laptop only). **Round
1** needs a phone — the card shows a QR + URL (**`https://<laptop-ip>:3001`**,
also printed in the console). On your phone (same Wi-Fi):

1. Scan the QR code, or type the URL.
2. Accept the one-time security warning (**Advanced → proceed**) — needed for the
   camera on a LAN IP.
3. Sign in (**Operator / 123**). The card's **Start Round 1** button unlocks the
   moment the phone signs in.
4. Press **Start Round 1** on the laptop. On the phone tap **Start Scanning** and
   allow camera access.

### Barcodes (one per part)

Printable Code-128 PNGs live in **`generated_barcodes/`** — one per part, named
`NN_<pn>_<slug>.png` (e.g. `01_1001_main-frame-center-plate.png`). Each encodes
the **part number** (`1001`…), the same value the laptop OCR matches, so the same
sheet works for both rounds. Print them or show them on a second screen.

Regenerate any time with `npm run barcodes` — it reads the parts from
[`src/data/steps.ts`](src/data/steps.ts) and rewrites both the PNGs and the
pn→name mapping in [`shared/parts.json`](shared/parts.json) (the value the server
matches against). Re-run it whenever you edit the steps.

On the phone you'll see **"Now scan: \<part\>"**, then **"\<part\> Scanned"** on a
match, **"Wrong part — scan \<expected\>"** out of order, or **"Incorrect
barcode"** for anything unknown.

---

## How it works

### Flow
1. **Intro** — animated BRIDGE bridge mark, then **Assemble Drone** (active) or
   **RC Racer** (coming soon).
2. **Assembly station** — one screen, three regions:
   - **Left rail:** the 7 stages as a stepper (done ✓ / active / locked).
     Completed stages re-open on click; locked stages are inert.
   - **Center column:** title → reference image → BOM row (with a checkbox that
     ticks on verification) → instruction → *(canopy)* colour picker → **Vision
     Verification** → **Video container (directly below verification)** →
     **Confirm & Continue** (enabled only after a PASS).
   - **Right rail:** progress (Stage X of 7) and a live **Traceability Log**.
3. **Completion** — when all 7 stages pass: *Build Verified*, a summary, the
   serialised unit, and **Start New Build**.

### Verification logic (`verify()`)
- **Demo Mode ON**, camera unavailable, or OCR fails/times out → a short
  ~1.4 s scan, then a **deterministic PASS** with the expected serial
  (`source = DEMO`). The demo **never hard-fails** on a stage.
- Otherwise → capture a frame, run **`tesseract.js`** (digit whitelist),
  tolerant-match the detected digits against the stage's expected part number.
  Match → ✓ `source = OCR`; mismatch → ✗ showing the detected digits.
- A PASS ticks the part checkbox, writes a record to the log, and unlocks
  **Confirm & Continue**.

With a camera and decent lighting, point it at the expected number (e.g. print
`2207` for stage 1) to verify a match, and a different number to see a rejection.

---

## Architecture

```
shared/parts.json           accepted barcode → part-name map (single source of truth)
generated_barcodes/         printable Code-128 PNGs for Part 1/2/3 (npm run barcodes)
scripts/
  gen-barcodes.mjs          barcode generator (bwip-js)
  dev-all.mjs               runs Vite + mobile server together (npm run dev:all)
server/
  mobile-server.mjs         Round 1: HTTPS (self-signed) + Socket.IO + REST on :3001
  public/                   mobile scanner UI (login → intro → camera scanner)
    index.html · styles.css · app.js · vendor/html5-qrcode.min.js
src/
  main.tsx                  app entry
  App.tsx                   login → home → rounds → station view state
  types.ts                  domain model
  data/steps.ts             the 7 AssemblyStep records + operator/station ids
  styles/global.css         design tokens + every component style
  lib/
    ocr.ts                  tesseract.js wrapper (dynamic import, digit OCR)
    records.ts              RecordsService interface + IndexedDB implementation
    mobileLink.ts           shared Socket.IO link + hooks (gate + station scan)
  hooks/
    useCamera.ts            getUserMedia + frame capture
  components/
    BridgeLogo.tsx          animated SVG bridge
    IntroScreen.tsx
    RoundsHub.tsx           connect gate — link the phone, then Proceed
    RoundIntermission.tsx   Round 1 → Round 2 hand-off overlay
    AssemblyStation.tsx     Round 1 (mobile scan) → Round 2 (laptop OCR)
    StepRail.tsx
    InstructionPanel.tsx    image → part row → instruction → verification → VIDEO
    PartFigure.tsx          inline SVG per PartKind (no external assets)
    VisionVerification.tsx  camera + OCR + demo fallback + status
    VideoContainer.tsx      the player directly below verification
    TraceabilityLog.tsx
    CompletionCard.tsx
```

### Data access is behind a service interface
Persistence lives **only** behind `RecordsService` in
[`src/lib/records.ts`](src/lib/records.ts). The shipped implementation is
**IndexedDB** (survives reload, PWA-ready — no localStorage/sessionStorage). The
production target is a **NestJS / PostgreSQL** backend with an offline-sync
layer; to migrate, implement `RecordsService` against your API and swap the
single exported `recordsService` singleton — **no component changes required**:

```ts
// src/lib/records.ts
export const recordsService: RecordsService = new RestRecordsService(baseUrl)
```

The traceability log persists across reloads, and an in-progress build is
**restored on reload** (completion state and active stage are reconstructed from
the stored records).

---

## Customising for a real line

### Drop in real assembly clips (MP4)
Each stage's video is optional. Add an MP4 and point the step at it via
`videoSrc` in [`src/data/steps.ts`](src/data/steps.ts):

```ts
{
  id: 'frame',
  name: 'Carbon Frame',
  // ...
  videoSrc: '/clips/frame.mp4',   // put the file in  public/clips/frame.mp4
}
```

With a `videoSrc` set, the Video container renders a real `<video controls>`
player; without one it shows the styled placeholder. Files in `public/` are
served from the site root (`/clips/frame.mp4`).

### Real reference photos
Reference and BOM images are drawn as **inline SVG** (`PartFigure.tsx`) so the
demo needs zero image assets. To use real photos instead, replace the
`<PartFigure … />` usages in
[`src/components/InstructionPanel.tsx`](src/components/InstructionPanel.tsx)
with an `<img src={…} />` (store the files under `public/`).

### Edit the steps / part numbers
All step content — names, codes, expected OCR numbers (`pn`), quantities,
instructions, accent colours, and the canopy colour palette — is the typed
array in [`src/data/steps.ts`](src/data/steps.ts). No backend is needed to run.

---

## Tech
- **React 18 + TypeScript (strict) + Vite**
- **tesseract.js** for OCR (loaded via dynamic `import()` so it never blocks
  first paint)
- **IndexedDB** for traceability persistence, behind `RecordsService`
- Hand-styled CSS — no UI kit. Fonts: **Chakra Petch**, **IBM Plex Sans**,
  **IBM Plex Mono** (Google Fonts).
