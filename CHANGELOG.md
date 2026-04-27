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
