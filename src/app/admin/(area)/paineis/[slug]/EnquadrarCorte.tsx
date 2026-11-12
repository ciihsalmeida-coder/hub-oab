"use client";

import { createPortal } from "react-dom";
import { useRef, useState } from "react";

// Ajuste do corte vertical: mostra o plano aberto do trecho e uma janela 9:16 que a equipe arrasta
// até a pessoa que está falando. A posição vai de 0 (janela encostada à esquerda) a 1 (à direita),
// a mesma conta do robô: x = (largura − 1080) × posição.
export function EnquadrarCorte(props: {
  imagem: string;
  inicial: number | null;
  salvando: boolean;
  aoSalvar: (x: number) => void;
  aoFechar: () => void;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(props.inicial ?? 0.5);
  const [proporcao, setProporcao] = useState(16 / 9);
  const arraste = useRef<{ px: number; x: number } | null>(null);
  // Largura da janela 9:16 em relação à imagem deitada.
  const janela = Math.min(1, (9 / 16) / proporcao);
  const esquerda = x * (1 - janela);
  const limitar = (v: number) => Math.min(1, Math.max(0, v));

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-center overflow-y-auto bg-black/85 p-4" role="dialog" aria-modal="true">
      <div className="my-auto w-full max-w-2xl space-y-3">
        <p className="text-center text-sm font-semibold text-white">👆 Arraste o quadro claro até a pessoa que está falando</p>
        <div
          ref={caixa}
          className="relative w-full cursor-grab touch-none overflow-hidden rounded-xl active:cursor-grabbing"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            arraste.current = { px: e.clientX, x };
          }}
          onPointerMove={(e) => {
            const a = arraste.current;
            const largura = caixa.current?.getBoundingClientRect().width ?? 1;
            if (!a || janela >= 1) return;
            setX(limitar(a.x + (e.clientX - a.px) / (largura * (1 - janela))));
          }}
          onPointerUp={() => (arraste.current = null)}
          onPointerCancel={() => (arraste.current = null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={props.imagem}
            alt="Plano aberto do trecho"
            className="block w-full select-none"
            draggable={false}
            onLoad={(e) => setProporcao(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 bg-black/60" style={{ width: `${esquerda * 100}%` }} />
          <div
            className="pointer-events-none absolute inset-y-0 bg-black/60"
            style={{ left: `${(esquerda + janela) * 100}%`, right: 0 }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 border-2 border-sky"
            style={{ left: `${esquerda * 100}%`, width: `${janela * 100}%` }}
          />
        </div>
        <p className="text-center text-xs text-white/70">Ao salvar, o robô corta de novo nessa posição (uns 10 a 20 minutos).</p>
        <div className="flex flex-wrap justify-center gap-2 text-sm font-bold">
          <button
            type="button"
            disabled={props.salvando}
            onClick={() => props.aoSalvar(x)}
            className="rounded-full bg-sky px-5 py-2 text-navy"
          >
            {props.salvando ? "Salvando…" : "Salvar e cortar de novo"}
          </button>
          <button type="button" onClick={props.aoFechar} className="rounded-full bg-white/15 px-4 py-2 text-white">
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
