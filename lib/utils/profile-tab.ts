/**
 * File: lib/utils/profile-tab.ts
 * Description: Resolves profile tabs from shareable URLs and legacy section anchors.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export const resolveProfileTab = (
  tab: string | null,
  hash: string,
): 'current' | 'history' => {
  if (tab === 'current' || tab === 'history') return tab
  return hash === '#tournaments-history' ? 'history' : 'current'
}
