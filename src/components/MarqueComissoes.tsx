import { Copiar } from "@/components/Botoes";
import { MARCACOES, PERFIS } from "@/lib/marcacoes";

// Chamada para compartilhar e marcar as comissões organizadoras nas redes.
export function MarqueComissoes({ texto = "Postou algo do congresso? Marque as comissões organizadoras:" }: { texto?: string }) {
  return (
    <div className="rounded-2xl bg-navy p-5 text-white shadow-sm">
      <p className="text-xs font-extrabold tracking-[0.15em] text-sky uppercase">Compartilhe e marque</p>
      <p className="mt-1 font-semibold">{texto}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {PERFIS.map((p) => (
          <li key={p}>
            <a
              href={`https://instagram.com/${p.slice(1)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white ring-1 ring-white/25"
            >
              {p}
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-3 [&_button]:bg-white [&_button]:text-navy">
        <Copiar texto={MARCACOES} rotulo="Copiar os dois @" />
      </div>
    </div>
  );
}
