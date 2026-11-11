"use client";

import { useEffect, useState } from "react";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type Aparelho = "iphone" | "android" | "outro";

function detectar(): Aparelho {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "iphone";
  if (/Android/i.test(ua)) return "android";
  return "outro";
}

export function Instalar() {
  const [aparelho, setAparelho] = useState<Aparelho | null>(null);
  const [instalado, setInstalado] = useState(false);
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [escolha, setEscolha] = useState<"iphone" | "android" | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- só dá para ler o aparelho no navegador
    setAparelho(detectar());
    setInstalado(window.matchMedia("(display-mode: standalone)").matches);
    const guardar = (e: Event) => {
      e.preventDefault();
      setPrompt(e as PromptEvent);
    };
    window.addEventListener("beforeinstallprompt", guardar);
    return () => window.removeEventListener("beforeinstallprompt", guardar);
  }, []);

  if (instalado) {
    return (
      <Caixa>
        <p className="text-lg font-extrabold">✅ Deu certo!</p>
        <p className="mt-1">Você está usando o app do congresso. Ele fica na sua tela inicial, como um aplicativo.</p>
      </Caixa>
    );
  }

  const aba = escolha ?? (aparelho === "android" ? "android" : "iphone");

  return (
    <div className="space-y-4">
      {prompt && (
        <button
          onClick={async () => {
            await prompt.prompt();
            if ((await prompt.userChoice).outcome === "accepted") setInstalado(true);
          }}
          className="w-full rounded-2xl bg-sky py-4 text-lg font-extrabold text-navy uppercase shadow-lg"
        >
          📲 Instalar agora
        </button>
      )}

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-navy/10 p-1" role="tablist">
        {(["iphone", "android"] as const).map((a) => (
          <button
            key={a}
            role="tab"
            aria-selected={aba === a}
            onClick={() => setEscolha(a)}
            className={`rounded-xl py-2.5 text-sm font-extrabold transition ${
              aba === a ? "bg-navy text-white shadow" : "text-navy/70"
            }`}
          >
            {a === "iphone" ? "📱 iPhone" : "🤖 Android"}
          </button>
        ))}
      </div>

      {aba === "iphone" ? (
        <Passos
          titulo="No iPhone (Safari)"
          passos={[
            <>Abra este link no <strong>Safari</strong>, o navegador com ícone de bússola 🧭.</>,
            <>Toque nos <strong>três pontinhos ⋯</strong>, no canto de baixo, à direita. (Se a barra de baixo já mostrar o botão Compartilhar ⬆️, toque direto nele.)</>,
            <>No menu que abre, toque em <strong>Compartilhar</strong>, o quadrado com uma seta para cima ⬆️.</>,
            <>Role a lista e toque em <strong>Adicionar à Tela de Início</strong> ➕. Se não aparecer, toque antes em <strong>Ver mais</strong>.</>,
            <>Toque em <strong>Adicionar</strong>, no canto de cima.</>,
            <>Pronto! O ícone <strong>Congresso OAB</strong> aparece na sua tela inicial.</>,
          ]}
        />
      ) : (
        <Passos
          titulo="No Android (Chrome)"
          passos={[
            <>Abra este link no <strong>Chrome</strong>.</>,
            <>Se aparecer o botão azul <strong>Instalar agora</strong> acima, toque nele e confirme.</>,
            <>Se não aparecer, toque nos <strong>três pontinhos ⋮</strong>, no canto de cima.</>,
            <>Toque em <strong>Adicionar à tela inicial</strong> ou <strong>Instalar app</strong>.</>,
            <>Confirme em <strong>Instalar</strong>. O ícone <strong>Congresso OAB</strong> aparece na sua tela inicial.</>,
          ]}
        />
      )}
    </div>
  );
}

function Caixa({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border-2 border-sky bg-card p-5">{children}</div>;
}

function Passos({ titulo, passos }: { titulo: string; passos: React.ReactNode[] }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <h3 className="text-xs font-extrabold tracking-[0.15em] text-muted uppercase">{titulo}</h3>
      <ol className="mt-4 space-y-4">
        {passos.map((p, i) => (
          <li key={i} className="flex gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy font-extrabold text-white">
              {i + 1}
            </span>
            <p className="pt-1 leading-snug">{p}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
