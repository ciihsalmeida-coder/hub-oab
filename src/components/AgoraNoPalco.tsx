"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type Momento, momentoAtual } from "@/lib/agenda";

// Faixa "Agora no palco", calculada pelo relógio de quem abre a página.
export function AgoraNoPalco() {
  const [momento, setMomento] = useState<Momento | null>(null);
  useEffect(() => {
    const atualizar = () => setMomento(momentoAtual());
    atualizar();
    const t = setInterval(atualizar, 60_000);
    return () => clearInterval(t);
  }, []);
  if (!momento) return null;
  return (
    <Link href={`/paineis/${momento.slug}`} className="block bg-wine px-4 py-3 text-white">
      <span className="mx-auto flex max-w-3xl items-center gap-3">
        <span className="flex items-center gap-2 text-xs font-extrabold tracking-widest uppercase">
          {momento.estado === "agora" && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />}
          {momento.estado === "agora" ? "Agora no palco" : "A seguir"}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-bold">
          {momento.numero ? `Painel ${momento.numero} · ` : ""}
          {momento.titulo}
        </span>
        <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
