"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirEquipe } from "@/lib/equipe";

type FalaRascunho = { texto: string; palestranteId: string | null };

function atualizarSite(slug: string) {
  revalidatePath("/");
  revalidatePath(`/paineis/${slug}`);
  revalidatePath(`/admin/paineis/${slug}`);
  revalidatePath("/admin");
}

// Salva o rascunho. Qualquer edição volta o texto para "aguardando aprovação".
export async function salvarRascunho(slug: string, form: FormData) {
  const { db, membro } = await exigirEquipe();
  if (!membro) throw new Error("Sem permissão.");

  const pontos = form.getAll("ponto").map(String).map((p) => p.trim()).filter(Boolean);
  const falas: FalaRascunho[] = JSON.parse(String(form.get("falas") || "[]"));

  const painel = await db
    .from("paineis")
    .update({ resumo: String(form.get("resumo") || "").trim() || null, pontos, status_texto: "rascunho", atualizado_em: new Date().toISOString() })
    .eq("slug", slug);
  if (painel.error) throw painel.error;

  const apagar = await db.from("falas").delete().eq("painel_slug", slug);
  if (apagar.error) throw apagar.error;
  const validas = falas.filter((f) => f.texto.trim());
  if (validas.length) {
    const inserir = await db.from("falas").insert(
      validas.map((f, i) => ({ painel_slug: slug, texto: f.texto.trim(), palestrante_id: f.palestranteId || null, ordem: i })),
    );
    if (inserir.error) throw inserir.error;
  }
  atualizarSite(slug);
}

// Publica texto, falas, fotos e cortes do painel. Só quem tem papel de aprovador (a pessoa indicada pela OAB).
export async function aprovar(slug: string) {
  const { db, membro } = await exigirEquipe();
  if (membro?.papel !== "aprovador") throw new Error("Só o aprovador da OAB pode publicar.");

  const { data: painel, error } = await db.from("paineis").select("resumo, pontos").eq("slug", slug).single();
  if (error) throw error;
  const r1 = await db
    .from("paineis")
    .update({
      resumo_publicado: painel.resumo,
      pontos_publicados: painel.pontos,
      status_texto: "publicado",
      aprovado_por: membro.userId,
      aprovado_em: new Date().toISOString(),
    })
    .eq("slug", slug);
  if (r1.error) throw r1.error;
  for (const tabela of ["falas", "fotos", "cortes"]) {
    const r = await db.from(tabela).update({ status: "publicado" }).eq("painel_slug", slug);
    if (r.error) throw r.error;
  }
  atualizarSite(slug);
}

// Tira o texto e as falas do ar (por exemplo, se a OAB pedir uma correção).
export async function despublicar(slug: string) {
  const { db, membro } = await exigirEquipe();
  if (membro?.papel !== "aprovador") throw new Error("Só o aprovador da OAB pode despublicar.");
  const r1 = await db
    .from("paineis")
    .update({ resumo_publicado: null, pontos_publicados: [], status_texto: "rascunho" })
    .eq("slug", slug);
  if (r1.error) throw r1.error;
  for (const tabela of ["falas", "fotos", "cortes"]) {
    const r = await db.from(tabela).update({ status: "rascunho" }).eq("painel_slug", slug);
    if (r.error) throw r.error;
  }
  atualizarSite(slug);
}

// Marca de quem é a foto (para ela entrar no kit do palestrante).
export async function marcarPalestranteDaFoto(slug: string, fotoId: string, palestranteId: string | null) {
  const { db, membro } = await exigirEquipe();
  if (!membro) throw new Error("Sem permissão.");
  const r = await db.from("fotos").update({ palestrante_id: palestranteId }).eq("id", fotoId);
  if (r.error) throw r.error;
  atualizarSite(slug);
}

export async function removerFoto(slug: string, fotoId: string) {
  const { db, membro } = await exigirEquipe();
  if (!membro) throw new Error("Sem permissão.");
  const { data, error } = await db.from("fotos").delete().eq("id", fotoId).select("url, miniatura_url").single();
  if (error) throw error;
  const caminhos = [data.url, data.miniatura_url]
    .filter(Boolean)
    .map((u) => String(u).split("/storage/v1/object/public/fotos/")[1])
    .filter(Boolean);
  if (caminhos.length) await db.storage.from("fotos").remove(caminhos);
  atualizarSite(slug);
}

// Depois que o navegador termina de enviar as fotos, atualiza as páginas.
export async function fotosEnviadas(slug: string) {
  const { membro } = await exigirEquipe();
  if (!membro) throw new Error("Sem permissão.");
  atualizarSite(slug);
}

export async function sair() {
  const { db } = await exigirEquipe();
  await db.auth.signOut();
  redirect("/admin/login");
}

// Reprocessa o áudio mais recente do painel (a transcrição já paga é reaproveitada).
export async function refazerComIA(slug: string) {
  const { db, membro } = await exigirEquipe();
  if (!membro) throw new Error("Sem permissão.");
  const { data: envio } = await db
    .from("envios")
    .select("id, assemblyai_id")
    .eq("painel_slug", slug)
    .eq("tipo", "audio")
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!envio) throw new Error("Nenhum áudio deste painel no Drive ainda.");
  const r = await db
    .from("envios")
    .update({ etapa: envio.assemblyai_id ? "transcrevendo" : "recebido", erro: null, bloqueado_ate: null })
    .eq("id", envio.id);
  if (r.error) throw r.error;
  atualizarSite(slug);
}

// Corrige dados do carômetro e guarda o WhatsApp do palestrante.
export async function salvarPalestrante(id: string, form: FormData) {
  const { db, membro } = await exigirEquipe();
  if (!membro) throw new Error("Sem permissão.");
  // Guarda no formato do wa.me: com 55 na frente quando vier só DDD + número.
  let whatsapp: string | null = String(form.get("whatsapp") || "").replace(/\D/g, "") || null;
  if (whatsapp && whatsapp.length <= 11) whatsapp = `55${whatsapp}`;
  const r = await db
    .from("palestrantes")
    .update({
      nome: String(form.get("nome")).trim(),
      cargo: String(form.get("cargo")).trim(),
      whatsapp,
      pendente: form.get("resolvido") === "on" ? null : undefined,
    })
    .eq("id", id)
    .select("painel_slug")
    .single();
  if (r.error) throw r.error;
  revalidatePath("/admin/palestrantes");
  revalidatePath(`/paineis/${r.data.painel_slug}`);
}

export async function marcarKitEnviado(palestranteId: string) {
  const { db, membro } = await exigirEquipe();
  if (!membro) throw new Error("Sem permissão.");
  await db.from("kits").update({ enviado_em: new Date().toISOString() }).eq("palestrante_id", palestranteId);
  revalidatePath("/admin/palestrantes");
}

// Manda o robô cortar de novo os trechos escolhidos pela IA (por exemplo, depois de trocar o vídeo).
export async function refazerCortes(slug: string) {
  const { db, membro } = await exigirEquipe();
  if (!membro) throw new Error("Sem permissão.");
  const r1 = await db
    .from("cortes")
    .update({ video_url: null, tentativas: 0, erro: null, status: "rascunho" })
    .eq("painel_slug", slug)
    .eq("origem", "auto");
  if (r1.error) throw r1.error;
  const r2 = await db.from("paineis").update({ cortes_disparado_em: null }).eq("slug", slug);
  if (r2.error) throw r2.error;
  atualizarSite(slug);
}
