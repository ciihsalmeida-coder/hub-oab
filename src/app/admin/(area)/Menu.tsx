"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const itens = [
  { href: "/admin", rotulo: "Painéis", icone: "🎙️" },
  { href: "/admin/palestrantes", rotulo: "Palestrantes", icone: "🎤" },
  { href: "/admin/cadastros", rotulo: "Cadastros", icone: "👥" },
  { href: "/admin/manual", rotulo: "Manual", icone: "📖" },
];

export function Menu({ abas = false }: { abas?: boolean }) {
  const caminho = usePathname();
  return (
    <nav className={abas ? "grid grid-cols-4 gap-1" : "flex gap-1 overflow-x-auto"}>
      {itens.map((i) => {
        const ativo = i.href === "/admin" ? caminho === "/admin" || caminho.startsWith("/admin/paineis") : caminho.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`flex shrink-0 items-center rounded-full font-bold transition ${
              abas ? "flex-col gap-0.5 py-1.5 text-[11px]" : "gap-1.5 px-3.5 py-2 text-sm"
            } ${
              ativo ? "bg-white text-navy shadow" : "text-white/70 hover:bg-white/10"
            }`}
          >
            <span className={abas ? "text-lg leading-none" : ""}>{i.icone}</span>
            {i.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
