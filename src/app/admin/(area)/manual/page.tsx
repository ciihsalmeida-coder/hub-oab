import { paineis } from "@/data/programacao";
import { Cartao, TituloCartao } from "../ui";

export const metadata = { title: "Manual do dia · Área de controle" };

// Manual de bolso da equipe para os dias do congresso.
export default function Manual() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Manual do dia</h1>
        <p className="mt-1 text-muted">O passo a passo de cada painel, quem faz o quê e o que fazer se algo der errado.</p>
      </div>

      <Cartao>
        <TituloCartao icone="👥" titulo="Quem faz o quê" />
        <ul className="space-y-3 text-sm">
          <Papel quem="Segunda câmera" faz="Grava o áudio da mesa de som. No fim do painel, entrega o arquivo para a Central de Mídia." />
          <Papel quem="Rafael (direção de vídeo)" faz="Exporta o vídeo do painel em um arquivo único (1080p ou 720p) e entrega para a Central de Mídia." />
          <Papel quem="Central de Mídia" faz="Coloca áudio, vídeo e fotos tratadas nas pastas do Drive, com os nomes certos." />
          <Papel quem="Cilene" faz="Revisa na área de controle, marca quem aparece em cada foto e corte e pede a aprovação." />
          <Papel quem="Aprovador(a) da OAB" faz="Confere e aperta “Aprovar e publicar”." />
        </ul>
      </Cartao>

      <Cartao>
        <TituloCartao icone="⏱️" titulo="Linha do tempo de cada painel" ajuda="Contando a partir do fim do painel." />
        <ol className="space-y-3 text-sm">
          <Passo tempo="0 min" texto="Central de Mídia solta o ÁUDIO da mesa na pasta “Áudio e vídeo do painel”. Primeiro o áudio: ele é leve e sobe rápido." />
          <Passo tempo="+ 2 min" texto="O site percebe o áudio e começa a transcrever (faixa 🎧 no painel)." />
          <Passo tempo="+ 15 a 25 min" texto="Resumo, pontos, falas e trechos de corte aparecem como rascunho (faixa ✅)." />
          <Passo tempo="+ 20 a 40 min" texto="Central de Mídia solta o VÍDEO (mesmo nome do áudio) e as fotos tratadas. O robô corta os vídeos em 10 a 15 min." />
          <Passo tempo="+ 40 a 60 min" texto="Cilene revisa, marca quem aparece nas fotos e cortes, e pede a aprovação pelo WhatsApp." />
          <Passo tempo="Depois do OK" texto="Página pública e kits atualizados em até 1 minuto. Postar os cortes nas redes e enviar os kits pela aba Palestrantes." />
        </ol>
      </Cartao>

      <Cartao>
        <TituloCartao
          icone="📁"
          titulo="Nomes dos arquivos"
          ajuda="Áudio e vídeo do mesmo painel com o MESMO nome. É assim que o robô sabe que são da mesma gravação."
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted uppercase">
              <tr>
                <th className="py-2 pr-3">Painel</th>
                <th className="py-2 pr-3">Áudio</th>
                <th className="py-2">Vídeo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {paineis.map((p) => (
                <tr key={p.slug}>
                  <td className="py-2 pr-3 font-bold">{p.numero ? `Painel ${p.numero}` : "Abertura"}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{p.slug}.mp3</td>
                  <td className="py-2 font-mono text-xs">{p.slug}.mp4</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-4 space-y-1 text-sm text-muted">
          <li>📸 Fotos tratadas do painel → pasta “Fotos do painel”.</li>
          <li>🧑‍💼 Retratos de cada palestrante → “Fotos por palestrante” → pasta com o nome dele.</li>
          <li>🎬 Cortes editados pelo Rafael ou pelo Opus Clip → “Cortes de vídeo” (até 45 MB cada).</li>
        </ul>
      </Cartao>

      <Cartao>
        <TituloCartao icone="✅" titulo="O que conferir antes de pedir a aprovação" />
        <ul className="space-y-2 text-sm">
          <Item>As falas estão fiéis ao que foi dito? Nenhuma frase foi atribuída à pessoa errada?</Item>
          <Item>Nomes e cargos batem com o carômetro?</Item>
          <Item>Cada corte tem “Quem aparece no vídeo?” preenchido? (é isso que leva o vídeo para o kit)</Item>
          <Item>As fotos dos palestrantes estão marcadas com o nome certo?</Item>
          <Item>O resumo não tem dado, número ou lei que não foi dito no painel?</Item>
        </ul>
      </Cartao>

      <Cartao className="border-amber-300/40">
        <TituloCartao icone="🛟" titulo="Plano B" ajuda="Se algo der errado, nesta ordem." />
        <ul className="space-y-4 text-sm">
          <Problema titulo="A internet do resort caiu ou está lenta">
            Rotear a internet do celular (4G/5G) para o notebook da Central de Mídia. Subir primeiro só o ÁUDIO (é pequeno). O vídeo
            pode esperar a internet voltar: os textos saem sem ele.
          </Problema>
          <Problema titulo="A faixa do painel mostra ⚠️ erro na IA">
            Apertar “🔄 Refazer com a IA”. Se der erro de novo, escrever os 3 pontos e o resumo à mão no editor: o resto do sistema
            funciona igual.
          </Problema>
          <Problema titulo="O robô de cortes não entregou os vídeos">
            Apertar “🎬 Refazer cortes”. Se não resolver, o Rafael (ou o Opus Clip) corta e solta na pasta “Cortes de vídeo”: entra
            sozinho como rascunho.
          </Problema>
          <Problema titulo="As fotos não chegam do Drive">
            Abrir o painel e usar “Plano B: enviar fotos direto do computador”, no cartão de fotos.
          </Problema>
          <Problema titulo="O aprovador da OAB não responde">
            Pedir de novo pelo botão do WhatsApp. Nada é publicado sem o OK: melhor atrasar do que publicar sem aprovação.
          </Problema>
        </ul>
      </Cartao>
    </div>
  );
}

function Papel({ quem, faz }: { quem: string; faz: string }) {
  return (
    <li className="rounded-2xl bg-white/5 p-3">
      <p className="font-bold">{quem}</p>
      <p className="text-muted">{faz}</p>
    </li>
  );
}

function Passo({ tempo, texto }: { tempo: string; texto: string }) {
  return (
    <li className="flex gap-3">
      <span className="w-24 shrink-0 rounded-full bg-sky/20 px-2 py-1 text-center text-xs font-extrabold text-sky">{tempo}</span>
      <span className="pt-0.5">{texto}</span>
    </li>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="text-sky">☐</span>
      <span>{children}</span>
    </li>
  );
}

function Problema({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <li>
      <p className="font-bold">{titulo}</p>
      <p className="mt-1 text-muted">{children}</p>
    </li>
  );
}
