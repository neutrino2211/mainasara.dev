#!/usr/bin/env node

import { execSync } from 'node:child_process'
import path from 'node:path'

try {
  execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' })
} catch {
  process.exit(0)
}

try {
  execSync('git config core.hooksPath .githooks', { stdio: 'ignore' })
  const hooksPath = path.resolve(process.cwd(), '.githooks')
  console.log(`[hooks] core.hooksPath -> ${hooksPath}`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.warn(`[hooks] Failed to set core.hooksPath: ${message}`)
}
