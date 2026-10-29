import { notFound } from "next/navigation";
import { Compartilhar } from "@/components/Botoes";
import { Cadastro } from "@/components/Cadastro";
import { GaleriaBotao } from "@/components/GaleriaBotao";
import { Assinatura, FaixaLocal, Voltar } from "@/components/Marca";
import { Palestrante } from "@/components/Palestrante";
import { LinkContado, Rastrear } from "@/components/Rastrear";
import { congresso, dias, paineis } from "@/data/programacao";
import { buscarConteudo } from "@/lib/dados";

export const revalidate = 60;

export function generateStaticParams() {
  return paineis.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const painel = paineis.find((p) => p.slug === slug);
  return { title: painel ? `${painel.titulo} · XIV Congresso OAB` : "Painel" };
}

export default async function PainelPage({ params }: { params: Promise<{ slug: string }> }) {
  const painel = await buscarConteudo((await params).slug);
  if (!painel) notFound();
  const dia = dias.find((d) => d.data === painel.data)?.rotulo;
  const nomePor = new Map(painel.palestrantes.map((p) => [p.id, p]));
  const galeria = painel.galeriaUrl || congresso.galeriaUrl;

  return (
    <main>
      <Rastrear tipo="visita_painel" alvo={painel.slug} />
      <header className="ceu-mar px-4 pt-6 pb-8">
        <div className="mx-auto max-w-3xl">
          <Voltar />
          <div className="mt-5">
            <Assinatura />
          </div>
          <p className="mt-6 text-xs font-extrabold tracking-[0.2em] text-wine uppercase">
            {painel.numero ? `Painel ${painel.numero} · ` : ""}
            {painel.area} · {dia} · {painel.horario}
          </p>
          <h1 className="mt-2 text-2xl leading-tight font-extrabold text-navy sm:text-3xl">{painel.titulo}</h1>
          <div className="mt-24">
            <GaleriaBotao url={galeria} />
          </div>
        </div>
      </header>
      <FaixaLocal />

      <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
        <Secao titulo="O painel em 1 minuto">
          {painel.pontos.length || painel.resumo ? (
            <>
              <ol className="space-y-3">
                {painel.pontos.map((p, i) => (
                  <li key={i} className="flex gap-3 rounded-2xl border border-line bg-card p-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky font-extrabold text-navy">
                      {i + 1}
                    </span>
                    <p className="leading-snug font-medium">{p}</p>
                  </li>
                ))}
              </ol>
              {painel.resumo && (
                <details className="mt-3 rounded-2xl border border-line bg-card p-4">
                  <summary className="cursor-pointer font-bold">Ler o resumo completo</summary>
                  <div className="mt-3 space-y-3 leading-relaxed whitespace-pre-line text-navy/90">{painel.resumo}</div>
                </details>
              )}
            </>
          ) : (
            <EmBreve>O resumo com as principais ideias aparece aqui no mesmo dia do painel.</EmBreve>
          )}
        </Secao>

        <Secao titulo="Melhores momentos em vídeo">
          {painel.cortes.length ? (
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
              {painel.cortes.map((c) => (
                <figure key={c.id} className="w-64 shrink-0 snap-start overflow-hidden rounded-2xl bg-card shadow-sm">
                  {c.videoUrl && (
                    <video
                      src={c.videoUrl}
                      poster={c.capaUrl ?? undefined}
                      controls
                      playsInline
                      preload="none"
                      className="aspect-[9/16] w-full bg-navy object-cover"
                    />
                  )}
                  <figcaption className="p-3">
                    <p className="leading-tight font-bold">{c.titulo}</p>
                    {c.palestranteId && <p className="text-sm text-muted">{nomePor.get(c.palestranteId)?.nome}</p>}
                    <div className="mt-3">
                      <Compartilhar titulo={c.titulo} alvo={painel.slug} />
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <EmBreve>Os melhores momentos em vídeo aparecem aqui no mesmo dia do painel.</EmBreve>
          )}
        </Secao>

        {painel.falas.length > 0 && (
          <Secao titulo="Frases em destaque">
            <ul className="space-y-4">
              {painel.falas.map((f) => {
                const quem = f.palestranteId ? nomePor.get(f.palestranteId) : undefined;
                return (
                  <li key={f.id}>
                    <blockquote className="rounded-2xl bg-navy p-5 text-white">
                      <p className="text-lg leading-snug font-semibold">“{f.texto}”</p>
                      {quem && <footer className="mt-2 text-sm text-sky">{quem.nome}</footer>}
                    </blockquote>
                  </li>
                );
              })}
            </ul>
          </Secao>
        )}

        <Secao titulo="Fotos do painel">
          {painel.fotos.length ? (
            <div className="grid grid-cols-3 gap-2">
              {painel.fotos.map((f) => (
                <LinkContado key={f.id} tipo="baixou_foto" alvo={painel.slug} href={f.url} target="_blank" rel="noreferrer" download>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.miniatura ?? f.url} alt="" loading="lazy" className="aspect-[4/5] w-full rounded-xl object-cover" />
                </LinkContado>
              ))}
            </div>
          ) : (
            <EmBreve>A seleção de fotos aparece aqui até 2 horas depois do painel.</EmBreve>
          )}
        </Secao>

        <Secao titulo="Palestrantes">
          <ul className="grid gap-3 sm:grid-cols-2">
            {painel.palestrantes.map((p) => (
              <Palestrante key={p.nome} p={p} />
            ))}
          </ul>
        </Secao>

        <Cadastro painel={painel.slug} />
      </div>
    </main>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-extrabold tracking-[0.15em] text-navy uppercase">{titulo}</h2>
      {children}
    </section>
  );
}

function EmBreve({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line bg-card/60 p-4 text-sm text-muted">{children}</p>;
}
