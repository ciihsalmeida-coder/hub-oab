import { redirect } from "next/navigation";
import { supabaseServidor } from "@/lib/supabase/servidor";

export type Membro = { userId: string; nome: string; papel: "editor" | "aprovador"; email: string };

// Garante que quem abriu a área de controle está logado e faz parte da equipe.
export async function exigirEquipe() {
  const db = await supabaseServidor();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data } = await db.from("equipe").select("nome, papel").eq("user_id", user.id).maybeSingle();
  const membro: Membro | null = data
    ? { userId: user.id, nome: data.nome, papel: data.papel, email: user.email ?? "" }
    : null;
  return { db, user, membro };
}
