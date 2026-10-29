import "server-only";
import { drive, type drive_v3 } from "@googleapis/drive";
import { GoogleAuth } from "google-auth-library";
import sharp from "sharp";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Pasta principal no Drive da Cilene, compartilhada com o robô (conta de serviço).
export const PASTA_RAIZ = "1S4UKRokkKPsYD6gZudhxVM292-PgZUu0";
const PASTA = "application/vnd.google-apps.folder";
const LIMITE_VIDEO_MB = 45; // limite por arquivo no plano gratuito do Supabase (50 MB)

export function driveConfigurado() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.SUPABASE_SECRET_KEY);
}

export function cliente() {
  const credenciais = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "{}");
  const auth = new GoogleAuth({ credentials: credenciais, scopes: ["https://www.googleapis.com/auth/drive"] });
  return drive({ version: "v3", auth });
}

async function criarPasta(api: drive_v3.Drive, nome: string, pai: string) {
  const existente = await api.files.list({
    q: `'${pai}' in parents and name = '${nome.replace(/'/g, "\\'")}' and mimeType = '${PASTA}' and trashed = false`,
    fields: "files(id)",
  });
  if (existente.data.files?.[0]?.id) return existente.data.files[0].id;
  const nova = await api.files.create({ requestBody: { name: nome, mimeType: PASTA, parents: [pai] }, fields: "id" });
  return nova.data.id!;
}

// Cria (ou reaproveita) a árvore de pastas: um painel por pasta, com Fotos, Cortes e uma pasta por palestrante.
export async function prepararPastas() {
  const api = cliente();
  const db = supabaseAdmin();
  const [{ data: paineis }, { data: palestrantes }] = await Promise.all([
    db.from("paineis").select("slug, numero, titulo, ordem").order("ordem"),
    db.from("palestrantes").select("id, painel_slug, nome").order("ordem"),
  ]);

  const registros: { drive_id: string; painel_slug: string; tipo: string; palestrante_id: string | null }[] = [];
  for (const p of paineis ?? []) {
    const nome = `${String(p.ordem + 1).padStart(2, "0")} · ${p.numero ? `Painel ${p.numero}` : "Abertura"} · ${p.titulo}`.slice(0, 120);
    const painel = await criarPasta(api, nome, PASTA_RAIZ);
    const fotos = await criarPasta(api, "Fotos do painel", painel);
    const cortes = await criarPasta(api, "Cortes de vídeo", painel);
    const porPalestrante = await criarPasta(api, "Fotos por palestrante", painel);
    const midia = await criarPasta(api, "Áudio e vídeo do painel", painel);
    registros.push(
      { drive_id: painel, painel_slug: p.slug, tipo: "painel", palestrante_id: null },
      { drive_id: fotos, painel_slug: p.slug, tipo: "fotos", palestrante_id: null },
      { drive_id: cortes, painel_slug: p.slug, tipo: "cortes", palestrante_id: null },
      { drive_id: porPalestrante, painel_slug: p.slug, tipo: "palestrantes", palestrante_id: null },
      { drive_id: midia, painel_slug: p.slug, tipo: "midia", palestrante_id: null },
    );
    for (const s of (palestrantes ?? []).filter((x) => x.painel_slug === p.slug)) {
      const id = await criarPasta(api, s.nome, porPalestrante);
      registros.push({ drive_id: id, painel_slug: p.slug, tipo: "palestrante", palestrante_id: s.id });
    }
  }
  const r = await db.from("pastas_drive").upsert(registros, { onConflict: "painel_slug,tipo,palestrante_id" });
  if (r.error) throw r.error;
  return registros.length;
}

type Resultado = { copiados: number; erros: number; pendentes: number; paineis: string[] };

// Copia para o site o que é novo nas pastas. Tudo entra como rascunho.
// Roda por partes: para antes do tempo limite e continua na próxima chamada.
export async function sincronizar(orcamentoMs = 45_000): Promise<Resultado> {
  const inicio = Date.now();
  const api = cliente();
  const db = supabaseAdmin();
  const resultado: Resultado = { copiados: 0, erros: 0, pendentes: 0, paineis: [] };

  const [{ data: pastas }, { data: fotos }, { data: cortes }, { data: falhas }] = await Promise.all([
    db.from("pastas_drive").select("drive_id, painel_slug, tipo, palestrante_id").in("tipo", ["fotos", "cortes", "palestrante", "midia"]),
    db.from("fotos").select("origem_drive_id").not("origem_drive_id", "is", null),
    db.from("cortes").select("origem_drive_id").not("origem_drive_id", "is", null),
    db.from("drive_erros").select("drive_id, tentativas"),
  ]);
  const { data: envios } = await db.from("envios").select("origem_drive_id").not("origem_drive_id", "is", null);
  const jaCopiados = new Set([...(fotos ?? []), ...(cortes ?? []), ...(envios ?? [])].map((x) => x.origem_drive_id));
  const desistir = new Set((falhas ?? []).filter((f) => f.tentativas >= 3).map((f) => f.drive_id));

  // Uma busca só para todas as pastas (em lotes, por causa do tamanho da consulta).
  const porPasta = new Map((pastas ?? []).map((p) => [p.drive_id, p]));
  const ids = [...porPasta.keys()];
  const novos: (drive_v3.Schema$File & { pasta: Pasta })[] = [];
  for (let i = 0; i < ids.length; i += 40) {
    const lote = ids.slice(i, i + 40);
    let pageToken: string | undefined;
    do {
      const r = await api.files.list({
        q: `(${lote.map((id) => `'${id}' in parents`).join(" or ")}) and trashed = false and (mimeType contains 'image/' or mimeType contains 'video/' or mimeType contains 'audio/')`,
        fields: "nextPageToken, files(id, name, mimeType, size, parents)",
        pageSize: 1000,
        pageToken,
      });
      for (const f of r.data.files ?? []) {
        const pasta = porPasta.get(f.parents?.[0] ?? "");
        if (pasta && f.id && !jaCopiados.has(f.id) && !desistir.has(f.id)) novos.push({ ...f, pasta });
      }
      pageToken = r.data.nextPageToken ?? undefined;
    } while (pageToken);
  }

  const paineisTocados = new Set<string>();
  for (const arquivo of novos) {
    if (Date.now() - inicio > orcamentoMs) {
      resultado.pendentes++;
      continue;
    }
    try {
      if (arquivo.pasta.tipo === "midia") await registrarEnvio(arquivo, arquivo.pasta);
      else if (arquivo.mimeType?.startsWith("image/")) await copiarFoto(api, arquivo, arquivo.pasta);
      else await copiarVideo(api, arquivo, arquivo.pasta);
      await db.from("drive_erros").delete().eq("drive_id", arquivo.id!);
      paineisTocados.add(arquivo.pasta.painel_slug);
      resultado.copiados++;
    } catch (e) {
      resultado.erros++;
      const anterior = (falhas ?? []).find((f) => f.drive_id === arquivo.id)?.tentativas ?? 0;
      await db.from("drive_erros").upsert({
        drive_id: arquivo.id!,
        nome: arquivo.name,
        erro: e instanceof Error ? e.message : String(e),
        tentativas: anterior + 1,
        atualizado_em: new Date().toISOString(),
      });
    }
  }
  resultado.paineis = [...paineisTocados];
  return resultado;
}

