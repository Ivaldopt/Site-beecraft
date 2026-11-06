# Imagens, fontes e bibliotecas: licenças

## Fontes
| Item | Licença | Uso comercial |
|---|---|---|
| Inter (`@fontsource-variable/inter`) | SIL Open Font License 1.1 | ✅ Permitido (não pode vender a fonte isolada) |
| Georgia / Arial (fontes do sistema) | Do sistema do visitante, não são distribuídas | ✅ |

## Imagens (pasta `frontend/src/assets`)
| Ficheiro | Origem apurada | Estado |
|---|---|---|
| `agenda-customization-template.png`, `agenda-customization-template-v2.png`, `magnet-button-template.png` | Metadados C2PA indicam geração por IA (`gpt-image`, 2026-09-08) | ⚠️ Gerada por IA: confirme os termos da ferramenta (os termos da OpenAI atribuem os resultados ao utilizador, mas não há direitos de autor garantidos). Assinalada no site. |
| `bee-only.png` | Metadados indicam autor "Ivaldo Almeida" | ✅ Sua |
| `magnets-hero.jpg`, `services/*.jpg` (4), `works/*.webp` (4) | **Sem metadados de origem.** Foram descritas por si como artificiais (IA). | ❓ **Não consigo confirmar licença nem autoria.** Assinaladas como "gerada por IA". Substitua por fotos reais (já pendente). |
| Fotos de produtos (Cloudinary) | Enviadas por si no `/adm` | ✅ Suas, se foram tiradas por si |

## Bibliotecas da loja (frontend)
React, React DOM, React Router, Axios e dependências: **MIT**. Fonte Inter: **OFL-1.1**. Nenhuma com restrição a uso comercial.

## API da loja (backend, NestJS)
~260 pacotes: MIT (198), ISC (28), Apache-2.0 (24), BSD (8), Unlicense (2), 0BSD (1) e **EPL-2.0** (1: `elkjs`, usada por ferramentas de desenvolvimento do Prisma). Todas permitem uso comercial. EPL-2.0 e Apache-2.0 exigem manter os avisos de licença se redistribuir o código; não é o caso de um serviço alojado.

## Painel /adm
React e dependências: MIT / Apache-2.0.

## API de gestão (Python)
FastAPI, SQLAlchemy, Alembic, Pydantic, httpx, PyJWT, pwdlib, uvicorn: MIT/BSD. `reportlab`: BSD. **`psycopg`: LGPL-3.0** (permite uso comercial como biblioteca, sem alterar o código dela).

## Pode ou não ser usado em produto comercial?
- **Nada nas bibliotecas impede uso comercial.**
- **Atenção às imagens:** as sem origem confirmada e as geradas por IA. Para as fotos reais que vai pôr, guarde prova de autoria.
- O próprio projeto está sem licença declarada (`UNLICENSED`) — correto para código privado.
