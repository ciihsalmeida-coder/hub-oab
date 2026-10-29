import "server-only";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServidor } from "@/lib/supabase/servidor";

// Aceita o agendador do banco (cabeçalho com token) ou alguém logado da equipe.
export async function autorizado(request: NextRequest) {
  const token = request.headers.get("x-sync-token");
  if (token) {
    const { data } = await supabaseAdmin().from("segredos").select("valor").eq("chave", "sync_token").single();
    return Boolean(data && data.valor === token);
  }
  const db = await supabaseServidor();
  const { data: user } = await db.auth.getUser();
  if (!user.user) return false;
  const { data } = await db.from("equipe").select("user_id").eq("user_id", user.user.id).maybeSingle();
  return Boolean(data);
}
