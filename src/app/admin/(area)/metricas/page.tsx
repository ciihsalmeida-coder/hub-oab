import { exigirEquipe } from "@/lib/equipe";
import { Cartao, Numero, TituloCartao } from "../ui";

export const dynamic = "force-dynamic";

type Linha = { tipo: string; alvo: string | null; dia: string; total: number };

const COR = "#3b9fd4";
const DOWNLOADS = ["baixou_card", "baixou_video", "baixou_foto"];
const VISITAS = ["visita_home", "visita_painel"];

function soma(linhas: Linha[], tipos: string[]) {
  return linhas.filter((l) => tipos.includes(l.tipo)).reduce((t, l) => t + l.total, 0);
}

function rotuloDia(dia: string) {
  const [, m, d] = dia.split("-");
  return `${d}/${m}`;
}

// Barras horizontais ranqueadas (uma série só, sem legenda).
function Ranking({ itens }: { itens: { rotulo: string; valor: number }[] }) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  if (!itens.length) return <p className="text-sm text-muted">Ainda sem dados.</p>;
  return (
    <ul className="space-y-3">
      {itens.map((i) => (
        <li key={i.rotulo} title={`${i.rotulo}: ${i.valor}`} className="group">
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-white/85 group-hover:text-white">{i.rotulo}</span>
            <span className="shrink-0 font-bold">{i.valor}</span>
          </div>
          <div className="h-3 rounded-full bg-white/5">
            <div className="h-3 rounded-full transition-opacity group-hover:opacity-80" style={{ width: `${(i.valor / max) * 100}%`, background: COR }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function Metricas() {
  const { db } = await exigirEquipe();
  const [metricas, paineis, palestrantes, kits, cadastros] = await Promise.all([
    db.from("metricas").select("tipo, alvo, dia, total"),
    db.from("paineis").select("slug, numero, titulo").order("ordem"),
    db.from("palestrantes").select("slug, nome"),
    db.from("kits").select("palestrante_id, enviado_em").not("enviado_em", "is", null),
    db.from("cadastros").select("id", { count: "exact", head: true }),
  ]);
  const linhas = (metricas.data ?? []) as Linha[];

  const visitas = soma(linhas, VISITAS);
  const downloads = soma(linhas, DOWNLOADS);
  const kitsAbertos = new Set(linhas.filter((l) => l.tipo === "visita_kit").map((l) => l.alvo)).size;
  const kitsComDownload = new Set(linhas.filter((l) => DOWNLOADS.includes(l.tipo) && linhas.some((k) => k.tipo === "visita_kit" && k.alvo === l.alvo)).map((l) => l.alvo)).size;
  const totalPalestrantes = (palestrantes.data ?? []).length;

  // Visitas por dia (últimos 14 dias com dados).
  const porDia = new Map<string, number>();
  for (const l of linhas) if (VISITAS.includes(l.tipo)) porDia.set(l.dia, (porDia.get(l.dia) ?? 0) + l.total);
  const dias = [...porDia.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-14);
  const maxDia = Math.max(1, ...dias.map(([, v]) => v));

  const porPainel = (paineis.data ?? [])
    .map((p) => ({
      rotulo: `${p.numero ? `P${p.numero}` : "Abertura"} · ${p.titulo}`,
      valor: linhas.filter((l) => l.tipo === "visita_painel" && l.alvo === p.slug).reduce((t, l) => t + l.total, 0),
    }))
    .filter((p) => p.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const nomes = new Map((palestrantes.data ?? []).map((p) => [p.slug, p.nome]));
  const porKit = [...new Set(linhas.filter((l) => l.tipo === "visita_kit").map((l) => l.alvo ?? ""))]
    .map((slug) => ({
      rotulo: nomes.get(slug) ?? slug,
      valor: linhas.filter((l) => l.alvo === slug && (l.tipo === "visita_kit" || DOWNLOADS.includes(l.tipo))).reduce((t, l) => t + l.total, 0),
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  const funil = [
    { rotulo: "Kits enviados", valor: (kits.data ?? []).length },
    { rotulo: "Kits abertos", valor: kitsAbertos },
    { rotulo: "Baixaram material", valor: kitsComDownload },
  ];
  const maxFunil = Math.max(1, ...funil.map((f) => f.valor));

  const porTipo: [string, string][] = [
    ["visita_home", "Visitas à página inicial"],
    ["visita_painel", "Visitas às páginas dos painéis"],
    ["visita_kit", "Aberturas de kit"],
    ["baixou_card", "Cards baixados"],
    ["baixou_video", "Vídeos baixados"],
    ["baixou_foto", "Fotos baixadas"],
    ["compartilhou", "Compartilhamentos"],
    ["abriu_galeria", "Cliques na galeria de fotos"],
    ["abriu_mural", "Aberturas do mural"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Métricas 📊</h1>
        <p className="mt-1 text-muted">Contagem anônima de acessos e downloads. Atualiza a cada visita.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Numero icone="👀" valor={visitas} rotulo="visitas ao hub" destaque />
        <Numero icone="🎁" valor={`${kitsAbertos}/${totalPalestrantes}`} rotulo="kits abertos" />
        <Numero icone="⬇️" valor={downloads} rotulo="downloads" />
        <Numero icone="👥" valor={cadastros.count ?? 0} rotulo="cadastros" />
        <Numero icone="📸" valor={soma(linhas, ["abriu_galeria"])} rotulo="cliques na galeria" />
      </div>

      <Cartao>
        <TituloCartao icone="📅" titulo="Visitas por dia" ajuda="Página inicial + páginas dos painéis" />
        {dias.length ? (
          <div className="flex h-44 items-end gap-1.5">
            {dias.map(([dia, v]) => (
              <div key={dia} className="group flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${rotuloDia(dia)}: ${v} visita(s)`}>
                <span className="text-[11px] font-bold opacity-0 transition group-hover:opacity-100">{v}</span>
                <div className="w-full max-w-6 rounded-t-[4px]" style={{ height: `${Math.max(2, (v / maxDia) * 100)}%`, background: COR }} />
                <span className="text-[10px] text-muted">{rotuloDia(dia)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Ainda sem visitas registradas.</p>
        )}
      </Cartao>

      <div className="grid gap-6 lg:grid-cols-2">
        <Cartao>
          <TituloCartao icone="🎙️" titulo="Painéis mais vistos" />
          <Ranking itens={porPainel} />
        </Cartao>

        <Cartao>
          <TituloCartao icone="🎁" titulo="Kit do palestrante" ajuda="Quantos receberam, abriram e baixaram" />
          <ul className="space-y-3">
            {funil.map((f) => (
              <li key={f.rotulo} title={`${f.rotulo}: ${f.valor}`}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-white/85">{f.rotulo}</span>
                  <span className="font-bold">{f.valor}</span>
                </div>
                <div className="h-3 rounded-full bg-white/5">
                  <div className="h-3 rounded-full" style={{ width: `${(f.valor / maxFunil) * 100}%`, background: COR }} />
                </div>
              </li>
            ))}
          </ul>
          {porKit.length > 0 && (
            <>
              <h3 className="mt-6 mb-3 text-xs font-extrabold tracking-[0.2em] text-sky uppercase">Palestrantes mais ativos</h3>
              <Ranking itens={porKit} />
            </>
          )}
        </Cartao>
      </div>

      <Cartao>
        <details>
          <summary className="cursor-pointer font-bold">Ver em tabela</summary>
          <table className="mt-4 w-full text-sm">
            <tbody>
              {porTipo.map(([tipo, rotulo]) => (
                <tr key={tipo} className="border-t border-white/10">
                  <td className="py-2 text-white/85">{rotulo}</td>
                  <td className="py-2 text-right font-bold">{soma(linhas, [tipo])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </Cartao>

      <p className="text-xs text-muted">
        Sem nome, e-mail ou IP: só contamos a ação (ex.: “baixou um card”) e o painel ou palestrante. Use esses números no
        relatório final para a OAB.
      </p>
    </div>
  );
}
