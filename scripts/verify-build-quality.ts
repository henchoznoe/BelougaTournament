/**
 * File: scripts/verify-build-quality.ts
 * Description: Enforces static rendering and frontend asset budgets after a Next.js build.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { readFileSync, statSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const nextDirectory = path.resolve('.next')
const publicDirectory = path.resolve('public')
const minimumRevalidateSeconds = 30 * 24 * 60 * 60

const staticRoutes = [
  '/',
  '/contact',
  '/legal',
  '/players',
  '/privacy',
  '/stream',
  '/terms',
  '/tournaments',
  '/sitemap.xml',
] as const

const routeHtmlPaths = {
  '/': 'index.html',
  '/contact': 'contact.html',
  '/privacy': 'privacy.html',
  '/tournaments': 'tournaments.html',
} as const

const routeJavascriptBudgets: Partial<
  Record<keyof typeof routeHtmlPaths, number>
> = {
  '/': 400 * 1024,
  '/contact': 400 * 1024,
  '/privacy': 400 * 1024,
  '/tournaments': 475 * 1024,
}

const imageExtensions = new Set([
  '.avif',
  '.gif',
  '.jpeg',
  '.jpg',
  '.png',
  '.webp',
])
const maximumImageBytes = 256 * 1024
const maximumPublicImagesBytes = 700 * 1024

interface PrerenderRoute {
  compute?: string
  initialRevalidateSeconds?: number | false
}

const formatKiB = (bytes: number): string => `${Math.ceil(bytes / 1024)} Kio`

const readJson = async <T>(file: string): Promise<T> =>
  JSON.parse(await readFile(file, 'utf8')) as T

const listFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map(entry => {
        const target = path.join(directory, entry.name)
        return entry.isDirectory()
          ? listFiles(target)
          : Promise.resolve([target])
      }),
    )
  ).flat()
}

const getRouteJavascriptBytes = async (
  route: keyof typeof routeHtmlPaths,
): Promise<number> => {
  const html = await readFile(
    path.join(nextDirectory, 'server/app', routeHtmlPaths[route]),
    'utf8',
  )
  const scripts = new Set(
    [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)]
      .map(match => match[1])
      .filter((script): script is string => Boolean(script)),
  )

  return [...scripts].reduce((total, script) => {
    const file = path.join(nextDirectory, script.replace(/^\/_next\//, ''))
    return total + gzipSync(readFileSync(file)).byteLength
  }, 0)
}

const verifyPrerenderedRoutes = async (): Promise<void> => {
  const manifest = await readJson<{ routes: Record<string, PrerenderRoute> }>(
    path.join(nextDirectory, 'prerender-manifest.json'),
  )

  for (const route of staticRoutes) {
    const entry = manifest.routes[route]
    if (!entry) throw new Error(`${route} n'est pas prérendue.`)
    if (entry.compute && entry.compute !== 'static') {
      throw new Error(`${route} utilise encore compute=${entry.compute}.`)
    }
    if (
      route !== '/sitemap.xml' &&
      typeof entry.initialRevalidateSeconds === 'number' &&
      entry.initialRevalidateSeconds < minimumRevalidateSeconds
    ) {
      throw new Error(
        `${route} se revalide après ${entry.initialRevalidateSeconds}s, sous le minimum de ${minimumRevalidateSeconds}s.`,
      )
    }
  }

  console.info(`✓ ${staticRoutes.length} routes publiques sont statiques`)
}

const verifyJavascriptBudgets = async (): Promise<void> => {
  for (const [route, budget] of Object.entries(routeJavascriptBudgets)) {
    if (budget === undefined) continue
    const bytes = await getRouteJavascriptBytes(
      route as keyof typeof routeHtmlPaths,
    )
    if (bytes > budget) {
      throw new Error(
        `${route} charge ${formatKiB(bytes)} de JavaScript pour un budget de ${formatKiB(budget)}.`,
      )
    }
    console.info(
      `✓ JavaScript ${route}: ${formatKiB(bytes)} / ${formatKiB(budget)}`,
    )
  }
}

const verifyImageBudgets = async (): Promise<void> => {
  const images = (await listFiles(publicDirectory)).filter(file =>
    imageExtensions.has(path.extname(file).toLowerCase()),
  )
  const oversized = images.filter(
    file => statSync(file).size > maximumImageBytes,
  )
  if (oversized.length) {
    throw new Error(
      `Images au-dessus de ${formatKiB(maximumImageBytes)}: ${oversized
        .map(file => path.relative(publicDirectory, file))
        .join(', ')}.`,
    )
  }

  const total = images.reduce((sum, file) => sum + statSync(file).size, 0)
  if (total > maximumPublicImagesBytes) {
    throw new Error(
      `Images publiques: ${formatKiB(total)} pour un budget de ${formatKiB(maximumPublicImagesBytes)}.`,
    )
  }
  console.info(
    `✓ Images publiques: ${formatKiB(total)} / ${formatKiB(maximumPublicImagesBytes)}`,
  )
}

const main = async (): Promise<void> => {
  await verifyPrerenderedRoutes()
  await verifyJavascriptBudgets()
  await verifyImageBudgets()
}

main().catch(error => {
  console.error(error instanceof Error ? `✗ ${error.message}` : error)
  process.exitCode = 1
})
