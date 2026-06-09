// Generates a printable Code-128 barcode PNG for every part in the Drone
// Production Form, plus the shared pn->name mapping the server matches against.
//
//   node scripts/gen-barcodes.mjs        (or: npm run barcodes)
//
// Source of truth is src/data/steps.ts (so we never duplicate the 26 parts).
// Each barcode ENCODES the part number (pn), e.g. "1001" — the same value the
// laptop OCR matches, so one printed barcode works for Round 1 (mobile scan)
// and Round 2 (laptop camera) alike.
//
// Output:
//   shared/parts.json                      { "1001": "Main frame / center plate", ... }
//   generated_barcodes/NN_<pn>_<slug>.png  one per part, captioned with name + pn
import bwipjs from 'bwip-js'
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const outDir = join(root, 'generated_barcodes')

// --- Pull [name, pn] out of the steps array (no TS toolchain needed) --------
const stepsSrc = await readFile(join(root, 'src', 'data', 'steps.ts'), 'utf8')
// Scope to the steps array so the colour names above it aren't picked up.
const arrStart = stepsSrc.indexOf('export const steps')
const region = arrStart === -1 ? stepsSrc : stepsSrc.slice(arrStart)
// Within each step object `name:` always precedes `pn:` (id, name, code, pn, …).
const parts = [...region.matchAll(/name:\s*'([^']+)'[\s\S]*?pn:\s*'([^']+)'/g)].map((m) => ({
  name: m[1],
  pn: m[2],
}))

if (!parts.length) {
  console.error('No parts found in src/data/steps.ts — aborting.')
  process.exit(1)
}

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40)

// --- Write the shared mapping (pn -> name) ---------------------------------
const mapping = Object.fromEntries(parts.map((p) => [p.pn, p.name]))
await writeFile(join(root, 'shared', 'parts.json'), JSON.stringify(mapping, null, 2) + '\n')

// --- Regenerate the barcode PNGs (clean the folder first) ------------------
await rm(outDir, { recursive: true, force: true })
await mkdir(outDir, { recursive: true })

let i = 0
for (const { name, pn } of parts) {
  i += 1
  const nn = String(i).padStart(2, '0')
  const png = await bwipjs.toBuffer({
    bcid: 'code128', // dense, reliably decoded by phone cameras
    text: pn, // the value the scanner reads back, e.g. "1001"
    scale: 4,
    height: 20,
    includetext: true,
    alttext: `${nn})  ${name}   ·   PN ${pn}`, // caption under the bars
    textxalign: 'center',
    paddingwidth: 12,
    paddingheight: 12,
    backgroundcolor: 'FFFFFF',
  })
  const file = join(outDir, `${nn}_${pn}_${slug(name)}.png`)
  await writeFile(file, png)
  console.log(`✓ ${nn}  PN ${pn.padEnd(5)} ${name}`)
}

console.log(`\nDone. ${parts.length} barcodes → ${outDir}`)
console.log(`Mapping → shared/parts.json (${parts.length} parts)`)
