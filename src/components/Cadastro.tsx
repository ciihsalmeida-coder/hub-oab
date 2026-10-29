"use client";

import Link from "next/link";
import { useState } from "react";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { supabaseNavegador } from "@/lib/supabase/navegador";

export const TEXTO_CONSENTIMENTO =
  "Aceito que a OAB/SC use meu nome e contato para me enviar os conteúdos do XIV Congresso, conforme o aviso de privacidade.";

// Cadastro opcional do público. Nunca bloqueia o acesso ao conteúdo.
export function Cadastro({ painel }: { painel?: string }) {
  const [estado, setEstado] = useState<"livre" | "enviando" | "ok" | "erro">("livre");

  async function enviar(form: FormData) {
    if (form.get("site")) return setEstado("ok"); // robô preencheu o campo escondido
    setEstado("enviando");
    const { error } = await supabaseNavegador()
      .from("cadastros")
      .insert({
        nome: String(form.get("nome")).trim(),
        email: String(form.get("email")).trim().toLowerCase(),
        whatsapp: String(form.get("whatsapp") || "").trim() || null,
        consentimento: form.get("consentimento") === "on",
        texto_consentimento: TEXTO_CONSENTIMENTO,
        painel_origem: painel ?? null,
      });
    // E-mail repetido (código 23505) conta como sucesso: a pessoa já está na lista.
    setEstado(!error || error.code === "23505" ? "ok" : "erro");
  }

  if (!supabaseConfigurado) return null;

  if (estado === "ok") {
    return (
      <div className="rounded-2xl bg-navy p-5 text-white">
        <p className="text-lg font-extrabold">✅ Pronto!</p>
        <p className="mt-1 text-white/80">Você vai receber os resumos e vídeos do congresso.</p>
      </div>
    );
  }

  return (
    <form action={enviar} className="rounded-2xl bg-navy p-5 text-white">
      <p className="text-lg leading-tight font-extrabold">Quer receber os resumos e vídeos dos painéis?</p>
      <p className="mt-1 text-sm text-white/75">Opcional. O conteúdo continua aberto para todos.</p>
      <input name="site" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div className="mt-4 space-y-3">
        <Campo nome="nome" rotulo="Nome" obrigatorio autoComplete="name" />
        <Campo nome="email" rotulo="E-mail" tipo="email" obrigatorio autoComplete="email" />
        <Campo nome="whatsapp" rotulo="WhatsApp (opcional)" tipo="tel" autoComplete="tel" />
        <label className="flex gap-3 text-sm leading-snug">
          <input type="checkbox" name="consentimento" required className="mt-1 h-5 w-5 shrink-0 accent-sky" />
          <span>
            {TEXTO_CONSENTIMENTO.replace(", conforme o aviso de privacidade.", ",")}{" "}
            conforme o{" "}
            <Link href="/privacidade" className="font-semibold text-sky underline">
              aviso de privacidade
            </Link>
            .
          </span>
        </label>
      </div>
      <button
        disabled={estado === "enviando"}
        className="mt-4 w-full rounded-full bg-sky py-3 font-extrabold text-navy uppercase disabled:opacity-60"
      >
        {estado === "enviando" ? "Enviando…" : "Quero receber"}
      </button>
      {estado === "erro" && (
        <p className="mt-2 text-sm text-red-200">Não foi possível enviar agora. Confira os dados e tente de novo.</p>
      )}
    </form>
  );
}

function Campo(props: { nome: string; rotulo: string; tipo?: string; obrigatorio?: boolean; autoComplete?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{props.rotulo}</span>
      <input
        name={props.nome}
        type={props.tipo ?? "text"}
        required={props.obrigatorio}
        autoComplete={props.autoComplete}
        maxLength={props.tipo === "tel" ? 30 : 200}
        className="mt-1 w-full rounded-xl border-0 bg-white px-4 py-3 text-navy"
      />
    </label>
  );
}
