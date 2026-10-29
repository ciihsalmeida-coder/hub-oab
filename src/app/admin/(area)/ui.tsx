// Peças visuais da área de controle.

export function Cartao({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-line/70 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

export function TituloCartao({ icone, titulo, ajuda, acao }: { icone: string; titulo: string; ajuda?: string; acao?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-fog text-xl">{icone}</span>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg leading-tight font-extrabold">{titulo}</h2>
        {ajuda && <p className="mt-0.5 text-sm text-muted">{ajuda}</p>}
      </div>
      {acao}
    </div>
  );
}

export function Numero({ valor, rotulo, icone, destaque = false }: { valor: number | string; rotulo: string; icone: string; destaque?: boolean }) {
  return (
    <div className={`rounded-3xl p-4 shadow-sm ${destaque ? "bg-navy text-white" : "border border-line/70 bg-white"}`}>
      <span className="text-xl">{icone}</span>
      <p className="mt-2 text-3xl leading-none font-extrabold">{valor}</p>
      <p className={`mt-1 text-xs font-semibold ${destaque ? "text-white/75" : "text-muted"}`}>{rotulo}</p>
    </div>
  );
}

export type Etapa = { icone: string; rotulo: string; estado: "feito" | "andamento" | "pendente" | "erro" };

const corEtapa: Record<Etapa["estado"], string> = {
  feito: "bg-green-100 text-green-900 border-green-200",
  andamento: "bg-sky/15 text-navy border-sky/40",
  pendente: "bg-fog text-muted border-line",
  erro: "bg-red-50 text-wine border-wine/30",
};

export function Etapas({ etapas }: { etapas: Etapa[] }) {
  return (
    <ol className="flex flex-wrap gap-1.5">
      {etapas.map((e) => (
        <li key={e.rotulo} className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${corEtapa[e.estado]}`}>
          <span>{e.estado === "feito" ? "✓" : e.icone}</span>
          {e.rotulo}
        </li>
      ))}
    </ol>
  );
}
