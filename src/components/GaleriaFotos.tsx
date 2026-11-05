"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { registrar } from "@/lib/metricas";

export type FotoGaleria = { id: string; url: string; miniatura: string | null };

// Galeria para celular: miniaturas na proporção original (sem cortar ninguém) e, ao tocar,
// a foto em tela cheia com setas, arrastar para os lados e botão de baixar.
export function GaleriaFotos({ fotos, alvo, nomeArquivo = "foto-congresso-oab" }: { fotos: FotoGaleria[]; alvo?: string; nomeArquivo?: string }) {
  const [aberta, setAberta] = useState<number | null>(null);

  return (
    <>
      <div className="columns-2 gap-2 sm:columns-3">
        {fotos.map((f, i) => (
          <button
            key={f.id}
            onClick={() => setAberta(i)}
            className="mb-2 block w-full overflow-hidden rounded-xl bg-fog focus-visible:outline-2 focus-visible:outline-sky"
            aria-label={`Abrir foto ${i + 1} de ${fotos.length}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.miniatura ?? f.url} alt="" loading="lazy" decoding="async" className="block h-auto w-full" />
          </button>
        ))}
      </div>
      {aberta !== null && (
        <Visualizador fotos={fotos} inicial={aberta} alvo={alvo} nomeArquivo={nomeArquivo} fechar={() => setAberta(null)} />
      )}
    </>
  );
}

function Visualizador({
  fotos,
  inicial,
  alvo,
  nomeArquivo,
  fechar,
}: {
  fotos: FotoGaleria[];
  inicial: number;
  alvo?: string;
  nomeArquivo: string;
  fechar: () => void;
}) {
  const [i, setI] = useState(inicial);
  const [baixando, setBaixando] = useState(false);
  const toque = useRef<number | null>(null);
  const foto = fotos[i];
  const ir = useCallback((passo: number) => setI((x) => (x + passo + fotos.length) % fotos.length), [fotos.length]);

  // Trava a rolagem da página e aceita as setas do teclado e o Esc.
  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") ir(1);
      if (e.key === "ArrowLeft") ir(-1);
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = antes;
      window.removeEventListener("keydown", tecla);
    };
  }, [ir, fechar]);

  // No celular, abre o "Salvar imagem" do próprio aparelho; no computador, baixa o arquivo.
  async function baixar() {
    registrar("baixou_foto", alvo);
    const nome = `${nomeArquivo}-${i + 1}.jpg`;
    setBaixando(true);
    try {
      const r = await fetch(foto.url);
      const arquivo = new File([await r.blob()], nome, { type: "image/jpeg" });
      if (navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo] }).catch(() => {});
      } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(arquivo);
        link.download = nome;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
      }
    } catch {
      window.open(`${foto.url}?download=${encodeURIComponent(nome)}`, "_blank");
    } finally {
      setBaixando(false);
    }
  }

  const seta = "grid h-12 w-12 place-items-center rounded-full bg-white/15 text-2xl text-white backdrop-blur active:bg-white/30";
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${i + 1} de ${fotos.length}`}
      className="fixed inset-0 z-50 flex flex-col bg-black text-white"
      onTouchStart={(e) => (toque.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (toque.current === null) return;
        const dx = e.changedTouches[0].clientX - toque.current;
        if (Math.abs(dx) > 50) ir(dx < 0 ? 1 : -1);
        toque.current = null;
      }}
    >
      <div className="flex items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2">
        <span className="text-sm font-bold tabular-nums">
          {i + 1} / {fotos.length}
        </span>
        <button onClick={fechar} className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-xl" aria-label="Fechar">
          ✕
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={foto.id} src={foto.url} alt="" className="max-h-full max-w-full object-contain" />
        {fotos.length > 1 && (
          <>
            <button onClick={() => ir(-1)} className={`absolute left-2 ${seta}`} aria-label="Foto anterior">
              ‹
            </button>
            <button onClick={() => ir(1)} className={`absolute right-2 ${seta}`} aria-label="Próxima foto">
              ›
            </button>
          </>
        )}
        {/* Já carrega a próxima e a anterior, para a troca ser instantânea */}
        {fotos.length > 1 && (
          <div className="hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotos[(i + 1) % fotos.length].url} alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotos[(i - 1 + fotos.length) % fotos.length].url} alt="" />
          </div>
        )}
      </div>

      <div className="flex justify-center px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
        <button
          onClick={baixar}
          disabled={baixando}
          className="rounded-full bg-sky px-6 py-3 text-sm font-extrabold text-navy uppercase disabled:opacity-60"
        >
          {baixando ? "Preparando…" : "⬇ Baixar foto"}
        </button>
      </div>
    </div>
  );
}
