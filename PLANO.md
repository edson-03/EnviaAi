# Plano de Desenvolvimento — Enviaí

Plataforma web de coleta de fotos e vídeos de eventos via QR code. O organizador conecta o próprio Google Drive, cria um álbum e recebe um link + QR code. Convidados enviam arquivos pelo navegador, sem app e sem login, direto para o Drive do organizador.

> Status das etapas: `[ ]` pendente · `[~]` em andamento · `[x]` concluída.
> Atualize este arquivo ao terminar cada etapa.

---

## 1. Nome do sistema

| Nome | Ideia | Observação |
|---|---|---|
| Olhares | Cada convidado vê o evento de um jeito; o álbum junta todos os olhares | Curto, português, serve para casamento, formatura e corporativo |
| Flashê | "Flash" + sotaque brasileiro | Descontraído, bom para festas |
| **Enviaí** (escolhido) | "Envia aí" | Deixa a ação óbvia para o convidado |
| Mural do Evento | Descritivo | Fácil de entender, mais difícil de registrar marca |
| Retrato Coletivo | Foco no coletivo | Mais formal |

Antes de fechar: verificar domínio `.com.br` no Registro.br, perfil no Instagram e marca no INPI.

---

## 2. Decisões técnicas

| Tema | Decisão | Motivo |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Front e API no mesmo projeto |
| UI | Tailwind CSS + shadcn/ui | Rapidez e responsividade |
| Banco | MongoDB Atlas (M0 grátis) com driver oficial `mongodb` | Escolha do projeto; só guarda metadados |
| Autorização de dados | No código: toda consulta do painel filtra por `ownerId` da sessão | Não há RLS no MongoDB |
| Login + Drive | Better Auth com Google: um fluxo pede `drive.file`, `accessType: "offline"`, `prompt: "consent"` | Um login só; o organizador já sai com o Drive conectado |
| Token do Google | Guardado pelo Better Auth na coleção `account` com `encryptOAuthTokens: true` (AES-256-GCM); renovado por `auth.api.getAccessToken` | Sem código próprio de criptografia e refresh |
| Upload | Sessão resumable criada no backend; navegador envia o arquivo direto ao Drive numa única requisição (`XMLHttpRequest`, progresso por `upload.onprogress`); se falhar, `/api/upload-status` consulta no servidor de onde retomar | O Drive não expõe o header `Range` via CORS, então o navegador não sabe sozinho quantos bytes chegaram |
| Registro de upload | `/api/upload-complete` valida o `fileId` no Drive (pasta pai = pasta do álbum) | Não confiar no cliente |
| Hospedagem | Vercel | Deploy via GitHub (Hobby não permite uso comercial; Pro ao cobrar) |

---

## 3. Riscos conhecidos

1. **CORS/308 no upload direto**: CORS funciona (Drive libera a origem), mas o header `Range` não é legível no navegador. Resolvido com envio único + consulta de status pelo servidor.
2. **App OAuth em modo "Testing"**: refresh token expira em 7 dias. Publicar como "In production" cedo (`drive.file` não é sensível).
3. **Abuso do endpoint público**: limite de tamanho, só `image/*` e `video/*`, rate limit por IP.
4. **iPhone suspende upload com tela bloqueada**: aviso + Wake Lock API.
5. **Login em webview (Instagram/WhatsApp)**: Google bloqueia; detectar e mostrar "Abrir no navegador" (só afeta o organizador).
6. **Cota do Drive (15 GB grátis)**: mostrar espaço livre via `about.get`.
7. **LGPD**: informar na página do convidado para onde vão as fotos e quem é o controlador.

---

## 4. Etapas do MVP

