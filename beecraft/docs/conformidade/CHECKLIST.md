# Checklist de conformidade — estado em 6 nov 2026

✅ feito · ⚠️ feito em parte · ❌ não consegui

| # | Pedido | Estado | Notas |
|---|---|---|---|
| 1 | Páginas `/privacidade` e `/termos` baseadas no que o app recolhe | ✅ | Escritas a partir do código (checkout, pagamento, métricas, WhatsApp, modo evento). Os links antigos redirecionam. **Falta revisão jurídica.** |
| 2 | Links no rodapé e no "cadastro" | ✅ | O site não tem contas de cliente: o "cadastro" é o formulário de encomenda (carrinho) e o formulário do modo evento. Ambos têm os links. |
| 3 | Caixa desmarcada + guardar data, hora e versão | ✅ | Guardado no servidor (`Order.termsVersion/termsAcceptedAt`, `EventOrder.*`). A hora é a do servidor; o servidor recusa se a versão não for a em vigor. Encomendas antigas não têm registo. |
| 4 | Banner de cookies Aceitar/Recusar/Configurar, igual destaque, escolha guardada | ✅ | Escolha em `beecraft-consent` (com data e versão). "Gerir cookies" no rodapé. |
| 5 | GA, Pixel e rastreio só após aceite | ✅ | Testado no navegador: sem aceite não há pedidos a Google/Meta. As métricas internas também só correm com "Estatísticas". GA/Pixel só existem se definir `VITE_GA_ID` / `VITE_META_PIXEL_ID`. |
| 6 | Marketing num checkbox próprio, desmarcado e opcional | ✅ | Encomenda funciona sem ele. Guardado em `Customer.marketingOptIn/At/Version`. ⚠️ Ainda não aparece no `/adm` e nada envia marketing. O modo evento não tem esta caixa. |
| 7 | Lista de serviços externos e DPA de cada um | ⚠️ | `SERVICOS_EXTERNOS.md`. ❌ Não posso assinar DPAs nem abrir os links daqui. Removi o Google Fonts (enviava o IP dos visitantes à Google). |
| 8 | Rodapé com nome, endereço e contacto | ⚠️ | Aparece "BeeCraft Papelaria · Loulé, Algarve, Portugal · +351 915 099 277". ❌ Faltam razão social, NIF, morada completa e email (ver decisões). |
| 9 | Licenças de imagens, fontes e bibliotecas | ⚠️ | `LICENCAS.md`. Bibliotecas e fonte: todas permitem uso comercial. ❌ As imagens sem metadados não têm origem confirmável. |
| 10 | Logos de terceiros | ✅ | `LOGOS_DE_TERCEIROS.md`: só o ícone do WhatsApp; MB WAY/Stripe só em texto. |
| 11 | Acessibilidade | ⚠️ | Teste automático (axe) sem falhas de rótulos, alt ou teclado; corrigidos contraste do rodapé e do texto secundário, títulos, regiões e adicionado "Saltar para o conteúdo". Ver restos abaixo. |
| 12 | Aviso "feito com IA" | ⚠️ | Etiqueta nas imagens incluídas no site (heróis, serviços, categorias, modelos de pré-visualização). ❌ Não consigo saber que textos foram gerados por IA. |

## O que não consegui cumprir, porquê e o que decidir

1. **Identificação da empresa (rodapé, privacidade, termos).** Não tenho razão social, NIF, morada completa nem email. *Decida:* que dados publicar (a lei do comércio eletrónico exige nome, morada e email; sendo negócio em casa pode usar morada de correspondência). Defina `VITE_COMPANY_LEGAL_NAME`, `VITE_COMPANY_NIF`, `VITE_COMPANY_ADDRESS`, `VITE_COMPANY_EMAIL` na Vercel e faça Redeploy.
2. **Contratos de tratamento de dados.** Só você pode aceitá-los nas contas. Faça-o e guarde cópias. *Decida:* continuar a usar o plano Hobby da Vercel? Esse plano é só para uso pessoal/não comercial; uma loja precisa do plano Pro.
3. **Imagens.** As 9 imagens sem origem provada e as 3 geradas por IA continuam no site (agora assinaladas). *Decida:* substituir por fotos reais (está pendente de si).
4. **Textos gerados por IA.** Não sei quais são. *Diga-me* e eu assinalo-os.
5. **Prazos de conservação.** A política não fixa números e o app **não apaga nada automaticamente** (nem as fotografias do modo evento). *Decida:* prazos (ex.: fotos do evento X dias após a entrega) e peço-lhe a implementação de limpeza.
6. **Newsletter.** O formulário antigo mostrava "obrigado" mas **não guardava nada**; removi-o. *Decida:* quer uma newsletter a sério (lista + confirmação por email + ferramenta de envio)?
7. **Texto legal.** Preços com/sem IVA, custos e prazos de envio, entidade de resolução de litígios e política de devolução de produtos não personalizados são pontos que o texto trata de forma genérica. *Decida/Peça:* revisão por advogado ou por serviço jurídico especializado antes de lançar.
8. **Acessibilidade — o que falta verificar à mão.** (a) Texto branco sobre fotografias (axe não consegue medir) e o logótipo dourado (2,5:1; os logótipos estão isentos pela norma, mas pode escurecer o dourado). (b) Não testei em ecrã as páginas que precisam de dados da loja (produto, atelier 3D da agenda, montador de ímanes). (c) Não fiz um teste completo só com teclado nem com leitor de ecrã.
9. **Testes.** A API real e o Prisma não correm neste ambiente; a migração e os registos de consentimento foram testados só com testes unitários e com o fluxo do navegador simulado. Faça um pedido de teste depois de publicar.
10. **Painel /adm e clientes antigos.** Os dados de utilizadores do painel e a tabela de clientes da gestão não estão descritos na política. Os clientes anteriores a hoje não têm registo de aceitação; só passa a existir nas próximas encomendas.
