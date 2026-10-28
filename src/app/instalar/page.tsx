import Image from "next/image";
import { Assinatura, Voltar } from "@/components/Marca";
import { Instalar } from "./Instalar";

export const metadata = { title: "Instale no celular · XIV Congresso OAB" };

export default function InstalarPage() {
  return (
    <main>
      <header className="ceu-mar px-4 pt-6 pb-10">
        <div className="mx-auto max-w-xl">
          <Voltar />
          <div className="mt-5">
            <Assinatura />
          </div>
          <div className="mt-8 flex items-center gap-4">
            <Image src="/icone-192.png" alt="" width={72} height={72} className="rounded-2xl shadow-lg" />
            <div>
              <h1 className="text-2xl leading-tight font-extrabold text-navy">Leve o congresso no celular</h1>
              <p className="text-sm font-semibold text-white">Sem loja, sem cadastro, em 30 segundos.</p>
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-xl px-4 py-8">
        <Instalar />
      </div>
    </main>
  );
}
