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
npm run db:studio
```

## Deploy no Railway (pronto)

O projeto já está preparado com `railway.json` e `postinstall` do Prisma.

### 1. Criar serviço no Railway

- Conecte o repositório.
- O Railway vai usar o builder Nixpacks automaticamente.

### 2. Configurar variáveis no Railway

- `DATABASE_URL` (Neon PostgreSQL)
- `AUTH_SECRET` (chave longa aleatória)
- `LOGIN_USERNAME` (`jhullya`)
- `LOGIN_PASSWORD` (`iuxy`)

### 3. Primeiro deploy

- Deploy normal (build/start já configurados).
- Após o deploy, abra o shell do serviço e rode uma vez:

```bash
npm run db:push
```

### 4. Acessar

- `/login`
- usuário e senha conforme variáveis configuradas.

## Observação de dados

- Calorias diárias, metas semanais e histórico de peso usam `localStorage` (foco em uso de 1 pessoa no celular).
- Cadastro de alimentos usa API + Prisma (com fallback local em dev).
