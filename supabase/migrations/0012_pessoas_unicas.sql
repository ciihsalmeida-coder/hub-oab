-- Pessoas únicas: código aleatório do navegador (sem nome, e-mail ou IP), renovado a cada 30 dias.
alter table public.eventos add column visitante uuid;
alter table public.eventos drop constraint eventos_tipo_check;
alter table public.eventos add constraint eventos_tipo_check check (tipo in (
  'visita_home','visita_painel','visita_kit','baixou_card','baixou_video','baixou_foto',
  'compartilhou','abriu_galeria','abriu_mural','tocou_video'));
grant insert (visitante) on public.eventos to anon, authenticated;
create index on public.eventos (visitante);

create view public.pessoas_por_dia with (security_invoker = true) as
  select (criado_em at time zone 'America/Sao_Paulo')::date as dia, count(distinct visitante)::int as pessoas
  from public.eventos where visitante is not null group by 1;
create view public.pessoas_por_alvo with (security_invoker = true) as
  select tipo, alvo, count(distinct visitante)::int as pessoas
  from public.eventos where visitante is not null and alvo is not null group by 1, 2;
create view public.pessoas_total with (security_invoker = true) as
  select count(distinct visitante)::int as pessoas from public.eventos where visitante is not null;
revoke all on public.pessoas_por_dia, public.pessoas_por_alvo, public.pessoas_total from anon;
grant select on public.pessoas_por_dia, public.pessoas_por_alvo, public.pessoas_total to authenticated;
