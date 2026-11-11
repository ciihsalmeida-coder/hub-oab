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
- Endereço: https://hub-oab.vercel.app (admin: /admin). Cilene quer subdomínio da Mzen (sugerido oab.mzen.com.br):
  falta ela adicionar na Vercel + CNAME no DNS do mzen.com.br; depois trocar NEXT_PUBLIC_SITE_URL/padrões (mural, QR,
  Linha.tsx, Aprovacao.tsx tem URL fixa) e redirecionar o vercel.app (menos /api). DECIDIR ANTES DE IMPRIMIR QR.
- Galeria com busca por selfie: VZERO face (galeria_url em todos os painéis, definido em 05/11).
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
  Montserrat). Logos oficiais em `public/marca/` (OAB/SC azul e branco, Mzen colorido e branco); assinatura
  oficial `assinatura-azul/branco.png` (OAB | ESA | CAASC) + as duas comissões em texto. Mzen (`SeloMzen`, logo
  colorido): rodapé, fim do kit, topo da área de controle e mural. Login = produto "Mzen hub" (barra com logo
  Mzen + "hub", título "Entrar no Mzen hub"), assinatura OAB pequena dentro do quadro. Ícone do app: OAB branco sobre o mar. Cards: logo OAB
  embutido em `src/lib/logo-oab.ts` (next/og não busca arquivo do próprio site).

## Equipe (tabela `equipe`)
- Cilene (cilene@mzen.com.br) está como `aprovador` SÓ PARA TESTES. Antes do evento,
  voltar para `editor` e cadastrar o aprovador indicado pela OAB.
- Painel 1 tem conteúdo "[TESTE]" para Cilene testar o fluxo. Limpar antes do evento.

## Google Drive
- Pasta raiz (desde 06/11): "Congresso OAB 2026 · Hub" (id 1lGLnqcFRI6xfguGP7KVLdqBiFCeG3fCr), dono
  midialapa@gmail.com, editores luana@mzen.com.br e o robô. Estava "qualquer pessoa com o link = editor" (pedir para
  restringir). A antiga (1S4UKRokkKPsYD6gZudhxVM292-PgZUu0, Drive de ciihs.almeida@gmail.com) ficou com os testes.
  Trocar de pasta: mudar PASTA_RAIZ e rodar /api/drive/preparar (o upsert troca os drive_id em pastas_drive).
  Arquivo enviado conta no Drive de quem envia, não do dono da pasta. Compartilhada como editor com o robô
  hub-oab-drive@buoyant-climate-513113-q0.iam.gserviceaccount.com (projeto "My First Project").
- Chave do robô na Vercel: GOOGLE_SERVICE_ACCOUNT_JSON (Secret).
- pg_cron "sincronizar-drive" chama /api/drive/sincronizar a cada 2 min (token em public.segredos).
- Vídeos acima de 45 MB falham no plano gratuito do Supabase (limite 50 MB/arquivo).

## Riscos conhecidos (revisão 29/10)
- Vercel Hobby: funções com limite de tempo menor; `/api/ia/processar` pede 300 s (Claude em painel
  de 1 h). Assinar Vercel Pro antes do evento. Envios têm limite de 4 tentativas por etapa.
- Supabase Free: 1 GB de arquivos. 10 painéis × (fotos + 5 cortes de ~13 MB) passa disso → Pro.
- Regra de aprovação: vídeo novo em corte já aprovado volta a rascunho (cortar.py); "Refazer com
  a IA" substitui falas e cortes automáticos do painel (sem duplicar).
- Proteção de senhas vazadas (Supabase Auth) só no plano Pro: ligar ao assinar.
- `pg_net` no schema public (aviso do Supabase): limitação conhecida da extensão, sem impacto.

## Pendências (05/11)
- (11/11) Vercel Pro assinado: /api/ia/processar com maxDuration 800 e reserva do envio 14 min.
- (11/11) Supabase Pro assinado (org Mzen Films): vídeo manual até 200 MB (LIMITE_VIDEO_MB); falta o limite geral
  em Storage > Settings (Cilene) e ligar proteção de senhas vazadas.
