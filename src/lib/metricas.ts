"use client";

import { supabaseConfigurado } from "@/lib/supabase/config";
import { inserirPublico } from "@/lib/supabase/inserir";

export type TipoEvento =
  | "visita_home"
  | "visita_painel"
  | "visita_kit"
  | "baixou_card"
  | "baixou_video"
  | "baixou_foto"
  | "compartilhou"
  | "abriu_galeria"
  | "abriu_mural"
  | "tocou_video";

const CHAVE = "hub-visitante";
const VALIDADE_MS = 30 * 86_400_000;

// Código aleatório deste navegador, só para contar pessoas sem repetir. Não identifica ninguém
// e é trocado a cada 30 dias. Se o navegador não guardar, cada visita conta como uma pessoa.
function visitante() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? "null") as { id: string; desde: number } | null;
    if (salvo && Date.now() - salvo.desde < VALIDADE_MS) return salvo.id;
    const novo = { id: crypto.randomUUID(), desde: Date.now() };
    localStorage.setItem(CHAVE, JSON.stringify(novo));
    return novo.id;
  } catch {
    return crypto.randomUUID();
  }
}

// Contagem anônima (só a ação e o painel/palestrante). Nunca atrapalha a página se falhar.
export function registrar(tipo: TipoEvento, alvo?: string) {
  if (!supabaseConfigurado) return;
  void inserirPublico("eventos", { tipo, alvo: alvo ?? null, visitante: visitante() });
}
