import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { autorizado } from "@/lib/autorizacao";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

// Limpeza única antes do evento (11/11): tira todo o conteúdo de teste e deixa o hub zerado.
// Remover esta rota depois de usada.
export async function POST(request: NextRequest) {
  if (!(await autorizado(request))) return NextResponse.json({ erro: "Sem permissão." }, { status: 401 });
  const db = supabaseAdmin();
  const r: Record<string, number> = {};
  const contar = async (nome: string, q: PromiseLike<{ data: unknown[] | null; error: unknown }>) => {
    const { data, error } = await q;
    if (error) throw error;
    r[nome] = data?.length ?? 0;
  };

  // Arquivos de teste (fotos e cortes da Abertura de 29/10)
  for (const bucket of ["fotos", "cortes"]) {
    const { data, error } = await db.storage.from(bucket).list("abertura", { limit: 1000 });
    if (error) throw error;
    const caminhos = (data ?? []).map((f) => `abertura/${f.name}`);
    if (caminhos.length) {
      const apagar = await db.storage.from(bucket).remove(caminhos);
      if (apagar.error) throw apagar.error;
    }
    r[`arquivos_${bucket}`] = caminhos.length;
  }

  await contar("falas", db.from("falas").delete().neq("id", "00000000-0000-0000-0000-000000000000").select("id"));
  await contar("cortes", db.from("cortes").delete().neq("id", "00000000-0000-0000-0000-000000000000").select("id"));
  await contar("fotos", db.from("fotos").delete().neq("id", "00000000-0000-0000-0000-000000000000").select("id"));
  await contar("envios", db.from("envios").delete().neq("id", "00000000-0000-0000-0000-000000000000").select("id"));
  await contar("cadastros", db.from("cadastros").delete().not("id", "is", null).select("id"));
  await contar("eventos", db.from("eventos").delete().gt("id", 0).select("id"));
  await contar("resumos_dia", db.from("resumos_dia").delete().not("dia", "is", null).select("dia"));
  await contar("testes_carga", db.from("testes_carga").delete().gt("id", 0).select("id"));
  await contar(
    "paineis_zerados",
    db
      .from("paineis")
      .update({ resumo: null, pontos: [], resumo_publicado: null, pontos_publicados: [], status_texto: "rascunho", aprovado_por: null, aprovado_em: null, video_sessao_url: null })
      .neq("slug", "")
      .select("slug"),
  );
  await contar("palestrantes_zerados", db.from("palestrantes").update({ whatsapp: null, legenda_kit: null }).neq("slug", "").select("id"));

  // Kits: marca de "enviado" sai e quem já teve link circulando ganha um link novo (o de teste para de funcionar)
  const { data: enviados } = await db.from("kits").select("palestrante_id").not("enviado_em", "is", null);
  for (const k of enviados ?? []) {
    const { error } = await db.from("kits").update({ enviado_em: null, token: randomBytes(6).toString("hex") }).eq("palestrante_id", k.palestrante_id);
    if (error) throw error;
  }
  r.kits_link_novo = enviados?.length ?? 0;

  revalidatePath("/", "layout");
  return NextResponse.json(r);
}
