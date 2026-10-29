import { NextResponse } from "next/server";
import { driveConfigurado, prepararPastas } from "@/lib/drive";
import { supabaseServidor } from "@/lib/supabase/servidor";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Cria as pastas de cada painel e de cada palestrante no Drive. Pode rodar de novo sem duplicar.
export async function POST() {
  if (!driveConfigurado()) return NextResponse.json({ erro: "Google Drive ainda não configurado." }, { status: 503 });
  const db = await supabaseServidor();
  const { data: user } = await db.auth.getUser();
  const { data: membro } = user.user
    ? await db.from("equipe").select("user_id").eq("user_id", user.user.id).maybeSingle()
    : { data: null };
  if (!membro) return NextResponse.json({ erro: "Sem permissão." }, { status: 401 });
  try {
    const total = await prepararPastas();
    return NextResponse.json({ pastas: total });
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
