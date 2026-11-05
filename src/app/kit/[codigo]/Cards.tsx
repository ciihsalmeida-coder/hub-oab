"use client";

import { useState } from "react";
import { Salvar } from "@/components/Botoes";
import { Visualizador } from "@/components/GaleriaFotos";

export type CardKit = {
  chave: string;
  src: string;
  alt: string;
  rotulo: string;
};

const FORMATOS = [
  { id: "feed", rotulo: "Feed · 4:5", proporcao: "aspect-[4/5]", largura: "w-64" },
  { id: "story", rotulo: "Story · 9:16", proporcao: "aspect-[9/16]", largura: "w-52" },
] as const;

// Cards do kit com a escolha Feed (Instagram/LinkedIn) ou Story (Stories e Reels).
// Tocar ou clicar no card abre em tamanho grande, com setas para os outros cards e o botão de salvar.
export function CardsKit({ cards, alvo }: { cards: CardKit[]; alvo: string }) {
  const [formato, setFormato] = useState<(typeof FORMATOS)[number]["id"]>("feed");
  const [aberto, setAberto] = useState<number | null>(null);
  const atual = FORMATOS.find((f) => f.id === formato)!;
  const srcDe = (c: CardKit) => (formato === "story" ? `${c.src}&formato=story` : c.src);

  return (
    <>
      <div className="mb-4 inline-flex rounded-full border border-line bg-card p-1" role="group" aria-label="Formato do card">
        {FORMATOS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFormato(f.id)}
            aria-pressed={formato === f.id}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${formato === f.id ? "bg-navy text-white" : "text-navy"}`}
          >
            {f.rotulo}
          </button>
        ))}
      </div>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {cards.map((c, i) => {
          const src = srcDe(c);
          return (
            <figure key={`${c.chave}-${formato}`} className={`shrink-0 snap-start ${atual.largura}`}>
              <button
                onClick={() => setAberto(i)}
                className="block w-full cursor-zoom-in"
                aria-label={`Ver em tamanho grande: ${c.alt}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={c.alt} loading="lazy" className={`${atual.proporcao} w-full rounded-2xl bg-fog shadow-md`} />
              </button>
              {c.chave === "fundo" && (
                <figcaption className="mt-2 text-xs text-muted">Moldura livre: escreva sua mensagem no Instagram ou no Canva.</figcaption>
              )}
              <Salvar
                url={src}
                titulo={`card-congresso-oab-${c.rotulo}-${formato}`}
                tipo="imagem"
                evento="baixou_card"
                alvo={alvo}
                className="mt-2"
              />
            </figure>
          );
        })}
      </div>
      {aberto !== null && (
        <Visualizador
          fotos={cards.map((c) => ({ id: `${c.chave}-${formato}`, url: srcDe(c), miniatura: null }))}
          nomes={cards.map((c) => `card-congresso-oab-${c.rotulo}-${formato}`)}
          inicial={aberto}
          alvo={alvo}
          nomeArquivo="card-congresso-oab"
          evento="baixou_card"
          fechar={() => setAberto(null)}
        />
      )}
    </>
  );
}
