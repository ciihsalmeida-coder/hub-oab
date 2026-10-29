import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { driveConfigurado, sincronizar } from "@/lib/drive";
import { autorizado } from "@/lib/autorizacao";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Chamado a cada 2 minutos pelo agendador do banco (com o token) ou pelo botão da área de controle.
async function executar(request: NextRequest) {
  if (!driveConfigurado()) return NextResponse.json({ erro: "Google Drive ainda não configurado." }, { status: 503 });
  if (!(await autorizado(request))) return NextResponse.json({ erro: "Sem permissão." }, { status: 401 });
  const resultado = await sincronizar();
  for (const slug of resultado.paineis) {
    revalidatePath(`/paineis/${slug}`);
    revalidatePath(`/admin/paineis/${slug}`);
  }
  if (resultado.paineis.length) revalidatePath("/admin");
  return NextResponse.json(resultado);
}

export const GET = executar;
export const POST = executar;
