/**
 * File: declarations.d.ts
 * Description: Type declarations.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

declare module '*.css';

interface TwitchPlayerOptions {
  width: string | number
  height: string | number
  channel: string
  autoplay?: boolean
  muted?: boolean
  parent?: string[]
}

interface TwitchPlayerInstance {
  addEventListener(event: string, callback: () => void): void
  removeEventListener(event: string, callback: () => void): void
}

interface TwitchPlayerConstructor {
  new (containerId: string, options: TwitchPlayerOptions): TwitchPlayerInstance
  readonly READY: string
  readonly ONLINE: string
  readonly OFFLINE: string
}

interface TwitchNamespace {
  Player: TwitchPlayerConstructor
}

declare global {
  interface Window {
    Twitch?: TwitchNamespace
  }
}

export {}
