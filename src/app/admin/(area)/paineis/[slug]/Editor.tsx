"use client";

import { useState, useTransition } from "react";
import { aprovar, despublicar, salvarRascunho } from "../../acoes";

type Fala = { texto: string; palestranteId: string | null };

export function Editor(props: {
  slug: string;
  podeAprovar: boolean;
  publicado: boolean;
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
      action={(form) => executar(() => salvarRascunho(props.slug, form), "Rascunho salvo. Aguardando aprovação.")}
      className="mt-6 space-y-8"
    >
      <Bloco titulo="O painel em 1 minuto" ajuda="Até 3 pontos principais, curtos e diretos.">
        <div className="space-y-2">
          {pontos.map((p, i) => (
            <textarea
              key={i}
              name="ponto"
              defaultValue={p}
              rows={2}
              placeholder={`Ponto ${i + 1}`}
              className="w-full rounded-xl border border-line bg-card px-4 py-3"
            />
          ))}
          {pontos.length < 5 && (
            <button type="button" onClick={() => setPontos([...pontos, ""])} className="text-sm font-semibold text-sky">
              + Adicionar ponto
            </button>
          )}
        </div>
      </Bloco>

      <Bloco titulo="Resumo completo" ajuda="Parágrafos separados por uma linha em branco.">
        <textarea
          name="resumo"
          defaultValue={props.resumo}
          rows={10}
          className="w-full rounded-xl border border-line bg-card px-4 py-3 leading-relaxed"
        />
      </Bloco>

      <Bloco titulo="Principais falas" ajuda="Confira se a frase e o nome do palestrante estão certos.">
        <input type="hidden" name="falas" value={JSON.stringify(falas)} />
        <ul className="space-y-3">
          {falas.map((f, i) => (
            <li key={i} className="rounded-xl border border-line bg-card p-3">
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

      <div className="sticky bottom-0 -mx-4 space-y-2 border-t border-line bg-fog/95 px-4 py-3 backdrop-blur">
        {aviso && <p className="text-sm font-semibold">{aviso}</p>}
        <div className="flex flex-wrap gap-2">
          <button disabled={pendente} className="flex-1 rounded-full bg-navy px-5 py-3 font-extrabold text-white uppercase disabled:opacity-60">
            {pendente ? "Salvando…" : "Salvar rascunho"}
          </button>
          {props.podeAprovar && (
            <button
              type="button"
              disabled={pendente}
              onClick={() => executar(() => aprovar(props.slug), "✅ Publicado! Já aparece no site em até 1 minuto.")}
              className="flex-1 rounded-full bg-green-600 px-5 py-3 font-extrabold text-white uppercase disabled:opacity-60"
            >
              Aprovar e publicar
            </button>
          )}
          {props.podeAprovar && props.publicado && (
            <button
              type="button"
              disabled={pendente}
              onClick={() => executar(() => despublicar(props.slug), "Conteúdo retirado do ar.")}
              className="rounded-full border border-wine px-5 py-3 font-bold text-wine disabled:opacity-60"
            >
              Tirar do ar
            </button>
          )}
        </div>
        {!props.podeAprovar && (
          <p className="text-xs text-muted">Depois de salvar, a pessoa indicada pela OAB entra e aperta “Aprovar e publicar”.</p>
        )}
      </div>
    </form>
  );
}

function Bloco({ titulo, ajuda, children }: { titulo: string; ajuda: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-extrabold tracking-[0.15em] uppercase">{titulo}</h2>
      <p className="mt-1 mb-2 text-sm text-muted">{ajuda}</p>
      {children}
    </section>
  );
}
