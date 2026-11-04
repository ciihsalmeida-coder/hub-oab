// Teste de carga: simula muita gente abrindo o hub ao mesmo tempo e guarda o resultado no Supabase.
// Roda no GitHub Actions (.github/workflows/carga.yml). Não executa o JavaScript das páginas,
// então não suja as métricas do evento.
import autocannon from "autocannon";

const SITE = process.env.SITE ?? "https://hub-oab.vercel.app";
const SEGUNDOS = Number(process.env.SEGUNDOS ?? 60);
const rotas = [
  { rota: "/", conexoes: 200 },
  { rota: "/paineis/abertura", conexoes: 200 },
  { rota: "/paineis/painel-3", conexoes: 100 },
  { rota: "/api/mural", conexoes: 20 },
];

for (const { rota, conexoes } of rotas) {
  const r = await autocannon({ url: SITE + rota, connections: conexoes, duration: SEGUNDOS });
  const resultado = {
    conexoes,
    segundos: SEGUNDOS,
    pedidos: r.requests.total,
    por_segundo: Math.round(r.requests.average),
    ms_mediana: r.latency.p50,
    ms_p97_5: r.latency.p97_5,
    ms_maximo: r.latency.max,
    status_2xx: r["2xx"],
    status_nao_2xx: r.non2xx,
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
