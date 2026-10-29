import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { driveConfigurado, sincronizar } from "@/lib/drive";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServidor } from "@/lib/supabase/servidor";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Chamado a cada 2 minutos pelo agendador do banco (com o token) ou pelo botão da área de controle.
async function autorizado(request: NextRequest) {
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

async function executar(request: NextRequest) {
  if (!driveConfigurado()) return NextResponse.json({ erro: "Google Drive ainda não configurado." }, { status: 503 });
  if (!(await autorizado(request))) return NextResponse.json({ erro: "Sem permissão." }, { status: 401 });
  const resultado = await sincronizar();
  for (const slug of resultado.paineis) {
    revalidatePath(`/paineis/${slug}`);
    revalidatePath(`/admin/paineis/${slug}`);
  }
  if (resultado.paineis.length) revalidatePath("/admin");
  return NextResponse.json(resultado);
}

export const GET = executar;
export const POST = executar;
