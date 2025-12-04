/**
 * File: lib/actions/settings.ts
 * Description: Server actions for updating site settings.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

'use server'

import { put } from '@vercel/blob'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const settingsSchema = z.object({
    logoUrl: z.string().optional().or(z.literal('')),
    socialDiscord: z.string().optional().or(z.literal('')),
    socialTwitch: z.string().optional().or(z.literal('')),
    socialTiktok: z.string().optional().or(z.literal('')),
    socialInstagram: z.string().optional().or(z.literal('')),
    socialYoutube: z.string().optional().or(z.literal('')),
})

export async function updateSiteSettings(
    _prevState: unknown,
    formData: FormData,
) {
    let logoUrl = formData.get('logoUrl') as string
    const logoFile = formData.get('logoFile') as File

    if (logoFile && logoFile.size > 0) {
        try {
            const blob = await put(logoFile.name, logoFile, {
                access: 'public',
                allowOverwrite: true,
            })
            logoUrl = blob.url
        } catch (error) {
            console.error('Blob upload error:', error)
            return { message: 'Failed to upload logo' }
        }
    }

    const data = {
        logoUrl,
        socialDiscord: formData.get('socialDiscord') as string,
        socialTwitch: formData.get('socialTwitch') as string,
        socialTiktok: formData.get('socialTiktok') as string,
        socialInstagram: formData.get('socialInstagram') as string,
        socialYoutube: formData.get('socialYoutube') as string,
    }

    const validatedFields = settingsSchema.safeParse(data)

    if (!validatedFields.success) {
        return {
            message: 'Invalid fields',
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    try {
        await prisma.siteSettings.upsert({
            where: { id: 1 },
            update: validatedFields.data,
            create: {
                id: 1,
                ...validatedFields.data,
            },
        })

        revalidatePath('/', 'layout')
        return { message: 'Settings updated successfully' }
    } catch (_error) {
        return { message: 'Failed to update settings' }
    }
}
