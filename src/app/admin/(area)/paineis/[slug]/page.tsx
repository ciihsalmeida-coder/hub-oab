import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirEquipe } from "@/lib/equipe";
import { situacaoDoPainel, Status } from "../../Status";
import { Cartao, TituloCartao } from "../../ui";
import { Aprovacao } from "./Aprovacao";
import { Editor } from "./Editor";
import { Fotos } from "./Fotos";
import { QuemNoCorte } from "./Quem";
import { Refazer } from "./Refazer";
import { VideoSessao } from "./VideoSessao";

export const dynamic = "force-dynamic";

export default async function EditarPainel({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db, membro } = await exigirEquipe();
  const [painel, palestrantes, falas, fotos, envios, cortes] = await Promise.all([
    db.from("paineis").select("slug, numero, titulo, horario, resumo, pontos, status_texto, aprovado_em, video_sessao_url").eq("slug", slug).maybeSingle(),
    db.from("palestrantes").select("id, nome").eq("painel_slug", slug).order("ordem"),
    db.from("falas").select("texto, palestrante_id, status, inicio_ms").eq("painel_slug", slug).order("ordem"),
    db.from("fotos").select("id, url, miniatura_url, palestrante_id, status").eq("painel_slug", slug).order("ordem"),
    db
      .from("envios")
      .select("nome, etapa, erro, atualizado_em")
      .eq("painel_slug", slug)
      .neq("etapa", "ignorado")
      .order("criado_em", { ascending: false })
      .limit(1),
    db
      .from("cortes")
      .select("id, titulo, inicio_ms, fim_ms, legenda_sugerida, video_url, palestrante_id, erro, tentativas, status")
      .eq("painel_slug", slug)
      .order("ordem"),
  ]);
  if (!painel.data) notFound();
  const p = painel.data;
  const todos = [...(falas.data ?? []), ...(fotos.data ?? []), ...(cortes.data ?? [])];
  const pendentes = todos.filter((x) => x.status === "rascunho").length;
  const situacao = situacaoDoPainel(p, pendentes, todos.length);
  const envio = envios.data?.[0];
  const lista = palestrantes.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm font-semibold text-muted hover:text-white">
          ← Todos os painéis
        </Link>
        <div className="mt-3 rounded-[28px] border border-white/15 bg-gradient-to-br from-sky/35 via-sea/30 to-wine/30 p-6 text-white shadow-[0_10px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-extrabold">{p.horario}</span>
            <span className="text-xs font-bold text-white/70 uppercase">{p.numero ? `Painel ${p.numero}` : "Abertura"}</span>
            <span className="ml-auto">
              <Status situacao={situacao} />
            </span>
          </div>
          <h1 className="mt-3 text-3xl leading-tight font-extrabold tracking-tight">{p.titulo}</h1>
          <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold">
            <Link href={`/paineis/${slug}`} target="_blank" className="rounded-full bg-white px-4 py-2 text-navy">
              Ver página pública ↗
            </Link>
          </div>
        </div>
      </div>

      <StatusIA envio={envio} slug={slug} />

      <Editor
        slug={slug}
        resumo={p.resumo ?? ""}
        pontos={(p.pontos as string[]) ?? []}
        falas={(falas.data ?? []).map((f) => ({ texto: f.texto, palestranteId: f.palestrante_id, inicioMs: f.inicio_ms }))}
        palestrantes={lista}
      />

      <Cortes slug={slug} cortes={cortes.data ?? []} palestrantes={lista} />

      <VideoSessao slug={slug} atual={p.video_sessao_url ?? ""} />

      <Cartao>
        <Fotos
          slug={slug}
          palestrantes={lista}
          fotos={(fotos.data ?? []).map((f) => ({
            id: f.id,
            url: f.url,
            miniatura: f.miniatura_url,
            palestranteId: f.palestrante_id,
            publicada: f.status === "publicado",
          }))}
        />
      </Cartao>

      <Aprovacao slug={slug} titulo={p.titulo} podeAprovar={membro?.papel === "aprovador"} publicado={situacao === "publicado"} pendentes={pendentes} />
    </div>
  );
}

