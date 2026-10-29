import { paineis } from "@/data/programacao";

// Início de cada momento no horário de Florianópolis (UTC-3, sem horário de verão em 2026).
function inicio(data: string, horario: string) {
  const [h, m] = horario.replace("h", ":").split(":");
  return new Date(`${data}T${h.padStart(2, "0")}:${(m || "00").padStart(2, "0")}:00-03:00`);
}

const agenda = paineis.map((p, i) => {
  const comeca = inicio(p.data, p.horario);
  const proximo = paineis[i + 1];
  const mesmoDia = proximo && proximo.data === p.data;
  // Termina quando começa o próximo do mesmo dia; o último do dia dura 1h30 (a abertura, 2h30).
  const termina = mesmoDia ? inicio(proximo.data, proximo.horario) : new Date(comeca.getTime() + (p.numero ? 90 : 150) * 60_000);
  return { slug: p.slug, numero: p.numero, titulo: p.titulo, comeca, termina };
});

export type Momento = { slug: string; numero: number | null; titulo: string; estado: "agora" | "proximo" };

// O que está no palco agora; se nada, o próximo do mesmo dia (até 2 horas antes).
export function momentoAtual(agora = new Date()): Momento | null {
  const atual = agenda.find((a) => agora >= a.comeca && agora < a.termina);
  if (atual) return { slug: atual.slug, numero: atual.numero, titulo: atual.titulo, estado: "agora" };
  const proximo = agenda.find((a) => a.comeca > agora && a.comeca.getTime() - agora.getTime() < 2 * 3_600_000);
  return proximo ? { slug: proximo.slug, numero: proximo.numero, titulo: proximo.titulo, estado: "proximo" } : null;
}
