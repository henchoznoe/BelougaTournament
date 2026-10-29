/**
 * File: tests/scripts/deploy-migrations.test.ts
 * Description: Exercises migration environment guards and failure propagation in a subprocess.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const script = path.resolve('scripts/deploy-migrations.ts')

describe('Vercel migration deployment', () => {
  let directory: string

  beforeEach(async () => {
    directory = await mkdtemp(path.join(os.tmpdir(), 'belouga-migrations-'))
    const cliDirectory = path.join(directory, 'node_modules/prisma/build')
    await mkdir(cliDirectory, { recursive: true })
    await writeFile(
      path.join(cliDirectory, 'index.js'),
      'console.log(process.argv.slice(2).join(" ")); process.exit(Number(process.env.TEST_MIGRATION_EXIT_CODE ?? 0))',
    )
  })

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true })
  })

  const run = (environment: string, exitCode = '0') =>
    spawnSync(process.execPath, [script], {
      cwd: directory,
      encoding: 'utf8',
      env: {
        ...process.env,
        VERCEL_ENV: environment,
        TEST_MIGRATION_EXIT_CODE: exitCode,
      },
    })

  it.each(['preview', 'production'])(
    'applies migrations during a %s deployment',
    environment => {
      const result = run(environment)
      expect(result.status).toBe(0)
      expect(result.stdout).toContain('migrate deploy')
    },
  )

  it.each(['', 'development', 'test'])(
    'does not migrate for environment %s',
    environment => {
      const result = run(environment)
      expect(result.status).toBe(0)
      expect(result.stdout).toContain('Skipping database migrations')
      expect(result.stdout).not.toContain('migrate deploy')
    },
  )

  it('stops a preview build when migrations fail', () => {
    expect(run('preview', '3').status).toBe(3)
  })
})
