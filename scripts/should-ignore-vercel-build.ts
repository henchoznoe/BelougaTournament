/**
 * File: scripts/should-ignore-vercel-build.ts
 * Description: Skips Vercel builds when a commit only changes non-deployable files.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { execFileSync } from 'node:child_process'

const output = execFileSync('git', ['diff', '--name-only', 'HEAD^', 'HEAD'], {
  encoding: 'utf8',
})
const files = output.split('\n').filter(Boolean)
const isNonDeployable = (file: string): boolean =>
  /(^|\/)[^/]+\.mdx?$/.test(file) ||
  file.startsWith('.github/ISSUE_TEMPLATE/') ||
  file === '.github/PULL_REQUEST_TEMPLATE.md'

process.exit(files.length > 0 && files.every(isNonDeployable) ? 0 : 1)
