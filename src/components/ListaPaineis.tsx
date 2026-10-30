"use client";

import Link from "next/link";
import { useState } from "react";
import type { PainelPublico } from "@/lib/dados";

const corArea: Record<string, string> = {
  Abertura: "bg-wine text-white",
  Aduaneiro: "bg-sky text-navy",
  Portuário: "bg-navy text-white",
  Marítimo: "bg-sea text-white",
};

const EIXOS = ["Aduaneiro", "Portuário", "Marítimo"] as const;

// Programação por dia, com filtro por eixo temático.
export function ListaPaineis({ paineis, dias }: { paineis: PainelPublico[]; dias: { data: string; rotulo: string }[] }) {
  const [eixo, setEixo] = useState<string | null>(null);
  const visiveis = eixo ? paineis.filter((p) => p.area === eixo) : paineis;

  return (
    <>
      <div className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filtrar por eixo">
        {[null, ...EIXOS].map((e) => (
          <button
            key={e ?? "todos"}
            onClick={() => setEixo(e)}
            aria-pressed={eixo === e}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${
              eixo === e ? "border-navy bg-navy text-white" : "border-line bg-card text-navy"
            }`}
          >
            {e ?? "Todos"}
          </button>
        ))}
      </div>

      {dias.map((dia) => {
        const doDia = visiveis.filter((p) => p.data === dia.data);
        if (!doDia.length) return null;
        return (
          <section key={dia.data} className="mt-8">
            <h2 className="text-xs font-extrabold tracking-[0.2em] text-wine uppercase">{dia.rotulo}</h2>
            <ul className="mt-3 space-y-3">
              {doDia.map((p) => (
                <li key={p.slug}>
                  <Link href={`/paineis/${p.slug}`} className="block rounded-2xl border border-line bg-card p-4 shadow-sm active:bg-fog">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase">
                      <span className="text-navy">{p.horario}</span>
                      <span className={`rounded-full px-2 py-0.5 ${corArea[p.area]}`}>
                        {p.numero ? `Painel ${p.numero} · ${p.area}` : p.area}
                      </span>
                    </div>
                    <p className="mt-2 text-lg leading-snug font-bold">{p.titulo}</p>
                    <p className="mt-1 text-sm text-muted">
                      {p.palestrantes.length} palestrante(s){p.videoSessaoUrl ? " · 🎥 vídeo completo" : ""} →
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
