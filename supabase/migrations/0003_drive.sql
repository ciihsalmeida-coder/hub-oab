-- Ligação com o Google Drive: pastas criadas pelo site e controle do que já foi copiado.

create table public.pastas_drive (
  drive_id text primary key,
  painel_slug text not null references public.paineis (slug) on delete cascade,
  tipo text not null check (tipo in ('painel', 'fotos', 'cortes', 'palestrantes', 'palestrante')),
  palestrante_id uuid references public.palestrantes (id) on delete cascade,
  constraint pastas_drive_unica unique nulls not distinct (painel_slug, tipo, palestrante_id)
);

-- Arquivos que deram erro ao copiar (para não tentar sem parar e para mostrar na área de controle).
create table public.drive_erros (
  drive_id text primary key,
  nome text,
  erro text not null,
  tentativas int not null default 1,
  atualizado_em timestamptz not null default now()
);

-- Segredos do servidor. Sem regras de acesso: só a chave secreta do site lê.
create table public.segredos (chave text primary key, valor text not null);
insert into public.segredos values ('sync_token', encode(extensions.gen_random_bytes(24), 'hex'));

alter table public.cortes add column origem_drive_id text unique;

alter table public.pastas_drive enable row level security;
alter table public.drive_erros enable row level security;
alter table public.segredos enable row level security;
revoke all on public.pastas_drive, public.drive_erros, public.segredos from anon, authenticated;
grant select on public.pastas_drive, public.drive_erros to authenticated;
create policy "equipe le pastas" on public.pastas_drive for select to authenticated using (privado.e_da_equipe());
create policy "equipe le erros" on public.drive_erros for select to authenticated using (privado.e_da_equipe());
