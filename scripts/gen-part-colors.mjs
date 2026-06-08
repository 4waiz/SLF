// One-shot asset pipeline: take the blue source renders in `drone parts/` and
// emit three colour-ways (blue / orange / grey) under `public/drone-parts/<color>/`
// with clean, stable filenames the app imports by key.
//
//   node scripts/gen-part-colors.mjs
//
// Orange  = rotate every saturated hue +175° (blue ≈210° → orange ≈25°).
// Grey    = collapse saturation toward zero (desaturated brushed-metal look).
// Blue    = the source, copied through and re-keyed.
//
// Pixels with no saturation (white spacers, black trim) and transparent pixels
// are left alone, so only the coloured body of each part is re-tinted.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'drone parts')
const OUT = join(ROOT, 'public', 'drone-parts')

// part key  ->  source filename in `drone parts/`
const PARTS = {
  full_drone: 'blue_full_drone.png',
  main_frame: 'blue_main_frame.png',
  top_cover: 'blue_protective_canopy.png',
  gps_mast: 'blue_gps_mast.png',
  front_arms: 'blue_fl_fr_drone_arms.png',
  rear_arms: 'blue_rl_rr_drone_arms (2).png',
  front_props: 'blue_front_properller (2).png',
  rear_props: 'blue_rear_Properller (2).png',
  prop_blades: 'blue_propeller_blades (2).png',
  motor_mounts: 'blue_motor_mounts (2).png',
  motor: 'blue_brushless_drone_motor (2).png',
  battery: 'blue_LiPo_battery_pack (2).png',
  flight_controller: 'blue_flight_controller.png',
  motor_wires: 'blue_motor_wires.png',
  shock_absorbers: 'blue_shock_absorbers.png',
  springs: 'blue_springs (2).png',
  suspension_arms: 'blue_suspension_arms (2).png',
  steering_linkage: 'blue_steering_linkage.png',
  screws: 'blue_screws (2).png',
  nuts: 'blue_nuts (2).png',
  washers: 'blue_washers (2).png',
  white_spacers: 'blue_white_spacers.png',
  mounting_brackets: 'blue_small_mounting_brackets.png',
  camera_module: 'blue_camera_moudle.png',
  landing_gear: 'blue_landing_gear.png',
  propeller_guards: 'blue_propeller_guards.png',
  esc_modules: 'blue_esc_modules.png',
}

const ORANGE_ROTATE = 175 // degrees
const GREY_SATURATION = 0.1 // keep a faint warmth so it reads as metal, not flat

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0
  const l = (max + min) / 2
  const d = max - min
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return [h, s, l]
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ]
}

function transform(png, mode) {
  const out = new PNG({ width: png.width, height: png.height })
  png.data.copy(out.data)
  const d = out.data
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue // transparent → leave alone
    const [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2])
    if (s < 0.06) continue // near-neutral (white/black) → leave alone
    let nh = h, ns = s
    if (mode === 'orange') {
      nh = (h + ORANGE_ROTATE) % 360
    } else if (mode === 'grey') {
      ns = Math.min(s, GREY_SATURATION)
      nh = 30 // faint warm cast
    }
    const [r, g, b] = hslToRgb(nh, ns, l)
    d[i] = r; d[i + 1] = g; d[i + 2] = b
  }
  return out
}

mkdirSync(join(OUT, 'blue'), { recursive: true })
mkdirSync(join(OUT, 'orange'), { recursive: true })
mkdirSync(join(OUT, 'grey'), { recursive: true })

let n = 0
for (const [key, file] of Object.entries(PARTS)) {
  const src = PNG.sync.read(readFileSync(join(SRC, file)))
  writeFileSync(join(OUT, 'blue', `${key}.png`), PNG.sync.write(src))
  writeFileSync(join(OUT, 'orange', `${key}.png`), PNG.sync.write(transform(src, 'orange')))
  writeFileSync(join(OUT, 'grey', `${key}.png`), PNG.sync.write(transform(src, 'grey')))
  n++
  process.stdout.write(`  ✓ ${key}\n`)
}
console.log(`\nDone — ${n} parts × 3 colours → ${OUT}`)
