"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/Palestrante";
import { marcarKitEnviado, salvarPalestrante } from "../acoes";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hub-oab.vercel.app";

type P = { id: string; nome: string; cargo: string; foto_url: string | null; whatsapp: string | null; pendente: string | null };

export function Linha(props: { p: P; codigo: string; enviadoEm: string | null; falas: number; fotos: number }) {
  const { p } = props;
  const [aberto, setAberto] = useState(false);
  const [aviso, setAviso] = useState("");
  const [pendente, iniciar] = useTransition();
  const link = `${SITE}/kit/${props.codigo}`;
  const primeiroNome = p.nome.split(" ")[0];
  const mensagem = `Olá, ${primeiroNome}! Obrigado por participar do XIV Congresso Nacional de Direito Marítimo, Portuário e Aduaneiro. Seu material do painel (fotos, vídeos e cards prontos para postar) está aqui: ${link}`;
  const pronto = props.falas + props.fotos > 0;

  return (
    <li className={`rounded-[24px] border bg-white/[0.07] p-3 backdrop-blur-xl ${p.pendente ? "border-dashed border-red-300/60" : "border-line"}`}>
      <div className="flex items-center gap-3">
        <Avatar nome={p.nome} foto={p.foto_url ?? undefined} tamanho={48} />
        <div className="min-w-0 flex-1">
          <p className="leading-tight font-bold">{p.nome}</p>
          <p className="truncate text-xs text-muted">{p.cargo}</p>
          <p className="mt-1 text-xs">
            {pronto ? `✅ ${props.falas} fala(s), ${props.fotos} foto(s) aprovadas` : "⏳ kit ainda vazio"}
            {props.enviadoEm && " · 📨 enviado"}
          </p>
          {p.pendente && <p className="text-xs font-semibold text-red-300">⚠ {p.pendente}</p>}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
        <a href={`/kit/${props.codigo}`} target="_blank" rel="noreferrer" className="rounded-full border border-white/30 px-3 py-1.5">
          Ver kit ↗
        </a>
        {p.whatsapp ? (
          <a
            href={`https://wa.me/${p.whatsapp}?text=${encodeURIComponent(mensagem)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => iniciar(() => marcarKitEnviado(p.id))}
            className={`rounded-full px-3 py-1.5 text-white ${pronto ? "bg-green-600" : "bg-green-600/50"}`}
          >
            Enviar pelo WhatsApp
          </a>
        ) : (
          <span className="rounded-full bg-fog px-3 py-1.5 text-muted">Sem WhatsApp</span>
        )}
        <button type="button" onClick={() => setAberto(!aberto)} className="rounded-full bg-fog px-3 py-1.5">
          {aberto ? "Fechar" : "Editar"}
        </button>
      </div>
      {aberto && (
        <form
          action={(form) =>
            iniciar(async () => {
              try {
                await salvarPalestrante(p.id, form);
                setAviso("Salvo.");
              } catch {
                setAviso("⚠️ Não foi possível salvar.");
              }
            })
          }
          className="mt-3 space-y-2 text-sm"
        >
          <input name="nome" defaultValue={p.nome} className="w-full rounded-lg border border-line px-3 py-2" />
          <textarea name="cargo" defaultValue={p.cargo} rows={2} className="w-full rounded-lg border border-line px-3 py-2" />
          <input
            name="whatsapp"
            defaultValue={p.whatsapp ?? ""}
            placeholder="WhatsApp com DDD, ex.: 48 99999-9999"
            inputMode="tel"
            className="w-full rounded-lg border border-line px-3 py-2"
          />
          {p.pendente && (
            <label className="flex items-center gap-2">
              <input type="checkbox" name="resolvido" /> Pendência do carômetro resolvida
            </label>
          )}
          <button disabled={pendente} className="rounded-full bg-sky px-4 py-2 font-bold text-navy disabled:opacity-60">
            Salvar
          </button>
          {aviso && <span className="ml-2 font-semibold">{aviso}</span>}
        </form>
      )}
    </li>
  );
}
