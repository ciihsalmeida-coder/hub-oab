import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

// Gravação direta (sem a biblioteca do Supabase) para as páginas públicas ficarem leves.
// Só serve para tabelas em que o público pode inserir (cadastros, eventos).
export async function inserirPublico(tabela: string, linha: Record<string, unknown>): Promise<{ error: { code?: string } | null }> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
      method: "POST",
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(linha),
      keepalive: true, // conclui mesmo se a pessoa sair da página (ex.: clicou em baixar)
    });
    if (r.ok) return { error: null };
    const corpo = await r.json().catch(() => ({}));
    return { error: { code: corpo.code } };
  } catch {
    return { error: {} };
  }
}
