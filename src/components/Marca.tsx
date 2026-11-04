import Link from "next/link";

// Assinatura oficial (OAB/SC | ESA | CAASC) + as duas comissões organizadoras.
// No celular as comissões descem para a linha de baixo; no computador ficam ao lado.
export function Assinatura({ claro = false }: { claro?: boolean }) {
  const cor = claro ? "text-white" : "text-navy";
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${cor}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={
          claro ? "/marca/assinatura-branco.png" : "/marca/assinatura-azul.png"
        }
        alt="OAB Santa Catarina, ESA e CAASC"
        width={177}
        height={36}
        className="h-9 w-auto"
      />
      <span
        className={`hidden h-8 w-px sm:block ${claro ? "bg-white/50" : "bg-navy/40"}`}
      />
      <span className="flex basis-full items-center gap-2 text-[10px] leading-tight font-medium sm:basis-auto">
        <span>
          Comissão de Direito
          <br />
          Portuário e Marítimo
        </span>
        <span className={`h-6 w-px ${claro ? "bg-white/40" : "bg-navy/30"}`} />
        <span>
          Comissão de
          <br />
          Direito Aduaneiro
        </span>
      </span>
    </div>
  );
}

// Assinatura da Mzen com o logo colorido (para fundos escuros).
export function SeloMzen({
  texto = "Cobertura audiovisual e tecnologia",
}: {
  texto?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-wide text-white/75">
      {texto}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/marca/mzen.png"
        alt="Mzen"
        width={82}
        height={24}
        className="h-6 w-auto"
      />
    </span>
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
      <p className="mt-6">
        <SeloMzen />
      </p>
    </footer>
  );
}
