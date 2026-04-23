/**
 * File: lib/utils/app-version.ts
 * Description: Utility function for getting the application version
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import packageJson from '@/package.json' with { type: 'json' }

export const getAppVersion = (): string => {
  return packageJson.version
}

export const getRepoUrl = (): string => {
  return packageJson.homepage
}
