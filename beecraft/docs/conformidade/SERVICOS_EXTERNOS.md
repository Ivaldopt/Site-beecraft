# Serviços externos que recebem dados deste app

Levantado a partir do código (novembro de 2026). "DPA" = contrato de tratamento de dados (Data Processing Agreement).
**Ação sua:** aceitar/assinar o DPA de cada conta (na maioria é um clique nas definições da conta) e guardar uma cópia.

| Serviço | Para quê | Dados que recebe | DPA / termos de tratamento de dados |
|---|---|---|---|
| **Vercel** | Aloja o site da loja (`/`) e o painel (`/adm`) | IP e dados técnicos de cada visita (registos) | https://vercel.com/legal/dpa |
| **Railway** | Corre a API da loja, a API de gestão e as duas bases de dados PostgreSQL | Tudo o que o cliente submete (nome, email, telemóvel, encomendas, consentimentos), métricas, utilizadores do painel | https://railway.com/legal/dpa |
| **Stripe** | Pagamento MB WAY (página segura) | Email e valor da encomenda; o número MB WAY é inserido pelo cliente na Stripe | https://stripe.com/legal/dpa |
| **Resend** | Email interno "pagamento recebido" para a BeeCraft | Nome, email, telemóvel e artigos da encomenda | https://resend.com/legal/dpa |
| **Cloudinary** | Imagens de produtos e fotografias do modo evento (privadas) | Fotografias enviadas pelos clientes no modo evento | https://cloudinary.com/gdpr (DPA nas definições da conta) |
| **WhatsApp (Meta)** | Conversa iniciada pelo cliente (`wa.me`) | Telemóvel, mensagens e PDF que o cliente enviar | https://www.whatsapp.com/legal/business-data-processing-terms (se usar WhatsApp Business) |
| **Google Analytics** *(inativo até definir `VITE_GA_ID` e o cliente aceitar)* | Estatísticas | Identificador de navegador, páginas vistas, IP anonimizado | https://business.safety.google/adsprocessorterms/ |
| **Pixel da Meta** *(inativo até definir `VITE_META_PIXEL_ID` e o cliente aceitar)* | Medir anúncios | Identificadores de navegador e eventos | https://www.facebook.com/legal/terms/dataprocessing |
| **GitHub** | Código-fonte (sem dados de clientes) | Nenhum dado de clientes | — |

**Já removido:** Google Fonts. As fontes passaram a ser servidas pelo próprio site (pacote `@fontsource-variable/inter`), por isso o Google deixou de receber o IP de cada visitante.

**Transferências para fora da UE:** Vercel, Railway, Stripe, Resend, Cloudinary, Meta e Google têm operações nos EUA. Confirme em cada DPA que usam cláusulas contratuais-tipo e/ou o Quadro de Privacidade de Dados UE-EUA.

> Os links dos DPAs são os endereços públicos habituais de cada empresa; não consegui abri-los a partir deste ambiente. Confirme-os ao assinar.
