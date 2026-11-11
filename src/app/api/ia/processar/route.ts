import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { autorizado } from "@/lib/autorizacao";
import { dispararCortes } from "@/lib/cortes";
import { iaConfigurada, processarProximo } from "@/lib/ia";

export const maxDuration = 800; // Vercel Pro: painel de 1 h pode levar vários minutos no Claude
export const dynamic = "force-dynamic";

// Avança a fila da IA: transcrição e textos de cada painel. Chamado a cada 2 minutos.
async function executar(request: NextRequest) {
  if (!iaConfigurada()) return NextResponse.json({ erro: "IA ainda não configurada." }, { status: 503 });
  if (!(await autorizado(request))) return NextResponse.json({ erro: "Sem permissão." }, { status: 401 });
  // Até 3 gravações por vez: no fim de um painel chegam a geral e a de cada palestrante juntas.
  const resultados = await Promise.all([processarProximo(), processarProximo(), processarProximo()]);
  const resultado = resultados.find((r) => r.envio) ?? {};
  const paineis = [...new Set(resultados.map((r) => r.painel).filter(Boolean))] as string[];
  let cortes: string[] = [];
  let erroCortes: string | undefined;
  try {
    cortes = await dispararCortes();
  } catch (e) {
    erroCortes = e instanceof Error ? e.message.slice(0, 300) : String(e);
    console.error("Falha ao acordar o robô de cortes", e);
  }
  for (const painel of paineis) revalidatePath(`/admin/paineis/${painel}`);
  if (paineis.length) revalidatePath("/admin");
  return NextResponse.json({
    ...resultado,
    processados: resultados.filter((r) => r.envio).length,
    cortes,
    erroCortes,
    github: Boolean(process.env.GITHUB_TOKEN),
  });
}

export const GET = executar;
export const POST = executar;
