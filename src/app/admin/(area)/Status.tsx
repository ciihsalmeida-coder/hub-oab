export type Situacao = "vazio" | "rascunho" | "publicado";

// pendentes = falas, fotos e cortes em rascunho; total = tudo o que existe no painel.
export function situacaoDoPainel(
  p: { resumo: string | null; pontos: unknown[]; status_texto: string },
  pendentes: number,
  total: number,
): Situacao {
  if (p.status_texto === "publicado" && !pendentes) return "publicado";
  return p.resumo || p.pontos.length || total ? "rascunho" : "vazio";
}

const estilos: Record<Situacao, [string, string]> = {
  vazio: ["bg-white/10 text-white/70", "⚪ Aguardando conteúdo"],
  rascunho: ["bg-amber-300/20 text-amber-200", "🟡 Rascunho · aguardando aprovação"],
  publicado: ["bg-emerald-400/20 text-emerald-200", "✅ Publicado"],
};

export function Status({ situacao }: { situacao: Situacao }) {
  const [cls, texto] = estilos[situacao];
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{texto}</span>;
}
