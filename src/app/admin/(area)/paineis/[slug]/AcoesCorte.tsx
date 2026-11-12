"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { enquadrarCorte, removerCorte, renomearCorte } from "../../acoes";
import { EnquadrarCorte } from "./EnquadrarCorte";

// Trocar o título e tirar o vídeo do painel (reprovar).
export function AcoesCorte(props: { slug: string; corteId: string; titulo: string; quadro?: string | null; foco?: number | null }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(props.titulo);
  const [confirmando, setConfirmando] = useState(false);
  const [enquadrando, setEnquadrando] = useState(false);

  if (editando)
    return (
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          iniciar(async () => {
            await renomearCorte(props.slug, props.corteId, titulo);
            setEditando(false);
            router.refresh();
          });
        }}
      >
        <input
          id={`titulo-${props.corteId}`}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          autoFocus
          className="min-w-0 flex-1 rounded-xl border border-line bg-white/10 px-3 py-2 text-sm"
        />
        <button disabled={pendente} className="rounded-xl bg-sky px-3 py-2 text-xs font-bold text-navy">
          Salvar
        </button>
      </form>
    );

  if (confirmando)
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold">Tirar este vídeo do painel?</span>
        <button
          disabled={pendente}
          onClick={() => iniciar(async () => { await removerCorte(props.slug, props.corteId); router.refresh(); })}
          className="rounded-full bg-red-500 px-3 py-1.5 font-bold text-white"
        >
          {pendente ? "Tirando…" : "Sim, tirar"}
        </button>
        <button onClick={() => setConfirmando(false)} className="rounded-full bg-white/10 px-3 py-1.5 font-bold">
          Cancelar
        </button>
      </div>
    );

  return (
    <div className="flex flex-wrap gap-2 text-xs font-bold">
      {props.quadro && (
        <button onClick={() => setEnquadrando(true)} className="rounded-full bg-sky/20 px-3 py-1.5 text-sky">
          🎯 Enquadrar quem fala
        </button>
      )}
      {enquadrando && props.quadro && (
        <EnquadrarCorte
          imagem={props.quadro}
          inicial={props.foco ?? null}
          salvando={pendente}
          aoFechar={() => setEnquadrando(false)}
          aoSalvar={(x) =>
            iniciar(async () => {
              await enquadrarCorte(props.slug, props.corteId, x);
              setEnquadrando(false);
              router.refresh();
            })
          }
        />
      )}
      <button onClick={() => setEditando(true)} className="rounded-full bg-white/10 px-3 py-1.5">
        ✏️ Trocar título
      </button>
      <button onClick={() => setConfirmando(true)} className="rounded-full bg-red-500/20 px-3 py-1.5 text-red-200">
        🗑 Tirar vídeo
      </button>
    </div>
  );
}
