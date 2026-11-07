/**
 * File: tests/utils/media-upload.test.ts
 * Description: Tests upload recovery, progress, and preservation of successful images.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { uploadImageFiles } from '@/lib/utils/media-upload'

afterEach(() => vi.unstubAllGlobals())
const files = [
  new File(['image-one'], 'one.png'),
  new File(['image-two'], 'two.png'),
]

describe('media upload recovery', () => {
  it('retains the first image and reports a network failure for the second', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ url: 'https://media.test/one.png' }),
      )
      .mockRejectedValueOnce(new Error('Connexion interrompue'))
    vi.stubGlobal('fetch', fetch)
    const progress = vi.fn()
    expect(
      await uploadImageFiles(files, 'tournaments/test/images', progress),
    ).toEqual(['https://media.test/one.png'])
    expect(progress).toHaveBeenLastCalledWith({
      pending: false,
      completed: 2,
      total: 2,
      errors: ['two.png (image 2) : Connexion interrompue'],
    })
    const body = fetch.mock.calls[0][1].body as FormData
    expect(body.get('folder')).toBe('tournaments/test/images')
    expect(body.get('file')).toBeInstanceOf(File)
  })
  it('continues after a rejected file and reports successful imports', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ error: 'Fichier trop volumineux' }, { status: 400 }),
        )
        .mockResolvedValueOnce(
          Response.json({ url: 'https://media.test/two.png' }),
        ),
    )
    const progress = vi.fn()
    expect(await uploadImageFiles(files, 'sponsors', progress)).toEqual([
      'https://media.test/two.png',
    ])
    expect(progress).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pending: false,
        completed: 2,
        errors: ['one.png (image 1) : Fichier trop volumineux'],
      }),
    )
  })
  it('handles a malformed successful response as an individual error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({})))
    const progress = vi.fn()
    expect(await uploadImageFiles([files[0]], 'sponsors', progress)).toEqual([])
    expect(progress).toHaveBeenLastCalledWith(
      expect.objectContaining({
        pending: false,
        errors: ['one.png (image 1) : Import impossible.'],
      }),
    )
  })
})
