import { notFound } from "next/navigation";
import { GaleriaBotao } from "@/components/GaleriaBotao";
import { Assinatura, Voltar } from "@/components/Marca";
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
      <header className="ceu-mar px-4 pt-6 pb-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-4">
            <Voltar />
          </div>
          <div className="mt-5">
            <Assinatura />
          </div>
          <p className="mt-6 text-xs font-extrabold tracking-[0.2em] text-wine uppercase">
            {painel.numero ? `Painel ${painel.numero} · ` : ""}
            {painel.area} · {dia} · {painel.horario}
          </p>
          <h1 className="mt-2 text-2xl leading-tight font-extrabold text-navy sm:text-3xl">{painel.titulo}</h1>
          <div className="mt-24">
            <GaleriaBotao />
          </div>
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
        <Secao titulo="Resumo do painel">
          <EmBreve>O resumo com as principais ideias aparece aqui no mesmo dia do painel.</EmBreve>
        </Secao>
        <Secao titulo="Cortes em vídeo">
          <EmBreve>Os melhores momentos em vídeo aparecem aqui no mesmo dia do painel.</EmBreve>
        </Secao>
        <Secao titulo="Fotos do painel">
          <EmBreve>A seleção de fotos aparece aqui até 2 horas depois do painel.</EmBreve>
        </Secao>
      </div>
    </main>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-extrabold tracking-[0.15em] text-navy uppercase">{titulo}</h2>
      {children}
    </section>
  );
}

function EmBreve({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line bg-card/60 p-4 text-sm text-muted">{children}</p>;
}
