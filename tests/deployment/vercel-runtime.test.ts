/**
 * File: tests/deployment/vercel-runtime.test.ts
 * Description: Verifies HTML sanitization under the Vercel Lambda module-loading defaults.
 * Author: Noé Henchoz
 * License: MIT
 * Copyright (c) 2026 Noé Henchoz
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'

it('loads the server sanitizer with ESM interop disabled by the platform', () => {
  const config = JSON.parse(readFileSync(resolve('vercel.json'), 'utf8'))
  const html = execFileSync(
    process.execPath,
    [
      '--input-type=commonjs',
      '-e',
      `const purifier = require('isomorphic-dompurify'); process.stdout.write(purifier.sanitize('<p onclick="alert(1)">Safe<script>alert(1)</script></p>'));`,
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        // Lambda disables this default Node feature; our runtime config must restore it.
        NODE_OPTIONS: `--no-experimental-require-module ${config.env?.NODE_OPTIONS ?? ''}`,
      },
    },
  )

  expect(html).toBe('<p>Safe</p>')
})
