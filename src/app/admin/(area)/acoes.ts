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

// Publica o texto e as falas. Só quem tem papel de aprovador (a pessoa indicada pela OAB).
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
  const r2 = await db.from("falas").update({ status: "publicado" }).eq("painel_slug", slug);
  if (r2.error) throw r2.error;
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
  const r2 = await db.from("falas").update({ status: "rascunho" }).eq("painel_slug", slug);
  if (r2.error) throw r2.error;
  atualizarSite(slug);
}

export async function sair() {
  const { db } = await exigirEquipe();
  await db.auth.signOut();
  redirect("/admin/login");
}
