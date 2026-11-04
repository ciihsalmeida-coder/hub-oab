// Teste de carga: simula muita gente abrindo o hub e guarda o resultado no Supabase.
// Roda no GitHub Actions (.github/workflows/carga.yml). Não executa o JavaScript das páginas,
// então não suja as métricas do evento.
// Atenção: tudo sai de UMA máquina. Acima de alguns milhares de pedidos por segundo a Vercel
// entende como ataque e bloqueia essa máquina (é a proteção funcionando, não o site caindo).
// Por isso o teste usa um ritmo fixo, realista para o congresso, com folga.
import autocannon from "autocannon";

const SITE = process.env.SITE ?? "https://hub-oab.vercel.app";
const SEGUNDOS = Number(process.env.SEGUNDOS ?? 60);
const etapas = [
  // ~1.800 pessoas abrindo o QR code no mesmo minuto
  { rota: "/", conexoes: 50, porSegundo: 30 },
  { rota: "/paineis/abertura", conexoes: 50, porSegundo: 30 },
  // pico 3x maior, para medir a folga
  { rota: "/", conexoes: 100, porSegundo: 100 },
  { rota: "/paineis/painel-3", conexoes: 100, porSegundo: 100 },
  // 10 telões atualizando o mural (cada um a cada 60 s) com folga de 30x
  { rota: "/api/mural", conexoes: 5, porSegundo: 5 },
];

for (const { rota, conexoes, porSegundo } of etapas) {
  const r = await autocannon({ url: SITE + rota, connections: conexoes, overallRate: porSegundo, duration: SEGUNDOS });
  const codigos = Object.fromEntries(Object.entries(r.statusCodeStats ?? {}).map(([c, v]) => [c, v.count]));
  const resultado = {
    conexoes,
    ritmo_por_segundo: porSegundo,
    segundos: SEGUNDOS,
    pedidos: r.requests.total,
    ms_mediana: r.latency.p50,
    ms_p97_5: r.latency.p97_5,
    ms_maximo: r.latency.max,
    codigos,
    erros_conexao: r.errors,
    timeouts: r.timeouts,
  };
  console.log(rota, resultado);
  const salvo = await fetch(`${process.env.SUPABASE_URL}/rest/v1/testes_carga`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SECRET_KEY,
      authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
      "content-type": "application/json",
      prefer: "return=minimal",
    },
    body: JSON.stringify({ rota, resultado }),
  });
  if (!salvo.ok) console.error("Não salvou no Supabase:", salvo.status, await salvo.text());
}
