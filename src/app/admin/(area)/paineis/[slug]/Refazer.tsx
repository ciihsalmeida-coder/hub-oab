"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { refazerComIA, refazerCortes } from "../../acoes";

export function Refazer({
  slug,
  cortes = false,
}: {
  slug: string;
  cortes?: boolean;
}) {
  const acao = cortes ? refazerCortes : refazerComIA;
  const pergunta = cortes
    ? "Cortar os vídeos de novo? Os cortes automáticos atuais serão substituídos."
    : "Refazer o resumo, as falas e os cortes com a IA? O rascunho atual será substituído.";
  const router = useRouter();
  const [aviso, setAviso] = useState("");
  const [pendente, iniciar] = useTransition();
  return (
    <div className="mt-2">
      <button
        disabled={pendente}
        onClick={() => {
          if (!confirm(pergunta)) return;
          iniciar(async () => {
            try {
              await acao(slug);
              setAviso("Na fila. Recarregue em alguns minutos.");
              router.refresh();
            } catch (e) {
              setAviso(
                `⚠️ ${e instanceof Error ? e.message : "Algo deu errado."}`,
              );
            }
          });
        }}
        className="rounded-full border border-white/30 px-4 py-1.5 text-xs font-bold disabled:opacity-60"
      >
        {cortes ? "🎬 Refazer cortes" : "🔄 Refazer com a IA"}
      </button>
      {aviso && <span className="ml-2 text-xs font-semibold">{aviso}</span>}
    </div>
  );
}
