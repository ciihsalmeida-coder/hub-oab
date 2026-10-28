import Link from "next/link";
import { GaleriaBotao } from "@/components/GaleriaBotao";
import { congresso, dias, paineis } from "@/data/programacao";

export default function Home() {
  return (
    <main>
      <header className="bg-navy px-4 pb-10 pt-8 text-cream">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-red">● HUB DO CONGRESSO</p>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">{congresso.nome}</h1>
          <p className="mt-3 text-cream/80">{congresso.datas}</p>
          <p className="text-cream/80">{congresso.local}</p>
          <GaleriaBotao />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4">
        {dias.map((dia) => (
          <section key={dia.data} className="mt-8">
            <h2 className="text-xs font-semibold tracking-[0.2em] text-red uppercase">{dia.rotulo}</h2>
            <ul className="mt-3 space-y-3">
              {paineis
                .filter((p) => p.data === dia.data)
                .map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/paineis/${p.slug}`}
                      className="block rounded-xl border border-line bg-card p-4 active:bg-white"
                    >
                      <p className="text-sm text-muted">
                        <strong className="text-navy">{p.horario}</strong> ·{" "}
                        {p.numero ? `Painel ${p.numero} · ${p.area}` : p.area}
                      </p>
                      <p className="mt-1 font-display text-lg font-semibold leading-snug">{p.titulo}</p>
                      <p className="mt-1 text-sm text-muted">{p.palestrantes.length} palestrante(s)</p>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
