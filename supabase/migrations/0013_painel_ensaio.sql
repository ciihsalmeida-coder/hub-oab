-- Painel de ensaio: a equipe testa o fluxo completo com os próprios nomes, fora da vista do público.
-- Apagar antes do evento: delete from public.paineis where slug = 'ensaio' (apaga falas, cortes, fotos e kits juntos).
insert into public.paineis (slug, numero, titulo, area, data, horario, ordem)
values ('ensaio', null, 'Ensaio geral da equipe (teste interno)', 'Ensaio', '2026-11-04', 'Teste', 99)
on conflict (slug) do nothing;

insert into public.palestrantes (painel_slug, slug, nome, cargo, ordem) values
  ('ensaio', 'ensaio-mediacao', 'Mediadora do ensaio', 'Equipe Mzen · troque pelo nome real', 1),
  ('ensaio', 'ensaio-participante-a', 'Participante A', 'Equipe Mzen · troque pelo nome real', 2),
  ('ensaio', 'ensaio-participante-b', 'Participante B', 'Equipe Mzen · troque pelo nome real', 3),
  ('ensaio', 'ensaio-participante-c', 'Participante C', 'Equipe Mzen · troque pelo nome real', 4)
on conflict (slug) do nothing;

insert into public.kits (palestrante_id)
select id from public.palestrantes where painel_slug = 'ensaio'
on conflict (palestrante_id) do nothing;
