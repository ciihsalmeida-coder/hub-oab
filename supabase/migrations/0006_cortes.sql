-- Robô de cortes (GitHub Actions): controle de disparo e de tentativas.
alter table public.paineis add column cortes_disparado_em timestamptz;
alter table public.cortes add column tentativas int not null default 0, add column erro text;
