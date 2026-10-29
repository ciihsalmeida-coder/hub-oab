import Link from "next/link";
import { AgoraNoPalco } from "@/components/AgoraNoPalco";
import { GaleriaBotao } from "@/components/GaleriaBotao";
import { Assinatura, FaixaLocal, TituloCongresso } from "@/components/Marca";
import { dias } from "@/data/programacao";
import { listarPaineis } from "@/lib/dados";

export const revalidate = 60;

const corArea: Record<string, string> = {
  Abertura: "bg-wine text-white",
  Aduaneiro: "bg-sky text-navy",
  Portuário: "bg-navy text-white",
  Marítimo: "bg-sea text-white",
};

export default async function Home() {
  const paineis = await listarPaineis();
  return (
    <main>
      <header className="ceu-mar px-4 pt-8 pb-10">
        <div className="mx-auto max-w-3xl">
          <Assinatura />
          <div className="mt-8">
            <TituloCongresso />
          </div>
          <p className="mt-6 max-w-md text-sm font-medium text-white/90">
            Resumos, cortes em vídeo e fotos de cada painel, publicados no mesmo dia.
          </p>
          <div className="mt-5 space-y-3">
            <GaleriaBotao url={paineis[0]?.galeriaUrl ?? undefined} />
            <Link
              href="/instalar"
              className="block rounded-2xl bg-white/15 px-5 py-3 text-center text-sm font-bold text-white backdrop-blur"
            >
              📲 Instale o app do congresso no celular
            </Link>
          </div>
        </div>
      </header>
      <AgoraNoPalco />
      <FaixaLocal />

      <div className="mx-auto max-w-3xl px-4">
        {dias.map((dia) => (
          <section key={dia.data} className="mt-10">
            <h2 className="text-xs font-extrabold tracking-[0.2em] text-wine uppercase">{dia.rotulo}</h2>
            <ul className="mt-3 space-y-3">
              {paineis
                .filter((p) => p.data === dia.data)
                .map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/paineis/${p.slug}`}
                      className="block rounded-2xl border border-line bg-card p-4 shadow-sm active:bg-fog"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold uppercase">
                        <span className="text-navy">{p.horario}</span>
                        <span className={`rounded-full px-2 py-0.5 ${corArea[p.area]}`}>
                          {p.numero ? `Painel ${p.numero} · ${p.area}` : p.area}
                        </span>
                      </div>
                      <p className="mt-2 text-lg leading-snug font-bold">{p.titulo}</p>
                      <p className="mt-1 text-sm text-muted">{p.palestrantes.length} palestrante(s) →</p>
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
