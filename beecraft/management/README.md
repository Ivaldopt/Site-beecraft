# BeeCraft Gestão

ERP interno separado da loja pública. Inclui Dashboard, vendas, compras, stock/Kardex, ficha técnica e preços, CRM, CSV e recibos PDF.

## Início rápido com Docker

1. Copie `.env.example` para `.env` e altere todas as senhas.
2. Execute `docker compose up --build`.
3. Abra o painel em `http://localhost:8080`.
4. Swagger: `http://localhost:8000/docs`.

O primeiro utilizador OWNER é criado a partir de `BOOTSTRAP_OWNER_EMAIL` e `BOOTSTRAP_OWNER_PASSWORD`. Depois do primeiro login, crie a conta STAFF da Rayane em `POST /api/auth/users` pelo Swagger.

## Desenvolvimento

Backend: instale `backend/pyproject.toml` e execute `uvicorn app.main:app --reload` dentro de `backend`.

Frontend: execute `npm install` e `npm run dev` dentro de `frontend`.

## Regras contabilísticas

- Compras atualizam o custo médio ponderado e criam entradas de stock.
- Vendas congelam preço/custo, calculam lucro e consomem a ficha técnica ou produto acabado.
- Preço pela margem: `preço = custo / (1 - margem/100)`.
- Todos os movimentos mantêm referência para auditoria.

O PDF emitido é um recibo interno simples e não substitui software de faturação certificado quando legalmente exigido.
