# Hub do XIV Congresso OAB — notas do projeto

Cliente final: OAB/SC (Comissões de Direito Portuário e Marítimo e de Direito Aduaneiro).
Produção: Mzen Films (Cilene). Cilene não programa: explicar cada passo técnico em
português simples, um de cada vez, e nunca pedir para colar chaves/senhas no chat.

## Evento
- 11 a 13/11/2026, Costão do Santinho, Florianópolis. 10 momentos: abertura + P1–P9.
- Programação e carômetro em `src/data/programacao.ts` (59 palestrantes).
- Fotos dos palestrantes em `public/palestrantes/<nome-sem-acento>.jpg`, extraídas do
  plano de cobertura (144px). O carômetro tem divergências a confirmar com a OAB.
- Diogo Bianchi Fazolo: cargo incompleto, marcado como pendente.

## Prazos
- 04/11 pipeline + páginas funcionando · 06/11 teste completo · 08/11 congelado
- 09/11 equipe viaja · 11–13/11 conteúdo no mesmo dia · 20/11 hub completo

## Decisões
- Endereço fixo: https://hub-oab.vercel.app (admin: /admin).
- Um site só (Next.js 16 na Vercel), duas portas:
  - Público: link/QR aberto. Resumo "em 1 minuto", cortes, frases, fotos, botão para a
    galeria contratada com busca por selfie (só link; selfie fica na plataforma, LGPD).
  - Palestrante: link secreto individual (`/kit/<slug>-<token>`, noindex) com cards
    prontos (next/og, 1080x1350), falas, legenda, cortes e fotos. Enviado via botão
    "Enviar kit" (WhatsApp) na área admin.
- Admin em `/admin` com login (Supabase Auth): Cilene + aprovador da OAB.
- Nada publica sem aprovação: conteúdo da IA entra como rascunho.
- Cadastro do público OPCIONAL (nome, e-mail, WhatsApp opcional, consentimento
  desmarcado). Dados pertencem à OAB; aviso de privacidade validado pelo jurídico da OAB.
- Fotos/cortes chegam por pastas no Google Drive por painel (Central de Mídia).
- Cortes: corte próprio pelos tempos da transcrição é a rota principal; Opus Clip Pro
  (300 min/mês, API beta) só para 3–4 painéis escolhidos.
- Transcrição: AssemblyAI (pt-BR, separação de falantes). Textos: Claude API.
- PWA ("app sem loja"): manifest + ícones + `/instalar`. Sem app de loja.
- Supabase: projeto `hub-oab-sp` em São Paulo (sa-east-1). Free agora, Pro no mês do
  evento. Vercel Pro no mês do evento (Hobby não permite uso comercial).
- Identidade visual: cartaz oficial (névoa sobre o mar, marinho, azul-claro, vinho,
  Montserrat). Logo da OAB ainda é imitação em texto — trocar pelos arquivos oficiais.

## Equipe (tabela `equipe`)
- Cilene (cilene@mzen.com.br) está como `aprovador` SÓ PARA TESTES. Antes do evento,
  voltar para `editor` e cadastrar o aprovador indicado pela OAB.
- Painel 1 tem conteúdo "[TESTE]" para Cilene testar o fluxo. Limpar antes do evento.

## Google Drive
- Pasta raiz: "Congresso OAB 2026 · Fotos e cortes do hub" (id 1S4UKRokkKPsYD6gZudhxVM292-PgZUu0),
  no Drive de ciihs.almeida@gmail.com, compartilhada como editor com o robô
  hub-oab-drive@buoyant-climate-513113-q0.iam.gserviceaccount.com (projeto "My First Project").
- Chave do robô na Vercel: GOOGLE_SERVICE_ACCOUNT_JSON (Secret).
- pg_cron "sincronizar-drive" chama /api/drive/sincronizar a cada 2 min (token em public.segredos).
- Vídeos acima de 45 MB falham no plano gratuito do Supabase (limite 50 MB/arquivo).

## Páginas de demonstração
`/exemplo` (público) e `/exemplo/palestrante` — conteúdo fictício. APAGAR antes do evento.

## Próximos passos
1. ✅ Supabase ligado (variáveis na Vercel), tabelas e regras de acesso criadas.
2. ✅ Área `/admin` com login, rascunho/aprovação e cadastros (CSV).
3. ✅ Pipeline: áudio na pasta "Áudio e vídeo do painel" (Drive) → envios → AssemblyAI → Claude
   (claude-opus-5-5, structured output, fallbacks default) → rascunho. `/api/ia/processar` no cron.
   Chaves na Vercel: ASSEMBLYAI_API_KEY, ANTHROPIC_API_KEY. Ainda não testado com áudio real.
4. Cortes automáticos (ffmpeg pelos tempos) + Opus Clip opcional.
5. ✅ Kits (`/kit/<slug>-<token>`, só aprovado) + aba /admin/palestrantes (editar carômetro,
   WhatsApp com 55, enviar kit) + cadastro do público.
6. Teste de carga antes de 08/11.