// Áudio/vídeo do painel inteiro: não copia, só registra para a IA processar direto do Drive.
async function registrarEnvio(arquivo: drive_v3.Schema$File, pasta: Pasta) {
  const tipo = arquivo.mimeType?.startsWith("audio/") ? "audio" : "video";
  const r = await supabaseAdmin().from("envios").insert({
    painel_slug: pasta.painel_slug,
    tipo,
    caminho: `drive:${arquivo.id}`,
    origem_drive_id: arquivo.id,
    nome: arquivo.name,
  });
  if (r.error) throw r.error;
}

export async function baixar(api: drive_v3.Drive, id: string) {
  const r = await api.files.get({ fileId: id, alt: "media" }, { responseType: "arraybuffer" });
  return Buffer.from(r.data as ArrayBuffer);
}

type Pasta = { painel_slug: string; tipo: string; palestrante_id: string | null };

async function copiarFoto(api: drive_v3.Drive, arquivo: drive_v3.Schema$File, pasta: Pasta) {
  const db = supabaseAdmin();
  const original = await baixar(api, arquivo.id!);
  const base = sharp(original, { failOn: "none" }).rotate();
  const [grande, mini] = await Promise.all([
    base.clone().resize(2400, 2400, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer(),
    base.clone().resize(640, 640, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 75 }).toBuffer(),
  ]);
  const caminho = `${pasta.painel_slug}/drive-${arquivo.id}.jpg`;
  const caminhoMini = `${pasta.painel_slug}/drive-${arquivo.id}-mini.jpg`;
  const opcoes = { contentType: "image/jpeg", cacheControl: "31536000", upsert: true };
  const [r1, r2] = await Promise.all([
    db.storage.from("fotos").upload(caminho, grande, opcoes),
    db.storage.from("fotos").upload(caminhoMini, mini, opcoes),
  ]);
  if (r1.error || r2.error) throw r1.error ?? r2.error;
  const r3 = await db.from("fotos").insert({
    painel_slug: pasta.painel_slug,
    palestrante_id: pasta.palestrante_id,
    url: db.storage.from("fotos").getPublicUrl(caminho).data.publicUrl,
    miniatura_url: db.storage.from("fotos").getPublicUrl(caminhoMini).data.publicUrl,
    origem_drive_id: arquivo.id,
    ordem: Math.floor(Date.now() / 1000),
  });
  if (r3.error) throw r3.error;
}

async function copiarVideo(api: drive_v3.Drive, arquivo: drive_v3.Schema$File, pasta: Pasta) {
  if (pasta.tipo !== "cortes") throw new Error("Vídeos vão na pasta “Cortes de vídeo”.");
  const mb = Number(arquivo.size ?? 0) / 1024 / 1024;
  if (mb > LIMITE_VIDEO_MB) throw new Error(`Vídeo com ${mb.toFixed(0)} MB; o limite é ${LIMITE_VIDEO_MB} MB. Exporte em 1080p e tente de novo.`);
  const db = supabaseAdmin();
  const conteudo = await baixar(api, arquivo.id!);
  const extensao = (arquivo.name?.split(".").pop() ?? "mp4").toLowerCase();
  const caminho = `${pasta.painel_slug}/drive-${arquivo.id}.${extensao}`;
  const r1 = await db.storage
    .from("cortes")
    .upload(caminho, conteudo, { contentType: arquivo.mimeType ?? "video/mp4", cacheControl: "31536000", upsert: true });
  if (r1.error) throw r1.error;
  const titulo = (arquivo.name ?? "Corte").replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  const r2 = await db.from("cortes").insert({
    painel_slug: pasta.painel_slug,
    titulo,
    video_url: db.storage.from("cortes").getPublicUrl(caminho).data.publicUrl,
    origem: "manual",
    origem_drive_id: arquivo.id,
    ordem: Math.floor(Date.now() / 1000),
  });
  if (r2.error) throw r2.error;
}
