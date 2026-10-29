import Link from "next/link";
import { dias } from "@/data/programacao";
import { driveConfigurado } from "@/lib/drive";
import { exigirEquipe } from "@/lib/equipe";
import { Drive } from "./Drive";
import { situacaoDoPainel, Status } from "./Status";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const { db } = await exigirEquipe();
  const [paineis, falas, cortes, fotos, cadastros] = await Promise.all([
    db.from("paineis").select("slug, numero, titulo, data, horario, resumo, pontos, status_texto").order("ordem"),
    db.from("falas").select("painel_slug"),
    db.from("cortes").select("painel_slug, status"),
    db.from("fotos").select("painel_slug, status"),
    db.from("cadastros").select("id", { count: "exact", head: true }),
  ]);
  const [pastas, erros] = await Promise.all([
    db.from("pastas_drive").select("drive_id", { count: "exact", head: true }),
    db.from("drive_erros").select("nome, erro").gte("tentativas", 1),
  ]);
  const conta = (lista: { painel_slug: string; status?: string }[] | null, slug: string, status?: string) =>
    (lista ?? []).filter((x) => x.painel_slug === slug && (!status || x.status === status)).length;

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Painéis</h1>
      <p className="mt-1 text-sm text-muted">
        Toque num painel para revisar o que a IA preparou. {cadastros.count ?? 0} pessoa(s) cadastrada(s).
      </p>

      <Drive configurado={driveConfigurado()} pastasCriadas={(pastas.count ?? 0) > 0} erros={erros.data ?? []} />

      {dias.map((dia) => (
        <section key={dia.data} className="mt-6">
          <h2 className="text-xs font-extrabold tracking-[0.2em] text-wine uppercase">{dia.rotulo}</h2>
          <ul className="mt-2 space-y-2">
            {(paineis.data ?? [])
              .filter((p) => p.data === dia.data)
              .map((p) => {
                const nFalas = conta(falas.data, p.slug);
                return (
                  <li key={p.slug}>
                    <Link href={`/admin/paineis/${p.slug}`} className="block rounded-2xl border border-line bg-card p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-muted uppercase">
                          {p.horario} · {p.numero ? `Painel ${p.numero}` : "Abertura"}
                        </span>
                        <Status situacao={situacaoDoPainel(p, nFalas)} />
                      </div>
                      <p className="mt-1 leading-snug font-bold">{p.titulo}</p>
                      <p className="mt-1 text-xs text-muted">
                        {nFalas} fala(s) · {conta(cortes.data, p.slug)} corte(s), {conta(cortes.data, p.slug, "rascunho")} em
                        rascunho · {conta(fotos.data, p.slug)} foto(s)
                      </p>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
