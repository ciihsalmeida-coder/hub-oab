import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { autorizado } from "@/lib/autorizacao";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

// O robô de cortes manda 3 quadros (JPEG em base64) do trecho, em plano aberto, e o nome de quem fala.
// A IA devolve onde está o rosto dessa pessoa (0 = borda esquerda, 1 = borda direita), para o
// corte vertical 9:16 enquadrar quem está falando em vez do meio da mesa.
const esquema = {
  type: "object",
  additionalProperties: false,
  required: ["centro_x", "achou"],
  properties: {
    centro_x: { type: "number", description: "Posição horizontal do centro do rosto de quem fala, de 0 (esquerda) a 1 (direita)." },
    achou: { type: "boolean", description: "false se não deu para identificar quem está falando." },
  },
};

export async function POST(request: NextRequest) {
  if (!(await autorizado(request))) return NextResponse.json({ erro: "Sem permissão." }, { status: 401 });
  const { imagens, palestrante } = (await request.json()) as { imagens: string[]; palestrante?: string | null };
  if (!imagens?.length) return NextResponse.json({ erro: "Sem imagens." }, { status: 400 });

  const anthropic = new Anthropic();
  const resposta = await anthropic.beta.messages
    .stream({
      model: "claude-opus-5-5",
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "high", format: { type: "json_schema", schema: esquema } },
      messages: [
        {
          role: "user",
          content: [
            ...imagens.slice(0, 4).map((data) => ({
              type: "image" as const,
              source: { type: "base64" as const, media_type: "image/jpeg" as const, data },
            })),
            {
              type: "text" as const,
              text: `São quadros de um mesmo trecho de vídeo de um painel de congresso, gravado em plano aberto.
${palestrante ? `Quem está falando neste trecho é ${palestrante}.` : "Descubra quem está falando."}
Indique a posição horizontal do centro do rosto da pessoa que está falando: quem fala ao microfone, com a boca aberta, gesticulando ou de pé no púlpito.
Ignore pessoas que aparecem dentro do telão ou de slides. Se não der para saber, responda achou = false.`,
            },
          ],
        },
      ],
    })
    .finalMessage();
  if (resposta.stop_reason === "refusal") return NextResponse.json({ achou: false });
  const texto = resposta.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  const r = JSON.parse(texto) as { centro_x: number; achou: boolean };
  return NextResponse.json({ achou: r.achou, centro_x: Math.min(1, Math.max(0, Number(r.centro_x) || 0.5)) });
}
