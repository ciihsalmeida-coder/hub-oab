import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Lê o kit pelo código secreto do link (<slug>-<token>). Só conteúdo já aprovado.
export async function buscarKit(codigo: string) {
  const token = codigo.split("-").pop() ?? "";
  if (!/^[0-9a-f]{12}$/.test(token)) return null;
  const db = supabaseAdmin();
  const { data: kit } = await db.from("kits").select("palestrante_id").eq("token", token).maybeSingle();
  if (!kit) return null;
  const { data: p } = await db
    .from("palestrantes")
    .select("id, slug, nome, cargo, foto_url, legenda_kit, painel_slug")
    .eq("id", kit.palestrante_id)
    .single();
  if (!p || `${p.slug}-${token}` !== codigo) return null;

  const [painel, falas, fotos, cortes] = await Promise.all([
    db.from("paineis").select("titulo, numero, area, data, horario").eq("slug", p.painel_slug).single(),
    db.from("falas").select("id, texto").eq("palestrante_id", p.id).eq("status", "publicado").order("ordem"),
    db.from("fotos").select("id, url, miniatura_url").eq("palestrante_id", p.id).eq("status", "publicado").order("ordem"),
    db
      .from("cortes")
      .select("id, titulo, video_url, video_web_url, capa_url")
      .eq("palestrante_id", p.id)
      .eq("status", "publicado")
      .not("video_url", "is", null)
      .order("ordem"),
  ]);
  return {
    palestrante: p,
    painel: painel.data,
    falas: falas.data ?? [],
    fotos: fotos.data ?? [],
    cortes: cortes.data ?? [],
  };
}
