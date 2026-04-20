/**
 * File: lib/utils/image-magic.ts
 * Description: Validates image payloads by matching their magic bytes against a
 *   whitelist of formats (PNG, JPEG, WebP). Prevents attackers from uploading
 *   an HTML/JS file with a forged `Content-Type: image/png` header, which
 *   relying on `File.type` alone would accept.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

/** MIME types this module can verify. */
type VerifiableImageMime = 'image/png' | 'image/jpeg' | 'image/webp'

/**
 * Returns the MIME type implied by the file's leading bytes, or null if the
 * bytes do not match any supported image format.
 *
 * - PNG:  89 50 4E 47 0D 0A 1A 0A
 * - JPEG: FF D8 FF
 * - WebP: "RIFF" .... "WEBP"
 */
const detectImageMime = (bytes: Uint8Array): VerifiableImageMime | null => {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png'
  }
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return 'image/jpeg'
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // 'R'
    bytes[1] === 0x49 && // 'I'
    bytes[2] === 0x46 && // 'F'
    bytes[3] === 0x46 && // 'F'
    bytes[8] === 0x57 && // 'W'
    bytes[9] === 0x45 && // 'E'
    bytes[10] === 0x42 && // 'B'
    bytes[11] === 0x50 // 'P'
  ) {
    return 'image/webp'
  }
  return null
}

/**
 * Reads the first 32 bytes of the uploaded file and verifies the magic bytes
 * match the declared content-type. Returns true only on a positive match.
 */
export const verifyImageMagicBytes = async (
  file: File,
  declaredType: string,
): Promise<boolean> => {
  const header = await file.slice(0, 32).arrayBuffer()
  const detected = detectImageMime(new Uint8Array(header))
  return detected !== null && detected === declaredType
}
