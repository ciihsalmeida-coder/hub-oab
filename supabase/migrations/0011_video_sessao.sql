-- Link do YouTube (não listado) com a gravação completa da sessão.
alter table public.paineis add column video_sessao_url text
  check (video_sessao_url is null or video_sessao_url ~ '^https://www\.youtube\.com/watch\?v=[A-Za-z0-9_-]{11}$');
grant select (video_sessao_url) on public.paineis to anon;
