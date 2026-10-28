import { Assinatura, FaixaLocal } from "@/components/Marca";
import { Copiar } from "../Botoes";
import { cortes, falas, legendaPalestrante, painelExemplo, VIDEO_EXEMPLO } from "../dados";
import { FaixaDemo, FotoFicticia, Secao } from "../Demo";

// Kit do palestrante: link individual com o material pronto para postar.
const nome = "Helena Exemplo";

export default function ExemploPalestrante() {
  const minhasFalas = falas.map((f, i) => ({ ...f, i })).filter((f) => f.quem === nome);
  const meusCortes = cortes.filter((c) => c.quem === nome);

  return (
    <main>
      <FaixaDemo atual="palestrante" />
      <header className="ceu-mar px-4 pt-6 pb-8">
        <div className="mx-auto max-w-3xl">
          <Assinatura />
          <p className="mt-8 text-xs font-extrabold tracking-[0.2em] text-wine uppercase">Kit do palestrante</p>
          <h1 className="mt-2 text-3xl leading-tight font-extrabold text-navy">Olá, Helena!</h1>
          <p className="mt-2 max-w-md font-medium text-navy/80">
            Obrigado por participar do <strong>{painelExemplo.titulo}</strong>. Separamos o seu material, pronto para
            baixar e postar.
          </p>
          <ul className="mt-20 grid grid-cols-4 gap-2 text-center text-xs font-bold text-white">
            {[
              ["🖼️", "Cards"],
              ["💬", "Falas"],
              ["🎬", "Vídeos"],
              ["📸", "Fotos"],
            ].map(([e, t]) => (
              <li key={t} className="rounded-xl bg-white/15 py-2 backdrop-blur">
                <span className="block text-xl">{e}</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </header>
      <FaixaLocal />

      <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
        <Secao titulo="Cards prontos para postar" subtitulo="Tamanho do feed do Instagram e do LinkedIn. Toque em baixar e poste.">
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {minhasFalas.map((f) => (
              <figure key={f.i} className="w-64 shrink-0 snap-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/exemplo/card?i=${f.i}`}
                  alt={`Card com a frase: ${f.texto}`}
                  className="aspect-[4/5] w-full rounded-2xl shadow-md"
                />
                <a
                  href={`/exemplo/card?i=${f.i}`}
                  download={`card-congresso-oab-${f.i + 1}.png`}
                  className="mt-2 block rounded-full bg-sky py-2 text-center text-sm font-extrabold text-navy uppercase"
                >
                  ⬇ Baixar card
                </a>
              </figure>
            ))}
          </div>
        </Secao>

        <Secao titulo="Legenda sugerida" subtitulo="Copie, ajuste do seu jeito e cole no seu post.">
          <div className="rounded-2xl border border-line bg-card p-4">
            <p className="leading-relaxed">{legendaPalestrante}</p>
            <div className="mt-3">
              <Copiar texto={legendaPalestrante} rotulo="Copiar legenda" />
            </div>
          </div>
        </Secao>

        <Secao titulo="Suas melhores falas">
          <ul className="space-y-3">
            {minhasFalas.map((f) => (
              <li key={f.i} className="rounded-2xl border border-line bg-card p-4">
                <p className="text-lg leading-snug font-semibold">“{f.texto}”</p>
                <div className="mt-3">
                  <Copiar texto={`“${f.texto}”`} rotulo="Copiar frase" />
                </div>
              </li>
            ))}
          </ul>
        </Secao>

        <Secao titulo="Seus vídeos" subtitulo="Cortes verticais com legenda, prontos para Reels e Stories.">
          {meusCortes.map((c) => (
            <figure key={c.titulo} className="w-64 overflow-hidden rounded-2xl bg-card shadow-sm">
              <video src={VIDEO_EXEMPLO} controls playsInline preload="metadata" className="aspect-[9/16] w-full bg-navy object-cover" />
              <figcaption className="p-3">
                <p className="leading-tight font-bold">{c.titulo}</p>
                <p className="text-sm text-muted">{c.duracao}</p>
                <a
                  href={VIDEO_EXEMPLO}
                  download
                  className="mt-3 block rounded-full bg-sky py-2 text-center text-sm font-extrabold text-navy uppercase"
                >
                  ⬇ Baixar vídeo
                </a>
              </figcaption>
            </figure>
          ))}
        </Secao>

        <Secao titulo="Suas fotos" subtitulo="Fotos suas no palco, em alta resolução.">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <FotoFicticia key={i} i={i} />
            ))}
          </div>
          <a href="#" className="mt-4 block rounded-full bg-navy py-3 text-center font-extrabold text-white uppercase">
            ⬇ Baixar todas as fotos
          </a>
        </Secao>

        <p className="rounded-2xl bg-card p-4 text-center text-sm text-muted">
          Ao postar, marque <strong className="text-navy">@oabsc</strong> e use <strong className="text-navy">#XIVCongressoOAB</strong>.
          <br />
          Fotos e vídeos: Mzen Films.
        </p>
      </div>
    </main>
  );
}