- Cilene: (storage já em 366 MB/1 GB) e créditos de IA; conferir validade do
  GITHUB_TOKEN; espaço no Google Drive de quem sobe vídeos (vídeo conta no Drive de quem envia); nome/e-mail do
  aprovador OAB; WhatsApps; carômetro; OK jurídico; domínio; teste de gravação por palestrante (ainda não testado).
- Eu, até 08/11: apagar painel `ensaio` (e pastas no Drive; a pasta do ensaio está "qualquer pessoa com link = editor"),
  conteúdo [TESTE] do Painel 1, /exemplo, testes de carga; Cilene → editor; cadastrar aprovador; revisar firewall (Wi-Fi do evento = mesmo IP).
- Ideias não feitas: glossário de nomes/siglas na AssemblyAI (não testado, risco de quebrar), gamificação (passaporte,
  frase do dia, selo LinkedIn), produto "Mzen hub" multi-evento depois do congresso.
- Regras para a equipe: pasta geral do painel = UMA gravação (áudio e vídeo da mesma, mesmo nome); gravação de uma
  pessoa vai em "Gravações por palestrante/<nome>"; fotos de uma pessoa em "Fotos por palestrante/<nome>" (vira card
  com foto). Kit só depois de aprovar. Arquivo novo na pasta geral substitui o painel (volta a rascunho).

## Limpeza antes do evento (11/11)
Hub zerado: painel `ensaio`, conteúdo de teste da Abertura (falas, cortes, fotos, envios e arquivos), resumos de todos
os painéis, "[TESTE]" do Painel 1, cadastros, métricas, resumos do dia, testes de carga, WhatsApps e legendas dos
palestrantes, páginas `/exemplo`. O kit do Amyr ganhou token novo (o link de teste não abre mais). O código que
esconde o ensaio do público (`src/lib/ensaio.ts`) ficou, para um próximo teste. A pasta do ensaio no Drive continua lá.

## Próximos passos
1. ✅ Supabase ligado (variáveis na Vercel), tabelas e regras de acesso criadas.
2. ✅ Área `/admin` com login, rascunho/aprovação e cadastros (CSV).
3. ✅ Pipeline: áudio na pasta "Áudio e vídeo do painel" (Drive) → envios → AssemblyAI → Claude
   (claude-opus-5-5, structured output, fallbacks default) → rascunho. `/api/ia/processar` no cron.
   Chaves na Vercel: ASSEMBLYAI_API_KEY, ANTHROPIC_API_KEY. Ainda não testado com áudio real.
4. ✅ Robô de cortes: `.github/workflows/cortes.yml` + `scripts/cortes/cortar.py` (alinha áudio da mesa ×
   vídeo por correlação de energia, corta 9:16 com legenda ASS, sobe em storage `cortes`). Disparado por
   `/api/ia/processar` via GITHUB_TOKEN (Vercel). Secrets no GitHub: SUPABASE_SECRET_KEY,
   GOOGLE_SERVICE_ACCOUNT_JSON. Vídeo = o de mesmo nome do áudio (senão o mais recente).
   Testado ponta a ponta em 29/10 (disparo automático pelo site OK). Botão "Refazer cortes" no editor.
   O robô também faz versão leve 720p (`video_web_url`) + capa de todo corte (inclusive manuais do Drive);
   o site toca a leve, o kit baixa a original. Falha na leve → `video_web_url` = original.
5. ✅ Kits (`/kit/<slug>-<token>`, só aprovado) + aba /admin/palestrantes (editar carômetro,
   WhatsApp com 55, enviar kit) + cadastro do público.
6. ✅ Manual do dia + plano B (/admin/manual), mural do telão (/mural), resumo do dia (/admin/resumo-do-dia),
   QR codes e "Agora no palco" (/admin/materiais), métricas anônimas (tabela `eventos`, view `metricas`,
   /admin/metricas; aviso em /privacidade).
