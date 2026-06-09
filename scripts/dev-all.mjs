// Runs the laptop app (Vite, :5173) and the Round 1 mobile server (:3001)
// together in one terminal. Zero extra dependencies — just spawns both with the
// current Node and forwards their output. Ctrl+C stops both.
//
//   npm run dev:all
import { spawn, execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const procs = [
  { name: 'app   ', color: '\x1b[36m', cmd: [join(root, 'node_modules', 'vite', 'bin', 'vite.js')] },
  { name: 'mobile', color: '\x1b[35m', cmd: [join(root, 'server', 'mobile-server.mjs')] },
]

const children = procs.map(({ name, color, cmd }) => {
  const child = spawn(process.execPath, cmd, { cwd: root })
  const tag = `${color}[${name}]\x1b[0m `
  const pipe = (stream, out) => {
    stream.on('data', (b) => {
      for (const line of b.toString().split(/\r?\n/)) if (line) out.write(tag + line + '\n')
    })
  }
  pipe(child.stdout, process.stdout)
  pipe(child.stderr, process.stderr)
  child.on('exit', (code) => {
    process.stdout.write(`${tag}exited (${code})\n`)
    shutdown()
  })
  return child
})

// Kill a child *and its descendants*. On Windows, child.kill() only kills the
// direct process (Vite/esbuild spawn workers), so use taskkill /T to take the
// whole tree down and avoid orphans holding the ports next run.
function killTree(c) {
  if (!c.pid) return
  try {
    if (process.platform === 'win32') execSync(`taskkill /pid ${c.pid} /T /F`, { stdio: 'ignore' })
    else c.kill('SIGTERM')
  } catch { /* already gone */ }
}

let stopping = false
function shutdown() {
  if (stopping) return
  stopping = true
  for (const c of children) killTree(c)
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
