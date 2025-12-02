/**
 * File: app/admin/settings/settings-form.tsx
 * Description: Client component for updating site settings.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateSiteSettings } from '@/lib/actions/settings'
import { useActionState } from 'react'

interface SettingsFormProps {
	initialSettings: {
		siteName: string
		heroTitle: string
		logoUrl: string | null
		socialDiscord: string | null
		socialTwitch: string | null
		socialTwitter: string | null
	}
}

const initialState = {
	message: '',
	errors: {},
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
	const [state, action, isPending] = useActionState(
		updateSiteSettings,
		initialState,
	)

	return (
		<form action={action} className="space-y-6">
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="siteName">Site Name</Label>
					<Input
						id="siteName"
						name="siteName"
						defaultValue={initialSettings.siteName}
						required
					/>
					{state?.errors?.siteName && (
						<p className="text-sm text-red-500">{state.errors.siteName}</p>
					)}
				</div>
				<div className="space-y-2">
					<Label htmlFor="heroTitle">Hero Title</Label>
					<Input
						id="heroTitle"
						name="heroTitle"
						defaultValue={initialSettings.heroTitle}
						required
					/>
					{state?.errors?.heroTitle && (
						<p className="text-sm text-red-500">{state.errors.heroTitle}</p>
					)}
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="logoFile">Logo</Label>
				<div className="flex items-center gap-4">
					{initialSettings.logoUrl && (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={initialSettings.logoUrl}
							alt="Current Logo"
							className="h-10 w-auto rounded border border-zinc-200 bg-white p-1"
						/>
					)}
					<Input id="logoFile" name="logoFile" type="file" accept="image/*" />
					<input
						type="hidden"
						name="logoUrl"
						value={initialSettings.logoUrl || ''}
					/>
				</div>
				<p className="text-xs text-muted-foreground">
					Upload a new logo to replace the current one.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<div className="space-y-2">
					<Label htmlFor="socialDiscord">Discord URL</Label>
					<Input
						id="socialDiscord"
						name="socialDiscord"
						defaultValue={initialSettings.socialDiscord || ''}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="socialTwitch">Twitch URL</Label>
					<Input
						id="socialTwitch"
						name="socialTwitch"
						defaultValue={initialSettings.socialTwitch || ''}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="socialTwitter">Twitter URL</Label>
					<Input
						id="socialTwitter"
						name="socialTwitter"
						defaultValue={initialSettings.socialTwitter || ''}
					/>
				</div>
			</div>

			{state?.message && (
				<p
					className={`text-sm ${state.message.includes('success') ? 'text-green-500' : 'text-red-500'}`}
				>
					{state.message}
				</p>
			)}

			<Button type="submit" disabled={isPending}>
				{isPending ? 'Saving...' : 'Save Settings'}
			</Button>
		</form>
	)
}
