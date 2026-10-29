"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const itens = [
  { href: "/admin", rotulo: "Painéis", icone: "🎙️" },
  { href: "/admin/palestrantes", rotulo: "Palestrantes", icone: "🎤" },
  { href: "/admin/cadastros", rotulo: "Cadastros", icone: "👥" },
];

export function Menu() {
  const caminho = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {itens.map((i) => {
        const ativo = i.href === "/admin" ? caminho === "/admin" || caminho.startsWith("/admin/paineis") : caminho.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition ${
              ativo ? "bg-navy text-white shadow" : "text-navy/70 hover:bg-fog"
            }`}
          >
            <span>{i.icone}</span>
            {i.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
