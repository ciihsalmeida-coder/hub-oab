"use client";

import { useState } from "react";

export function Copiar({ texto, rotulo = "Copiar texto" }: { texto: string; rotulo?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setOk(true);
          setTimeout(() => setOk(false), 2000);
        } catch {}
      }}
      className="rounded-full bg-navy px-4 py-2 text-sm font-bold text-white"
    >
      {ok ? "✓ Copiado" : `📋 ${rotulo}`}
    </button>
  );
}

export function Compartilhar({ titulo }: { titulo: string }) {
  return (
    <button
      onClick={() => {
        const url = window.location.href;
        if (navigator.share) navigator.share({ title: titulo, url }).catch(() => {});
        else navigator.clipboard?.writeText(url);
      }}
      className="rounded-full border border-navy px-4 py-2 text-sm font-bold text-navy"
    >
      ↗ Compartilhar
    </button>
  );
}
