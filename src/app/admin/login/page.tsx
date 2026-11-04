"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Assinatura } from "@/components/Marca";
import { supabaseNavegador } from "@/lib/supabase/navegador";

export default function Login() {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(form: FormData) {
    setEnviando(true);
    setErro("");
    const { error } = await supabaseNavegador().auth.signInWithPassword({
      email: String(form.get("email")).trim(),
      password: String(form.get("senha")),
    });
    if (error) {
      setErro("E-mail ou senha incorretos.");
      setEnviando(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      {/* Barra do produto: Mzen hub (o sistema), como em plataformas de login */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marca/mzen.png" alt="Mzen" width={96} height={28} className="h-7 w-auto" />
          <span className="text-2xl leading-none font-semibold tracking-tight text-white">hub</span>
        </div>
      </header>

      <main className="flex justify-center px-4 pt-12 pb-16">
        <form
          action={entrar}
          className="w-full max-w-sm rounded-[28px] border border-white/15 bg-white/[0.08] p-6 shadow-2xl backdrop-blur-xl"
        >
          <h1 className="text-2xl font-extrabold">Entrar no Mzen hub</h1>
          <p className="mt-1 text-sm text-muted">Acesso restrito à equipe. Novos acessos são criados pela Mzen.</p>
          <label className="mt-6 block">
            <span className="text-sm font-semibold">E-mail</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-xl border border-line bg-white/10 px-4 py-3"
            />
          </label>
          <label className="mt-3 block">
            <span className="text-sm font-semibold">Senha</span>
            <input
              name="senha"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-xl border border-line bg-white/10 px-4 py-3"
            />
          </label>
          {erro && <p className="mt-3 text-sm font-semibold text-red-300">{erro}</p>}
          <button
            disabled={enviando}
            className="mt-5 w-full rounded-full bg-sky py-3 font-extrabold text-navy uppercase disabled:opacity-60"
          >
            {enviando ? "Entrando…" : "Entrar"}
          </button>

          {/* De qual evento é este acesso */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="mb-3 text-[10px] font-bold tracking-[0.18em] text-white/50 uppercase">
              XIV Congresso · Direito Marítimo, Portuário e Aduaneiro
            </p>
            <div className="origin-left scale-[0.85]">
              <Assinatura claro empilhada />
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
