-- Revisão: limite de tentativas da IA por arquivo.
alter table public.envios add column tentativas int not null default 0;

-- Índices para as buscas por palestrante (kits) apontados pelo verificador do Supabase.
create index if not exists cortes_palestrante_idx on public.cortes (palestrante_id);
create index if not exists falas_palestrante_idx on public.falas (palestrante_id);
create index if not exists fotos_palestrante_idx on public.fotos (palestrante_id);
create index if not exists pastas_drive_palestrante_idx on public.pastas_drive (palestrante_id);
create index if not exists paineis_aprovado_por_idx on public.paineis (aprovado_por);
