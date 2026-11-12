-- Zoom do enquadramento da foto no card (1 = foto inteira cobrindo o quadro; até 3 = aproxima).
alter table public.fotos add column if not exists foco_zoom real;
