## [1.7.4](https://github.com/henchoznoe/BelougaTournament/compare/v1.7.3...v1.7.4) (2026-05-15)


### Bug Fixes

* configure dependabot grouping and update dependencies ([a793080](https://github.com/henchoznoe/BelougaTournament/commit/a793080fb1e620ebff377bd3b01efc0af984aa59))

## [1.7.3](https://github.com/henchoznoe/BelougaTournament/compare/v1.7.2...v1.7.3) (2026-05-13)


### Bug Fixes

* update calendar and date-time-picker components for v10 ([2a0d32c](https://github.com/henchoznoe/BelougaTournament/commit/2a0d32ca5ec33ba61eb2eda136b4c7302f3d242b))

## [1.7.2](https://github.com/henchoznoe/BelougaTournament/compare/v1.7.1...v1.7.2) (2026-05-12)


### Bug Fixes

* relocate kysely dependency override from package.json to pnpm-workspace.yaml ([dcee4e2](https://github.com/henchoznoe/BelougaTournament/commit/dcee4e28fb13f525e274e3cec5416c86660f2c72))
* remove Sentry error monitoring and associated configuration files ([1163c26](https://github.com/henchoznoe/BelougaTournament/commit/1163c264e437ac98441832bcd6389c5b3cf8cd3b))

## [1.7.1](https://github.com/henchoznoe/BelougaTournament/compare/v1.7.0...v1.7.1) (2026-05-07)


### Bug Fixes

* disable text masking and media blocking in Sentry replay integration ([91b2b06](https://github.com/henchoznoe/BelougaTournament/commit/91b2b06defd44ea9b4589c32ad3ac1fbbcdc9d95))
* update Sentry enabled condition to use NODE_ENV across all configurations ([9a4cafd](https://github.com/henchoznoe/BelougaTournament/commit/9a4cafd1d60c228cfa4964b5fcf4f193adf9154a))

# [1.7.0](https://github.com/henchoznoe/BelougaTournament/compare/v1.6.0...v1.7.0) (2026-05-06)


### Features

* integrate Sentry for server-side and client-side error monitoring and performance tracing ([fc3f4a1](https://github.com/henchoznoe/BelougaTournament/commit/fc3f4a1cf6251133705552ca1a1194069be40716))

# [1.6.0](https://github.com/henchoznoe/BelougaTournament/compare/v1.5.0...v1.6.0) (2026-05-04)


### Features

* integrate commitlint with lefthook for commit message validation ([893a0c5](https://github.com/henchoznoe/BelougaTournament/commit/893a0c5b1168fdab5e63deb005c20db2422e87f4))

# [1.5.0](https://github.com/henchoznoe/BelougaTournament/compare/v1.4.4...v1.5.0) (2026-05-04)


### Features

* redesign tournament detail page with sidebar layout and Framer Motion hero gallery carousel ([057abef](https://github.com/henchoznoe/BelougaTournament/commit/057abefdfaff00eec77fbd3b9357ce382604dd7f))

## [1.4.4](https://github.com/henchoznoe/BelougaTournament/compare/v1.4.3...v1.4.4) (2026-05-01)


### Bug Fixes

* update dependabot config to rebase to avoid pnpm lock not up to date ([76b63c5](https://github.com/henchoznoe/BelougaTournament/commit/76b63c51488adee12d03360aa82ee96c49d1d8ab))

## [1.4.3](https://github.com/henchoznoe/BelougaTournament/compare/v1.4.2...v1.4.3) (2026-04-27)


### Bug Fixes

* remove caching logic from getPlayerProfileStatus service to avoid 404 ([e737056](https://github.com/henchoznoe/BelougaTournament/commit/e73705691ce8fed7c8f4b275e60c15d9e0e3fc0f))

## [1.4.2](https://github.com/henchoznoe/BelougaTournament/compare/v1.4.1...v1.4.2) (2026-04-26)


### Bug Fixes

* add comprehensive player page when their profile is private instead of 404 ([21ef7f2](https://github.com/henchoznoe/BelougaTournament/commit/21ef7f26acf44dcb970b373df5362605eb444b5f))
* add suppressHydrationWarning to body element to prevent checksum mismatch errors ([484622e](https://github.com/henchoznoe/BelougaTournament/commit/484622e5d8a8737087173a79fe82eb07b4cfc8f9))

## [1.4.1](https://github.com/henchoznoe/BelougaTournament/compare/v1.4.0...v1.4.1) (2026-04-26)


### Bug Fixes

* clear search debounce timer on component unmount to prevent memory leaks ([6efbf21](https://github.com/henchoznoe/BelougaTournament/commit/6efbf21f124b01e9ed30213dcc911b760b7a4f16))
* handle Prisma unique constraint errors in server actions ([c0c5cfc](https://github.com/henchoznoe/BelougaTournament/commit/c0c5cfc1b3bd25871e4072205e4fab4d52e62d37))
* invalidate profile cache ([fea6b47](https://github.com/henchoznoe/BelougaTournament/commit/fea6b476b74e4ad7432b53cc53a688c8ae6087be))

# [1.4.0](https://github.com/henchoznoe/BelougaTournament/compare/v1.3.0...v1.4.0) (2026-04-26)


### Features

* add players page and profile visibility toggles, and allow tournament organizers to configure registrant list display. ([3f0f934](https://github.com/henchoznoe/BelougaTournament/commit/3f0f934cf0f8b99f525fecf71320ad0b65fc3546))
* filter registration counts by confirmed status and display refund policy details on registration forms ([d2abde1](https://github.com/henchoznoe/BelougaTournament/commit/d2abde1db484e3937f19b32e6fc4c3eebb6ccf8f))

# [1.3.0](https://github.com/henchoznoe/BelougaTournament/compare/v1.2.0...v1.3.0) (2026-04-25)


### Bug Fixes

* centralize active tournament resolution logic to avoid hydration error ([3da576f](https://github.com/henchoznoe/BelougaTournament/commit/3da576f48dfaedeecff4708b6e2202bc85a69c2e))
* move PostHog initialization to provider and suppress ResizeObserver errors, ([195c945](https://github.com/henchoznoe/BelougaTournament/commit/195c945449d2a69bf4cad8a192be808882f494ee))


### Features

* implement calendar integration to allow adding tournament events via .ics file generation ([ea5e61d](https://github.com/henchoznoe/BelougaTournament/commit/ea5e61dec8752f9171820110dff00db4df5d874f))
* upgrade add-to-calendar component to a multi-service dropdown supporting Google, Outlook, and iCalendar formats ([8ea2fb3](https://github.com/henchoznoe/BelougaTournament/commit/8ea2fb3634d2cf7e2f9193fc13e86faab466f9bd))

# [1.2.0](https://github.com/henchoznoe/BelougaTournament/compare/v1.1.0...v1.2.0) (2026-04-25)


### Features

* implement contact form with email dispatch via Resend ([8b06271](https://github.com/henchoznoe/BelougaTournament/commit/8b062712cfc1c31b1b07d4e2488a36b7790d2778))
* setup semantic release pipeline and configure automated dependency updates ([557b228](https://github.com/henchoznoe/BelougaTournament/commit/557b2287cfe5f1d0c298aecae71b0426e2283166))
* update legal documentation to disclose technical service providers and tracking practices ([aa27b00](https://github.com/henchoznoe/BelougaTournament/commit/aa27b0035e960ffdf6dc009c42d6adcdfdda8d2f))
