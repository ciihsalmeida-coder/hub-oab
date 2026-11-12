-- Ponto de foco da foto (0 a 1, da esquerda/topo): o card centraliza o recorte nele. Vazio = automático.
alter table public.fotos add column if not exists foco_x real check (foco_x between 0 and 1);
alter table public.fotos add column if not exists foco_y real check (foco_y between 0 and 1);
