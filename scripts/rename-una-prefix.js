#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// When ran from node ESM mode, __dirname isn't defined; derive it
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DRY_RUN = process.argv.includes('--dry-run')
const ROOT = process.cwd()

// File extensions to process
const EXT = new Set(['.vue', '.ts', '.js', '.jsx', '.tsx'])

// Paths to ignore
const IGNORES = ['node_modules', '.git', 'dist', 'public', 'build', 'scripts']

function walk(dir) {
  const results = []
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const rel = path.relative(ROOT, full)
    if (IGNORES.some(p => rel.split(path.sep).includes(p))) continue
    const stat = fs.statSync(full)
    if (stat.isDirectory()) results.push(...walk(full))
    else {
      if (EXT.has(path.extname(name))) results.push(full)
    }
  }
  return results
}

// Replace PascalCase U-prefixed identifiers with N-prefixed
// Only match U followed by Uppercase then lowercase (avoid matching ALL-ACRONYM words like URLSearchParams)
// Example: UButton -> NButton, UDrawerHeader -> NDrawerHeader
const pascalRegex = /\bU([A-Z][a-z][A-Za-z0-9_]*)\b/g

function processFile(file) {
  const src = fs.readFileSync(file, 'utf8')
  let out = src

  // We want to change PascalCase identifiers clearly (component names / imports)
  out = out.replace(pascalRegex, (m, p1) => {
    // Avoid changing words that look like UA, URL, UUID — heuristics: if remaining
    // part is only uppercase letters, skip (likely acronyms)
    if (/^[A-Z]+$/.test(p1)) return m
    return 'N' + p1
  })

  if (out !== src) return {file, src, out}
  return null
}

function main() {
  const files = walk(ROOT)
  const changes = []
  for (const f of files) {
    const r = processFile(f)
    if (r) changes.push(r)
  }

  if (changes.length === 0) {
    console.log('No changes detected')
    return
  }

  for (const c of changes) {
    const rel = path.relative(ROOT, c.file)
    console.log('\n----', rel)
    // show small diff preview
    const srcLines = c.src.split('\n')
    const outLines = c.out.split('\n')
    for (let i = 0; i < Math.min(srcLines.length, outLines.length); i++) {
      if (srcLines[i] !== outLines[i]) {
        console.log(`${i+1}: -${srcLines[i]}`)
        console.log(`${i+1}: +${outLines[i]}`)
      }
    }
  }

  console.log(`\nTotal files to change: ${changes.length}`)

  if (!DRY_RUN) {
    for (const c of changes) fs.writeFileSync(c.file, c.out, 'utf8')
    console.log('\nApplied changes to files (non dry-run)')
  } else {
    console.log('\nDry-run (no files modified). Rerun without --dry-run to apply changes.')
  }
}

main()
