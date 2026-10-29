import { exigirEquipe } from "@/lib/equipe";
import { Linha } from "./Linha";

export const dynamic = "force-dynamic";

export default async function Palestrantes() {
  const { db } = await exigirEquipe();
  const [paineis, palestrantes, kits, falas, fotos] = await Promise.all([
    db.from("paineis").select("slug, numero, titulo").order("ordem"),
    db.from("palestrantes").select("id, slug, painel_slug, nome, cargo, foto_url, whatsapp, pendente").order("ordem"),
    db.from("kits").select("palestrante_id, token, enviado_em"),
    db.from("falas").select("palestrante_id").eq("status", "publicado"),
    db.from("fotos").select("palestrante_id").eq("status", "publicado"),
  ]);
  const kitDe = new Map((kits.data ?? []).map((k) => [k.palestrante_id, k]));
  const conta = (lista: { palestrante_id: string | null }[] | null, id: string) => (lista ?? []).filter((x) => x.palestrante_id === id).length;

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Palestrantes e kits</h1>
      <p className="mt-1 text-sm text-muted">
        Cada palestrante tem um link secreto com o próprio material. O kit mostra só o que já foi aprovado. Corrija nome e
        cargo aqui quando o carômetro mudar.
      </p>
      {(paineis.data ?? []).map((painel) => (
        <section key={painel.slug} className="mt-6">
          <h2 className="text-xs font-extrabold tracking-[0.2em] text-wine uppercase">
            {painel.numero ? `Painel ${painel.numero}` : "Abertura"} · {painel.titulo}
          </h2>
          <ul className="mt-2 space-y-2">
            {(palestrantes.data ?? [])
              .filter((p) => p.painel_slug === painel.slug)
              .map((p) => {
                const kit = kitDe.get(p.id);
                return (
                  <Linha
                    key={p.id}
                    p={p}
                    codigo={`${p.slug}-${kit?.token}`}
                    enviadoEm={kit?.enviado_em ?? null}
                    falas={conta(falas.data, p.id)}
                    fotos={conta(fotos.data, p.id)}
                  />
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
