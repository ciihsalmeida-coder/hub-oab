"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { supabaseNavegador } from "@/lib/supabase/navegador";
import { fotosEnviadas, marcarPalestranteDaFoto, removerFoto } from "../../acoes";

type Foto = { id: string; url: string; miniatura: string | null; palestranteId: string | null; publicada: boolean };

// Reduz a foto no próprio aparelho antes de enviar: sobe rápido mesmo com internet fraca.
async function reduzir(arquivo: File, lado: number, qualidade: number): Promise<Blob> {
  const imagem = await createImageBitmap(arquivo);
  const escala = Math.min(1, lado / Math.max(imagem.width, imagem.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(imagem.width * escala);
  canvas.height = Math.round(imagem.height * escala);
  canvas.getContext("2d")!.drawImage(imagem, 0, 0, canvas.width, canvas.height);
  imagem.close();
  return new Promise((ok, falha) =>
    canvas.toBlob((b) => (b ? ok(b) : falha(new Error("Não foi possível ler a foto."))), "image/jpeg", qualidade),
  );
}

export function Fotos(props: { slug: string; fotos: Foto[]; palestrantes: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [progresso, setProgresso] = useState<{ feitas: number; total: number; erros: number } | null>(null);
  const [, iniciar] = useTransition();

  async function enviar(arquivos: FileList | null) {
    if (!arquivos?.length) return;
    const lista = Array.from(arquivos).filter((a) => a.type.startsWith("image/"));
    const db = supabaseNavegador();
    let feitas = 0;
    let erros = 0;
    setProgresso({ feitas, total: lista.length, erros });

    const fila = [...lista];
    async function trabalhador() {
      for (let arquivo = fila.shift(); arquivo; arquivo = fila.shift()) {
        try {
          const id = crypto.randomUUID();
          const [grande, mini] = await Promise.all([reduzir(arquivo, 2400, 0.85), reduzir(arquivo, 640, 0.75)]);
          const caminho = `${props.slug}/${id}.jpg`;
          const caminhoMini = `${props.slug}/${id}-mini.jpg`;
          const opcoes = { contentType: "image/jpeg", cacheControl: "31536000" };
          const [r1, r2] = await Promise.all([
            db.storage.from("fotos").upload(caminho, grande, opcoes),
            db.storage.from("fotos").upload(caminhoMini, mini, opcoes),
          ]);
          if (r1.error || r2.error) throw r1.error ?? r2.error;
          const url = db.storage.from("fotos").getPublicUrl(caminho).data.publicUrl;
          const miniatura = db.storage.from("fotos").getPublicUrl(caminhoMini).data.publicUrl;
          const r3 = await db.from("fotos").insert({ id, painel_slug: props.slug, url, miniatura_url: miniatura, ordem: Math.floor(Date.now() / 1000) });
          if (r3.error) throw r3.error;
          feitas++;
        } catch (e) {
          console.error(e);
          erros++;
        }
        setProgresso({ feitas, total: lista.length, erros });
      }
    }
    await Promise.all([trabalhador(), trabalhador(), trabalhador()]);
    await fotosEnviadas(props.slug);
    router.refresh();
  }

  const enviando = progresso && progresso.feitas + progresso.erros < progresso.total;

  return (
    <section>
      <h2 className="text-sm font-extrabold tracking-[0.15em] uppercase">Fotos do painel</h2>
      <p className="mt-1 mb-2 text-sm text-muted">
        Escolha as fotos tratadas. Marque de quem é cada foto para ela entrar no kit do palestrante.
      </p>

      <label
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sky bg-card p-6 text-center ${
          enviando ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <span className="text-3xl">📸</span>
        <span className="mt-1 font-extrabold">Adicionar fotos</span>
        <span className="text-sm text-muted">Toque para escolher várias de uma vez</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => enviar(e.target.files)} />
      </label>

      {progresso && (
        <p className="mt-2 text-sm font-semibold">
          {enviando ? "Enviando" : "Pronto:"} {progresso.feitas} de {progresso.total} foto(s)
          {progresso.erros > 0 && <span className="text-wine"> · {progresso.erros} com erro (tente de novo)</span>}
        </p>
      )}

      {props.fotos.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {props.fotos.map((f) => (
            <li key={f.id} className="overflow-hidden rounded-xl border border-line bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.miniatura ?? f.url} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" />
              <div className="space-y-2 p-2">
                <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${f.publicada ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-900"}`}>
                  {f.publicada ? "Publicada" : "Rascunho"}
                </span>
                <select
                  defaultValue={f.palestranteId ?? ""}
                  onChange={(e) => iniciar(() => marcarPalestranteDaFoto(props.slug, f.id, e.target.value || null))}
                  className="w-full rounded-lg border border-line px-2 py-1 text-xs"
                >
                  <option value="">Foto geral do painel</option>
                  {props.palestrantes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Remover esta foto?")) iniciar(async () => { await removerFoto(props.slug, f.id); router.refresh(); });
                  }}
                  className="text-xs font-semibold text-wine"
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
