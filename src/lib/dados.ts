import { paineis as programacaoFixa, type Painel as PainelFixo } from "@/data/programacao";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { supabasePublico } from "@/lib/supabase/publico";

// Leitura do conteúdo público. Se o banco não responder, a programação fixa garante o site no ar.

export type PalestrantePublico = { id?: string; slug?: string; nome: string; cargo: string; foto?: string };

export type PainelPublico = Omit<PainelFixo, "palestrantes"> & {
  palestrantes: PalestrantePublico[];
  galeriaUrl: string | null;
  videoSessaoUrl: string | null;
  resumo: string | null;
  pontos: string[];
};

export type Fala = { id: string; texto: string; palestranteId: string | null; ordem: number };
export type Corte = {
  id: string;
  titulo: string;
  videoUrl: string | null;
  /** Versão leve (720p) para tocar no site; cai na original se ainda não existir. */
  videoWebUrl: string | null;
  capaUrl: string | null;
  legenda: string | null;
  palestranteId: string | null;
};
export type Foto = { id: string; url: string; miniatura: string | null; palestranteId: string | null };

export type ConteudoPainel = PainelPublico & { falas: Fala[]; cortes: Corte[]; fotos: Foto[] };

function daProgramacaoFixa(p: PainelFixo): PainelPublico {
  return { ...p, galeriaUrl: null, videoSessaoUrl: null, resumo: null, pontos: [] };
}

type LinhaPainel = {
  slug: string;
  numero: number | null;
  titulo: string;
  area: PainelFixo["area"];
  data: string;
  horario: string;
  galeria_url: string | null;
  video_sessao_url: string | null;
  resumo_publicado: string | null;
  pontos_publicados: string[] | null;
};

type LinhaPalestrante = { id: string; painel_slug: string; slug: string; nome: string; cargo: string; foto_url: string | null };

function montar(linha: LinhaPainel, palestrantes: LinhaPalestrante[]): PainelPublico {
  return {
    slug: linha.slug,
    numero: linha.numero,
    titulo: linha.titulo,
    area: linha.area,
    data: linha.data,
    horario: linha.horario,
    galeriaUrl: linha.galeria_url,
    videoSessaoUrl: linha.video_sessao_url,
    resumo: linha.resumo_publicado,
    pontos: linha.pontos_publicados ?? [],
    palestrantes: palestrantes
      .filter((p) => p.painel_slug === linha.slug)
      .map((p) => ({ id: p.id, slug: p.slug, nome: p.nome, cargo: p.cargo, foto: p.foto_url ?? undefined })),
  };
}

const colunasPainel = "slug, numero, titulo, area, data, horario, galeria_url, video_sessao_url, resumo_publicado, pontos_publicados";
const colunasPalestrante = "id, painel_slug, slug, nome, cargo, foto_url";

export async function listarPaineis(): Promise<PainelPublico[]> {
  if (!supabaseConfigurado) return programacaoFixa.map(daProgramacaoFixa);
  try {
    const db = supabasePublico();
    const [paineis, palestrantes] = await Promise.all([
      db.from("paineis").select(colunasPainel).order("ordem"),
      db.from("palestrantes").select(colunasPalestrante).order("ordem"),
    ]);
    if (paineis.error || palestrantes.error || !paineis.data.length) throw paineis.error ?? palestrantes.error;
    return (paineis.data as LinhaPainel[]).map((l) => montar(l, palestrantes.data as LinhaPalestrante[]));
  } catch (erro) {
    console.error("Falha ao ler painéis do banco; usando programação fixa.", erro);
    return programacaoFixa.map(daProgramacaoFixa);
  }
}

export async function buscarConteudo(slug: string): Promise<ConteudoPainel | null> {
  const fixo = programacaoFixa.find((p) => p.slug === slug);
  const vazio = (p: PainelPublico): ConteudoPainel => ({ ...p, falas: [], cortes: [], fotos: [] });
  if (!supabaseConfigurado) return fixo ? vazio(daProgramacaoFixa(fixo)) : null;

  try {
    const db = supabasePublico();
    const [painel, palestrantes, falas, cortes, fotos] = await Promise.all([
      db.from("paineis").select(colunasPainel).eq("slug", slug).maybeSingle(),
      db.from("palestrantes").select(colunasPalestrante).eq("painel_slug", slug).order("ordem"),
      db.from("falas").select("id, texto, palestrante_id, ordem").eq("painel_slug", slug).order("ordem"),
      db
        .from("cortes")
        .select("id, titulo, video_url, video_web_url, capa_url, legenda_sugerida, palestrante_id")
        .eq("painel_slug", slug)
        .not("video_url", "is", null)
        .order("ordem"),
      db.from("fotos").select("id, url, miniatura_url, palestrante_id").eq("painel_slug", slug).order("ordem"),
    ]);
    if (painel.error) throw painel.error;
    if (!painel.data) return null;
    return {
      ...montar(painel.data as LinhaPainel, (palestrantes.data ?? []) as LinhaPalestrante[]),
      falas: (falas.data ?? []).map((f) => ({ id: f.id, texto: f.texto, palestranteId: f.palestrante_id, ordem: f.ordem })),
      cortes: (cortes.data ?? []).map((c) => ({
        id: c.id,
        titulo: c.titulo,
        videoUrl: c.video_url,
        videoWebUrl: c.video_web_url ?? c.video_url,
        capaUrl: c.capa_url,
        legenda: c.legenda_sugerida,
        palestranteId: c.palestrante_id,
      })),
      fotos: (fotos.data ?? []).map((f) => ({ id: f.id, url: f.url, miniatura: f.miniatura_url, palestranteId: f.palestrante_id })),
    };
  } catch (erro) {
    console.error(`Falha ao ler o painel ${slug}; usando programação fixa.`, erro);
    return fixo ? vazio(daProgramacaoFixa(fixo)) : null;
  }
}
