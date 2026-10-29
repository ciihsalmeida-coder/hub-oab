import Link from "next/link";
import { dias } from "@/data/programacao";
import { driveConfigurado } from "@/lib/drive";
import { exigirEquipe } from "@/lib/equipe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Drive } from "./Drive";
import { situacaoDoPainel, Status } from "./Status";
import { type Etapa, Etapas, Numero } from "./ui";

export const dynamic = "force-dynamic";

const ABERTURA = new Date("2026-11-11T17:30:00-03:00");

// Dias inteiros até a abertura (negativo depois que o congresso começa).
function diasAteAbertura() {
  return Math.ceil((ABERTURA.getTime() - new Date().getTime()) / 86_400_000);
}

type Item = { painel_slug: string; status?: string };

export default async function Admin() {
  const { db, membro } = await exigirEquipe();
  const [paineis, falas, cortes, fotos, cadastros, envios] = await Promise.all([
    db.from("paineis").select("slug, numero, titulo, data, horario, resumo, pontos, status_texto").order("ordem"),
    db.from("falas").select("painel_slug, status"),
    db.from("cortes").select("painel_slug, status, video_url"),
    db.from("fotos").select("painel_slug, status"),
    db.from("cadastros").select("id", { count: "exact", head: true }),
    db.from("envios").select("painel_slug, etapa, criado_em").neq("etapa", "ignorado").order("criado_em", { ascending: false }),
  ]);
  const [pastas, erros] = await Promise.all([
    db.from("pastas_drive").select("drive_id", { count: "exact", head: true }),
    db.from("drive_erros").select("nome, erro").gte("tentativas", 1),
  ]);
  const { data: fotosAuto } = await supabaseAdmin().from("segredos").select("valor").eq("chave", "fotos_auto").maybeSingle();

  const doPainel = <T extends Item>(lista: T[] | null, slug: string) => (lista ?? []).filter((x) => x.painel_slug === slug);
  const lista = paineis.data ?? [];
  const resumo = lista.map((p) => {
    const f = doPainel(falas.data, p.slug);
    const fo = doPainel(fotos.data, p.slug);
    const c = doPainel(cortes.data, p.slug);
    const pendentes = [...f, ...fo, ...c].filter((x) => x.status === "rascunho").length;
    const situacao = situacaoDoPainel(p, pendentes, f.length + fo.length + c.length);
    const envio = (envios.data ?? []).find((e) => e.painel_slug === p.slug);
    const etapas: Etapa[] = [
      {
        icone: "🎙️",
        rotulo: "Áudio",
        estado: !envio ? "pendente" : envio.etapa === "erro" ? "erro" : envio.etapa === "pronto" ? "feito" : "andamento",
      },
      { icone: "✍️", rotulo: "Textos", estado: p.resumo ? "feito" : envio && envio.etapa !== "erro" ? "andamento" : "pendente" },
      { icone: "📸", rotulo: `Fotos${fo.length ? ` (${fo.length})` : ""}`, estado: fo.length ? "feito" : "pendente" },
      {
        icone: "🎬",
        rotulo: `Cortes${c.length ? ` (${c.filter((x) => x.video_url).length}/${c.length})` : ""}`,
        estado: !c.length ? "pendente" : c.every((x) => x.video_url) ? "feito" : "andamento",
      },
      { icone: "✅", rotulo: "Publicado", estado: situacao === "publicado" ? "feito" : "pendente" },
    ];
    return { p, situacao, etapas, pendentes };
  });

  const publicados = resumo.filter((r) => r.situacao === "publicado").length;
  const aguardando = resumo.filter((r) => r.situacao === "rascunho").length;
  const dias_ = diasAteAbertura();
  const primeiroNome = membro?.nome.split(" ")[0] ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Olá, {primeiroNome} 👋</h1>
        <p className="mt-1 text-muted">
          {dias_ > 0
            ? `Faltam ${dias_} dia(s) para a abertura do congresso.`
            : dias_ > -3
              ? "O congresso está acontecendo. Bom trabalho!"
              : "Congresso encerrado. Hora de completar o hub."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Numero icone="✅" valor={`${publicados}/${lista.length}`} rotulo="painéis publicados" destaque />
        <Numero icone="🟡" valor={aguardando} rotulo="aguardando aprovação" />
        <Numero icone="📸" valor={(fotos.data ?? []).length} rotulo="fotos no hub" />
        <Numero icone="👥" valor={cadastros.count ?? 0} rotulo="pessoas cadastradas" />
      </div>

      <Drive
        configurado={driveConfigurado()}
        pastasCriadas={(pastas.count ?? 0) > 0}
        fotosAuto={fotosAuto?.valor !== "nao"}
        erros={erros.data ?? []}
      />

      {dias.map((dia) => (
        <section key={dia.data}>
          <h2 className="mb-2 text-xs font-extrabold tracking-[0.2em] text-sky uppercase">{dia.rotulo}</h2>
          <ul className="space-y-3">
            {resumo
              .filter(({ p }) => p.data === dia.data)
              .map(({ p, situacao, etapas, pendentes }) => (
                <li key={p.slug}>
                  <Link
                    href={`/admin/paineis/${p.slug}`}
                    className="group block rounded-[28px] border border-white/12 bg-white/[0.07] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-sky/50"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-extrabold">{p.horario}</span>
                      <span className="text-xs font-bold text-muted uppercase">{p.numero ? `Painel ${p.numero}` : "Abertura"}</span>
                      <span className="ml-auto">
                        <Status situacao={situacao} />
                      </span>
                    </div>
                    <p className="mt-2 text-lg leading-snug font-bold group-hover:text-sky">{p.titulo}</p>
                    <div className="mt-3">
                      <Etapas etapas={etapas} />
                    </div>
                    {pendentes > 0 && (
                      <p className="mt-2 text-xs font-semibold text-amber-200">{pendentes} item(ns) esperando aprovação →</p>
                    )}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
