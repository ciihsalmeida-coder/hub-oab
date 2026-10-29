import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirEquipe } from "@/lib/equipe";
import { situacaoDoPainel, Status } from "../../Status";
import { Editor } from "./Editor";
import { Fotos } from "./Fotos";
import { Refazer } from "./Refazer";

export const dynamic = "force-dynamic";

export default async function EditarPainel({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { db, membro } = await exigirEquipe();
  const [painel, palestrantes, falas, fotos, envios, cortes] =
    await Promise.all([
      db
        .from("paineis")
        .select(
          "slug, numero, titulo, horario, resumo, pontos, status_texto, aprovado_em",
        )
        .eq("slug", slug)
        .maybeSingle(),
      db
        .from("palestrantes")
        .select("id, nome")
        .eq("painel_slug", slug)
        .order("ordem"),
      db
        .from("falas")
        .select("texto, palestrante_id, status")
        .eq("painel_slug", slug)
        .order("ordem"),
      db
        .from("fotos")
        .select("id, url, miniatura_url, palestrante_id, status")
        .eq("painel_slug", slug)
        .order("ordem"),
      db
        .from("envios")
        .select("nome, etapa, erro, atualizado_em")
        .eq("painel_slug", slug)
        .neq("etapa", "ignorado")
        .order("criado_em", { ascending: false })
        .limit(1),
      db
        .from("cortes")
        .select(
          "id, titulo, inicio_ms, fim_ms, legenda_sugerida, video_url, palestrante_id, erro, tentativas",
        )
        .eq("painel_slug", slug)
        .order("ordem"),
    ]);
  if (!painel.data) notFound();
  const p = painel.data;
  const todos = [...(falas.data ?? []), ...(fotos.data ?? [])];
  const situacao = situacaoDoPainel(
    p,
    todos.filter((x) => x.status === "rascunho").length,
    todos.length,
  );

  return (
    <div>
      <Link href="/admin" className="text-sm font-semibold text-navy/70">
        ← Painéis
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-muted uppercase">
          {p.horario} · {p.numero ? `Painel ${p.numero}` : "Abertura"}
        </span>
        <Status situacao={situacao} />
        <Link
          href={`/paineis/${slug}`}
          target="_blank"
          className="ml-auto text-sm font-semibold text-sky underline"
        >
          Ver página pública ↗
        </Link>
      </div>
      <h1 className="mt-1 text-2xl leading-tight font-extrabold">{p.titulo}</h1>

      <StatusIA envio={envios.data?.[0]} />
      {envios.data?.[0] &&
        ["pronto", "erro"].includes(envios.data[0].etapa) && (
          <Refazer slug={slug} />
        )}

      <Editor
        slug={slug}
        podeAprovar={membro?.papel === "aprovador"}
        publicado={situacao === "publicado"}
        resumo={p.resumo ?? ""}
        pontos={(p.pontos as string[]) ?? []}
        falas={(falas.data ?? []).map((f) => ({
          texto: f.texto,
          palestranteId: f.palestrante_id,
        }))}
        palestrantes={palestrantes.data ?? []}
      />

      <Cortes
        cortes={cortes.data ?? []}
        palestrantes={palestrantes.data ?? []}
      />

      <div className="mt-10 rounded-2xl border border-line bg-card p-4">
        <Fotos
          slug={slug}
          palestrantes={palestrantes.data ?? []}
          fotos={(fotos.data ?? []).map((f) => ({
            id: f.id,
            url: f.url,
            miniatura: f.miniatura_url,
            palestranteId: f.palestrante_id,
            publicada: f.status === "publicado",
          }))}
        />
      </div>
    </div>
  );
}

const etapas: Record<string, string> = {
  recebido:
    "📥 Áudio recebido do Drive. A transcrição começa em até 2 minutos.",
  transcrevendo:
    "🎧 Transcrevendo o áudio… (cerca de 1/4 da duração do painel)",
  escrevendo: "✍️ A IA está escrevendo o resumo, as falas e os cortes…",
  pronto: "✅ A IA terminou. Revise abaixo e aprove.",
  erro: "⚠️ Algo deu errado no processamento.",
  ignorado: "ℹ️ Arquivo guardado, mas não transcrito.",
};

function StatusIA({
  envio,
}: {
  envio?: { nome: string | null; etapa: string; erro: string | null };
}) {
  if (!envio) {
    return (
      <p className="mt-4 rounded-2xl border border-dashed border-line p-3 text-sm text-muted">
        🎙️ Quando o áudio do painel for colocado na pasta “Áudio e vídeo do
        painel” do Drive, a IA começa sozinha.
      </p>
    );
  }
  const cor =
    envio.etapa === "erro"
      ? "border-wine bg-red-50"
      : envio.etapa === "pronto"
        ? "border-green-600 bg-green-50"
        : "border-sky bg-card";
  return (
    <div className={`mt-4 rounded-2xl border-2 p-3 text-sm ${cor}`}>
      <p className="font-bold">{etapas[envio.etapa] ?? envio.etapa}</p>
      <p className="text-muted">Arquivo: {envio.nome}</p>
      {envio.erro && (
        <p className="mt-1 font-semibold text-wine">{envio.erro}</p>
      )}
    </div>
  );
}

function tempo(ms: number | null) {
  if (ms == null) return "";
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function Cortes({
  slug,
  cortes,
  palestrantes,
}: {
  slug: string;
  cortes: {
    id: string;
    titulo: string;
    inicio_ms: number | null;
    fim_ms: number | null;
    legenda_sugerida: string | null;
    video_url: string | null;
    palestrante_id: string | null;
    erro: string | null;
    tentativas: number;
  }[];
  palestrantes: { id: string; nome: string }[];
}) {
  if (!cortes.length) return null;
  const nome = new Map(palestrantes.map((p) => [p.id, p.nome]));
  return (
    <section className="mt-10">
      <h2 className="text-sm font-extrabold tracking-[0.15em] uppercase">
        Cortes de vídeo
      </h2>
      <p className="mt-1 mb-2 text-sm text-muted">
        Trechos escolhidos pela IA. Só aparecem no site os que já têm vídeo
        (gerado pelo robô ou colocado na pasta “Cortes de vídeo”).
      </p>
      <Refazer slug={slug} cortes />
      <ul className="space-y-3">
        {cortes.map((c) => (
          <li
            key={c.id}
            className="flex gap-3 rounded-xl border border-line bg-card p-3 text-sm"
          >
            {c.video_url && (
              <video
                src={c.video_url}
                controls
                playsInline
                preload="metadata"
                className="aspect-[9/16] w-32 shrink-0 rounded-lg bg-navy object-cover sm:w-40"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold">{c.titulo}</p>
              <p className="text-muted">
                {c.palestrante_id
                  ? nome.get(c.palestrante_id)
                  : "Palestrante não identificado"}
                {c.inicio_ms != null &&
                  ` · de ${tempo(c.inicio_ms)} a ${tempo(c.fim_ms)}`}
                {" · "}
                {c.video_url
                  ? "🎬 vídeo pronto"
                  : c.tentativas >= 3
                    ? "⚠️ o robô desistiu"
                    : "⏳ sem vídeo ainda"}
              </p>
              {c.erro && (
                <p className="mt-1 font-semibold text-wine">{c.erro}</p>
              )}
              {c.legenda_sugerida && (
                <p className="mt-2 rounded-lg bg-fog p-2">
                  💬 {c.legenda_sugerida}
                </p>
              )}
              {c.video_url && (
                <a
                  href={c.video_url}
                  download
                  className="mt-2 inline-block font-semibold text-sky underline"
                >
                  ⬇ Baixar vídeo
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
