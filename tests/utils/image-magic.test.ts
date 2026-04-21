/**
 * File: tests/utils/image-magic.test.ts
 * Description: Unit tests for verifyImageMagicBytes — magic-byte validation for image uploads.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { describe, expect, it } from 'vitest'
import { verifyImageMagicBytes } from '@/lib/utils/image-magic'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Creates a File whose content is the given bytes, padded to 32 bytes with zeros. */
const makeFile = (bytes: number[], mimeType = 'image/png'): File => {
  const padded = [
    ...bytes,
    ...new Array(Math.max(0, 32 - bytes.length)).fill(0),
  ]
  return new File([new Uint8Array(padded)], 'test', { type: mimeType })
}

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG_MAGIC = [0xff, 0xd8, 0xff]
// WEBP: "RIFF" + 4 arbitrary size bytes + "WEBP"
const WEBP_MAGIC = [
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]

// ─── PNG ──────────────────────────────────────────────────────────────────────

describe('verifyImageMagicBytes — PNG', () => {
  it('returns true for a valid PNG with declared image/png', async () => {
    const file = makeFile(PNG_MAGIC, 'image/png')
    expect(await verifyImageMagicBytes(file, 'image/png')).toBe(true)
  })

  it('returns false when declared type is image/jpeg but bytes are PNG', async () => {
    const file = makeFile(PNG_MAGIC, 'image/jpeg')
    expect(await verifyImageMagicBytes(file, 'image/jpeg')).toBe(false)
  })

  it('returns false when declared type is image/webp but bytes are PNG', async () => {
    const file = makeFile(PNG_MAGIC, 'image/webp')
    expect(await verifyImageMagicBytes(file, 'image/webp')).toBe(false)
  })
})

// ─── JPEG ─────────────────────────────────────────────────────────────────────

describe('verifyImageMagicBytes — JPEG', () => {
  it('returns true for a valid JPEG with declared image/jpeg', async () => {
    const file = makeFile(JPEG_MAGIC, 'image/jpeg')
    expect(await verifyImageMagicBytes(file, 'image/jpeg')).toBe(true)
  })

  it('returns false when declared type is image/png but bytes are JPEG', async () => {
    const file = makeFile(JPEG_MAGIC, 'image/png')
    expect(await verifyImageMagicBytes(file, 'image/png')).toBe(false)
  })

  it('returns false when declared type is image/webp but bytes are JPEG', async () => {
    const file = makeFile(JPEG_MAGIC, 'image/webp')
    expect(await verifyImageMagicBytes(file, 'image/webp')).toBe(false)
  })
})

// ─── WebP ─────────────────────────────────────────────────────────────────────

describe('verifyImageMagicBytes — WebP', () => {
  it('returns true for a valid WebP with declared image/webp', async () => {
    const file = makeFile(WEBP_MAGIC, 'image/webp')
    expect(await verifyImageMagicBytes(file, 'image/webp')).toBe(true)
  })

  it('returns false when declared type is image/png but bytes are WebP', async () => {
    const file = makeFile(WEBP_MAGIC, 'image/png')
    expect(await verifyImageMagicBytes(file, 'image/png')).toBe(false)
  })

  it('returns false when declared type is image/jpeg but bytes are WebP', async () => {
    const file = makeFile(WEBP_MAGIC, 'image/jpeg')
    expect(await verifyImageMagicBytes(file, 'image/jpeg')).toBe(false)
  })
})

// ─── Unknown / malicious bytes ────────────────────────────────────────────────

describe('verifyImageMagicBytes — unknown/malicious bytes', () => {
  it('returns false for an HTML payload claiming to be PNG', async () => {
    const htmlBytes = Array.from(
      Buffer.from('<html><script>alert(1)</script></html>'),
    )
    const file = makeFile(htmlBytes, 'image/png')
    expect(await verifyImageMagicBytes(file, 'image/png')).toBe(false)
  })

  it('returns false for a JavaScript payload claiming to be JPEG', async () => {
    const jsBytes = Array.from(Buffer.from('alert("xss")'))
    const file = makeFile(jsBytes, 'image/jpeg')
    expect(await verifyImageMagicBytes(file, 'image/jpeg')).toBe(false)
  })

  it('returns false for an SVG payload claiming to be PNG', async () => {
    const svgBytes = Array.from(
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    )
    const file = makeFile(svgBytes, 'image/png')
    expect(await verifyImageMagicBytes(file, 'image/png')).toBe(false)
  })

  it('returns false for all-zero bytes', async () => {
    const file = makeFile(new Array(32).fill(0), 'image/png')
    expect(await verifyImageMagicBytes(file, 'image/png')).toBe(false)
  })

  it('returns false for an unknown declared type even with valid PNG bytes', async () => {
    const file = makeFile(PNG_MAGIC, 'image/gif')
    expect(await verifyImageMagicBytes(file, 'image/gif')).toBe(false)
  })
})

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('verifyImageMagicBytes — edge cases', () => {
  it('returns false for a file with fewer than 3 bytes', async () => {
    const file = makeFile([0xff, 0xd8], 'image/jpeg')
    // Even though first 2 bytes match JPEG, the 3rd (0x00 padding) does not
    expect(await verifyImageMagicBytes(file, 'image/jpeg')).toBe(false)
  })

  it('returns false for an empty file', async () => {
    const file = new File([], 'empty.png', { type: 'image/png' })
    expect(await verifyImageMagicBytes(file, 'image/png')).toBe(false)
  })

  it('returns false for a PNG with a corrupted first byte', async () => {
    const corrupted = [0x00, ...PNG_MAGIC.slice(1)]
    const file = makeFile(corrupted, 'image/png')
    expect(await verifyImageMagicBytes(file, 'image/png')).toBe(false)
  })

  it('returns false for a WebP missing the WEBP signature at offset 8', async () => {
    const badWebp = [
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]
    const file = makeFile(badWebp, 'image/webp')
    expect(await verifyImageMagicBytes(file, 'image/webp')).toBe(false)
  })
})
