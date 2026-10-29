import { NextResponse } from "next/server";
import { gerarCard } from "@/lib/card";
import { buscarKit } from "@/lib/kit";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const kit = await buscarKit((await params).codigo);
  const falaId = new URL(request.url).searchParams.get("fala");
  const fala = kit?.falas.find((f) => f.id === falaId);
  if (!kit || !fala) return new NextResponse("Não encontrado", { status: 404 });
  const p = kit.palestrante;
  return gerarCard({
    texto: fala.texto,
    nome: p.nome,
    cargo: p.cargo,
    foto: p.foto_url ? new URL(p.foto_url, request.url).toString() : null,
  });
}
