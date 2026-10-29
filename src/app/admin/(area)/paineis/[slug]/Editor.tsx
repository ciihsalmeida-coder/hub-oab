"use client";

import { useState, useTransition } from "react";
import { salvarRascunho } from "../../acoes";
import { Cartao, TituloCartao } from "../../ui";

type Fala = { texto: string; palestranteId: string | null };

export function Editor(props: {
  slug: string;
  resumo: string;
  pontos: string[];
  falas: Fala[];
  palestrantes: { id: string; nome: string }[];
}) {
  const [falas, setFalas] = useState<Fala[]>(props.falas);
  const [pontos, setPontos] = useState<string[]>(props.pontos.length ? props.pontos : ["", "", ""]);
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
    <form
      action={(form) => executar(() => salvarRascunho(props.slug, form), "✓ Textos salvos. Aguardando aprovação.")}
      className="space-y-6"
    >
      <Bloco icone="⚡" titulo="O painel em 1 minuto" ajuda="Até 3 pontos principais, curtos e diretos.">
        <div className="space-y-2">
          {pontos.map((p, i) => (
            <textarea
              key={i}
              name="ponto"
              defaultValue={p}
              rows={2}
              placeholder={`Ponto ${i + 1}`}
              className="w-full rounded-2xl border border-line bg-fog/40 px-4 py-3 focus:border-sky focus:bg-white focus:outline-none"
            />
          ))}
          {pontos.length < 5 && (
            <button type="button" onClick={() => setPontos([...pontos, ""])} className="text-sm font-semibold text-sky">
              + Adicionar ponto
            </button>
          )}
        </div>
      </Bloco>

      <Bloco icone="📝" titulo="Resumo completo" ajuda="Parágrafos separados por uma linha em branco.">
        <textarea
          name="resumo"
          defaultValue={props.resumo}
          rows={10}
          className="w-full rounded-2xl border border-line bg-fog/40 px-4 py-3 focus:border-sky focus:bg-white focus:outline-none leading-relaxed"
        />
      </Bloco>

      <Bloco icone="💬" titulo="Principais falas" ajuda="Confira se a frase e o nome do palestrante estão certos.">
        <input type="hidden" name="falas" value={JSON.stringify(falas)} />
        <ul className="space-y-3">
          {falas.map((f, i) => (
            <li key={i} className="rounded-2xl border border-line bg-fog/40 p-3">
              <textarea
                value={f.texto}
                onChange={(e) => setFalas(falas.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)))}
                rows={3}
                className="w-full rounded-lg border border-line px-3 py-2"
              />
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={f.palestranteId ?? ""}
                  onChange={(e) =>
                    setFalas(falas.map((x, j) => (j === i ? { ...x, palestranteId: e.target.value || null } : x)))
                  }
                  className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-sm"
                >
                  <option value="">Quem falou?</option>
                  {props.palestrantes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setFalas(falas.filter((_, j) => j !== i))}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-wine"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setFalas([...falas, { texto: "", palestranteId: null }])}
          className="mt-2 text-sm font-semibold text-sky"
        >
          + Adicionar fala
        </button>
      </Bloco>

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pendente} className="rounded-full bg-navy px-6 py-3 font-extrabold text-white disabled:opacity-60">
          {pendente ? "Salvando…" : "💾 Salvar textos"}
        </button>
        {aviso && <p className="text-sm font-semibold">{aviso}</p>}
      </div>
    </form>
  );
}

function Bloco({ icone, titulo, ajuda, children }: { icone: string; titulo: string; ajuda: string; children: React.ReactNode }) {
  return (
    <Cartao>
      <TituloCartao icone={icone} titulo={titulo} ajuda={ajuda} />
      {children}
    </Cartao>
  );
}
