"use client";

import { useEffect } from "react";
import { registrar, type TipoEvento } from "@/lib/metricas";

// Registra uma visita quando a página abre.
export function Rastrear({ tipo, alvo }: { tipo: TipoEvento; alvo?: string }) {
  useEffect(() => {
    registrar(tipo, alvo);
  }, [tipo, alvo]);
  return null;
}

// Link que conta o clique (downloads e galeria).
export function LinkContado({
  tipo,
  alvo,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { tipo: TipoEvento; alvo?: string }) {
  return (
    <a {...props} onClick={() => registrar(tipo, alvo)}>
      {children}
    </a>
  );
}
