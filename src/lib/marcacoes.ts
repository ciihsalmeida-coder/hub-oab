// Perfis das comissões organizadoras no Instagram: pedimos para marcar em todo post sobre o congresso.
export const PERFIS = ["@aduaneiro.oabsc", "@portuarioemaritimo.oabsc"] as const;
export const MARCACOES = PERFIS.join(" ");

// Garante que a legenda termina marcando as comissões (sem repetir se a IA já marcou).
export function comMarcacoes(texto: string) {
  const faltam = PERFIS.filter((p) => !texto.toLowerCase().includes(p));
  return faltam.length ? `${texto.trimEnd()}\n\n${faltam.join(" ")}` : texto;
}
