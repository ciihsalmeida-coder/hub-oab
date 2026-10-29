alter table public.envios drop constraint envios_etapa_check;
alter table public.envios add constraint envios_etapa_check
  check (etapa in ('recebido', 'transcrevendo', 'escrevendo', 'cortando', 'pronto', 'erro', 'ignorado'));
