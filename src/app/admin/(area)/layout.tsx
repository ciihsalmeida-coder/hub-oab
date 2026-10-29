import Image from "next/image";
import Link from "next/link";
import { exigirEquipe } from "@/lib/equipe";
import { sair } from "./acoes";
import { Menu } from "./Menu";

export default async function AreaLayout({ children }: { children: React.ReactNode }) {
  const { user, membro } = await exigirEquipe();

  if (!membro) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-xl font-extrabold">Login ainda não liberado</p>
        <p className="mt-2 text-muted">
          Você entrou como <strong>{user.email}</strong>, mas esse e-mail ainda não faz parte da equipe do congresso.
          Peça a liberação para a Mzen Films.
        </p>
        <form action={sair} className="mt-6">
          <button className="rounded-full border border-navy px-5 py-2 font-bold">Sair</button>
        </form>
      </main>
    );
  }

  const iniciais = membro.nome.slice(0, 1).toUpperCase();
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/icone-192.png" alt="" width={36} height={36} className="rounded-xl" />
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-extrabold">Área de controle</span>
              <span className="block text-[11px] font-semibold text-muted">XIV Congresso OAB</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-right text-xs leading-tight sm:block">
              <span className="block font-bold">{membro.nome}</span>
              <span className="block text-muted">{membro.papel === "aprovador" ? "Aprovação OAB" : "Edição"}</span>
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-sky font-extrabold text-navy">{iniciais}</span>
            <form action={sair}>
              <button className="rounded-full px-3 py-2 text-xs font-bold text-muted hover:bg-fog">Sair</button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-3 pb-2">
          <Menu />
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </>
  );
}
