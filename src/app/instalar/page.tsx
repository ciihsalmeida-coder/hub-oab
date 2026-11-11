import Image from "next/image";
import QRCode from "qrcode";
import { Assinatura, MzenTopo, Voltar } from "@/components/Marca";
import { Instalar } from "./Instalar";

export const metadata = { title: "Instale no celular · XIV Congresso OAB" };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hub-oab.vercel.app";

const VANTAGENS = [
  { icone: "⏱️", titulo: "Cada painel em 1 minuto", texto: "Resumo com as principais ideias, no mesmo dia." },
  { icone: "🎬", titulo: "Cortes em vídeo", texto: "Os melhores momentos, prontos para assistir e compartilhar." },
  { icone: "📸", titulo: "Suas fotos", texto: "Ache as fotos em que você aparece com uma selfie." },
  { icone: "🔒", titulo: "Leve e seguro", texto: "Sem loja, sem cadastro e quase sem ocupar espaço." },
];

export default async function InstalarPage() {
  const endereco = `${SITE}/instalar`;
  const qr = await QRCode.toString(endereco, { type: "svg", margin: 1, color: { dark: "#0f2a44", light: "#ffffff" } });

  return (
    <main>
      <header className="ceu-mar px-4 pt-6 pb-10">
        <div className="relative mx-auto max-w-5xl">
          <MzenTopo />
          <Voltar />
          <div className="mt-5">
            <Assinatura />
          </div>
          <div className="mt-8 flex items-center gap-4 sm:gap-6">
            <Image
              src="/icone-512.png"
              alt="Ícone do app"
              width={96}
              height={96}
              className="h-20 w-20 rounded-[22%] shadow-xl sm:h-24 sm:w-24"
              priority
            />
            <div>
              <p className="text-xs font-extrabold tracking-[0.2em] text-sky uppercase">App do congresso</p>
              <h1 className="text-2xl leading-tight font-extrabold text-white sm:text-4xl">Leve o congresso no celular</h1>
              <p className="mt-1 text-sm font-semibold text-white/90 sm:text-base">
                Sem loja, sem cadastro, em 30 segundos.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-extrabold tracking-[0.15em] text-navy uppercase">O que tem no app</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {VANTAGENS.map((v) => (
                <li key={v.titulo} className="flex gap-3 rounded-2xl border border-line bg-card p-4">
                  <span className="text-2xl leading-none">{v.icone}</span>
                  <span>
                    <strong className="block text-navy">{v.titulo}</strong>
                    <span className="text-sm text-muted">{v.texto}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-extrabold tracking-[0.15em] text-navy uppercase">Como instalar</h2>
            <div className="mt-4">
              <Instalar />
            </div>
          </section>
        </div>

        {/* Para quem abre no computador ou vê a página no telão: aponta a câmera e abre no celular. */}
        <aside className="hidden md:block">
          <div className="sticky top-6 rounded-3xl bg-navy p-6 text-center text-white shadow-xl">
            <p className="text-lg leading-tight font-extrabold">Aponte a câmera do celular</p>
            <div
              className="mx-auto mt-4 w-full rounded-2xl bg-white p-3 [&_svg]:h-auto [&_svg]:w-full"
              dangerouslySetInnerHTML={{ __html: qr }}
            />
            <div className="mt-4 flex h-1.5 overflow-hidden rounded-full">
              <span className="w-1/6 bg-wine" />
              <span className="flex-1 bg-sky" />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
