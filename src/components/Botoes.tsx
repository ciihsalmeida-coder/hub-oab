"use client";

import { useState } from "react";
import { registrar, type TipoEvento } from "@/lib/metricas";

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

// Nome de arquivo legível a partir de um título ("Metas são cenouras" → "Metas-são-cenouras.mp4").
function nomeDeArquivo(titulo: string, extensao: string) {
  const base = titulo
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${base || "congresso-oab"}.${extensao}`;
}

// Baixa o arquivo e abre o menu do celular ("Salvar imagem"/"Salvar vídeo" vai direto para a galeria;
// também dá para mandar no WhatsApp etc.). No computador, baixa o arquivo normalmente.
// O iPhone só abre o menu logo após o toque: se o arquivo demorar, o botão pede um segundo toque.
type Estado = "livre" | "baixando" | "pronto";

function useArquivoParaCelular(
  url: string | null | undefined,
  nome: string,
  tipo: string,
) {
  const [estado, setEstado] = useState<Estado>("livre");
  const [arquivo, setArquivo] = useState<File | null>(null);

  const celularAceita = () =>
    typeof navigator !== "undefined" &&
    Boolean(
      navigator.canShare?.({ files: [new File([], nome, { type: tipo })] }),
    );

  async function abrirMenu(f: File, extra?: ShareData) {
    try {
      await navigator.share({ files: [f], ...extra });
      setEstado("livre");
    } catch (e) {
      setEstado(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "pronto"
          : "livre",
      );
    }
  }

  function baixarNoComputador(f: File) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(f);
    link.download = f.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 30_000);
    setEstado("livre");
  }

  // Devolve false quando não há arquivo para buscar (quem chama decide o que fazer).
  async function usar(extra?: ShareData, soMenu = false) {
    if (!url) return false;
    if (arquivo) {
      if (celularAceita()) await abrirMenu(arquivo, extra);
      else if (!soMenu) baixarNoComputador(arquivo);
      return true;
    }
    if (soMenu && !celularAceita()) return false;
    setEstado("baixando");
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error();
      const f = new File([await r.blob()], nome, { type: tipo });
      setArquivo(f);
      if (celularAceita()) await abrirMenu(f, extra);
      else baixarNoComputador(f);
    } catch {
      setEstado("livre");
      window.open(url, "_blank");
    }
    return true;
  }

  return { estado, usar };
}

// Botão principal de cards, fotos e vídeos.
export function Salvar({
  url,
  titulo,
  tipo,
  evento,
  alvo,
  className = "",
}: {
  url: string | null | undefined;
  titulo: string;
  tipo: "imagem" | "video";
  evento: TipoEvento;
  alvo?: string;
  className?: string;
}) {
  const mime =
    tipo === "video"
      ? "video/mp4"
      : url?.includes("/card")
        ? "image/png"
        : "image/jpeg";
  const nome = nomeDeArquivo(
    titulo,
    mime === "video/mp4" ? "mp4" : mime === "image/png" ? "png" : "jpg",
  );
  const { estado, usar } = useArquivoParaCelular(url, nome, mime);
  const rotulo =
    estado === "baixando"
      ? tipo === "video"
        ? "Preparando vídeo…"
        : "Preparando…"
      : estado === "pronto"
        ? "⬇ Toque para salvar"
        : "⬇ Salvar no celular";
  return (
    <button
      onClick={() => {
        registrar(evento, alvo);
        void usar();
      }}
      disabled={estado === "baixando" || !url}
      className={`block w-full rounded-full bg-sky py-2.5 text-center text-sm font-extrabold text-navy uppercase disabled:opacity-60 ${className}`}
    >
      {rotulo}
    </button>
  );
}

// Com `video`, compartilha o próprio arquivo (WhatsApp, Instagram, LinkedIn…) quando o celular permite;
// senão, o link da página.
export function Compartilhar({
  titulo,
  alvo,
  video,
}: {
  titulo: string;
  alvo?: string;
  video?: string | null;
}) {
  const texto = `${titulo} · XIV Congresso OAB`;
  const { estado, usar } = useArquivoParaCelular(
    video,
    nomeDeArquivo(titulo, "mp4"),
    "video/mp4",
  );

  function compartilharLink() {
    const url = window.location.href;
    if (navigator.share)
      navigator.share({ title: titulo, text: texto, url }).catch(() => {});
    else navigator.clipboard?.writeText(url);
  }

  const rotulo = {
    livre: "↗ Compartilhar",
    baixando: "Preparando vídeo…",
    pronto: "↗ Toque para enviar",
  }[estado];
  return (
    <button
      onClick={async () => {
        registrar("compartilhou", alvo);
        if (!(await usar({ title: titulo, text: texto }, true)))
          compartilharLink();
      }}
      disabled={estado === "baixando"}
      className="block w-full rounded-full border border-navy py-2 text-center text-sm font-bold text-navy disabled:opacity-60"
    >
      {rotulo}
    </button>
  );
}
