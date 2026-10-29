"use client";

import { useState, useTransition } from "react";
import { definirGaleria } from "./acoes";
import { Cartao, TituloCartao } from "./ui";

export function Galeria({ atual }: { atual: string }) {
  const [aviso, setAviso] = useState("");
  const [pendente, iniciar] = useTransition();
  return (
    <Cartao>
      <TituloCartao
        icone="🤳"
        titulo="Galeria com busca por selfie"
        ajuda="Cole o link da plataforma contratada. Ele vai para o botão “Encontre suas fotos” de todas as páginas."
      />
      <form
        action={(form) =>
          iniciar(async () => {
            try {
              await definirGaleria(String(form.get("url") ?? ""));
              setAviso("✓ Link salvo. Aparece no site em até 1 minuto.");
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
          placeholder="https://..."
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
