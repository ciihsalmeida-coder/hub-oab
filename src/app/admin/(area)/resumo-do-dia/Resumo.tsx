"use client";

import { useState, useTransition } from "react";
import { Copiar } from "@/components/Botoes";
import { gerarResumoDia, salvarResumoDia } from "../acoes";
import { Cartao, TituloCartao } from "../ui";

export function Resumo(props: { dia: string; rotulo: string; texto: string; geradoEm: string | null }) {
  const [texto, setTexto] = useState(props.texto);
  const [aviso, setAviso] = useState("");
  const [pendente, iniciar] = useTransition();

  return (
    <Cartao>
      <TituloCartao
        icone="🗓️"
        titulo={props.rotulo}
        ajuda={props.geradoEm ? `Gerado em ${new Date(props.geradoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : "Ainda não gerado."}
        acao={
          <button
            disabled={pendente}
            onClick={() =>
              iniciar(async () => {
                setAviso("A IA está escrevendo… (até 1 minuto)");
                try {
                  setTexto(await gerarResumoDia(props.dia, props.rotulo));
                  setAviso("✓ Pronto. Revise antes de enviar.");
                } catch (e) {
                  setAviso(`⚠️ ${e instanceof Error ? e.message : "Não foi possível gerar."}`);
                }
              })
            }
            className="shrink-0 rounded-full bg-sky px-4 py-2 text-sm font-extrabold text-navy disabled:opacity-60"
          >
            {texto ? "🔄 Gerar de novo" : "✨ Gerar com a IA"}
          </button>
        }
      />
      {texto && (
        <>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => iniciar(() => salvarResumoDia(props.dia, texto))}
            rows={12}
            className="w-full rounded-2xl border border-line bg-white/10 px-4 py-3 text-sm leading-relaxed"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Copiar texto={texto} rotulo="Copiar texto" />
            <a
              href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-green-600 px-4 py-2 text-sm font-bold text-white"
            >
              Enviar no WhatsApp
            </a>
          </div>
        </>
      )}
      {aviso && <p className="mt-2 text-sm font-semibold">{aviso}</p>}
    </Cartao>
  );
}
