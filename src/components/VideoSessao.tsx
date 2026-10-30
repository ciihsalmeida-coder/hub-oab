"use client";

import { useState } from "react";
import { idDoYoutube } from "@/lib/youtube";

// Mostra só a capa até a pessoa tocar: o player do YouTube é pesado e não deve atrasar a página.
export function VideoSessao({ url, titulo }: { url: string; titulo: string }) {
  const [tocando, setTocando] = useState(false);
  const id = idDoYoutube(url);
  if (!id) return null;
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-navy shadow-sm">
      {tocando ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={titulo}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button onClick={() => setTocando(true)} className="group absolute inset-0 h-full w-full" aria-label={`Assistir: ${titulo}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover opacity-80" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-2xl text-navy shadow-lg transition group-hover:scale-105">
              ▶
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
