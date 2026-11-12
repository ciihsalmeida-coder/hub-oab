-- Enquadramento vertical dos cortes: posição horizontal (0 = esquerda, 1 = direita) do quadro 9:16
-- dentro do vídeo deitado, e uma imagem do plano aberto para o ajuste manual no /admin.
alter table public.cortes add column if not exists foco_x real;
alter table public.cortes add column if not exists foco_manual boolean not null default false;
alter table public.cortes add column if not exists quadro_url text;
