# Calorias Rosa Premium

App web da Jhullya (Next.js 14 + Tailwind + Prisma), com login único e uso mobile-first.

## Rodar local

```bash
npm install
npm run dev
```

Abra `http://localhost:3000` (ou a porta mostrada no terminal).

## Variáveis de ambiente

Crie um `.env` baseado em `.env.example`:

```bash
cp .env.example .env
```

Obrigatórias:

- `DATABASE_URL`
- `AUTH_SECRET`
- `LOGIN_USERNAME`
- `LOGIN_PASSWORD`

## Scripts úteis

```bash
npm run lint
npm run build
npm run db:push
npm run db:migrate:deploy
npm run db:studio
```

## Deploy no Railway (pronto)

O projeto já está preparado com `railway.json`, `postinstall` do Prisma e migração inicial versionada.

### 1. Criar serviço no Railway

- Conecte o repositório.
- O Railway vai usar o builder Nixpacks automaticamente.

### 2. Configurar variáveis no Railway

- `DATABASE_URL` (Neon PostgreSQL)
- `AUTH_SECRET` (chave longa aleatória)
- `LOGIN_USERNAME` (`jhullya`)
- `LOGIN_PASSWORD` (`iuxy`)

### 3. Primeiro deploy

- Deploy normal.
- O Railway sobe com `npm run railway:start`, que executa `prisma migrate deploy` antes do `next start`.
- O healthcheck consulta `/api/health`, então o serviço só fica saudável quando app e banco estiverem respondendo.

### 4. Acessar

- `/login`
- usuário e senha conforme variáveis configuradas.

## Observação de dados

- Persistência principal no PostgreSQL (Prisma): alimentos, metas, logs diários, metas semanais e histórico de peso.
- A API não usa mais fallback em memória para escrita, então qualquer falha de banco aparece explicitamente em vez de “salvar localmente”.
- Tema (`claro/escuro`) e lista de recentes seguem no `localStorage` do navegador (preferência do aparelho).
