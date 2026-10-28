-- Tira a função de checagem da equipe da API pública (alerta do Supabase).
create schema if not exists privado;
alter function public.e_da_equipe() set schema privado;
grant usage on schema privado to authenticated;
revoke execute on function privado.e_da_equipe() from public, anon;
grant execute on function privado.e_da_equipe() to authenticated;
