"use client";

import { useEffect, useState } from "react";
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

// Vídeo que conta quando alguém aperta o play (uma vez por vídeo aberto).
export function VideoContado({ alvo, ...props }: React.VideoHTMLAttributes<HTMLVideoElement> & { alvo?: string }) {
  const [contou, setContou] = useState(false);
  return (
    <video
      {...props}
      onPlay={() => {
        if (contou) return;
        setContou(true);
        registrar("tocou_video", alvo);
      }}
    />
  );
}
