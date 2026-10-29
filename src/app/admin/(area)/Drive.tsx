"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Cartão do Google Drive na área de controle.
export function Drive(props: { configurado: boolean; pastasCriadas: boolean; erros: { nome: string | null; erro: string }[] }) {
  const router = useRouter();
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function chamar(caminho: string, sucesso: (r: Record<string, number>) => string) {
    setOcupado(true);
    setMensagem("Trabalhando… pode levar até 1 minuto.");
    try {
      const r = await fetch(caminho, { method: "POST" });
      const json = await r.json();
      setMensagem(r.ok ? sucesso(json) : `⚠️ ${json.erro ?? "Algo deu errado."}`);
      router.refresh();
    } catch {
      setMensagem("⚠️ Sem conexão. Tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-extrabold">📁 Google Drive</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${props.configurado ? "bg-green-100 text-green-900" : "bg-line text-muted"}`}>
          {props.configurado ? "conectado" : "aguardando configuração"}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Fotos e cortes colocados nas pastas do congresso entram aqui sozinhos, como rascunho, a cada 2 minutos.
      </p>
      {props.configurado && (
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="https://drive.google.com/drive/folders/1S4UKRokkKPsYD6gZudhxVM292-PgZUu0"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-navy px-4 py-2 text-sm font-bold"
          >
            Abrir pasta ↗
          </a>
            <button
              disabled={ocupado}
              onClick={() => chamar("/api/drive/preparar", (r) => `✅ ${r.pastas} pastas prontas no Drive.`)}
              className="rounded-full bg-navy px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {props.pastasCriadas ? "Atualizar pastas" : "Criar pastas no Drive"}
            </button>
          <button
            disabled={ocupado}
            onClick={() =>
              chamar("/api/drive/sincronizar", (r) =>
                r.copiados || r.erros || r.pendentes
                  ? `✅ ${r.copiados} arquivo(s) novo(s)${r.erros ? ` · ${r.erros} com erro` : ""}${r.pendentes ? ` · ${r.pendentes} na fila` : ""}.`
                  : "Nada novo no Drive.",
              )
            }
            className="rounded-full bg-sky px-4 py-2 text-sm font-bold text-navy disabled:opacity-60"
          >
            Buscar agora
          </button>
        </div>
      )}
      {mensagem && <p className="mt-2 text-sm font-semibold">{mensagem}</p>}
      {props.erros.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-wine">{props.erros.length} arquivo(s) com problema</summary>
          <ul className="mt-2 space-y-1">
            {props.erros.map((e, i) => (
              <li key={i}>
                <strong>{e.nome}</strong>: {e.erro}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
