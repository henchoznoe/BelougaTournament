/**
 * File: scripts/build-artifacts.ts
 * Description: Locates prerendered HTML in local and adapter-scoped Next.js builds.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { access, readdir } from 'node:fs/promises'
import path from 'node:path'
import { inflateSync } from 'node:zlib'

/** Reads tags embedded in Next.js's postponed render data, not just its HTML. */
export const getPostponedCacheTags = (postponed?: string): string[] => {
  if (!postponed) return []
  // Next.js stores <length>:<React state><resume cache>. The resume cache is
  // either null, raw JSON or base64-encoded deflate JSON.
  const prefix = postponed.match(/^(\d+):/)
  if (!prefix) throw new Error('Invalid postponed state length prefix')
  const tail = postponed.slice(prefix[0].length + Number(prefix[1]))
  if (tail === 'null') return []
  const cache = JSON.parse(
    tail.startsWith('{')
      ? tail
      : inflateSync(Buffer.from(tail, 'base64'), {
          maxOutputLength: 10 * 1024 * 1024,
        }).toString('utf8'),
  ) as { store: { cache: Record<string, { entry: { tags: string[] } }> } }
  return [
    ...new Set(
      Object.values(cache.store.cache).flatMap(value => value.entry.tags),
    ),
  ]
}

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
