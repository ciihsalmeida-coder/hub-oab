"use client";

import { useState } from "react";
import { registrar } from "@/lib/metricas";

export function Copiar({
  texto,
  rotulo = "Copiar texto",
}: {
  texto: string;
  rotulo?: string;
}) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setOk(true);
          setTimeout(() => setOk(false), 2000);
        } catch {}
      }}
      className="rounded-full bg-navy px-4 py-2 text-sm font-bold text-white"
    >
      {ok ? "✓ Copiado" : `📋 ${rotulo}`}
    </button>
  );
}

type EstadoVideo = "livre" | "baixando" | "pronto" | "erro";

// Com `video`, compartilha o próprio arquivo (WhatsApp, Instagram, LinkedIn…) quando o celular permite;
// senão, o link da página. O vídeo é baixado no primeiro toque; se o celular exigir, pede um segundo toque.
export function Compartilhar({
  titulo,
  alvo,
  video,
}: {
  titulo: string;
  alvo?: string;
  video?: string | null;
}) {
  const [estado, setEstado] = useState<EstadoVideo>("livre");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const texto = `${titulo} · XIV Congresso OAB`;

  function compartilharLink() {
    const url = window.location.href;
    if (navigator.share)
      navigator.share({ title: titulo, text: texto, url }).catch(() => {});
    else navigator.clipboard?.writeText(url);
  }

  async function enviar(f: File) {
    try {
      await navigator.share({ files: [f], title: titulo, text: texto });
      setEstado("livre");
    } catch (e) {
      // Safari só deixa compartilhar logo após o toque; com o vídeo já baixado, o próximo toque funciona.
      if (e instanceof DOMException && e.name === "NotAllowedError")
        setEstado("pronto");
      else setEstado("livre");
    }
  }

  async function clicar() {
    registrar("compartilhou", alvo);
    if (arquivo) return enviar(arquivo);
    const teste = new File([], "corte.mp4", { type: "video/mp4" });
    if (!video || !navigator.canShare?.({ files: [teste] }))
      return compartilharLink();
    setEstado("baixando");
    try {
      const r = await fetch(video);
      if (!r.ok) throw new Error();
      const nome = `${
        titulo
          .replace(/[^\p{L}\p{N}]+/gu, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 60) || "corte"
      }.mp4`;
      const f = new File([await r.blob()], nome, { type: "video/mp4" });
      setArquivo(f);
      await enviar(f);
    } catch {
      setEstado("erro");
      compartilharLink();
    }
  }

  const rotulo = {
    livre: "↗ Compartilhar",
    baixando: "Preparando vídeo…",
    pronto: "↗ Toque para enviar o vídeo",
    erro: "↗ Compartilhar link",
  }[estado];
  return (
    <button
      onClick={clicar}
      disabled={estado === "baixando"}
      className="rounded-full border border-navy px-4 py-2 text-sm font-bold text-navy disabled:opacity-60"
    >
      {rotulo}
    </button>
  );
}
