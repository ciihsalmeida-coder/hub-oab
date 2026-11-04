import { NextResponse, type NextRequest } from "next/server";
import { driveConfigurado, prepararPastas } from "@/lib/drive";
import { autorizado } from "@/lib/autorizacao";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Cria as pastas de cada painel e de cada palestrante no Drive. Pode rodar de novo sem duplicar.
export async function POST(request: NextRequest) {
  if (!driveConfigurado()) return NextResponse.json({ erro: "Google Drive ainda não configurado." }, { status: 503 });
  if (!(await autorizado(request))) return NextResponse.json({ erro: "Sem permissão." }, { status: 401 });
  try {
    const total = await prepararPastas();
    return NextResponse.json({ pastas: total });
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
