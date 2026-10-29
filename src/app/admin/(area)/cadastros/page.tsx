import { exigirEquipe } from "@/lib/equipe";

export const dynamic = "force-dynamic";

export default async function Cadastros() {
  const { db } = await exigirEquipe();
  const { data } = await db.from("cadastros").select("nome, email, whatsapp, painel_origem, criado_em").order("criado_em", { ascending: false });
  const lista = data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">Cadastros do público</h1>
        <a href="/admin/cadastros/planilha" className="ml-auto rounded-full bg-navy px-4 py-2 text-sm font-bold text-white">
          ⬇ Baixar planilha
        </a>
      </div>
      <p className="mt-1 text-sm text-muted">
        {lista.length} pessoa(s). Os dados pertencem à OAB/SC e só podem ser usados para enviar conteúdos do congresso.
      </p>
      <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
        {lista.map((c) => (
          <li key={c.email} className="p-3 text-sm">
            <p className="font-bold">{c.nome}</p>
            <p className="text-muted">
              {c.email}
              {c.whatsapp ? ` · ${c.whatsapp}` : ""}
            </p>
          </li>
        ))}
        {!lista.length && <li className="p-4 text-sm text-muted">Nenhum cadastro ainda.</li>}
      </ul>
    </div>
  );
}
