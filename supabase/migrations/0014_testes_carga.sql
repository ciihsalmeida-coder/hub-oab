-- Resultados do teste de carga (rodado no GitHub Actions). Só a equipe lê; ninguém de fora escreve.
create table public.testes_carga (
  id bigint generated always as identity primary key,
  rota text not null,
  resultado jsonb not null,
  criado_em timestamptz not null default now()
);
alter table public.testes_carga enable row level security;
revoke all on public.testes_carga from anon, authenticated;
create policy "equipe le testes" on public.testes_carga for select to authenticated using (privado.e_da_equipe());
grant select on public.testes_carga to authenticated;
