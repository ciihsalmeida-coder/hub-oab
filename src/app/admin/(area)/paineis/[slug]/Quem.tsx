"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { marcarPalestranteDoCorte } from "../../acoes";

export function QuemNoCorte(props: { slug: string; corteId: string; atual: string | null; palestrantes: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  return (
    <select
      defaultValue={props.atual ?? ""}
      disabled={pendente}
      onChange={(e) =>
        iniciar(async () => {
          await marcarPalestranteDoCorte(props.slug, props.corteId, e.target.value || null);
          router.refresh();
        })
      }
      className={`w-full rounded-xl border px-3 py-2 text-sm ${props.atual ? "border-line" : "border-amber-400 bg-amber-50"}`}
    >
      <option value="">Quem aparece no vídeo?</option>
      {props.palestrantes.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nome}
        </option>
      ))}
    </select>
  );
}