const etapas: Record<string, [string, string]> = {
  recebido: ["📥", "Áudio recebido do Drive. A transcrição começa em até 2 minutos."],
  transcrevendo: ["🎧", "Transcrevendo o áudio… leva cerca de 1/4 da duração do painel."],
  escrevendo: ["✍️", "A IA está escrevendo o resumo, as falas e os cortes…"],
  pronto: ["✅", "A IA terminou. Revise abaixo e aprove."],
  erro: ["⚠️", "Algo deu errado no processamento."],
};

function StatusIA({ envio, slug }: { envio?: { nome: string | null; etapa: string; erro: string | null }; slug: string }) {
  if (!envio) {
    return (
      <Cartao className="border-dashed">
        <TituloCartao
          icone="🎙️"
          titulo="Aguardando o áudio do painel"
          ajuda="Quando o áudio for colocado na pasta “Áudio e vídeo do painel” do Drive, a IA começa sozinha."
        />
      </Cartao>
    );
  }
  const [icone, texto] = etapas[envio.etapa] ?? ["ℹ️", envio.etapa];
  const cor = envio.etapa === "erro" ? "border-red-300/30 bg-red-400/10" : envio.etapa === "pronto" ? "border-emerald-300/30 bg-emerald-400/10" : "border-sky/40 bg-sky/5";
  return (
    <section className={`rounded-3xl border p-5 ${cor}`}>
      <TituloCartao
        icone={icone}
        titulo={texto}
        ajuda={`Arquivo: ${envio.nome ?? "—"}`}
        acao={["pronto", "erro"].includes(envio.etapa) ? <Refazer slug={slug} /> : undefined}
      />
      {envio.erro && <p className="font-semibold text-red-300">{envio.erro}</p>}
    </section>
  );
}

function tempo(ms: number | null) {
  if (ms == null) return "";
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

type Corte = {
  id: string;
  titulo: string;
  inicio_ms: number | null;
  fim_ms: number | null;
  legenda_sugerida: string | null;
  video_url: string | null;
  palestrante_id: string | null;
  erro: string | null;
  tentativas: number;
  status: string;
};

function Cortes({ slug, cortes, palestrantes }: { slug: string; cortes: Corte[]; palestrantes: { id: string; nome: string }[] }) {
  if (!cortes.length) return null;
  return (
    <Cartao>
      <TituloCartao
        icone="🎬"
        titulo="Cortes de vídeo"
        ajuda="Escolha quem aparece em cada vídeo: é isso que leva o corte para o kit do palestrante."
        acao={<Refazer slug={slug} cortes />}
      />
      <ul className="grid gap-4 sm:grid-cols-2">
        {cortes.map((c) => (
          <li key={c.id} className="flex gap-3 rounded-2xl border border-line bg-fog/40 p-3 text-sm">
            {c.video_url ? (
              <video src={c.video_url} controls playsInline preload="metadata" className="aspect-[9/16] w-28 shrink-0 rounded-xl bg-navy object-cover" />
            ) : (
              <div className="grid aspect-[9/16] w-28 shrink-0 place-items-center rounded-xl bg-line/60 text-center text-xs text-muted">
                {c.tentativas >= 3 ? "⚠️ o robô desistiu" : "⏳ cortando…"}
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <p className="leading-tight font-bold">{c.titulo}</p>
              <p className="text-xs text-muted">
                {c.inicio_ms != null && `de ${tempo(c.inicio_ms)} a ${tempo(c.fim_ms)} · `}
                {c.status === "publicado" ? "publicado" : "rascunho"}
              </p>
              <QuemNoCorte slug={slug} corteId={c.id} atual={c.palestrante_id} palestrantes={palestrantes} />
              {c.erro && <p className="text-xs font-semibold text-red-300">{c.erro}</p>}
              {c.legenda_sugerida && <p className="rounded-xl bg-white/10 p-2 text-xs">💬 {c.legenda_sugerida}</p>}
              {c.video_url && (
                <a href={c.video_url} download className="inline-block text-xs font-bold text-sky underline">
                  ⬇ Baixar vídeo
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Cartao>
  );
}
