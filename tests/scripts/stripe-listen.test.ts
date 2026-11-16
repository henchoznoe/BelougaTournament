/**
 * File: tests/scripts/stripe-listen.test.ts
 * Description: Checks Stripe listener event selection, forwarding and failure reporting.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STRIPE_WEBHOOK_EVENTS } from '@/lib/config/constants/stripe'

const spawn = vi.hoisted(() => vi.fn())
const writeFile = vi.hoisted(() => vi.fn())
vi.mock('node:child_process', () => ({ spawn }))
vi.mock('node:fs', () => ({
  default: {
    existsSync: () => true,
    readFileSync: () => 'STRIPE_SECRET_KEY="sk_test_fixture"\nOTHER=value\n',
    writeFileSync: writeFile,
  },
}))
const originalArgs = process.argv
const originalExitCode = process.exitCode
let child: EventEmitter & { stdout: EventEmitter; stderr: EventEmitter }

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  child = Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  })
  spawn.mockReturnValue(child)
  process.argv = ['node', 'stripe-listen.ts']
  process.exitCode = undefined
  vi.spyOn(process.stdout, 'write').mockReturnValue(true)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => {
  process.argv = originalArgs
  process.exitCode = originalExitCode
  vi.restoreAllMocks()
})

describe('Stripe listener', () => {
  it('subscribes to all handled events in test mode without putting credentials in arguments', async () => {
    await import('../../scripts/stripe-listen.ts')
    expect(spawn).toHaveBeenCalledWith(
      'stripe',
      [
        'listen',
        '--events',
        STRIPE_WEBHOOK_EVENTS.join(','),
        '--forward-to',
        'localhost:3000/api/webhook',
      ],
      expect.objectContaining({
        env: expect.objectContaining({ STRIPE_API_KEY: 'sk_test_fixture' }),
      }),
    )
  })

  it('supports an isolated forwarding port and explicit live mode', async () => {
    process.argv.push('--live', '--forward-to', 'localhost:3300/api/webhook')
    await import('../../scripts/stripe-listen.ts')
    expect(spawn.mock.calls[0][1]).toEqual(
      expect.arrayContaining(['--live', 'localhost:3300/api/webhook']),
    )
  })

  it('propagates listener failures and process launch errors', async () => {
    await import('../../scripts/stripe-listen.ts')
    child.emit('close', 1)
    expect(process.exitCode).toBe(1)
    child.emit('error', new Error('not installed'))
    expect(process.exitCode).toBe(1)
  })

  it('writes the received webhook secret to the isolated environment file', async () => {
    await import('../../scripts/stripe-listen.ts')
    child.stderr.emit(
      'data',
      Buffer.from('Ready! Signing secret whsec_fixture123'),
    )
    expect(writeFile).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('STRIPE_WEBHOOK_SECRET=whsec_fixture123'),
      'utf8',
    )
  })

  it('rejects a missing forwarding URL without starting the listener', async () => {
    process.argv.push('--forward-to')
    await import('../../scripts/stripe-listen.ts')
    expect(spawn).not.toHaveBeenCalled()
    expect(process.exitCode).toBe(1)
  })
})
