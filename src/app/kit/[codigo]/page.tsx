import { notFound } from "next/navigation";
import { Copiar } from "@/components/Botoes";
import { Assinatura, FaixaLocal } from "@/components/Marca";
import { LinkContado, Rastrear } from "@/components/Rastrear";
import { buscarKit } from "@/lib/kit";

export const dynamic = "force-dynamic";

// Kit individual do palestrante: link secreto, só conteúdo aprovado.
export default async function Kit({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const kit = await buscarKit(codigo);
  if (!kit) notFound();
  const { palestrante: p, painel } = kit;
  const primeiroNome = p.nome.split(" ")[0];
  const vazio = !kit.falas.length && !kit.fotos.length && !kit.cortes.length;

  return (
    <main>
      <Rastrear tipo="visita_kit" alvo={p.slug} />
      <header className="ceu-mar px-4 pt-6 pb-8">
        <div className="mx-auto max-w-3xl">
          <Assinatura />
          <p className="mt-8 text-xs font-extrabold tracking-[0.2em] text-wine uppercase">Kit do palestrante</p>
          <h1 className="mt-2 text-3xl leading-tight font-extrabold text-navy">Olá, {primeiroNome}!</h1>
          <p className="mt-2 max-w-md font-medium text-navy/80">
            Obrigado por participar do painel <strong>{painel?.titulo}</strong>. Aqui está o seu material, pronto para
            baixar e postar.
          </p>
          <div className="h-16" />
        </div>
      </header>
      <FaixaLocal />

      <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
        {vazio && (
          <p className="rounded-2xl border border-dashed border-line bg-card p-5 text-center text-muted">
            Seu material fica pronto no mesmo dia do painel. Guarde este link: ele se atualiza sozinho.
          </p>
        )}

        {kit.falas.length > 0 && (
          <Secao titulo="Cards prontos para postar" subtitulo="Tamanho do feed do Instagram e do LinkedIn. Toque em baixar e poste.">
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
              {kit.falas.map((f, i) => {
                const src = `/kit/${codigo}/card?fala=${f.id}`;
                return (
                  <figure key={f.id} className="w-64 shrink-0 snap-start">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Card com a frase: ${f.texto}`} className="aspect-[4/5] w-full rounded-2xl shadow-md" />
                    <LinkContado
                      tipo="baixou_card"
                      alvo={p.slug}
                      href={src}
                      download={`card-congresso-oab-${i + 1}.png`}
                      className="mt-2 block rounded-full bg-sky py-2 text-center text-sm font-extrabold text-navy uppercase"
                    >
                      ⬇ Baixar card
                    </LinkContado>
                  </figure>
                );
              })}
            </div>
          </Secao>
        )}

        {p.legenda_kit && kit.falas.length > 0 && (
          <Secao titulo="Legenda sugerida" subtitulo="Copie, ajuste do seu jeito e cole no seu post.">
            <div className="rounded-2xl border border-line bg-card p-4">
              <p className="leading-relaxed">{p.legenda_kit}</p>
              <div className="mt-3">
                <Copiar texto={p.legenda_kit} rotulo="Copiar legenda" />
              </div>
            </div>
          </Secao>
        )}

        {kit.falas.length > 0 && (
          <Secao titulo="Suas melhores falas">
            <ul className="space-y-3">
              {kit.falas.map((f) => (
                <li key={f.id} className="rounded-2xl border border-line bg-card p-4">
                  <p className="text-lg leading-snug font-semibold">“{f.texto}”</p>
                  <div className="mt-3">
                    <Copiar texto={`“${f.texto}”`} rotulo="Copiar frase" />
                  </div>
                </li>
              ))}
            </ul>
          </Secao>
        )}

        {kit.cortes.length > 0 && (
          <Secao titulo="Seus vídeos" subtitulo="Cortes verticais com legenda, prontos para Reels e Stories.">
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
              {kit.cortes.map((c) => (
                <figure key={c.id} className="w-64 shrink-0 snap-start overflow-hidden rounded-2xl bg-card shadow-sm">
                  <video src={c.video_url!} controls playsInline preload="none" className="aspect-[9/16] w-full bg-navy object-cover" />
                  <figcaption className="p-3">
                    <p className="leading-tight font-bold">{c.titulo}</p>
                    <LinkContado tipo="baixou_video" alvo={p.slug} href={c.video_url!} download className="mt-3 block rounded-full bg-sky py-2 text-center text-sm font-extrabold text-navy uppercase">
                      ⬇ Baixar vídeo
                    </LinkContado>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Secao>
        )}

        {kit.fotos.length > 0 && (
          <Secao titulo="Suas fotos" subtitulo="Toque numa foto para abrir em alta resolução e salvar.">
            <div className="grid grid-cols-3 gap-2">
              {kit.fotos.map((f) => (
                <LinkContado key={f.id} tipo="baixou_foto" alvo={p.slug} href={f.url} target="_blank" rel="noreferrer" download>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.miniatura_url ?? f.url} alt="" loading="lazy" className="aspect-[4/5] w-full rounded-xl object-cover" />
                </LinkContado>
              ))}
            </div>
          </Secao>
        )}

        <p className="rounded-2xl bg-card p-4 text-center text-sm text-muted">
          Ao postar, marque <strong className="text-navy">@oabsc</strong> e use{" "}
          <strong className="text-navy">#XIVCongressoOAB</strong>.
          <br />
          Fotos e vídeos: Mzen Films.
        </p>
      </div>
    </main>
  );
}

function Secao({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-extrabold tracking-[0.15em] text-navy uppercase">{titulo}</h2>
      {subtitulo && <p className="mt-1 text-sm text-muted">{subtitulo}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}
