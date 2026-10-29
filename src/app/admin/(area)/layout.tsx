import Link from "next/link";
import { exigirEquipe } from "@/lib/equipe";
import { sair } from "./acoes";

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

  return (
    <>
      <header className="sticky top-0 z-20 bg-navy text-white">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-3 text-sm">
          <Link href="/admin" className="font-extrabold uppercase">
            Área de controle
          </Link>
          <nav className="flex gap-3 text-white/80">
            <Link href="/admin">Painéis</Link>
            <Link href="/admin/palestrantes">Palestrantes</Link>
            <Link href="/admin/cadastros">Cadastros</Link>
          </nav>
          <span className="ml-auto hidden text-white/70 sm:inline">
            {membro.nome} · {membro.papel === "aprovador" ? "aprovador(a) OAB" : "editora"}
          </span>
          <form action={sair}>
            <button className="rounded-full bg-white/15 px-3 py-1 font-semibold">Sair</button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-6">{children}</div>
    </>
  );
}
