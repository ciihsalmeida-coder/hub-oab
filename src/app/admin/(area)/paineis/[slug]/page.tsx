import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirEquipe } from "@/lib/equipe";
import { situacaoDoPainel, Status } from "../../Status";
import { Editor } from "./Editor";

export const dynamic = "force-dynamic";

export default async function EditarPainel({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db, membro } = await exigirEquipe();
  const [painel, palestrantes, falas] = await Promise.all([
    db.from("paineis").select("slug, numero, titulo, horario, resumo, pontos, status_texto, aprovado_em").eq("slug", slug).maybeSingle(),
    db.from("palestrantes").select("id, nome").eq("painel_slug", slug).order("ordem"),
    db.from("falas").select("texto, palestrante_id").eq("painel_slug", slug).order("ordem"),
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
    </div>
  );
}