### Etapa 0 — Prova de conceito do upload `[~]`
- Página HTML/Next mínima + rota que cria sessão resumable com um token de teste.
- Envio em pedaços com `XMLHttpRequest`, leitura do status 308 e do header `Range`, retomada após falha.
- **Pronto quando:** vídeo de ~200 MB chega ao Drive a partir de Android (Chrome) e iPhone (Safari); retomada funciona após cortar a rede.
- Feito: `app/poc/page.tsx`, `app/api/poc/upload-session/route.ts`, `lib/resumable-upload.ts`, `lib/upload-limits.ts`.
- A rota usa o token do usuário logado (Etapa 4); não precisa mais do OAuth Playground.
- Testado em 2026-09-24 no desktop (Chrome): foto, vídeo grande e retomada após desligar o Wi-Fi ok.
- Falta: repetir no celular (Android Chrome e iPhone Safari). **Adiado para depois do deploy da Etapa 1** (HTTPS e login Google funcionam sem ajustes). Roteiro:
  1. Entrar em /entrar e abrir http://localhost:3000/poc. Os arquivos vão para a raiz do Drive.
  2. No celular: `npx next dev -H <IP do PC>` e abrir `http://<IP do PC>:3000/poc` na mesma rede Wi-Fi (login no celular também).
  3. Para testar retomada: ativar modo avião no meio do envio e desativar em seguida.
  4. Os arquivos da Etapa 0 com prefixo `poc` serão removidos quando a Etapa 6 estiver pronta.

### Etapa 1 — Base do projeto `[~]`
- `create-next-app` (TS, Tailwind, App Router, ESLint), shadcn/ui, git, deploy na Vercel.
- `.env.example` com todas as variáveis.
- **Pronto quando:** URL pública da Vercel no ar com a landing placeholder.
- Feito: Next.js 16.3 + TS + Tailwind 4 + ESLint, `.env.example`, landing, lint e build ok.
- Falta: deploy na Vercel (aguardando decisão conector x manual). shadcn/ui será instalado na primeira tela que precisar de componentes.

### Etapa 2 — Banco de dados `[x]`
- `lib/mongodb.ts`: conexão única reutilizada + tipos `Album` e `Upload`.
- `scripts/setup-db.mts` (`npm run db:setup`): cria coleções com validação `$jsonSchema` e índices. Idempotente.
- **Pronto quando:** `npm run db:setup` roda no Atlas sem erro.
- Feito: código acima, testado em MongoDB local em memória (validação, índices únicos de `slug` e `driveFileId`, execução repetida).
- Concluído em 2026-09-24: cluster Atlas `enviaai`, banco `enviai`, coleções com validação e índices criados.

### Etapa 3 — Login do organizador com Google + Drive `[x]`
- `lib/auth.ts` (Better Auth + `mongodbAdapter`, Google com `drive.file`, `accessType: "offline"`, `prompt: "consent"`, `account.encryptOAuthTokens: true`, campo extra `plano` com `input: false`).
- Rota `app/api/auth/[...all]/route.ts`, cliente `lib/auth-client.ts`, proteção de `/dashboard` no servidor.
- Detecção de webview com aviso "Abrir no navegador".
- **Pronto quando:** login/logout funcionam; `account` guarda tokens criptografados e escopo `drive.file`.
- Feito: `lib/auth.ts`, `lib/auth-client.ts`, `app/api/auth/[...all]/route.ts`, `/entrar` (com aviso de webview), `/dashboard` protegido. Verificado: redirect sem sessão, aviso no Instagram, URL do Google com `drive.file` + `offline` + `consent`.
- Concluído em 2026-09-24: login real ok; `account` com escopo `drive.file`, access e refresh token criptografados.

### Etapa 4 — Acesso ao Google Drive `[x]`
- `lib/google.ts`: `obterAccessToken(userId)` via `auth.api.getAccessToken` (renova sozinho).
- Estado "Drive conectado / Reconectar Drive" no painel (reconectar = novo login com consentimento).
- **Pronto quando:** access token renovado com sucesso; acesso revogado no Google leva ao estado "Reconectar".
- Concluído em 2026-09-24: `lib/google.ts` (`obterAccessToken`, `statusDrive` com espaço livre), botão "Reconectar Drive" via `linkSocial`. Testado: renovação após expirar, revogação -> Reconectar -> conectado.

### Etapa 5 — Criar álbum `[ ]`
- Formulário: título, tipo de evento, data. Slug único gerado a partir do título.
- Cria pasta no Drive e salva `drive_folder_id`.
- **Pronto quando:** pasta aparece no Drive e o álbum aparece no painel.

