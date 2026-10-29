/**
 * File: scripts/build-artifacts.ts
 * Description: Locates prerendered HTML in local and adapter-scoped Next.js builds.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { access, readdir } from 'node:fs/promises'
import path from 'node:path'

const fileExists = async (file: string): Promise<boolean> => {
  try {
    await access(file)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw error
  }
}

export const resolvePrerenderedHtml = async (
  nextDirectory: string,
  htmlPath: string,
): Promise<string> => {
  const legacyPath = path.join(nextDirectory, 'server/app', htmlPath)
  if (await fileExists(legacyPath)) return legacyPath

  // Next.js adapters scope artifacts by source route. Discover the owner
  // directory rather than duplicating Next.js's internal hashing algorithm.
  const cacheDirectory = path.join(nextDirectory, 'server/route-cache/APP_PAGE')
  const candidates: string[] = []
  if (await fileExists(cacheDirectory)) {
    const owners = await readdir(cacheDirectory, { withFileTypes: true })
    for (const owner of owners) {
      if (!owner.isDirectory()) continue
      const candidate = path.join(cacheDirectory, owner.name, '$', htmlPath)
      if (await fileExists(candidate)) candidates.push(candidate)
    }
  }

  if (candidates.length !== 1) {
    throw new Error(
      `HTML prérendu ${htmlPath}: ${candidates.length} fichiers trouvés dans ${cacheDirectory}.`,
    )
  }
  return candidates[0]
}
