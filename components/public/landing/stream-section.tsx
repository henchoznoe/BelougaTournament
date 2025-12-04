"use client";

import { TwitchEmbed } from "@/components/twitch-embed";
import { Suspense } from "react";

export function StreamSection() {
  return (
    <section className="container mx-auto px-4" id="stream">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-1 backdrop-blur-xl">
        <div className="rounded-[20px] bg-zinc-950 p-8 md:p-12">
          <div className="mb-12 flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-500 animate-pulse">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-red-500"></span>
              </span>
              EN DIRECT
            </div>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-5xl">
              Suivez l'action
            </h2>
            <p className="max-w-xl text-lg text-zinc-400">
              Ne manquez aucun moment fort. Retrouvez les meilleurs matchs commentés en direct sur notre chaîne Twitch.
            </p>
          </div>

          <div className="mx-auto max-w-5xl overflow-hidden rounded-xl shadow-[0_0_50px_-10px_rgba(147,51,234,0.3)] ring-1 ring-white/10">
            <Suspense
              fallback={
                <div className="flex h-[600px] w-full items-center justify-center rounded-lg bg-zinc-900 text-zinc-500">
                  Chargement du stream...
                </div>
              }
            >
              <TwitchEmbed channel="quentadoulive" />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
