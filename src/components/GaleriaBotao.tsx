import { congresso } from "@/data/programacao";

export function GaleriaBotao() {
  const url = congresso.galeriaUrl;
  return (
    <a
      href={url || undefined}
      aria-disabled={!url}
      className={`mt-6 inline-block rounded-full px-5 py-3 font-semibold ${
        url ? "bg-red text-white" : "pointer-events-none bg-red/50 text-white/80"
      }`}
    >
      📸 Encontre suas fotos{url ? "" : " (link em breve)"}
    </a>
  );
}
