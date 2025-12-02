/**
 * File: lib/data/settings.ts
 * Description: Data fetching utility for site settings.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

export const getSiteSettings = unstable_cache(
	async () => {
		return await prisma.siteSettings.upsert({
			where: { id: 1 },
			update: {},
			create: {
				id: 1,
				siteName: 'Belouga Tournament',
				heroTitle: 'Next Tournament',
			},
		})
	},
	['site-settings'],
	{ tags: ['site-settings'] },
)
