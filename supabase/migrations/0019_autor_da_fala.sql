-- Frase de quem não é palestrante do painel (ex.: autoridade na abertura): nome escrito à mão.
alter table public.falas add column if not exists autor text;
