// Peças visuais da área de controle.

export function Cartao({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[28px] border border-white/12 bg-white/[0.07] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl ${className}`}>{children}</section>;
}

export function TituloCartao({ icone, titulo, ajuda, acao }: { icone: string; titulo: string; ajuda?: string; acao?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-xl ring-1 ring-white/15">{icone}</span>
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
    <div className={`rounded-[28px] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.25)] ${destaque ? "bg-gradient-to-br from-sky to-sea text-white" : "border border-white/12 bg-white/[0.07] backdrop-blur-xl"}`}>
      <span className="text-xl">{icone}</span>
      <p className="mt-2 text-3xl leading-none font-extrabold">{valor}</p>
      <p className={`mt-1 text-xs font-semibold ${destaque ? "text-white/85" : "text-muted"}`}>{rotulo}</p>
    </div>
  );
}

export type Etapa = { icone: string; rotulo: string; estado: "feito" | "andamento" | "pendente" | "erro" };

const corEtapa: Record<Etapa["estado"], string> = {
  feito: "bg-emerald-400/15 text-emerald-200 border-emerald-300/30",
  andamento: "bg-sky/20 text-sky border-sky/40",
  pendente: "bg-white/5 text-white/45 border-white/10",
  erro: "bg-red-400/15 text-red-200 border-red-300/30",
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
