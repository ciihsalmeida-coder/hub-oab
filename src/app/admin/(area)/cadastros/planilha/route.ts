import { NextResponse } from "next/server";
import { supabaseServidor } from "@/lib/supabase/servidor";

// Planilha (CSV, abre no Excel) com os cadastros. Só para quem é da equipe (regras do banco).
export async function GET() {
  const db = await supabaseServidor();
  const { data, error } = await db
    .from("cadastros")
    .select("nome, email, whatsapp, painel_origem, criado_em, texto_consentimento")
    .order("criado_em");
  if (error) return new NextResponse("Sem permissão", { status: 403 });

  const celula = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const linhas = [
    ["Nome", "E-mail", "WhatsApp", "Painel de origem", "Data", "Consentimento"],
    ...(data ?? []).map((c) => [c.nome, c.email, c.whatsapp, c.painel_origem, c.criado_em, c.texto_consentimento]),
  ];
  const csv = "﻿" + linhas.map((l) => l.map(celula).join(";")).join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cadastros-congresso-oab.csv"',
    },
  });
}
