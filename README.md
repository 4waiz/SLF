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
src/
  main.tsx                  app entry
  App.tsx                   intro ↔ station view state
  types.ts                  domain model
  data/steps.ts             the 7 AssemblyStep records + operator/station ids
  styles/global.css         design tokens + every component style
  lib/
    ocr.ts                  tesseract.js wrapper (dynamic import, digit OCR)
    records.ts              RecordsService interface + IndexedDB implementation
  hooks/
    useCamera.ts            getUserMedia + frame capture
  components/
    BridgeLogo.tsx          animated SVG bridge
    IntroScreen.tsx
    AssemblyStation.tsx     owns build state, lays out the 3 regions
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
