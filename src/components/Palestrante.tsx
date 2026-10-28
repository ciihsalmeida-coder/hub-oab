import type { Palestrante as P } from "@/data/programacao";

export function iniciais(nome: string) {
  const partes = nome.replace(/,.*$/, "").split(" ").filter(Boolean);
  return (partes[0][0] + (partes.at(-1)?.[0] ?? "")).toUpperCase();
}

export function Avatar({ nome, foto, tamanho = 56 }: { nome: string; foto?: string; tamanho?: number }) {
  const estilo = { width: tamanho, height: tamanho };
  return foto ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={foto} alt="" style={estilo} className="shrink-0 rounded-xl object-cover" loading="lazy" />
  ) : (
    <div style={estilo} className="grid shrink-0 place-items-center rounded-xl bg-sea text-sm font-bold text-white">
      {iniciais(nome)}
    </div>
  );
}

export function Palestrante({ p }: { p: P }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border bg-card p-3 ${
        p.pendente ? "border-dashed border-wine" : "border-line"
      }`}
    >
      <Avatar nome={p.nome} foto={p.foto} />
      <div className="min-w-0">
        <p className="font-bold leading-tight">{p.nome}</p>
        <p className="text-sm leading-snug text-muted">{p.cargo}</p>
        {p.pendente && <p className="mt-1 text-xs font-semibold text-wine">⚠ {p.pendente}</p>}
      </div>
    </li>
  );
}
