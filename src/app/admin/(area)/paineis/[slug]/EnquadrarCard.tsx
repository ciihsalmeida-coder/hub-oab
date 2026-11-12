"use client";

import { useEffect, useRef, useState } from "react";

// Editor de enquadramento: mostra a foto dentro do card (moldura, sombra, lugar da frase e faixa do congresso)
// e a equipe arrasta a foto até ficar bom. Guarda a posição como em CSS (0 = encostada à esquerda/topo,
// 1 = à direita/embaixo); a rota do card recorta igual. Feed e Story usam a mesma posição (dá para ver os dois).
// Medidas do card de verdade (ver FOTO_CARD e FAIXA em lib/card.tsx).
const FORMATOS = {
  feed: { card: 1350, foto: 1170, faixa: 155 },
  story: { card: 1920, foto: 1565, faixa: 330 },
} as const;
const LARGURA = 1080;

export function EnquadrarCard(props: {
  url: string;
  inicial: { x: number; y: number; zoom?: number } | null;
  aoSalvar: (foco: { x: number; y: number; zoom: number } | null) => void;
  aoFechar: () => void;
  salvando: boolean;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5, ...props.inicial, zoom: props.inicial?.zoom ?? 1 });
  const [tamanho, setTamanho] = useState<{ w: number; h: number } | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [formato, setFormato] = useState<keyof typeof FORMATOS>("feed");
  const F = FORMATOS[formato];
  const arraste = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  // Tamanho do quadro da foto na tela (muda com Feed/Story e com a largura do celular).
  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const medir = () => setTamanho({ w: el.clientWidth, h: el.clientHeight });
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, [formato]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = props.url;
  }, [props.url]);

  // Quanto a foto passa da área visível (em px na tela), para converter o arraste em posição.
  // Com zoom 1 a foto cobre o quadro (como no card); acima disso, aproxima.
  function escala() {
    if (!tamanho || !natural) return 0;
    return Math.max(tamanho.w / natural.w, tamanho.h / natural.h) * pos.zoom;
  }
  function sobra() {
    const e = escala();
    if (!tamanho || !natural || !e) return { x: 0, y: 0 };
    return { x: natural.w * e - tamanho.w, y: natural.h * e - tamanho.h };
  }
  const tamanhoFundo = natural && escala() ? `${natural.w * escala()}px ${natural.h * escala()}px` : "cover";

  const limitar = (v: number) => Math.min(1, Math.max(0, v));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm space-y-3">
        <p className="text-center text-sm font-semibold text-white">👆 Arraste a foto até a pessoa ficar bem no card</p>
        <div className="mx-auto grid w-48 grid-cols-2 gap-1 rounded-full bg-white/10 p-1 text-xs font-bold">
          {(["feed", "story"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormato(f)}
              className={`rounded-full py-1.5 ${formato === f ? "bg-white text-navy" : "text-white"}`}
            >
              {f === "feed" ? "Feed" : "Story"}
            </button>
          ))}
        </div>
        {/* Card em miniatura, nas proporções reais (1080x1350 no Feed, 1080x1920 no Story) */}
        <div
          className="relative mx-auto overflow-hidden rounded-lg"
          style={{
            aspectRatio: `${LARGURA} / ${F.card}`,
            background: "#0b1866",
            width: formato === "story" ? "min(100%, 52vh)" : "100%",
          }}
        >
          <div
            ref={caixa}
            className="absolute cursor-grab touch-none active:cursor-grabbing"
            style={{
              left: `${(25 / LARGURA) * 100}%`,
              right: `${(25 / LARGURA) * 100}%`,
              top: `${(25 / F.card) * 100}%`,
              height: `${(F.foto / F.card) * 100}%`,
              backgroundImage: `url(${props.url})`,
              backgroundSize: tamanhoFundo,
              backgroundRepeat: "no-repeat",
              backgroundPosition: `${pos.x * 100}% ${pos.y * 100}%`,
            }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              arraste.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
            }}
            onPointerMove={(e) => {
              const a = arraste.current;
              if (!a) return;
              const s = sobra();
              setPos({
                ...pos,
                x: s.x > 0 ? limitar(a.x - (e.clientX - a.px) / s.x) : 0.5,
                y: s.y > 0 ? limitar(a.y - (e.clientY - a.py) / s.y) : 0.5,
              });
            }}
            onPointerUp={() => (arraste.current = null)}
            onPointerCancel={() => (arraste.current = null)}
          >
            {/* Mesmas sombras do card de verdade */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(11,24,102,0) 38%, rgba(11,24,102,0.55) 62%, rgba(9,18,80,0.92) 100%), linear-gradient(90deg, rgba(9,18,80,0.45) 0%, rgba(9,18,80,0) 55%)",
              }}
            />
            {/* Onde ficam o logo, o traço e a frase */}
            <div className="pointer-events-none absolute right-[9%] bottom-[6%] left-[9%] space-y-1.5">
              <div className="h-3 w-10 rounded-sm bg-white/90" />
              <div className="h-0.5 w-10 bg-[#5fb8d9]" />
              <div className="text-2xl leading-none font-extrabold text-white">“</div>
              <div className="h-2 w-full rounded bg-white/70" />
              <div className="h-2 w-5/6 rounded bg-white/70" />
              <div className="h-2 w-2/3 rounded bg-white/70" />
              <div className="mt-2 h-2 w-1/3 rounded bg-white" />
            </div>
          </div>
          <div
            className="absolute right-0 bottom-0 left-0 flex items-center justify-center px-3 text-center text-[9px] font-semibold text-[#0b1866]"
            style={{ height: `${(F.faixa / F.card) * 100}%`, background: "#eef0f3" }}
          >
            XIV CONGRESSO NACIONAL DE DIREITO MARÍTIMO, PORTUÁRIO E ADUANEIRO
          </div>
        </div>
        <label className="mx-auto flex max-w-xs items-center gap-3 text-sm font-semibold text-white">
          🔍 Aproximar
          <input
            id="zoom-card"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={pos.zoom}
            onChange={(e) => setPos({ ...pos, zoom: Number(e.target.value) })}
            className="flex-1 accent-sky"
          />
        </label>
        <div className="flex flex-wrap justify-center gap-2 text-sm font-bold">
          <button
            type="button"
            disabled={props.salvando}
            onClick={() => props.aoSalvar(pos)}
            className="rounded-full bg-sky px-5 py-2 text-navy"
          >
            {props.salvando ? "Salvando…" : "Salvar enquadramento"}
          </button>
          <button type="button" onClick={props.aoFechar} className="rounded-full bg-white/15 px-4 py-2 text-white">
            Cancelar
          </button>
          {props.inicial && (
            <button
              type="button"
              disabled={props.salvando}
              onClick={() => props.aoSalvar(null)}
              className="rounded-full px-3 py-2 text-white/70 underline"
            >
              Voltar ao automático
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
