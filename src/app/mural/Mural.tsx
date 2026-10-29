"use client";

import { useEffect, useMemo, useState } from "react";
import { registrar } from "@/lib/metricas";

type Fala = { id: string; texto: string; nome: string | null; cargo: string | null; foto: string | null };
type Dados = {
  agora: { titulo: string; numero: number | null; estado: "agora" | "proximo" } | null;
  falas: Fala[];
  fotos: { id: string; url: string }[];
  cortes: { id: string; titulo: string; video_url: string; nome: string | null }[];
};
type Slide = { tipo: "fala"; fala: Fala } | { tipo: "foto"; url: string } | { tipo: "corte"; url: string; titulo: string; nome: string | null };

const DURACAO_MS = 10_000;

function montar(d: Dados): Slide[] {
  const falas = d.falas.map((fala) => ({ tipo: "fala" as const, fala }));
  const fotos = d.fotos.map((f) => ({ tipo: "foto" as const, url: f.url }));
  const cortes = d.cortes.map((c) => ({ tipo: "corte" as const, url: c.video_url, titulo: c.titulo, nome: c.nome }));
  // Intercala: fala, foto, fala, foto… e um corte a cada 4 slides.
  const lista: Slide[] = [];
  const total = Math.max(falas.length, fotos.length);
  for (let i = 0; i < total; i++) {
    if (falas[i]) lista.push(falas[i]);
    if (fotos[i]) lista.push(fotos[i]);
    if (i % 2 === 1 && cortes.length) lista.push(cortes[(i >> 1) % cortes.length]);
  }
  return lista.length ? lista : cortes;
}

export function Mural({ qr, site }: { qr: string; site: string }) {
  const [dados, setDados] = useState<Dados | null>(null);
  const [i, setI] = useState(0);
  const slides = useMemo(() => (dados ? montar(dados) : []), [dados]);
  const atual = slides.length ? slides[i % slides.length] : null;

  useEffect(() => {
    const carregar = () =>
      fetch("/api/mural")
        .then((r) => r.json())
        .then(setDados)
        .catch(() => {});
    carregar();
    registrar("abriu_mural");
    const t = setInterval(carregar, 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!atual || atual.tipo === "corte") return; // o vídeo avança sozinho quando termina
    const t = setTimeout(() => setI((x) => x + 1), DURACAO_MS);
    return () => clearTimeout(t);
  }, [atual, i]);

  return (
    <main className="tema-app fixed inset-0 flex overflow-hidden text-white">
      <section className="relative flex flex-1 items-center justify-center p-[3vw]">
        {!atual && (
          <div className="text-center">
            <p className="text-[3vw] font-extrabold">XIV Congresso Nacional de Direito Marítimo, Portuário e Aduaneiro</p>
            <p className="mt-4 text-[1.6vw] text-white/70">Os melhores momentos aparecem aqui ao longo do dia.</p>
          </div>
        )}
        {atual?.tipo === "fala" && (
          <figure key={i} className="animate-[aparecer_0.8s_ease] max-w-[60vw]">
            <p className="text-[9vw] leading-[0.6] font-extrabold text-sky">“</p>
            <blockquote className="text-[3.2vw] leading-tight font-extrabold">{atual.fala.texto}</blockquote>
            {atual.fala.nome && (
              <figcaption className="mt-[2.5vw] flex items-center gap-[1.2vw]">
                {atual.fala.foto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={atual.fala.foto} alt="" className="h-[6vw] w-[6vw] rounded-[1.4vw] object-cover" />
                )}
                <span>
                  <span className="block text-[1.8vw] font-extrabold">{atual.fala.nome}</span>
                  <span className="block text-[1.2vw] text-white/70">{atual.fala.cargo}</span>
                </span>
              </figcaption>
            )}
          </figure>
        )}
        {atual?.tipo === "foto" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={atual.url} alt="" className="animate-[aparecer_0.8s_ease] max-h-full max-w-full rounded-[2vw] object-contain shadow-2xl" />
        )}
        {atual?.tipo === "corte" && (
          <video
            key={i}
            src={atual.url}
            autoPlay
            muted
            playsInline
            onEnded={() => setI((x) => x + 1)}
            onError={() => setI((x) => x + 1)}
            className="h-full max-h-full rounded-[2vw] shadow-2xl"
          />
        )}
      </section>

      <aside className="flex w-[24vw] flex-col justify-between border-l border-white/10 bg-[#081726]/60 p-[2vw] backdrop-blur-xl">
        <div>
          <p className="text-[1vw] font-extrabold tracking-[0.2em] text-sky uppercase">XIV Congresso OAB</p>
          <p className="mt-[0.5vw] text-[1.5vw] leading-tight font-light">
            Direito Marítimo, Portuário e <strong className="font-extrabold">Aduaneiro</strong>
          </p>
        </div>
        {dados?.agora && (
          <div className="rounded-[1.5vw] bg-white/10 p-[1.3vw]">
            <p className="flex items-center gap-[0.5vw] text-[0.9vw] font-extrabold tracking-widest text-sky uppercase">
              {dados.agora.estado === "agora" && <span className="h-[0.7vw] w-[0.7vw] animate-pulse rounded-full bg-red-500" />}
              {dados.agora.estado === "agora" ? "Agora no palco" : "A seguir"}
            </p>
            <p className="mt-[0.5vw] text-[1.3vw] leading-snug font-bold">
              {dados.agora.numero ? `Painel ${dados.agora.numero} · ` : ""}
              {dados.agora.titulo}
            </p>
          </div>
        )}
        <div className="text-center">
          <div className="mx-auto w-[15vw] rounded-[1.5vw] bg-white p-[0.8vw]" dangerouslySetInnerHTML={{ __html: qr }} />
          <p className="mt-[1vw] text-[1.2vw] font-extrabold">Resumos, vídeos e suas fotos</p>
          <p className="text-[1vw] text-white/70">{site}</p>
        </div>
      </aside>
    </main>
  );
}
