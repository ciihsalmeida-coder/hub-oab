import type { Palestrante as P } from "@/data/programacao";

function iniciais(nome: string) {
  const partes = nome.replace(/,.*$/, "").split(" ").filter(Boolean);
  return (partes[0][0] + (partes.at(-1)?.[0] ?? "")).toUpperCase();
}

export function Palestrante({ p }: { p: P }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-xl border bg-card p-3 ${
        p.pendente ? "border-dashed border-red" : "border-line"
      }`}
    >
      {p.foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.foto} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" loading="lazy" />
      ) : (
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-navy font-display text-sm text-cream">
          {iniciais(p.nome)}
        </div>
      )}
      <div className="min-w-0">
        <p className="font-semibold leading-tight">{p.nome}</p>
        <p className="text-sm leading-snug text-muted">{p.cargo}</p>
        {p.pendente && <p className="mt-1 text-xs text-red">⚠ {p.pendente}</p>}
      </div>
    </li>
  );
}
