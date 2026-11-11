import { notFound } from "next/navigation";
import { Compartilhar, Copiar, Salvar } from "@/components/Botoes";
import { CardsKit } from "./Cards";
import { GaleriaFotos } from "@/components/GaleriaFotos";
import { Assinatura, FaixaLocal, MzenTopo, SeloMzen } from "@/components/Marca";
import { Rastrear, VideoContado } from "@/components/Rastrear";
import { buscarKit } from "@/lib/kit";
import { comMarcacoes } from "@/lib/marcacoes";
import { MarqueComissoes } from "@/components/MarqueComissoes";

export const dynamic = "force-dynamic";

// Kit individual do palestrante: link secreto, só conteúdo aprovado.
export default async function Kit({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const kit = await buscarKit(codigo);
  if (!kit) notFound();
  const { palestrante: p, painel } = kit;
  const primeiroNome = p.nome.split(" ")[0];
  const vazio = !kit.falas.length && !kit.fotos.length && !kit.cortes.length; // os cards sem frase aparecem sempre

  return (
    <main>
      <Rastrear tipo="visita_kit" alvo={p.slug} />
      <header className="ceu-mar px-4 pt-6 pb-8">
        <div className="relative mx-auto max-w-3xl">
          <MzenTopo />
          <Assinatura />
          <p className="mt-8 text-xs font-extrabold tracking-[0.2em] text-wine uppercase">
            Kit do palestrante
          </p>
          <h1 className="mt-2 text-3xl leading-tight font-extrabold text-navy">
            Olá, {primeiroNome}!
          </h1>
          <p className="mt-2 max-w-md font-medium text-navy/80">
            Obrigado por participar do painel <strong>{painel?.titulo}</strong>.
            Aqui está o seu material, pronto para baixar e postar.
          </p>
          <div className="h-16" />
        </div>
      </header>
      <FaixaLocal />

      <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
        {vazio && (
          <p className="rounded-2xl border border-dashed border-line bg-card p-5 text-center text-muted">
            Seu material fica pronto no mesmo dia do painel. Guarde este link:
            ele se atualiza sozinho.
          </p>
        )}

        <Secao
          titulo="Cards prontos para postar"
          subtitulo="Escolha Feed (Instagram e LinkedIn) ou Story, toque em salvar e poste."
        >
          <CardsKit
            alvo={p.slug}
            cards={[
              ...kit.falas.map((f, i) => ({
                chave: f.id,
                src: `/kit/${codigo}/card?fala=${f.id}`,
                alt: `Card com a frase: ${f.texto}`,
                rotulo: `frase-${i + 1}`,
              })),
              {
                chave: "participacao",
                src: `/kit/${codigo}/card?modelo=participacao`,
                alt: "Card de palestrante do painel, sem frase",
                rotulo: "palestrante",
              },
              // Com fotos do evento, os cards acima usam a foto de fundo; esta é a versão no azul do cartaz.
              ...(kit.fotos.length
                ? [
                    {
                      chave: "participacao-azul",
                      src: `/kit/${codigo}/card?modelo=participacao&fundo=azul`,
                      alt: "Card de palestrante no fundo azul do congresso",
                      rotulo: "palestrante-azul",
                    },
                  ]
                : []),
              {
                chave: "fundo",
                src: `/kit/${codigo}/card?modelo=fundo`,
                alt: "Moldura do congresso com o meio livre para escrever",
                rotulo: "moldura",
              },
            ]}
          />
        </Secao>

        {p.legenda_kit && kit.falas.length > 0 && (
          <Secao
            titulo="Legenda sugerida"
            subtitulo="Copie, ajuste do seu jeito e cole no seu post."
          >
            <div className="rounded-2xl border border-line bg-card p-4">
              <p className="leading-relaxed whitespace-pre-line">{comMarcacoes(p.legenda_kit)}</p>
              <div className="mt-3">
                <Copiar texto={comMarcacoes(p.legenda_kit)} rotulo="Copiar legenda" />
              </div>
            </div>
          </Secao>
        )}

        <MarqueComissoes texto="Ao postar seus cards, vídeos e fotos, marque as comissões organizadoras:" />

        {kit.falas.length > 0 && (
          <Secao titulo="Suas melhores falas">
            <ul className="space-y-3">
              {kit.falas.map((f) => (
                <li
                  key={f.id}
                  className="rounded-2xl border border-line bg-card p-4"
                >
                  <p className="text-lg leading-snug font-semibold">
                    “{f.texto}”
                  </p>
                  <div className="mt-3">
                    <Copiar texto={`“${f.texto}”`} rotulo="Copiar frase" />
                  </div>
                </li>
              ))}
            </ul>
          </Secao>
        )}

        {kit.cortes.length > 0 && (
          <Secao
            titulo="Seus vídeos"
            subtitulo="Cortes verticais com legenda, prontos para Reels e Stories."
          >
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
              {kit.cortes.map((c) => (
                <figure
                  key={c.id}
                  className="w-64 shrink-0 snap-start overflow-hidden rounded-2xl bg-card shadow-sm"
                >
                  <VideoContado
                    alvo={p.slug}
                    src={c.video_web_url ?? c.video_url!}
                    poster={c.capa_url ?? undefined}
                    controls
                    playsInline
                    preload="none"
                    className="aspect-[9/16] w-full bg-navy object-cover"
                  />
                  <figcaption className="p-3">
                    <p className="leading-tight font-bold">{c.titulo}</p>
                    <Salvar
                      url={c.video_url}
                      titulo={c.titulo}
                      tipo="video"
                      evento="baixou_video"
                      alvo={p.slug}
                      className="mt-3"
                    />
                    <div className="mt-2">
                      <Compartilhar
                        titulo={c.titulo}
                        alvo={p.slug}
                        video={c.video_url}
                      />
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Secao>
        )}

        {kit.fotos.length > 0 && (
          <Secao
            titulo="Suas fotos"
            subtitulo="Toque numa foto para ver em tela cheia, passar para as próximas e baixar."
          >
            <GaleriaFotos
              fotos={kit.fotos.map((f) => ({
                id: f.id,
                url: f.url,
                miniatura: f.miniatura_url,
              }))}
              alvo={p.slug}
              nomeArquivo={`congresso-oab-${p.slug}`}
            />
          </Secao>
        )}

        <p className="rounded-2xl bg-card p-4 text-center text-sm text-muted">
          Ao postar, marque <strong className="text-navy">@oabsc</strong> e use{" "}
          <strong className="text-navy">#XIVCongressoOAB</strong>.
        </p>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-navy p-5 text-center">
          <SeloMzen texto="Kit produzido por" />
          <p className="text-xs text-white/60">
            Cobertura, cortes e tecnologia do XIV Congresso
          </p>
        </div>
      </div>
    </main>
  );
}

function Secao({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-extrabold tracking-[0.15em] text-navy uppercase">
        {titulo}
      </h2>
      {subtitulo && <p className="mt-1 text-sm text-muted">{subtitulo}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}
