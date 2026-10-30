import Link from "next/link";
import { AgoraNoPalco } from "@/components/AgoraNoPalco";
import { Rastrear } from "@/components/Rastrear";
import { GaleriaBotao } from "@/components/GaleriaBotao";
import { ListaPaineis } from "@/components/ListaPaineis";
import { Assinatura, FaixaLocal, TituloCongresso } from "@/components/Marca";
import { dias } from "@/data/programacao";
import { listarPaineis } from "@/lib/dados";

export const revalidate = 60;

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
      <Rastrear tipo="visita_home" />
      <AgoraNoPalco />
      <FaixaLocal />

      <div className="mx-auto max-w-3xl px-4 pb-10">
        <ListaPaineis paineis={paineis} dias={dias} />
      </div>
    </main>
  );
}
