"use client";

import { supabaseConfigurado } from "@/lib/supabase/config";
import { supabaseNavegador } from "@/lib/supabase/navegador";

export type TipoEvento =
  | "visita_home"
  | "visita_painel"
  | "visita_kit"
  | "baixou_card"
  | "baixou_video"
  | "baixou_foto"
  | "compartilhou"
  | "abriu_galeria"
  | "abriu_mural";

// Contagem anônima (só a ação e o painel/palestrante). Nunca atrapalha a página se falhar.
export function registrar(tipo: TipoEvento, alvo?: string) {
  if (!supabaseConfigurado) return;
  try {
    void supabaseNavegador().from("eventos").insert({ tipo, alvo: alvo ?? null }).then(() => {});
  } catch {}
}
