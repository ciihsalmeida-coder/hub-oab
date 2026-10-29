-- Pipeline de IA: pasta de áudio/vídeo no Drive, envios rastreados e legenda sugerida para o kit.
alter table public.pastas_drive drop constraint pastas_drive_tipo_check;
alter table public.pastas_drive add constraint pastas_drive_tipo_check
  check (tipo in ('painel', 'fotos', 'cortes', 'palestrantes', 'palestrante', 'midia'));

alter table public.envios
  add column origem_drive_id text unique,
  add column nome text,
  add column assemblyai_id text,
  add column bloqueado_ate timestamptz;

alter table public.palestrantes add column legenda_kit text;

-- O cron passa a chamar também o processamento da IA.
create or replace function privado.chamar_sincronizacao_drive() returns void
language plpgsql security definer set search_path = ''
as $$
declare
  cabecalhos jsonb := jsonb_build_object(
    'x-sync-token', (select valor from public.segredos where chave = 'sync_token'),
    'content-type', 'application/json');
begin
  perform net.http_post(url := 'https://hub-oab.vercel.app/api/drive/sincronizar',
    headers := cabecalhos, body := '{}'::jsonb, timeout_milliseconds := 60000);
  perform net.http_post(url := 'https://hub-oab.vercel.app/api/ia/processar',
    headers := cabecalhos, body := '{}'::jsonb, timeout_milliseconds := 300000);
end $$;
