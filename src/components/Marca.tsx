import Link from "next/link";

// Assinatura institucional, como no cartaz: OAB/SC | Comissões | ESA | CAASC.
// No celular vira duas linhas (OAB · ESA · CAASC em cima, Comissões embaixo); no computador, uma.
export function Assinatura({ claro = false }: { claro?: boolean }) {
  const cor = claro ? "text-white" : "text-navy";
  const barra = `h-7 w-px ${claro ? "bg-white/50" : "bg-navy/40"}`;
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-3 ${cor}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={claro ? "/marca/oab-branco.png" : "/marca/oab-azul.png"}
        alt="OAB Santa Catarina"
        width={72}
        height={38}
        className="h-[38px] w-auto"
      />
      <span className={`${barra} hidden sm:block`} />
      <span className="order-3 flex basis-full items-center gap-2 sm:order-none sm:basis-auto">
        <span className="text-base font-extrabold tracking-tight">Comissões</span>
        <span className="text-[9px] leading-tight font-medium">
          Comissão de Direito
          <br />
          Portuário e Marítimo
        </span>
        <span className={`h-5 w-px ${claro ? "bg-white/40" : "bg-navy/30"}`} />
        <span className="text-[9px] leading-tight font-medium">
          Comissão de
          <br />
          Direito Aduaneiro
        </span>
      </span>
      <span className="flex items-center gap-3">
        <span className={barra} />
        <span className="text-base font-extrabold">ESA</span>
        <span className={barra} />
        <span className="text-base font-extrabold">CAASC</span>
      </span>
    </div>
  );
}

export function TituloCongresso({
  tamanho = "grande",
}: {
  tamanho?: "grande" | "pequeno";
}) {
  const cls = tamanho === "grande" ? "text-[26px] sm:text-4xl" : "text-sm";
  return (
    <p className={`${cls} leading-[1.1] font-light uppercase text-navy`}>
      <strong className="font-extrabold">XIV Congresso</strong> Nacional de
      Direito Marítimo, Portuário e Aduaneiro das{" "}
      <strong className="font-extrabold">Seccionais OAB 2026</strong>
    </p>
  );
}

export function FaixaLocal() {
  return (
    <div className="flex flex-col text-sm font-bold uppercase sm:flex-row">
      <div className="flex flex-1">
        <span className="w-3 bg-wine sm:w-10" />
        <span className="flex-1 bg-navy px-4 py-2 text-sky">
          Costão do Santinho ·{" "}
          <span className="font-medium text-white">Florianópolis</span>
        </span>
      </div>
      <span className="bg-sky px-4 py-2 text-navy">
        11, 12 e 13 de novembro
      </span>
    </div>
  );
}

export function Voltar({
  href = "/",
  children = "Programação",
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-block text-sm font-semibold text-navy/70"
    >
      ← {children}
    </Link>
  );
}

export function Rodape() {
  return (
    <footer className="mt-10 bg-navy px-4 py-8 text-center text-xs text-white/70">
      <p className="font-semibold text-white">
        XIV Congresso Nacional de Direito Marítimo, Portuário e Aduaneiro
      </p>
      <p className="mt-1">
        OAB Santa Catarina · Costão do Santinho, Florianópolis
      </p>
      <p className="mt-6 flex items-center justify-center gap-2 text-[11px] tracking-wide text-white/50">
        Cobertura e tecnologia
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/marca/mzen-branco.png"
          alt="Mzen"
          width={56}
          height={16}
          className="h-4 w-auto opacity-70"
        />
      </p>
    </footer>
  );
}
