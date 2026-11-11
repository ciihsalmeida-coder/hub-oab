import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { autorizado } from "@/lib/autorizacao";
import { PAINEL_ENSAIO } from "@/lib/ensaio";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

// Limpeza única antes do evento: apaga o painel de ensaio (registros e arquivos) e a fala "[TESTE]" do Painel 1.
// Remover esta rota depois de usada.
async function arquivosDoEnsaio(bucket: string) {
  const db = supabaseAdmin();
  const caminhos: string[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await db.storage.from(bucket).list(PAINEL_ENSAIO, { limit: 100, offset });
    if (error) throw error;
    caminhos.push(...(data ?? []).map((f) => `${PAINEL_ENSAIO}/${f.name}`));
    if (!data || data.length < 100) return caminhos;
  }
}

export async function POST(request: NextRequest) {
  if (!(await autorizado(request))) return NextResponse.json({ erro: "Sem permissão." }, { status: 401 });
  const db = supabaseAdmin();
  const resultado: Record<string, number> = {};
  for (const bucket of ["fotos", "cortes"]) {
    const caminhos = await arquivosDoEnsaio(bucket);
    for (let i = 0; i < caminhos.length; i += 100) {
      const { error } = await db.storage.from(bucket).remove(caminhos.slice(i, i + 100));
      if (error) throw error;
    }
    resultado[`arquivos_${bucket}`] = caminhos.length;
  }
  const teste = await db.from("falas").delete().eq("painel_slug", "painel-1").like("texto", "[TESTE]%").select("id");
  if (teste.error) throw teste.error;
  resultado.falas_teste = teste.data.length;
  const ensaio = await db.from("paineis").delete().eq("slug", PAINEL_ENSAIO).select("slug");
  if (ensaio.error) throw ensaio.error;
  resultado.painel_ensaio = ensaio.data.length;
  revalidatePath("/", "layout");
  return NextResponse.json(resultado);
}
