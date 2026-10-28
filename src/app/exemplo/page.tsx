"use client";

// Página de demonstração: mostra como a página de um painel fica depois que a IA
// preenche o conteúdo. Nomes e falas são fictícios.

import Link from "next/link";
import { useState } from "react";

const VIDEO_EXEMPLO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const palestrantes = [
  { nome: "Helena Exemplo", cargo: "Advogada (nome fictício)" },
  { nome: "Marcos Modelo", cargo: "Conselheiro (nome fictício)" },
  { nome: "Ana Demonstração", cargo: "Gestora (nome fictício)" },
];

const resumo = [
  "O painel discutiu como o novo processo de importação muda a rotina de importadores, despachantes e advogados. A mesa concordou que a digitalização reduz etapas, mas alertou que a transição exige atenção redobrada aos prazos e à qualidade das informações declaradas.",
  "Um ponto de debate foi a responsabilidade por erros cometidos durante a fase de adaptação. Parte da mesa defendeu um período de orientação antes da aplicação de multas; outra parte lembrou que as regras já estão publicadas e que as empresas precisam se preparar desde já.",
  "Ao final, os participantes destacaram a importância de diálogo contínuo entre a advocacia, a Receita Federal e o setor privado para que a mudança traga, de fato, mais segurança jurídica.",
];

const falas = [
  {
    quem: "Helena Exemplo",
    tempo: "12:40",
    texto: "A tecnologia muda o formulário, mas não muda a responsabilidade de quem declara. O cuidado com a informação continua sendo a melhor defesa.",
  },
  {
    quem: "Marcos Modelo",
    tempo: "27:15",
    texto: "Segurança jurídica se constrói com regras claras e com tempo para que todos aprendam a aplicá-las.",
  },
  {
    quem: "Ana Demonstração",
    tempo: "41:02",
    texto: "Para a empresa, o ganho está na previsibilidade. Saber quanto tempo leva cada etapa vale tanto quanto reduzir custos.",
  },
];

const cortes = [
  {
    titulo: "A responsabilidade de quem declara",
    duracao: "0:42",
    legenda:
      "“A tecnologia muda o formulário, mas não muda a responsabilidade de quem declara.” Um dos destaques do Painel 1 do #XIVCongressoOAB. Confira o painel completo no hub do congresso.",
  },
  {
    titulo: "Regras claras e tempo para aprender",
    duracao: "0:35",
    legenda:
      "Segurança jurídica também é tempo de adaptação. Veja o trecho do debate sobre o novo processo de importação. #DireitoAduaneiro #XIVCongressoOAB",
  },
];

