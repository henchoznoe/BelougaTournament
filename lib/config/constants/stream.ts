/**
 * File: lib/config/constants/stream.ts
 * Description: Shared labels for Twitch playback and connection states.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

export const STREAM_STATE_LABELS = {
  loading: 'Connexion…',
  live: 'En direct',
  offline: 'Hors ligne',
  unavailable: 'Lecteur indisponible',
  unconfigured: 'Aucun stream prévu',
} as const
