-- Zoom no palestrante nos cortes (câmera no fundo da sala): posição vertical e fator de zoom do quadro 9:16.
alter table public.cortes add column if not exists foco_y real;
alter table public.cortes add column if not exists foco_zoom real;
