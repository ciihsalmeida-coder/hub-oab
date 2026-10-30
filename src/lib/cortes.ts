import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

const REPO = "ciihsalmeida-coder/hub-oab";
const INTERVALO_MS = 20 * 60_000; // espera entre disparos do mesmo painel

// Acorda o robô de cortes (GitHub Actions) para painéis com trechos sem vídeo ou cortes sem versão leve.
export async function dispararCortes() {
  if (!process.env.GITHUB_TOKEN) return [];
  const db = supabaseAdmin();
  const [{ data: pendentes }, { data: semVersaoLeve }, { data: videos }, { data: paineis }] = await Promise.all([
    db.from("cortes").select("painel_slug").eq("origem", "auto").is("video_url", null).lt("tentativas", 3),
    db.from("cortes").select("painel_slug").not("video_url", "is", null).is("video_web_url", null),
    db.from("envios").select("painel_slug").eq("tipo", "video"),
    db.from("paineis").select("slug, cortes_disparado_em"),
  ]);
  const comVideo = new Set((videos ?? []).map((v) => v.painel_slug));
  const agora = Date.now();
  const precisam = new Set([
    ...(pendentes ?? []).map((c) => c.painel_slug).filter((slug) => comVideo.has(slug)),
    ...(semVersaoLeve ?? []).map((c) => c.painel_slug),
  ]);
  const alvos = [...precisam].filter((slug) => {
    const ultimo = paineis?.find((p) => p.slug === slug)?.cortes_disparado_em;
    return !ultimo || agora - new Date(ultimo).getTime() > INTERVALO_MS;
  });

  for (const painel of alvos) {
    const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/cortes.yml/dispatches`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
      },
      body: JSON.stringify({ ref: "main", inputs: { painel } }),
    });
    if (!r.ok) throw new Error(`GitHub ${r.status}: ${await r.text()}`);
    await db.from("paineis").update({ cortes_disparado_em: new Date().toISOString() }).eq("slug", painel);
  }
  return alvos;
}