export default function Exemplo() {
  const [modo, setModo] = useState<"publico" | "rascunho">("publico");
  const [aprovado, setAprovado] = useState(false);
  const rascunho = modo === "rascunho";

  return (
    <main>
      <div className="sticky top-0 z-10 bg-purple px-4 py-2 text-center text-sm font-semibold text-white">
        Página de demonstração · nomes, falas e vídeo são fictícios
      </div>

      <div className="mx-auto flex max-w-3xl gap-2 px-4 pt-4">
        <Aba ativa={!rascunho} onClick={() => setModo("publico")}>👀 Como o público vê</Aba>
        <Aba ativa={rascunho} onClick={() => setModo("rascunho")}>✏️ Como você vê (rascunho)</Aba>
      </div>

      <header className="mt-4 bg-navy px-4 pb-8 pt-6 text-cream">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-sm text-cream/70">← Programação</Link>
          <p className="mt-4 text-xs font-semibold tracking-[0.2em] text-red uppercase">
            Painel 1 · Aduaneiro · Quinta, 12/11 · 10h00
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">
            Questões Legais do Novo Processo de Importação
          </h1>
          <span className="mt-6 inline-block rounded-full bg-red px-5 py-3 font-semibold text-white">
            📸 Encontre suas fotos
          </span>
        </div>
      </header>

      {rascunho && (
        <div className="mx-auto mt-6 max-w-3xl px-4">
          <div
            className={`rounded-xl border-2 p-4 ${
              aprovado ? "border-green-600 bg-green-50" : "border-amber-500 bg-amber-50"
            }`}
          >
            <p className="font-semibold">
              {aprovado ? "✅ PUBLICADO · aprovado pela organização" : "🟡 RASCUNHO · o público ainda não vê este conteúdo"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {aprovado
                ? "Agora o resumo, as falas e os cortes aparecem na página pública."
                : "Gerado pela IA às 11h32 a partir do áudio e do vídeo do painel. Revise, corrija o que precisar e envie para aprovação."}
            </p>
            <button
              onClick={() => setAprovado(!aprovado)}
              className={`mt-3 rounded-full px-5 py-2 font-semibold text-white ${aprovado ? "bg-muted" : "bg-green-600"}`}
            >
              {aprovado ? "Desfazer (voltar para rascunho)" : "Aprovar e publicar"}
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
        <Secao titulo="Palestrantes">
          <ul className="grid gap-3 sm:grid-cols-2">
            {palestrantes.map((p) => (
              <li key={p.nome} className="flex items-center gap-3 rounded-xl border border-line bg-card p-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-navy font-display text-sm text-cream">
                  {p.nome.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold leading-tight">{p.nome}</p>
                  <p className="text-sm text-muted">{p.cargo}</p>
                </div>
              </li>
            ))}
          </ul>
        </Secao>

        <Secao titulo="Resumo do debate" editavel={rascunho}>
          <div className="space-y-3 leading-relaxed">
            {resumo.map((p) => (
              <p key={p.slice(0, 20)}>{p}</p>
            ))}
          </div>
        </Secao>

        <Secao titulo="Principais falas" editavel={rascunho}>
          <ul className="space-y-4">
            {falas.map((f) => (
              <li key={f.quem}>
                <blockquote className="border-l-4 border-red pl-4">
                  <p className="font-display text-lg leading-snug">“{f.texto}”</p>
                  <footer className="mt-1 text-sm text-muted">
                    {f.quem}
                    {rascunho && <span> · aos {f.tempo} do vídeo</span>}
                  </footer>
                </blockquote>
              </li>
            ))}
          </ul>
        </Secao>

        <Secao titulo="Cortes de vídeo" editavel={rascunho}>
          <div className="grid gap-4 sm:grid-cols-2">
            {cortes.map((c) => (
              <figure key={c.titulo} className="overflow-hidden rounded-xl border border-line bg-card">
                <div className="relative aspect-[9/16] max-h-[480px] w-full bg-navy">
                  <video
                    src={VIDEO_EXEMPLO}
                    controls
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                  <span className="pointer-events-none absolute inset-x-3 bottom-14 rounded bg-black/70 px-2 py-1 text-center text-sm font-semibold text-white">
                    legenda automática aparece aqui
                  </span>
                </div>
                <figcaption className="p-3">
                  <p className="font-semibold">{c.titulo}</p>
                  <p className="text-sm text-muted">{c.duracao}</p>
                  {rascunho && (
                    <div className="mt-3 rounded-lg bg-cream p-3 text-sm">
                      <p className="font-semibold">💬 Sugestão de legenda para o Instagram</p>
                      <p className="mt-1">{c.legenda}</p>
                    </div>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        </Secao>

        <Secao titulo="Fotos do painel">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="grid aspect-square place-items-center rounded-lg bg-gradient-to-br from-navy-2 to-navy text-xs text-cream/60"
              >
                foto {i + 1}
              </div>
            ))}
          </div>
        </Secao>
      </div>
    </main>
  );
}

function Aba({ ativa, onClick, children }: { ativa: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold ${
        ativa ? "bg-navy text-cream" : "border border-line bg-card text-navy"
      }`}
    >
      {children}
    </button>
  );
}

function Secao({ titulo, editavel, children }: { titulo: string; editavel?: boolean; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-semibold">{titulo}</h2>
        {editavel && (
          <span className="rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold">✏️ Editar</span>
        )}
      </div>
      {children}
    </section>
  );
}
