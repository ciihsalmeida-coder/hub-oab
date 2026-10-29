-- Resumo do dia para a comissão organizadora (texto gerado pela IA e revisado pela equipe).
create table public.resumos_dia (
  dia date primary key,
  texto text not null,
  gerado_em timestamptz not null default now()
);
alter table public.resumos_dia enable row level security;
revoke all on public.resumos_dia from anon;
create policy "equipe resumos" on public.resumos_dia for all to authenticated
  using (privado.e_da_equipe()) with check (privado.e_da_equipe());
