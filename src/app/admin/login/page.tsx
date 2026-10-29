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
    <main className="ceu-mar flex min-h-screen items-start justify-center px-4 pt-16">
      <div className="w-full max-w-sm">
        <Assinatura />
        <form action={entrar} className="mt-8 rounded-2xl bg-card p-6 shadow-lg">
          <h1 className="text-xl font-extrabold">Área de controle</h1>
          <p className="mt-1 text-sm text-muted">Acesso restrito à equipe do congresso.</p>
          <label className="mt-5 block">
            <span className="text-sm font-semibold">E-mail</span>
            <input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-xl border border-line px-4 py-3" />
          </label>
          <label className="mt-3 block">
            <span className="text-sm font-semibold">Senha</span>
            <input name="senha" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-xl border border-line px-4 py-3" />
          </label>
          {erro && <p className="mt-3 text-sm font-semibold text-wine">{erro}</p>}
          <button disabled={enviando} className="mt-5 w-full rounded-full bg-navy py-3 font-extrabold text-white uppercase disabled:opacity-60">
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
