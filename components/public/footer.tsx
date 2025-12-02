/**
 * File: components/public/footer.tsx
 * Description: Footer component for the public website.
 * Author: Noé Henchoz
 * Date: 2025-12-02
 * License: MIT
 */

interface FooterProps {
  settings: {
    siteName: string;
  };
}

export function Footer({ settings }: FooterProps) {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-8 text-zinc-400">
      <div className="container mx-auto px-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} {settings.siteName}. All rights reserved.</p>
        <p className="mt-2">
          Powered by <span className="text-white">{settings.siteName}</span>
        </p>
      </div>
    </footer>
  );
}
