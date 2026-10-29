"use client";

import { useState, useTransition } from "react";
import { aprovar, despublicar } from "../../acoes";

// Barra fixa no rodapé: publica (ou tira do ar) textos, falas, fotos e cortes do painel de uma vez.
export function Aprovacao(props: { slug: string; podeAprovar: boolean; publicado: boolean; pendentes: number }) {
  const [aviso, setAviso] = useState("");
  const [pendente, iniciar] = useTransition();

  function executar(acao: () => Promise<void>, sucesso: string) {
    setAviso("");
    iniciar(async () => {
      try {
        await acao();
        setAviso(sucesso);
      } catch (e) {
        setAviso(`⚠️ ${e instanceof Error ? e.message : "Algo deu errado. Tente de novo."}`);
      }
    });
  }

  return (
    <div className="sticky bottom-3 z-20 mt-8">
      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-line/70 bg-white/95 p-3 shadow-lg backdrop-blur">
        <p className="min-w-0 flex-1 text-sm">
          {aviso ||
            (props.pendentes > 0 ? (
              <>
                <strong>{props.pendentes} item(ns)</strong> esperando aprovação
              </>
            ) : props.publicado ? (
              "✅ Tudo publicado"
            ) : (
              "Nada para aprovar ainda"
            ))}
        </p>
        {props.podeAprovar ? (
          <>
            {props.publicado && (
              <button
                type="button"
                disabled={pendente}
                onClick={() => {
                  if (confirm("Tirar todo o conteúdo deste painel do ar?")) executar(() => despublicar(props.slug), "Conteúdo retirado do ar.");
                }}
                className="rounded-full px-4 py-3 text-sm font-bold text-wine hover:bg-red-50 disabled:opacity-60"
              >
                Tirar do ar
              </button>
            )}
            <button
              type="button"
              disabled={pendente}
              onClick={() => executar(() => aprovar(props.slug), "✅ Publicado! Aparece no site e nos kits em até 1 minuto.")}
              className="rounded-full bg-green-600 px-6 py-3 font-extrabold text-white shadow disabled:opacity-60"
            >
              {pendente ? "Publicando…" : "Aprovar e publicar"}
            </button>
          </>
        ) : (
          <p className="text-xs text-muted">A aprovação é feita pela pessoa indicada pela OAB.</p>
        )}
      </div>
    </div>
  );
}
