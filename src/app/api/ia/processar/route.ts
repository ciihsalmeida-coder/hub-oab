import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { autorizado } from "@/lib/autorizacao";
import { dispararCortes } from "@/lib/cortes";
import { iaConfigurada, processarProximo } from "@/lib/ia";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Avança a fila da IA: transcrição e textos de cada painel. Chamado a cada 2 minutos.
async function executar(request: NextRequest) {
  if (!iaConfigurada()) return NextResponse.json({ erro: "IA ainda não configurada." }, { status: 503 });
  if (!(await autorizado(request))) return NextResponse.json({ erro: "Sem permissão." }, { status: 401 });
  const resultado = await processarProximo();
  let cortes: string[] = [];
  try {
    cortes = await dispararCortes();
  } catch (e) {
    console.error("Falha ao acordar o robô de cortes", e);
  }
  if (resultado.painel) {
    revalidatePath(`/admin/paineis/${resultado.painel}`);
    revalidatePath("/admin");
  }
  return NextResponse.json({ ...resultado, cortes });
}

export const GET = executar;
export const POST = executar;
