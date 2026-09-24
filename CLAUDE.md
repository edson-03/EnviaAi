# CLAUDE.md — Contexto do projeto Enviaí

Leia este arquivo e o `PLANO.md` antes de qualquer tarefa.

@AGENTS.md

## O que é

SaaS de coleta de fotos/vídeos de eventos via QR code. Organizador conecta o próprio Google Drive e cria um álbum; convidados enviam arquivos pelo navegador, sem login, direto para o Drive do organizador. Público: Brasil (casamentos, formaturas, 15 anos, eventos corporativos). Interface 100% em português.

## Stack

- Next.js (App Router) + TypeScript estrito
- Tailwind CSS + shadcn/ui
- MongoDB Atlas com driver oficial `mongodb` (sem ODM)
- Better Auth (login Google + tokens do Drive) com `mongodbAdapter`
- Google Drive API v3 via `fetch` direto na REST (sem `googleapis`), escopo **apenas** `https://www.googleapis.com/auth/drive.file`
- Hospedagem: Vercel
- Ambiente de desenvolvimento: Windows, PowerShell, Node 22

## Regras de arquitetura (não violar)

1. **Arquivos de convidados nunca passam pelo servidor.** O backend só cria a sessão resumable no Drive e devolve a URL; o navegador envia direto ao Drive.
2. **Tokens do Google**: ficam na coleção `account` do Better Auth com `encryptOAuthTokens: true`. Obter access token só por `auth.api.getAccessToken` no servidor. Nunca enviar ao frontend, nunca logar.
3. **O navegador nunca acessa o MongoDB.** `lib/mongodb.ts` só é importado em código de servidor (route handlers, server components, server actions).
4. **Nunca confiar no cliente**: validar álbum ativo, tipo (`image/*`, `video/*`), tamanho e, no `upload-complete`, confirmar no Drive que o arquivo está na pasta do álbum.
5. **Não há RLS: autorização é no código.** Toda consulta do painel filtra por `ownerId` = usuário da sessão (Better Auth). Nunca aceitar `ownerId` vindo do cliente.
6. Login e autorização do Drive são um único fluxo Google (Better Auth) com escopo `drive.file`, `accessType: "offline"`, `prompt: "consent"`.

## Estrutura de pastas

```
/app
  /(publico)/page.tsx              landing
  /(publico)/a/[slug]/page.tsx     página do convidado
  /(painel)/dashboard/...          painel do organizador
  /api/auth/[...all]               Better Auth
  /api/upload-session              cria sessão resumable
  /api/upload-complete             valida e registra upload
/lib        mongodb.ts, auth.ts, auth-client.ts, google.ts, rate-limit.ts
/components UploadDropzone.tsx, QrCodeCard.tsx, ...
/scripts/setup-db.mts              validação e índices do MongoDB
```

## Variáveis de ambiente

```
NEXT_PUBLIC_APP_URL
MONGODB_URI
MONGODB_DB               # padrão: enviai
BETTER_AUTH_SECRET       # também é a chave de criptografia dos tokens
BETTER_AUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

Manter `.env.example` atualizado. Nunca commitar `.env.local`.

## Como trabalhar neste projeto

1. **Uma etapa por vez**, na ordem do `PLANO.md`. Não adiantar recursos de etapas futuras nem da V2/V3.
2. Antes de começar uma etapa: listar premissas e o critério de "pronto" dela. Se algo depender do usuário (credenciais, contas, decisões), perguntar antes.
3. Ao terminar: rodar `npm run lint` e `npm run build`, verificar o critério de "pronto", marcar a etapa como `[x]` no `PLANO.md` e resumir o que foi feito e o que ficou pendente.
4. Mudança de schema = atualizar o tipo em `lib/mongodb.ts` **e** a validação/índices em `scripts/setup-db.mts`, depois rodar `npm run db:setup`. Campos novos devem ser opcionais ou vir com migração de dados.
5. Não rodar `npm run build` com `npm run dev` ativo (compartilham `.next` e o dev quebra). Parar o dev antes, inclusive o processo node que fica na porta 3000.
6. Código mínimo e direto. Sem abstrações especulativas, sem dependências desnecessárias.
7. Textos de interface em português; nomes de código podem seguir o padrão do esquema (tabelas/colunas em português, funções em camelCase).

## Etapa atual

Etapa 5 (criar álbum). Pendentes: deploy da Etapa 1 e, logo após, teste da Etapa 0 no celular. Ver `PLANO.md`.

## Pendências do usuário

- [x] Projeto Google Cloud, Drive API, consentimento (modo Testando) e OAuth Client ID
- [x] Nome definido: Enviaí
- [ ] Registrar domínio (ex.: enviai.com.br)
- [x] Cluster MongoDB Atlas criado (`enviaai`)
- [ ] Decidir: criar projeto Vercel via conector ou manualmente
