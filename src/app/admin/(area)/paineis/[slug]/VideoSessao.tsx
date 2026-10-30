"use client";

import { useState, useTransition } from "react";
import { definirVideoSessao } from "../../acoes";
import { Cartao, TituloCartao } from "../../ui";

export function VideoSessao({ slug, atual }: { slug: string; atual: string }) {
  const [aviso, setAviso] = useState("");
  const [pendente, iniciar] = useTransition();
  return (
    <Cartao>
      <TituloCartao
        icone="🎥"
        titulo="Vídeo da sessão completa"
        ajuda="Suba a gravação inteira no YouTube como “Não listado” e cole o link aqui. Aparece na página do painel assim que salvar."
      />
      <form
        action={(form) =>
          iniciar(async () => {
            try {
              const url = String(form.get("url") ?? "");
              await definirVideoSessao(slug, url);
              setAviso(url.trim() ? "✓ Vídeo salvo. Já está na página do painel." : "✓ Vídeo removido da página.");
            } catch (e) {
              setAviso(`⚠️ ${e instanceof Error ? e.message : "Não foi possível salvar."}`);
            }
          })
        }
        className="flex flex-wrap gap-2"
      >
        <input
          name="url"
          type="url"
          defaultValue={atual}
          placeholder="https://youtu.be/..."
          className="min-w-0 flex-1 rounded-full border border-line bg-white/10 px-4 py-2.5 text-sm"
        />
        <button disabled={pendente} className="rounded-full bg-sky px-5 py-2.5 text-sm font-extrabold text-navy disabled:opacity-60">
          Salvar
        </button>
      </form>
      {aviso && <p className="mt-2 text-sm font-semibold">{aviso}</p>}
    </Cartao>
  );
}
