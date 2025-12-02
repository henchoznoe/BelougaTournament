/**
 * File: components/public/navbar.tsx
 * Description: Navigation bar for the public website.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

interface NavbarProps {
  settings: {
    siteName: string;
    logoUrl: string | null;
  };
}

export function Navbar({ settings }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur supports-backdrop-filter:bg-zinc-950/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
          {settings.logoUrl ? (
            <Image 
              src={settings.logoUrl} 
              alt={settings.siteName} 
              width={40} 
              height={40} 
              className="h-10 w-auto"
            />
          ) : (
            <Image 
              src="/assets/logo-bleu.png" 
              alt={settings.siteName} 
              width={40} 
              height={40} 
              className="h-10 w-auto"
            />
          )}
          <span>{settings.siteName}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/#tournaments" className="hover:text-white transition-colors">
            Tournaments
          </Link>
          <Link href="/stream" className="hover:text-white transition-colors">
            Stream
          </Link>
          <Link href="/contact" className="hover:text-white transition-colors">
            Contact
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button asChild variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/admin">Admin Login</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
