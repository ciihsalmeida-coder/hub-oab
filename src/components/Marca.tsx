import Link from "next/link";

// Assinatura institucional. Trocar pelo logo oficial quando a OAB enviar os arquivos.
export function Assinatura({ claro = false }: { claro?: boolean }) {
  const cor = claro ? "text-white" : "text-navy";
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${cor}`}>
      <span className="leading-none">
        <span className="block text-3xl font-extrabold tracking-tight">OAB</span>
        <span className="block text-[9px] font-bold tracking-wide">SANTA CATARINA</span>
      </span>
      <span className={`h-8 w-px ${claro ? "bg-white/50" : "bg-navy/40"}`} />
      <span className="text-[10px] leading-tight font-medium">
        Comissão de Direito
        <br />
        Portuário e Marítimo
      </span>
      <span className={`h-8 w-px ${claro ? "bg-white/50" : "bg-navy/40"}`} />
      <span className="text-[10px] leading-tight font-medium">
        Comissão de
        <br />
        Direito Aduaneiro
      </span>
    </div>
  );
}

export function TituloCongresso({ tamanho = "grande" }: { tamanho?: "grande" | "pequeno" }) {
  const cls = tamanho === "grande" ? "text-[26px] sm:text-4xl" : "text-sm";
  return (
    <p className={`${cls} leading-[1.1] font-light uppercase text-navy`}>
      <strong className="font-extrabold">XIV Congresso</strong> Nacional de Direito Marítimo, Portuário e
      Aduaneiro das <strong className="font-extrabold">Seccionais OAB 2026</strong>
    </p>
  );
}

export function FaixaLocal() {
  return (
    <div className="flex flex-col text-sm font-bold uppercase sm:flex-row">
      <div className="flex flex-1">
        <span className="w-3 bg-wine sm:w-10" />
        <span className="flex-1 bg-navy px-4 py-2 text-sky">
          Costão do Santinho · <span className="font-medium text-white">Florianópolis</span>
        </span>
      </div>
      <span className="bg-sky px-4 py-2 text-navy">11, 12 e 13 de novembro</span>
    </div>
  );
}

export function Voltar({ href = "/", children = "Programação" }: { href?: string; children?: React.ReactNode }) {
  return (
    <Link href={href} className="inline-block text-sm font-semibold text-navy/70">
      ← {children}
    </Link>
  );
}

export function Rodape() {
  return (
    <footer className="mt-10 bg-navy px-4 py-8 text-center text-xs text-white/70">
      <p className="font-semibold text-white">XIV Congresso Nacional de Direito Marítimo, Portuário e Aduaneiro</p>
      <p className="mt-1">OAB Santa Catarina · Costão do Santinho, Florianópolis</p>
      <p className="mt-4">Cobertura Mzen Films</p>
    </footer>
  );
}
