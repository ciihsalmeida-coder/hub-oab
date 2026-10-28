import Link from "next/link";
import { notFound } from "next/navigation";
import { GaleriaBotao } from "@/components/GaleriaBotao";
import { Palestrante } from "@/components/Palestrante";
import { dias, getPainel, paineis } from "@/data/programacao";

export function generateStaticParams() {
  return paineis.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const painel = getPainel((await params).slug);
  return { title: painel ? `${painel.titulo} · XIV Congresso OAB` : "Painel" };
}

export default async function PainelPage({ params }: { params: Promise<{ slug: string }> }) {
  const painel = getPainel((await params).slug);
  if (!painel) notFound();
  const dia = dias.find((d) => d.data === painel.data)?.rotulo;

  return (
    <main>
      <header className="bg-navy px-4 pb-8 pt-6 text-cream">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-sm text-cream/70">← Programação</Link>
          <p className="mt-4 text-xs font-semibold tracking-[0.2em] text-red uppercase">
            {painel.numero ? `Painel ${painel.numero} · ` : ""}
            {painel.area} · {dia} · {painel.horario}
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">{painel.titulo}</h1>
          <GaleriaBotao />
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
        <Secao titulo="Palestrantes">
          <ul className="grid gap-3 sm:grid-cols-2">
            {painel.palestrantes.map((p) => (
              <Palestrante key={p.nome} p={p} />
            ))}
          </ul>
        </Secao>

        <Secao titulo="Resumo do debate">
          <EmBreve>O resumo aparece aqui depois do painel, com aprovação da organização.</EmBreve>
        </Secao>
        <Secao titulo="Principais falas">
          <EmBreve>As falas de destaque de cada palestrante aparecem aqui depois do painel.</EmBreve>
        </Secao>
        <Secao titulo="Cortes de vídeo">
          <EmBreve>Os cortes em vídeo aparecem aqui no mesmo dia do painel.</EmBreve>
        </Secao>
        <Secao titulo="Fotos do painel">
          <EmBreve>A seleção de fotos aparece aqui depois do painel.</EmBreve>
        </Secao>
      </div>
    </main>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-xl font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

function EmBreve({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">{children}</p>;
}