### Etapa 6 — Página do convidado `/a/[slug]` `[ ]`
- Nome opcional, seleção múltipla (`accept="image/*,video/*"`), fila com 2–3 envios paralelos, progresso por arquivo, retomada, mensagem de sucesso.
- Aviso de LGPD e de "mantenha a tela aberta"; Wake Lock.
- `/api/upload-session`: valida álbum ativo, tipo e tamanho.
- **Pronto quando:** 20 fotos + 1 vídeo grande enviados em 4G fraco sem perda.

### Etapa 7 — Registro do upload `[ ]`
- `/api/upload-complete`: busca o arquivo no Drive com o token do dono, confere `parents`, grava em `uploads` (sem duplicar).
- **Pronto quando:** `fileId` falso ou de outra pasta é rejeitado.

### Etapa 8 — Painel do organizador `[ ]`
- Lista de álbuns; detalhe com lista de envios (nome, convidado, tamanho, data, link do Drive).
- QR code para download (PNG e SVG) e link copiável.
- Espaço livre no Drive.
- **Pronto quando:** QR escaneado abre a página correta; cota exibida.

### Etapa 9 — Proteção contra abuso `[ ]`
- Rate limit por IP em `/api/upload-session` e `/api/upload-complete`.
- Limite de tamanho por arquivo e de arquivos por álbum (configurável por constante).
- **Pronto quando:** rajada de requisições retorna 429.

### Etapa 10 — Teste em campo `[ ]`
- Android e iPhone reais, 4G fraco, vídeos grandes, HEIC.
- Páginas `/privacidade` e `/termos` publicadas no domínio próprio; Branding do Google Auth Platform completo (home, privacidade, termos, domínio autorizado); clicar em "Publicar app" (até lá o app fica em "Testando": só usuários de teste, refresh token expira em 7 dias).
- **Pronto quando:** checklist de testes da seção 6 passa.

---

## 5. Esquema de banco (MVP)

MongoDB, banco `enviai`. Fonte da verdade: `scripts/setup-db.mts` (validação e índices) e tipos em `lib/mongodb.ts`.

| Coleção | Dono | Conteúdo | Índices |
|---|---|---|---|
| `user` | Better Auth | nome, email, imagem, `plano` (free/premium, não editável pelo usuário) | do Better Auth |
| `account` | Better Auth | vínculo Google, `accessToken`/`refreshToken` criptografados, `scope` | do Better Auth |
| `session`, `verification` | Better Auth | sessões e verificações | do Better Auth |
| `albums` | App | `ownerId`, `slug`, `titulo`, `tipoEvento`, `dataEvento`, `driveFolderId`, `corTema`, `mensagemBoasVindas`, `galeriaPublica`, `ativo`, `createdAt` | `slug` único; `ownerId + createdAt` |
| `uploads` | App | `albumId`, `driveFileId`, `nomeArquivo`, `mimeType` (image/video), `tamanhoBytes`, `nomeConvidado`, `legenda`, `aprovado`, `createdAt` | `driveFileId` único; `albumId + createdAt` |

Regra de acesso (substitui o RLS): o navegador nunca fala com o MongoDB. Rotas do painel filtram por `ownerId` da sessão; rotas públicas só leem álbum ativo por `slug` e gravam `uploads` após validar no Drive.

## 6. Checklist de teste em campo

- [ ] Android Chrome: fotos, vídeo > 500 MB
- [ ] iPhone Safari: fotos HEIC, vídeo 4K
- [ ] Rede lenta (throttling 3G) e queda de rede no meio do envio
- [ ] Tela bloqueada durante envio (iPhone)
- [ ] Link aberto dentro do WhatsApp e do Instagram (convidado)
- [ ] Login do organizador dentro do Instagram (deve pedir para abrir no navegador)
- [ ] Álbum inativo não aceita envios
- [ ] Drive sem espaço: mensagem clara

---

## 7. Depois do MVP

**V2 (premium):** pagamento Pix/cartão (tabela `pagamentos` ligada a `album_id`), personalização (capa, cores), e-mail agrupado por hora, placas em PDF, galeria em tempo real e slideshow via polling (decidir: proxy de miniaturas vs. arquivos públicos).

**V3:** livro de visitas com áudio, vários organizadores por álbum, moderação, download em ZIP, armazenamento próprio opcional (Cloudflare R2).
