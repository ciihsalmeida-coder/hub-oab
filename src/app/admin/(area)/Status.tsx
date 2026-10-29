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
  vazio: ["bg-line text-muted", "⚪ Aguardando conteúdo"],
  rascunho: ["bg-amber-100 text-amber-900", "🟡 Rascunho · aguardando aprovação"],
  publicado: ["bg-green-100 text-green-900", "✅ Publicado"],
};

export function Status({ situacao }: { situacao: Situacao }) {
  const [cls, texto] = estilos[situacao];
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{texto}</span>;
}
