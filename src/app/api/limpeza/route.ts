import { NextResponse, type NextRequest } from "next/server";
import { autorizado } from "@/lib/autorizacao";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Rotina única (12/11): tira os clipes da câmera reprovados na Abertura. Remover depois de usar.
export async function POST(request: NextRequest) {
  if (!(await autorizado(request))) return NextResponse.json({ erro: "Sem permissão." }, { status: 401 });
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("cortes")
    .delete()
    .eq("painel_slug", "abertura")
    .eq("origem", "manual")
    .eq("status", "rascunho")
    .like("titulo", "A7IV%")
    .select("titulo, video_url, video_web_url, capa_url");
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  const caminhos = (data ?? [])
    .flatMap((c) => [c.video_url, c.video_web_url, c.capa_url])
    .filter(Boolean)
    .map((u) => String(u).split("/storage/v1/object/public/cortes/")[1]?.split("?")[0])
    .filter(Boolean) as string[];
  if (caminhos.length) await db.storage.from("cortes").remove(caminhos);
  return NextResponse.json({ apagados: (data ?? []).map((c) => c.titulo), arquivos: caminhos.length });
}
