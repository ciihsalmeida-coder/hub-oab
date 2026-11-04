-- Cada palestrante pode ter a própria gravação (pasta "Gravações por palestrante/<nome>" no Drive).
-- Falas e cortes guardam de qual gravação vieram, para "refazer" uma não apagar as outras.
alter table public.pastas_drive drop constraint pastas_drive_tipo_check;
alter table public.pastas_drive add constraint pastas_drive_tipo_check
  check (tipo in ('painel', 'fotos', 'cortes', 'palestrantes', 'palestrante', 'midia', 'gravacoes', 'midia_palestrante'));

alter table public.envios add column palestrante_id uuid references public.palestrantes (id) on delete set null;
alter table public.falas add column envio_id uuid references public.envios (id) on delete set null;
alter table public.cortes add column envio_id uuid references public.envios (id) on delete set null;
create index on public.envios (palestrante_id);
create index on public.falas (envio_id);
create index on public.cortes (envio_id);
