/**
 * File: scripts/stripe-listen.ts
 * Description: Starts the Stripe CLI webhook listener, captures the generated
 *   webhook signing secret from its stdout, and writes it to .env.local so the
 *   dev server picks it up automatically without a manual copy-paste step.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const ENV_FILE_PATH = path.join(SCRIPT_DIR, '..', '.env.local')
const FORWARD_URL = 'localhost:3000/api/webhook'

/** Environment variable names. */
const ENV_KEY_WEBHOOK_SECRET = 'STRIPE_WEBHOOK_SECRET'
const ENV_KEY_SECRET_KEY = 'STRIPE_SECRET_KEY'

/**
 * Matches the Stripe CLI webhook signing secret format.
 * The secret is always prefixed with "whsec_" followed by alphanumeric characters.
 */
const WEBHOOK_SECRET_REGEX = /whsec_[a-zA-Z0-9]+/

// ---------------------------------------------------------------------------
// Env file helpers
// ---------------------------------------------------------------------------

/**
 * Reads `STRIPE_SECRET_KEY` from .env.local.
 * Returns null if the file is missing or the key is not present.
 */
const readStripeSecretKey = (): string | null => {
  if (!fs.existsSync(ENV_FILE_PATH)) return null

  const content = fs.readFileSync(ENV_FILE_PATH, 'utf8')
  const match = content.match(new RegExp(`^${ENV_KEY_SECRET_KEY}=(.*)$`, 'm'))
  if (!match) return null

  // Strip optional surrounding quotes left by some env editors.
  return match[1].replace(/(^"|"$)/g, '').trim() || null
}

/**
 * Upserts `STRIPE_WEBHOOK_SECRET=<webhookSecret>` in .env.local.
 * Ensures it is placed exactly after `STRIPE_SECRET_KEY`.
 */
const writeWebhookSecret = (webhookSecret: string): void => {
  if (!fs.existsSync(ENV_FILE_PATH)) return

  const content = fs.readFileSync(ENV_FILE_PATH, 'utf8')
  const lines = content.split('\n')

  const prefixSecret = `${ENV_KEY_SECRET_KEY}=`
  const prefixWebhook = `${ENV_KEY_WEBHOOK_SECRET}=`
  const newWebhookLine = `${prefixWebhook}${webhookSecret}`

  // 1. Remove any existing webhook secret line(s) to avoid duplicates
  const filteredLines = lines.filter(line => !line.startsWith(prefixWebhook))

  // 2. Find the exact index of STRIPE_SECRET_KEY
  const secretKeyIndex = filteredLines.findIndex(line =>
    line.startsWith(prefixSecret),
  )

  if (secretKeyIndex !== -1) {
    // 3. Insert the webhook secret immediately after the secret key
    filteredLines.splice(secretKeyIndex + 1, 0, newWebhookLine)
  } else {
    // Fallback: append at the end if the secret key line is completely malformed
    if (
      filteredLines.length > 0 &&
      filteredLines[filteredLines.length - 1] !== ''
    ) {
      filteredLines.push('')
    }
    filteredLines.push(newWebhookLine)
  }

  // 4. Write back to the file
  fs.writeFileSync(ENV_FILE_PATH, filteredLines.join('\n'), 'utf8')
  console.log(
    `\n[stripe-listen] ${ENV_KEY_WEBHOOK_SECRET} updated correctly below ${ENV_KEY_SECRET_KEY} in .env.local\n`,
  )
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const run = (): void => {
  const secretKey = readStripeSecretKey()

  if (!secretKey) {
    console.error(
      `[stripe-listen] ${ENV_KEY_SECRET_KEY} is missing from .env.local — aborting.`,
    )
    process.exit(1)
  }

  const isLiveMode = process.argv.includes('--live')
  const args = [
    'listen',
    ...(isLiveMode ? ['--live'] : []),
    '--api-key',
    secretKey,
    '--forward-to',
    FORWARD_URL,
  ]

  const stripeProcess = spawn('stripe', args, {
    shell: process.platform === 'win32',
  })

  // Helper to process both stdout and stderr (DRY)
  const processStream = (chunk: Buffer, stream: NodeJS.WriteStream): void => {
    const output = chunk.toString()
    stream.write(output)

    const match = output.match(WEBHOOK_SECRET_REGEX)
    if (match) {
      writeWebhookSecret(match[0])
    }
  }

  stripeProcess.stdout.on('data', (chunk: Buffer) => {
    processStream(chunk, process.stdout)
  })

  stripeProcess.stderr.on('data', (chunk: Buffer) => {
    processStream(chunk, process.stderr)
  })

  stripeProcess.on('close', (code: number | null) => {
    process.stdout.write(
      `[stripe-listen] Stripe CLI exited with code ${code ?? 'unknown'}\n`,
    )
  })
}

run()
