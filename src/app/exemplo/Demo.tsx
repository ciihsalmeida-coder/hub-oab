import Link from "next/link";

export function FaixaDemo({ atual }: { atual: "publico" | "palestrante" }) {
  return (
    <div className="sticky top-0 z-20 bg-wine px-4 py-2 text-white">
      <p className="text-center text-xs font-bold uppercase">Demonstração · nomes, falas e vídeos fictícios</p>
      <div className="mx-auto mt-2 flex max-w-md gap-2 text-sm font-bold">
        <Link
          href="/exemplo"
          className={`flex-1 rounded-full py-1.5 text-center ${atual === "publico" ? "bg-white text-wine" : "bg-white/15"}`}
        >
          👥 Público
        </Link>
        <Link
          href="/exemplo/palestrante"
          className={`flex-1 rounded-full py-1.5 text-center ${atual === "palestrante" ? "bg-white text-wine" : "bg-white/15"}`}
        >
          🎤 Palestrante
        </Link>
      </div>
    </div>
  );
}

export function Secao({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-extrabold tracking-[0.15em] text-navy uppercase">{titulo}</h2>
      {subtitulo && <p className="mt-1 text-sm text-muted">{subtitulo}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function FotoFicticia({ i }: { i: number }) {
  return (
    <div className="grid aspect-[4/5] place-items-center rounded-xl bg-gradient-to-br from-sea to-navy text-xs font-semibold text-white/60">
      foto {i + 1}
    </div>
  );
}