7. ✅ Filtro por eixo na home (`ListaPaineis`) e vídeo da sessão completa via YouTube não listado
   (`paineis.video_sessao_url`, campo no editor do painel; capa leve até tocar, youtube-nocookie).
   Publica ao salvar (não passa pela aprovação).
8. ✅ (04/11) Métricas com pessoas únicas (código aleatório no localStorage, 30 dias, sem IP; views
   `pessoas_por_dia`, `pessoas_por_alvo`, `pessoas_total`) e play de vídeo (`tocou_video`). Kit com 3 tipos de
   card: frase, "palestrante" (sem frase) e moldura livre (`?modelo=participacao|fundo`). LGPD: transcrição apagada
   da AssemblyAI depois de salva. Fotos: JPEG 90, 4:4:4, sRGB.
9. ✅ (04/11) Gravação por palestrante: pasta "Gravações por palestrante/<nome>" em cada painel (pastas_drive
   tipo `midia_palestrante`). envios.palestrante_id; falas/cortes.envio_id. Cada fonte (geral ou palestrante) é
   transcrita e refeita sem apagar as outras; falas/cortes vão direto para a pessoa. Resumo do painel = gravação geral
   se houver; senão, resumo combinado das individuais (`resumoDasGravacoesIndividuais`). cortar.py agrupa por envio
   (`escolher_fontes`): vídeo da mesma pessoa. Geral + individual juntas: resumo da geral; frases/cortes/legenda de
   quem tem gravação própria vêm só dela (a geral descarta os dessa pessoa; a individual apaga os que a geral tinha). Vídeo grande vai do Drive à AssemblyAI em stream (https.request;
   fetch do Node bufferiza tudo). Painel `ensaio` (fora do público) para testes; apagar antes do evento.
10. ✅ (05/11) Cards com foto do evento de fundo (fotos aprovadas em que o palestrante foi marcado; cada card uma
   foto; `&fundo=azul` força o cartaz). A rota do card embute as imagens (fetch com tempo limite + sharp) porque o
   next/og trava buscando arquivos. Fotos HEIC viram JPEG (`heic-convert`). Galeria de fotos em tela cheia
   (`GaleriaFotos`). Compartilhar envia o arquivo do vídeo (Web Share com arquivo).
11. ✅ (05/11) Botão único "Salvar no celular" (`Salvar` em Botoes.tsx: baixa e abre o menu do aparelho → galeria;
   no computador baixa). IA processa 3 gravações por vez; vídeo individual espera 5 min pelo áudio (geral 15);
   cortes redisparam a cada 8 min; sync de fotos 4 por vez (maxDuration 120); "Refazer com a IA" usa a
   transcrição guardada (a da AssemblyAI é apagada). Prévia de link (opengraph-image.tsx). Card com foto: foto em
   cima (ALTURA_FOTO) e texto na faixa azul embaixo.
12. ✅ (05/11) Cards em Feed 4:5 e Story 9:16 (`&formato=story`, chave no kit: `kit/[codigo]/Cards.tsx`). Cards e fotos
   pré-carregados (um toque abre o menu do celular). Celular sem menu de salvar (navegador dentro do WhatsApp):
   janela `JanelaSalvar` com "← Voltar" e instrução, sem abrir outra página.
13. ✅ (09/11) Card com foto no modelo da designer: moldura azul #0b1866, foto no quadro, logo OAB + traço + aspas +
   frase no canto inferior esquerdo, nome e cargo, faixa clara com o nome do congresso (FOTO_CARD dá o recorte).
   Fonte Montserrat embutida (`src/lib/fonte-montserrat.ts`, @fontsource 5.2.8, OFL) em todos os cards.
   QR não foi impresso: só no mural (TV/telão), que usa o endereço atual.
14. Teste de carga (`.github/workflows/carga.yml`, manual; resultados em `testes_carga`): de uma máquina só a
   Vercel bloqueia com 403 após ~100 pedidos (proteção contra robô). Não mede capacidade real; páginas são ISR/CDN.
