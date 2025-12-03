"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { Menu, Trophy, Video, Mail, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  settings: {
    siteName: string;
    logoUrl: string | null;
  };
}

export function Navbar({ settings }: NavbarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/tournaments", label: "Tournois", icon: Trophy },
    { href: "/stream", label: "Stream", icon: Video },
    { href: "/contact", label: "Contact", icon: Mail },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-md supports-backdrop-filter:bg-zinc-950/60"
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative hidden md:block">
            {settings.logoUrl ? (
              <Image
                src={settings.logoUrl}
                alt={settings.siteName}
                width={48}
                height={48}
                className="h-12 w-auto transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <Image
                src="/assets/logo-bleu.png"
                alt={settings.siteName}
                width={48}
                height={48}
                className="h-12 w-auto transition-transform duration-300 group-hover:scale-110"
              />
            )}
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="font-paladins text-md md:text-2xl text-white tracking-wider drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:drop-shadow-[0_0_25px_rgba(59,130,246,0.8)] transition-all duration-300 whitespace-nowrap">
            {settings.siteName}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex items-center gap-2 text-sm font-medium transition-colors duration-300 group",
                  isActive ? "text-blue-400" : "text-zinc-400 hover:text-white"
                )}
              >
                <link.icon
                  className={cn(
                    "size-4 transition-transform duration-300 group-hover:-translate-y-0.5",
                    isActive
                      ? "text-blue-400"
                      : "text-zinc-500 group-hover:text-blue-400"
                  )}
                />
                {link.label}
                <span
                  className={cn(
                    "absolute -bottom-1 left-0 h-0.5 bg-blue-500 transition-all duration-300",
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <Menu className="size-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] border-l border-white/10 bg-zinc-950/95 backdrop-blur-xl p-0"
            >
              <SheetHeader className="p-6 border-b border-white/10">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    {settings.logoUrl ? (
                      <Image
                        src={settings.logoUrl}
                        alt={settings.siteName}
                        width={64}
                        height={64}
                        className="h-16 w-auto"
                      />
                    ) : (
                      <Image
                        src="/assets/logo-bleu.png"
                        alt={settings.siteName}
                        width={64}
                        height={64}
                        className="h-16 w-auto"
                      />
                    )}
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full -z-10" />
                  </div>
                  <SheetTitle className="font-paladins text-2xl text-center text-white tracking-wider">
                    {settings.siteName}
                  </SheetTitle>
                </div>
              </SheetHeader>
              <div className="flex flex-col py-6 px-2 gap-2">
                {navLinks.map((link) => {
                  const isActive =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 text-lg font-medium transition-all duration-300 rounded-lg group",
                        isActive
                          ? "bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <link.icon
                        className={cn(
                          "size-5 transition-colors",
                          isActive
                            ? "text-blue-400"
                            : "text-zinc-500 group-hover:text-blue-400"
                        )}
                      />
                      {link.label}
                      {isActive && (
                        <div className="ml-auto size-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
