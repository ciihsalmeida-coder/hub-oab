-- Métricas anônimas: só o tipo de ação, o alvo (painel/palestrante) e a hora. Nenhum dado pessoal.
create table public.eventos (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in (
    'visita_home', 'visita_painel', 'visita_kit', 'baixou_card', 'baixou_video', 'baixou_foto',
    'compartilhou', 'abriu_galeria', 'abriu_mural')),
  alvo text check (alvo is null or char_length(alvo) <= 100),
  criado_em timestamptz not null default now()
);
create index on public.eventos (criado_em);
alter table public.eventos enable row level security;
revoke all on public.eventos from anon;
grant insert (tipo, alvo) on public.eventos to anon, authenticated;
create policy "registra evento" on public.eventos for insert to anon, authenticated with check (true);
create policy "equipe le eventos" on public.eventos for select to authenticated using (privado.e_da_equipe());

-- Totais por dia (horário de Florianópolis), tipo e alvo, para o painel de métricas.
create view public.metricas with (security_invoker = true) as
  select tipo, alvo, (criado_em at time zone 'America/Sao_Paulo')::date as dia, count(*)::int as total
  from public.eventos group by 1, 2, 3;
revoke all on public.metricas from anon;
grant select on public.metricas to authenticated;
