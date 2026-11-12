import { NextResponse } from "next/server";
import sharp from "sharp";
import { dias } from "@/data/programacao";
import { FOTO_CARD, type Formato, gerarCard } from "@/lib/card";
import { buscarKit } from "@/lib/kit";

export const dynamic = "force-dynamic";

// Baixa uma imagem (com limite de tempo), ajusta o tamanho e devolve embutida no card.
// O gerador de cards trava se tiver que buscar arquivos sozinho; se a imagem falhar, o card sai sem ela.
// Com `foco` (0 a 1, escolhido pela equipe arrastando a foto no editor do /admin), o recorte segue a mesma regra
// do CSS background-position: 0 = encostado à esquerda/topo, 1 = à direita/embaixo. Sem ele, o sharp escolhe
// a parte mais chamativa (às vezes pega o telão em vez da pessoa).
async function embutir(url: string, largura: number, altura: number, foco?: { x: number; y: number; zoom?: number } | null) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    let jpeg: Buffer;
    if (foco) {
      const { data, info } = await sharp(Buffer.from(await r.arrayBuffer())).rotate().toBuffer({ resolveWithObject: true });
      // zoom > 1 aproxima (a equipe escolhe no editor), igual à prévia do /admin.
      const escala = Math.max(largura / info.width, altura / info.height) * Math.max(1, foco.zoom ?? 1);
      const w = Math.round(info.width * escala);
      const h = Math.round(info.height * escala);
      const left = Math.round(foco.x * (w - largura));
      const top = Math.round(foco.y * (h - altura));
      jpeg = await sharp(data).resize(w, h).extract({ left, top, width: largura, height: altura }).jpeg({ quality: 82 }).toBuffer();
    } else {
      jpeg = await sharp(Buffer.from(await r.arrayBuffer()))
        .rotate()
        .resize(largura, altura, { fit: "cover", position: "attention" })
        .jpeg({ quality: 82 })
        .toBuffer();
    }
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

// ?fala=<id> → card com a frase · ?modelo=participacao → "palestrante no painel" · ?modelo=fundo → moldura livre
// &formato=story → 1080x1920 (Story/Reels); sem ele, feed 1080x1350.
// &fundo=azul força o fundo do congresso; sem isso, usa uma foto do evento em que o palestrante foi marcado.
// O navegador guarda o card por 10 min: a imagem da página e o botão "Salvar" usam o mesmo arquivo, sem gerar de novo.
function comCache(resposta: Response) {
  resposta.headers.set("Cache-Control", "private, max-age=600");
  return resposta;
}

export async function GET(request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const kit = await buscarKit((await params).codigo);
  if (!kit) return new NextResponse("Não encontrado", { status: 404 });
  const busca = new URL(request.url).searchParams;
  const modelo = busca.get("modelo");
  const formato: Formato = busca.get("formato") === "story" ? "story" : "feed";
  const p = kit.palestrante;

  if (modelo === "fundo") return comCache(gerarCard({ modelo: "fundo" }, formato));

  const fala = modelo === "participacao" ? null : kit.falas.find((f) => f.id === busca.get("fala"));
  if (modelo !== "participacao" && !fala) return new NextResponse("Não encontrado", { status: 404 });

  // Cada card usa uma foto diferente, quando houver mais de uma.
  const indice = fala ? kit.falas.indexOf(fala) + 1 : 0;
  const fotoEvento = busca.get("fundo") === "azul" || !kit.fotos.length ? null : kit.fotos[indice % kit.fotos.length];
  const foco = fotoEvento?.foco_x != null ? { x: fotoEvento.foco_x, y: fotoEvento.foco_y ?? 0.5, zoom: fotoEvento.foco_zoom ?? 1 } : null;
  const [fundo, retrato] = await Promise.all([
    fotoEvento ? embutir(fotoEvento.url, FOTO_CARD[formato].largura, FOTO_CARD[formato].altura, foco) : null,
    p.foto_url ? embutir(new URL(p.foto_url, request.url).toString(), 280, 280) : null,
  ]);
  const pessoa = { nome: p.nome, cargo: p.cargo, foto: retrato, fundo };

  if (fala) return comCache(gerarCard({ modelo: "frase", texto: fala.texto, ...pessoa }, formato));
  const painel = kit.painel;
  const dia = dias.find((d) => d.data === painel?.data)?.rotulo ?? "";
  const quando = [painel?.numero ? `Painel ${painel.numero}` : "Abertura", dia, painel?.horario].filter(Boolean).join(" · ");
  return comCache(gerarCard({ modelo: "participacao", painel: painel?.titulo ?? "", quando, ...pessoa }, formato));
}
