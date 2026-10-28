import { congresso } from "@/data/programacao";

export function GaleriaBotao({ url = congresso.galeriaUrl }: { url?: string }) {
  return (
    <a
      href={url || undefined}
      aria-disabled={!url}
      className={`flex items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left shadow-lg ${
        url ? "bg-sky text-navy" : "pointer-events-none bg-sky/60 text-navy/70"
      }`}
    >
      <span>
        <span className="block text-base font-extrabold uppercase">📸 Encontre suas fotos</span>
        <span className="block text-sm font-medium">
          {url ? "Tire uma selfie e veja todas as fotos em que você aparece" : "Link da galeria em breve"}
        </span>
      </span>
      <span className="text-2xl">→</span>
    </a>
  );
}
