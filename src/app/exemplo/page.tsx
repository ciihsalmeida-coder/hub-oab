import { GaleriaBotao } from "@/components/GaleriaBotao";
import { Assinatura, FaixaLocal, Voltar } from "@/components/Marca";
import { Avatar } from "@/components/Palestrante";
import { Compartilhar } from "./Botoes";
import { cortes, falas, painelExemplo, palestrantesExemplo, pontosPrincipais, resumo, VIDEO_EXEMPLO } from "./dados";
import { FaixaDemo, FotoFicticia, Secao } from "./Demo";

// Versão do público: para quem assistiu ao painel.
export default function ExemploPublico() {
  return (
    <main>
      <FaixaDemo atual="publico" />
      <header className="ceu-mar px-4 pt-6 pb-8">
        <div className="mx-auto max-w-3xl">
          <Voltar />
          <div className="mt-5">
            <Assinatura />
          </div>
          <p className="mt-6 text-xs font-extrabold tracking-[0.2em] text-wine uppercase">{painelExemplo.rotulo}</p>
          <h1 className="mt-2 text-2xl leading-tight font-extrabold text-navy sm:text-3xl">{painelExemplo.titulo}</h1>
          <div className="mt-24">
            <GaleriaBotao url="#" />
          </div>
        </div>
      </header>
      <FaixaLocal />

      <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
        <Secao titulo="O painel em 1 minuto">
          <ol className="space-y-3">
            {pontosPrincipais.map((p, i) => (
              <li key={i} className="flex gap-3 rounded-2xl border border-line bg-card p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky font-extrabold text-navy">
                  {i + 1}
                </span>
                <p className="leading-snug font-medium">{p}</p>
              </li>
            ))}
          </ol>
          <details className="mt-3 rounded-2xl border border-line bg-card p-4">
            <summary className="cursor-pointer font-bold">Ler o resumo completo</summary>
            <div className="mt-3 space-y-3 leading-relaxed text-navy/90">
              {resumo.map((p) => (
                <p key={p.slice(0, 20)}>{p}</p>
              ))}
            </div>
          </details>
        </Secao>

        <Secao titulo="Melhores momentos em vídeo">
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {cortes.map((c) => (
              <figure key={c.titulo} className="w-64 shrink-0 snap-start overflow-hidden rounded-2xl bg-card shadow-sm">
                <video src={VIDEO_EXEMPLO} controls playsInline preload="metadata" className="aspect-[9/16] w-full bg-navy object-cover" />
                <figcaption className="p-3">
                  <p className="leading-tight font-bold">{c.titulo}</p>
                  <p className="text-sm text-muted">
                    {c.quem} · {c.duracao}
                  </p>
                  <div className="mt-3">
                    <Compartilhar titulo={c.titulo} />
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </Secao>

        <Secao titulo="Frases em destaque">
          <ul className="space-y-4">
            {falas.slice(0, 3).map((f) => (
              <li key={f.texto}>
                <blockquote className="rounded-2xl bg-navy p-5 text-white">
                  <p className="text-lg leading-snug font-semibold">“{f.texto}”</p>
                  <footer className="mt-2 text-sm text-sky">
                    {f.quem} · {f.cargo}
                  </footer>
                </blockquote>
              </li>
            ))}
          </ul>
        </Secao>

        <Secao titulo="Fotos do painel" subtitulo="Toque numa foto para ampliar e baixar. Para achar as fotos em que você aparece, use a busca por selfie.">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <FotoFicticia key={i} i={i} />
            ))}
          </div>
          <div className="mt-4">
            <GaleriaBotao url="#" />
          </div>
        </Secao>

        <Secao titulo="Palestrantes">
          <ul className="grid gap-3 sm:grid-cols-2">
            {palestrantesExemplo.map((p) => (
              <li key={p.nome} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
                <Avatar nome={p.nome} />
                <div>
                  <p className="leading-tight font-bold">{p.nome}</p>
                  <p className="text-sm text-muted">{p.cargo}</p>
                </div>
              </li>
            ))}
          </ul>
        </Secao>
      </div>
    </main>
  );
}
