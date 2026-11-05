import { NextResponse } from "next/server";
import sharp from "sharp";
import { dias } from "@/data/programacao";
import { gerarCard } from "@/lib/card";
import { buscarKit } from "@/lib/kit";

export const dynamic = "force-dynamic";

// Baixa uma imagem (com limite de tempo), ajusta o tamanho e devolve embutida no card.
// O gerador de cards trava se tiver que buscar arquivos sozinho; se a imagem falhar, o card sai sem ela.
async function embutir(url: string, largura: number, altura: number) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const jpeg = await sharp(Buffer.from(await r.arrayBuffer()))
      .rotate()
      .resize(largura, altura, { fit: "cover", position: "attention" })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

// ?fala=<id> → card com a frase · ?modelo=participacao → "palestrante no painel" · ?modelo=fundo → moldura livre
// &fundo=azul força o fundo do congresso; sem isso, usa uma foto do evento em que o palestrante foi marcado.
export async function GET(request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const kit = await buscarKit((await params).codigo);
  if (!kit) return new NextResponse("Não encontrado", { status: 404 });
  const busca = new URL(request.url).searchParams;
  const modelo = busca.get("modelo");
  const p = kit.palestrante;

  if (modelo === "fundo") return gerarCard({ modelo: "fundo" });

  const fala = modelo === "participacao" ? null : kit.falas.find((f) => f.id === busca.get("fala"));
  if (modelo !== "participacao" && !fala) return new NextResponse("Não encontrado", { status: 404 });

  // Cada card usa uma foto diferente, quando houver mais de uma.
  const indice = fala ? kit.falas.indexOf(fala) + 1 : 0;
  const fotoEvento = busca.get("fundo") === "azul" || !kit.fotos.length ? null : kit.fotos[indice % kit.fotos.length].url;
  const [fundo, retrato] = await Promise.all([
    fotoEvento ? embutir(fotoEvento, 1080, 1350) : null,
    p.foto_url ? embutir(new URL(p.foto_url, request.url).toString(), 280, 280) : null,
  ]);
  const pessoa = { nome: p.nome, cargo: p.cargo, foto: retrato, fundo };

  if (fala) return gerarCard({ modelo: "frase", texto: fala.texto, ...pessoa });
  const painel = kit.painel;
  const dia = dias.find((d) => d.data === painel?.data)?.rotulo ?? "";
  const quando = [painel?.numero ? `Painel ${painel.numero}` : "Abertura", dia, painel?.horario].filter(Boolean).join(" · ");
  return gerarCard({ modelo: "participacao", painel: painel?.titulo ?? "", quando, ...pessoa });
}
