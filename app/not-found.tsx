/**
 * File: app/not-found.tsx
 * Description: Custom 404 page.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-50">
			<h1 className="text-9xl font-black text-zinc-800">404</h1>
			<h2 className="mt-4 text-2xl font-bold">Page Not Found</h2>
			<p className="mt-2 text-zinc-400">
				The page you are looking for does not exist.
			</p>
			<Button asChild className="mt-8 bg-blue-600 hover:bg-blue-700">
				<Link href="/">Return Home</Link>
			</Button>
		</div>
	)
}
