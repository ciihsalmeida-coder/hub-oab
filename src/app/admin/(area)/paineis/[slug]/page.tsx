import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirEquipe } from "@/lib/equipe";
import { situacaoDoPainel, Status } from "../../Status";
import { Editor } from "./Editor";
import { Fotos } from "./Fotos";

export const dynamic = "force-dynamic";

export default async function EditarPainel({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db, membro } = await exigirEquipe();
  const [painel, palestrantes, falas, fotos] = await Promise.all([
    db.from("paineis").select("slug, numero, titulo, horario, resumo, pontos, status_texto, aprovado_em").eq("slug", slug).maybeSingle(),
    db.from("palestrantes").select("id, nome").eq("painel_slug", slug).order("ordem"),
    db.from("falas").select("texto, palestrante_id").eq("painel_slug", slug).order("ordem"),
    db.from("fotos").select("id, url, miniatura_url, palestrante_id, status").eq("painel_slug", slug).order("ordem"),
  ]);
  if (!painel.data) notFound();
  const p = painel.data;
  const situacao = situacaoDoPainel(p, falas.data?.length ?? 0);

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
        <Link href={`/paineis/${slug}`} target="_blank" className="ml-auto text-sm font-semibold text-sky underline">
          Ver página pública ↗
        </Link>
      </div>
      <h1 className="mt-1 text-2xl leading-tight font-extrabold">{p.titulo}</h1>

      <Editor
        slug={slug}
        podeAprovar={membro?.papel === "aprovador"}
        publicado={situacao === "publicado"}
        resumo={p.resumo ?? ""}
        pontos={(p.pontos as string[]) ?? []}
        falas={(falas.data ?? []).map((f) => ({ texto: f.texto, palestranteId: f.palestrante_id }))}
        palestrantes={palestrantes.data ?? []}
      />

      <details className="mt-10 rounded-2xl border border-line bg-card p-4">
        <summary className="cursor-pointer font-bold">Plano B: enviar fotos direto do computador</summary>
        <p className="mt-1 text-sm text-muted">Use só se o Google Drive não estiver funcionando.</p>
        <div className="mt-4">
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
      </details>
    </div>
  );
}
