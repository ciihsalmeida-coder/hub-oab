import { paineis } from "@/data/programacao";
import { Cartao, TituloCartao } from "../ui";

export const metadata = { title: "Materiais · Área de controle" };

const alvos = [{ slug: "hub", rotulo: "Hub (página inicial)" }, ...paineis.map((p) => ({ slug: p.slug, rotulo: p.numero ? `Painel ${p.numero}` : "Abertura" }))];

export default function Materiais() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Materiais</h1>
        <p className="mt-1 text-muted">Mural para o telão e QR codes prontos para imprimir ou projetar.</p>
      </div>

      <Cartao>
        <TituloCartao
          icone="📺"
          titulo="Mural ao vivo"
          ajuda="Abra na TV ou no telão do saguão e aperte F11 (tela cheia). Ele passa sozinho as frases, fotos e cortes aprovados."
          acao={
            <a href="/mural" target="_blank" className="shrink-0 rounded-full bg-sky px-4 py-2 text-sm font-extrabold text-navy">
              Abrir mural ↗
            </a>
          }
        />
      </Cartao>

      <Cartao>
        <TituloCartao
          icone="🔳"
          titulo="QR codes"
          ajuda="“Arte” já vem com o visual do congresso (feed/telão). “Só o código” é para a designer encaixar em outras peças."
        />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {alvos.map((a) => (
            <li key={a.slug} className="rounded-2xl bg-white/5 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/qr/${a.slug}`} alt={`QR code: ${a.rotulo}`} loading="lazy" className="aspect-[4/5] w-full rounded-xl" />
              <p className="mt-2 text-sm font-bold">{a.rotulo}</p>
              <div className="mt-1 flex gap-2 text-xs font-bold">
                <a href={`/qr/${a.slug}`} download={`qr-${a.slug}-arte.png`} className="text-sky underline">
                  Arte
                </a>
                <a href={`/qr/${a.slug}?simples=1`} className="text-sky underline">
                  Só o código
                </a>
              </div>
            </li>
          ))}
        </ul>
      </Cartao>
    </div>
  );
}
