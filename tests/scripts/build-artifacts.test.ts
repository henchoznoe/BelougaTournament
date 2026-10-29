/**
 * File: tests/scripts/build-artifacts.test.ts
 * Description: Regression tests for local and Vercel prerendered HTML discovery.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resolvePrerenderedHtml } from '@/scripts/build-artifacts'

describe('resolvePrerenderedHtml', () => {
  let directory: string

  beforeEach(async () => {
    directory = await mkdtemp(path.join(os.tmpdir(), 'belouga-build-'))
  })

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true })
  })

  const createHtml = async (relativePath: string): Promise<string> => {
    const file = path.join(directory, relativePath)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, '<html></html>')
    return file
  }

  it('locates HTML in a regular Next.js build', async () => {
    const file = await createHtml('server/app/index.html')
    await expect(resolvePrerenderedHtml(directory, 'index.html')).resolves.toBe(
      file,
    )
  })

  it.each(['index.html', 'contact.html', 'tournaments/archive.html'])(
    'locates %s in an adapter build with hashed route owners',
    async htmlPath => {
      const file = await createHtml(
        `server/route-cache/APP_PAGE/owner-a/$/${htmlPath}`,
      )
      await createHtml('server/route-cache/APP_PAGE/owner-b/$/privacy.html')
      await expect(resolvePrerenderedHtml(directory, htmlPath)).resolves.toBe(
        file,
      )
    },
  )

  it('fails when the prerendered artifact is missing', async () => {
    await expect(
      resolvePrerenderedHtml(directory, 'index.html'),
    ).rejects.toThrow('0 fichiers')
  })

  it('rejects ambiguous source routes instead of measuring the wrong page', async () => {
    await createHtml('server/route-cache/APP_PAGE/owner-a/$/index.html')
    await createHtml('server/route-cache/APP_PAGE/owner-b/$/index.html')
    await expect(
      resolvePrerenderedHtml(directory, 'index.html'),
    ).rejects.toThrow('2 fichiers')
  })
})
