import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { autorizado } from "@/lib/autorizacao";
import { iaConfigurada, processarProximo } from "@/lib/ia";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Avança a fila da IA: transcrição e textos de cada painel. Chamado a cada 2 minutos.
async function executar(request: NextRequest) {
  if (!iaConfigurada()) return NextResponse.json({ erro: "IA ainda não configurada." }, { status: 503 });
  if (!(await autorizado(request))) return NextResponse.json({ erro: "Sem permissão." }, { status: 401 });
  const resultado = await processarProximo();
  if (resultado.painel) {
    revalidatePath(`/admin/paineis/${resultado.painel}`);
    revalidatePath("/admin");
  }
  return NextResponse.json(resultado);
}

export const GET = executar;
export const POST = executar;
