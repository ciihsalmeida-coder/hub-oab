import { NextResponse } from "next/server";
import { dias } from "@/data/programacao";
import { gerarCard } from "@/lib/card";
import { buscarKit } from "@/lib/kit";

export const dynamic = "force-dynamic";

// ?fala=<id> → card com a frase · ?modelo=participacao → "palestrante no painel" · ?modelo=fundo → moldura livre
export async function GET(request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const kit = await buscarKit((await params).codigo);
  if (!kit) return new NextResponse("Não encontrado", { status: 404 });
  const busca = new URL(request.url).searchParams;
  const modelo = busca.get("modelo");
  const p = kit.palestrante;
  const pessoa = { nome: p.nome, cargo: p.cargo, foto: p.foto_url ? new URL(p.foto_url, request.url).toString() : null };

  if (modelo === "fundo") return gerarCard({ modelo: "fundo" });
  if (modelo === "participacao") {
    const painel = kit.painel;
    const dia = dias.find((d) => d.data === painel?.data)?.rotulo ?? "";
    const quando = [painel?.numero ? `Painel ${painel.numero}` : "Abertura", dia, painel?.horario].filter(Boolean).join(" · ");
    return gerarCard({ modelo: "participacao", painel: painel?.titulo ?? "", quando, ...pessoa });
  }
  const fala = kit.falas.find((f) => f.id === busca.get("fala"));
  if (!fala) return new NextResponse("Não encontrado", { status: 404 });
  return gerarCard({ modelo: "frase", texto: fala.texto, ...pessoa });
}
