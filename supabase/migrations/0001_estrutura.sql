-- Estrutura do hub do XIV Congresso.
-- Regra central: o público só lê o que está 'publicado'. Tudo que a IA gera entra como 'rascunho'.

create type public.status_conteudo as enum ('rascunho', 'publicado');
create type public.papel_equipe as enum ('editor', 'aprovador');

-- Quem pode entrar na área de controle (Cilene = editor, OAB = aprovador).
create table public.equipe (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  papel public.papel_equipe not null default 'editor',
  criado_em timestamptz not null default now()
);

create table public.paineis (
  slug text primary key,
  numero int,
  titulo text not null,
  area text not null,
  data date not null,
  horario text not null,
  ordem int not null,
  -- Conteúdo gerado pela IA (resumo e pontos principais) e seu status.
  -- Rascunho (só a equipe vê) e versão publicada (copiada na aprovação).
  resumo text,
  pontos jsonb not null default '[]'::jsonb,
  resumo_publicado text,
  pontos_publicados jsonb not null default '[]'::jsonb,
  status_texto public.status_conteudo not null default 'rascunho',
  aprovado_por uuid references auth.users (id),
  aprovado_em timestamptz,
  galeria_url text,
  atualizado_em timestamptz not null default now()
);

create table public.palestrantes (
  id uuid primary key default gen_random_uuid(),
  painel_slug text not null references public.paineis (slug) on delete cascade,
  slug text not null unique,
  nome text not null,
  cargo text not null,
  foto_url text,
  pendente text,
  whatsapp text,
  email text,
  ordem int not null
);

-- Link secreto do kit de cada palestrante. Separado para o público nunca enxergar.
create table public.kits (
  palestrante_id uuid primary key references public.palestrantes (id) on delete cascade,
  token text not null unique default encode(extensions.gen_random_bytes(6), 'hex'),
  enviado_em timestamptz
);

create table public.falas (
  id uuid primary key default gen_random_uuid(),
  painel_slug text not null references public.paineis (slug) on delete cascade,
  palestrante_id uuid references public.palestrantes (id) on delete set null,
  texto text not null,
  inicio_ms int,
  fim_ms int,
  ordem int not null default 0,
  status public.status_conteudo not null default 'rascunho'
);

create table public.cortes (
  id uuid primary key default gen_random_uuid(),
  painel_slug text not null references public.paineis (slug) on delete cascade,
  palestrante_id uuid references public.palestrantes (id) on delete set null,
  titulo text not null,
  video_url text,
  capa_url text,
  inicio_ms int,
  fim_ms int,
  legenda_sugerida text,
  origem text not null default 'auto' check (origem in ('auto', 'opus', 'manual')),
  ordem int not null default 0,
  status public.status_conteudo not null default 'rascunho',
  criado_em timestamptz not null default now()
);

create table public.fotos (
  id uuid primary key default gen_random_uuid(),
  painel_slug text not null references public.paineis (slug) on delete cascade,
  palestrante_id uuid references public.palestrantes (id) on delete set null,
  url text not null,
  miniatura_url text,
  origem_drive_id text unique,
  ordem int not null default 0,
  status public.status_conteudo not null default 'rascunho',
  criado_em timestamptz not null default now()
);

-- Arquivos de áudio/vídeo enviados no fim de cada painel e o andamento do processamento.
create table public.envios (
  id uuid primary key default gen_random_uuid(),
  painel_slug text not null references public.paineis (slug) on delete cascade,
  tipo text not null check (tipo in ('audio', 'video')),
  caminho text not null,
  etapa text not null default 'recebido'
    check (etapa in ('recebido', 'transcrevendo', 'escrevendo', 'cortando', 'pronto', 'erro')),
  transcricao jsonb,
  erro text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Cadastro opcional do público (LGPD: consentimento explícito, dados da OAB/SC).
create table public.cadastros (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  whatsapp text check (whatsapp is null or char_length(whatsapp) <= 30),
  consentimento boolean not null check (consentimento),
  texto_consentimento text not null,
  painel_origem text,
  criado_em timestamptz not null default now()
);
create unique index cadastros_email_unico on public.cadastros (lower(email));

create index on public.palestrantes (painel_slug, ordem);
create index on public.falas (painel_slug, ordem);
create index on public.cortes (painel_slug, ordem);
create index on public.fotos (painel_slug, ordem);
create index on public.envios (painel_slug, criado_em desc);

-- Quem é da equipe (usado nas regras de acesso).
create function public.e_da_equipe() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.equipe where user_id = (select auth.uid())) $$;

alter table public.equipe enable row level security;
alter table public.paineis enable row level security;
alter table public.palestrantes enable row level security;
alter table public.kits enable row level security;
alter table public.falas enable row level security;
alter table public.cortes enable row level security;
alter table public.fotos enable row level security;
alter table public.envios enable row level security;
alter table public.cadastros enable row level security;

-- Público: lê programação e palestrantes; conteúdo só quando publicado.
create policy "publico le paineis" on public.paineis for select to anon using (true);
create policy "publico le palestrantes" on public.palestrantes for select to anon using (true);
create policy "publico le falas publicadas" on public.falas for select using (status = 'publicado');
create policy "publico le cortes publicados" on public.cortes for select using (status = 'publicado');
create policy "publico le fotos publicadas" on public.fotos for select using (status = 'publicado');
-- Público pode se cadastrar, mas nunca ler a lista.
create policy "publico se cadastra" on public.cadastros for insert to anon, authenticated with check (consentimento);

-- Equipe: acesso completo.
create policy "equipe le equipe" on public.equipe for select to authenticated using (public.e_da_equipe());
create policy "equipe paineis" on public.paineis for all to authenticated using (public.e_da_equipe()) with check (public.e_da_equipe());
create policy "equipe palestrantes" on public.palestrantes for all to authenticated using (public.e_da_equipe()) with check (public.e_da_equipe());
create policy "equipe kits" on public.kits for all to authenticated using (public.e_da_equipe()) with check (public.e_da_equipe());
create policy "equipe falas" on public.falas for all to authenticated using (public.e_da_equipe()) with check (public.e_da_equipe());
create policy "equipe cortes" on public.cortes for all to authenticated using (public.e_da_equipe()) with check (public.e_da_equipe());
create policy "equipe fotos" on public.fotos for all to authenticated using (public.e_da_equipe()) with check (public.e_da_equipe());
create policy "equipe envios" on public.envios for all to authenticated using (public.e_da_equipe()) with check (public.e_da_equipe());
create policy "equipe le cadastros" on public.cadastros for select to authenticated using (public.e_da_equipe());

-- O público só enxerga colunas seguras: nada de rascunho nem contato de palestrante.
revoke select on public.paineis, public.palestrantes from anon;
grant select (slug, numero, titulo, area, data, horario, ordem, galeria_url,
  resumo_publicado, pontos_publicados) on public.paineis to anon;
grant select (id, painel_slug, slug, nome, cargo, foto_url, ordem) on public.palestrantes to anon;
revoke all on public.kits, public.envios, public.equipe from anon;
revoke select, update, delete on public.cadastros from anon;

-- Arquivos: envios privados; cortes e fotos públicos para leitura.
insert into storage.buckets (id, name, public) values
  ('envios', 'envios', false),
  ('cortes', 'cortes', true),
  ('fotos', 'fotos', true)
on conflict (id) do nothing;

create policy "equipe envia arquivos" on storage.objects for all to authenticated
  using (bucket_id in ('envios', 'cortes', 'fotos') and public.e_da_equipe())
  with check (bucket_id in ('envios', 'cortes', 'fotos') and public.e_da_equipe());
