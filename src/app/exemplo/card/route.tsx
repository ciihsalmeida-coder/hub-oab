import { gerarCard } from "@/lib/card";
import { falas } from "../dados";

// Card de demonstração com fala fictícia.
export function GET(request: Request) {
  const i = Number(new URL(request.url).searchParams.get("i") ?? 0);
  const fala = falas[i] ?? falas[0];
  return gerarCard({ texto: fala.texto, nome: fala.quem, cargo: fala.cargo });
}
