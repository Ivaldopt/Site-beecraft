# Publicação BeeCraft

Arquitetura de produção:

- Vercel: loja em `/` e painel protegido em `/adm/`.
- Railway: API da loja (NestJS), API de gestão (FastAPI) e duas bases PostgreSQL.

## 1. Railway — API da loja

Crie um serviço a partir deste repositório e defina o diretório raiz como
`beecraft/backend`. O serviço usa o `Dockerfile` e executa as migrações Prisma
antes de iniciar.

Variáveis obrigatórias:

```text
DATABASE_URL=<referência ao PostgreSQL da loja>
NODE_ENV=production
CORS_ORIGINS=https://SEU-DOMINIO-VERCEL
ADMIN_API_KEY=<chave longa e aleatória>
CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_API_KEY=<api key>
CLOUDINARY_API_SECRET=<api secret>
```

Gere um domínio público para o serviço e confirme que `/health` responde
`{"status":"ok"}`.

## 2. Railway — API de gestão

Crie outro serviço com diretório raiz `beecraft/management/backend`. Ele usa
o seu próprio PostgreSQL e executa as migrações Alembic automaticamente.

Variáveis obrigatórias:

```text
DATABASE_URL=<referência ao PostgreSQL da gestão>
ENVIRONMENT=production
SECRET_KEY=<segredo longo e aleatório>
CORS_ORIGINS=https://SEU-DOMINIO-VERCEL
BOOTSTRAP_OWNER_EMAIL=<email inicial do proprietário>
BOOTSTRAP_OWNER_PASSWORD=<senha inicial forte>
STORE_API_URL=https://DOMINIO-DA-API-LOJA
STORE_ADMIN_KEY=<mesmo valor de ADMIN_API_KEY>
```

Gere um domínio público e confirme `/health`. A URL usada pelo painel deve
terminar em `/api`, por exemplo `https://gestao-api.up.railway.app/api`.

## 3. Vercel — loja e `/adm`

Importe o mesmo repositório, defina `beecraft` como diretório raiz e deixe o
Vercel usar o `vercel.json` existente.

Variáveis de build:

```text
STORE_API_URL=https://DOMINIO-DA-API-LOJA
MANAGEMENT_API_URL=https://DOMINIO-DA-API-GESTAO/api
VITE_MAINTENANCE_MODE=false
VITE_EVENT_MODE=false
VITE_WHATSAPP_NUMBER=351915099277
VITE_PRODUCTION_ESTIMATE=5 a 7 dias úteis
```

`VITE_EVENT_MODE=true` mostra só a página de ímanes para eventos (pagamento
online); `false` publica a loja completa, onde o pedido termina no WhatsApp.
As variáveis definidas no painel da Vercel têm prioridade sobre
`frontend/.env.production`, por isso é lá que se muda de modo (e depois é
preciso fazer um novo deploy, porque são variáveis de *build*).

No serviço Railway da API da loja, configure também:

```text
PUBLIC_STORE_URL=https://www.beecraft.pt
STRIPE_SECRET_KEY=<chave secreta da conta Stripe>
STRIPE_WEBHOOK_SECRET=<segredo do webhook Stripe>
```

Crie na Stripe um webhook para `https://DOMINIO-DA-API-LOJA/event-orders/stripe/webhook` com os eventos `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` e `checkout.session.expired`.

O build gera uma única publicação: a loja fica na raiz e o painel em `/adm/`.

## 4. Segurança depois da primeira entrada

Entre em `/adm/` com o utilizador inicial, troque a senha no painel e crie uma
conta individual para cada colaborador. Nunca coloque senhas, chaves ou URLs de
base de dados em ficheiros versionados ou em mensagens; use apenas a área de
variáveis secretas do Railway e do Vercel.
