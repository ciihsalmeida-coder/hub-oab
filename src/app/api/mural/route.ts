import { NextResponse } from "next/server";
import { momentoAtual } from "@/lib/agenda";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { supabasePublico } from "@/lib/supabase/publico";

export const dynamic = "force-dynamic";

// Conteúdo aprovado para o mural do telão (só o que já está publicado).
export async function GET() {
  const vazio = { falas: [], fotos: [], cortes: [], agora: momentoAtual() };
  if (!supabaseConfigurado) return NextResponse.json(vazio);
  const db = supabasePublico();
  const [falas, fotos, cortes, palestrantes] = await Promise.all([
    db.from("falas").select("id, texto, palestrante_id, painel_slug").order("ordem").limit(60),
    db.from("fotos").select("id, url, painel_slug").order("criado_em", { ascending: false }).limit(40),
    db
      .from("cortes")
      .select("id, titulo, video_url, palestrante_id")
      .not("video_url", "is", null)
      .order("criado_em", { ascending: false })
      .limit(10),
    db.from("palestrantes").select("id, nome, cargo, foto_url"),
  ]);
  const quem = new Map((palestrantes.data ?? []).map((p) => [p.id, p]));
  return NextResponse.json(
    {
      agora: momentoAtual(),
      falas: (falas.data ?? []).map((f) => {
        const p = f.palestrante_id ? quem.get(f.palestrante_id) : undefined;
        return { id: f.id, texto: f.texto, nome: p?.nome ?? null, cargo: p?.cargo ?? null, foto: p?.foto_url ?? null };
      }),
      fotos: fotos.data ?? [],
      cortes: (cortes.data ?? []).map((c) => ({ ...c, nome: c.palestrante_id ? quem.get(c.palestrante_id)?.nome ?? null : null })),
    },
    { headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=60" } },
  );
}
