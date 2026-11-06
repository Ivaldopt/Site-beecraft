import { Link } from 'react-router-dom';
import { company } from '../config/company';
import { LEGAL_UPDATED, TERMS_VERSION } from '../legal/version';
import { OPEN_COOKIE_SETTINGS } from '../consent/CookieBanner';

const contact = [company.email, company.phone].filter(Boolean).join(' · ') || 'WhatsApp da loja';
const openCookies = () => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS));

function Identity() {
  return (
    <p>
      <b>{company.legalName || company.name}</b>{company.nif ? ` · NIF ${company.nif}` : ''}<br />
      {company.address}<br />
      Contacto: {contact}
    </p>
  );
}

export function Privacy() {
  return (
    <main className="content-page legal-page"><div className="container content-page-inner">
      <div className="eyebrow">RGPD</div>
      <h1>Política de privacidade</h1>
      <p className="legal-updated">Última atualização: {LEGAL_UPDATED} · versão {TERMS_VERSION}</p>

      <h2>1. Quem é responsável pelos seus dados</h2>
      <Identity />
      <p>Para exercer direitos ou esclarecer dúvidas, use o contacto acima.</p>

      <h2>2. Que dados recolhemos, para quê e com que base legal</h2>
      <table>
        <thead><tr><th>Situação</th><th>Dados</th><th>Finalidade e base legal</th></tr></thead>
        <tbody>
          <tr><td>Fazer uma encomenda (carrinho)</td><td>Nome, email, telemóvel (opcional), artigos escolhidos e personalização (texto, cores, detalhes, nome do ficheiro PDF), versão dos Termos aceite e data/hora da aceitação</td><td>Criar, produzir, entregar e faturar a encomenda — execução do contrato. Guardar a prova de aceitação dos Termos — interesse legítimo. Conservação de documentos fiscais — obrigação legal.</td></tr>
          <tr><td>Pagar por MB WAY</td><td>Email do pedido; o número MB WAY e o pagamento são tratados pela Stripe. Nós guardamos apenas o estado do pagamento e referências da Stripe, não o número MB WAY nem dados de cartão.</td><td>Cobrar e confirmar o pagamento — execução do contrato.</td></tr>
          <tr><td>Aviso interno de pagamento</td><td>Dados da encomenda enviados por email à BeeCraft</td><td>Produzir a encomenda — execução do contrato.</td></tr>
          <tr><td>Conversa no WhatsApp</td><td>Número de telemóvel, mensagens e ficheiros que você enviar</td><td>Acertar detalhes, prazos e entrega — execução do contrato / diligências pré-contratuais.</td></tr>
          <tr><td>Montador de ímanes para eventos</td><td>Nome, telefone ou email, forma de levantamento, fotografias e legendas enviadas</td><td>Produzir os ímanes pedidos — execução do contrato. As fotografias ficam em armazenamento privado.</td></tr>
          <tr><td>Mensagens de marketing (opcional)</td><td>Email e telemóvel do pedido, data/hora e versão em que marcou a caixa</td><td>Enviar novidades e ofertas — <b>consentimento</b>, separado dos Termos. Sem esta caixa a encomenda funciona na mesma.</td></tr>
          <tr><td>Estatísticas do site (só se aceitar)</td><td>Identificador aleatório guardado no seu navegador, páginas vistas, produtos vistos, cliques em &ldquo;adicionar ao carrinho&rdquo; e no WhatsApp</td><td>Perceber o que a loja precisa de melhorar — <b>consentimento</b>.</td></tr>
          <tr><td>Funcionamento técnico</td><td>Endereço IP e dados técnicos do pedido, nos registos dos servidores</td><td>Segurança e funcionamento do site — interesse legítimo.</td></tr>
        </tbody>
      </table>
      <p>Não vendemos dados pessoais nem os usamos para decisões automatizadas. O site não tem contas de cliente nem palavras-passe.</p>

      <h2>3. Armazenamento no seu navegador</h2>
      <table>
        <thead><tr><th>Nome</th><th>Para quê</th><th>Categoria</th></tr></thead>
        <tbody>
          <tr><td>beecraft-cart</td><td>Guarda o seu carrinho</td><td>Essencial</td></tr>
          <tr><td>beecraft-pending-order</td><td>Lembra a encomenda em pagamento, para abrir o WhatsApp depois de pagar</td><td>Essencial</td></tr>
          <tr><td>beecraft-consent</td><td>Guarda a sua escolha sobre cookies</td><td>Essencial</td></tr>
          <tr><td>Base de dados local (PDF da personalização)</td><td>Guarda no seu dispositivo o PDF até o enviar. Não é enviado para os nossos servidores.</td><td>Essencial</td></tr>
          <tr><td>beecraft-visitor-id</td><td>Identificador aleatório das estatísticas</td><td>Estatísticas (só com consentimento)</td></tr>
          <tr><td>Google Analytics / Pixel da Meta</td><td>Só são carregados se forem ativados pela BeeCraft <b>e</b> se aceitar a categoria respetiva</td><td>Estatísticas / Marketing</td></tr>
        </tbody>
      </table>
      <p><button type="button" className="cookie-link-btn" onClick={openCookies}>Gerir as minhas escolhas de cookies</button></p>

      <h2>4. Quem recebe os seus dados</h2>
      <p>Usamos prestadores que tratam dados em nosso nome, ao abrigo de contratos de tratamento de dados: Vercel (alojamento do site), Railway (servidores e bases de dados), Stripe (pagamentos), Resend (envio de emails internos), Cloudinary (armazenamento de imagens) e, se escolher usar o WhatsApp, a Meta (WhatsApp). Se forem ativados e aceites, Google (Analytics) e Meta (Pixel). A lista completa está no documento interno de conformidade do projeto.</p>
      <p>Alguns destes prestadores estão nos Estados Unidos. As transferências apoiam-se nas garantias previstas no RGPD (por exemplo, cláusulas contratuais-tipo ou o Quadro de Privacidade de Dados UE-EUA).</p>

      <h2>5. Quanto tempo guardamos</h2>
      <p>Dados de encomendas: o tempo necessário para cumprir o contrato, a garantia legal e as obrigações fiscais. Estatísticas: apenas enquanto mantiver o consentimento. Consentimento de marketing: até o retirar. Pode pedir a eliminação do que não tenhamos de conservar por lei.</p>

      <h2>6. Os seus direitos</h2>
      <p>Pode pedir acesso, retificação, apagamento, limitação, portabilidade e oposição, e retirar o consentimento a qualquer momento (sem afetar o que foi feito antes). Tem também o direito de reclamar junto da autoridade de controlo portuguesa, a <a href="https://www.cnpd.pt" target="_blank" rel="noreferrer">CNPD</a>.</p>

      <h2>7. Conteúdo gerado por IA</h2>
      <p>Algumas imagens e textos do site foram criados com inteligência artificial e estão assinalados. Os seus dados pessoais não são enviados a ferramentas de IA para gerar esse conteúdo.</p>

      <h2>8. Menores</h2>
      <p>A loja não se destina a menores de 16 anos sem autorização de quem tem a responsabilidade parental.</p>
      <p>Veja também os <Link to="/termos">Termos e condições</Link>.</p>
    </div></main>
  );
}

export function Terms() {
  return (
    <main className="content-page legal-page"><div className="container content-page-inner">
      <div className="eyebrow">Informação legal</div>
      <h1>Termos e condições</h1>
      <p className="legal-updated">Última atualização: {LEGAL_UPDATED} · versão {TERMS_VERSION}</p>

      <h2>1. Quem vende</h2>
      <Identity />

      <h2>2. Como encomendar</h2>
      <p>Escolhe os produtos, personaliza-os e preenche nome, email e (opcionalmente) telemóvel. A encomenda fica registada com um número. Pode depois pagar por MB WAY na página segura da Stripe ou combinar o pagamento e a entrega connosco pelo WhatsApp. O contrato só fica concluído com a confirmação do pagamento ou do acordo no WhatsApp, e depois da confirmação da BeeCraft de que consegue produzir o pedido.</p>

      <h2>3. Preços e pagamento</h2>
      <p>Os preços estão em euros e são validados pelo servidor no momento da encomenda. O MB WAY via Stripe está disponível para particulares, entre 0,50 € e 5.000 €, e o pagamento tem de ser aprovado na app MB WAY em 4 minutos; se expirar, pode tentar de novo. No extrato aparece o nome da Stripe. Para valores maiores ou empresas, combine connosco pelo WhatsApp.</p>

      <h2>4. Produção, prazos e entrega</h2>
      <p>Os produtos são feitos à mão em Loulé. O prazo depende da personalização e é confirmado connosco. A entrega em Portugal e Espanha e os respetivos custos são confirmados antes do pagamento ou no acerto pelo WhatsApp.</p>

      <h2>5. O que você nos envia (textos, imagens, PDF)</h2>
      <p>Ao enviar texto, imagem ou ficheiro para personalização declara que tem direito de os usar e que não violam direitos de terceiros nem a lei. Podemos recusar conteúdos ilegais, ofensivos ou que infrinjam direitos.</p>

      <h2>6. Direito de livre resolução (devolução)</h2>
      <p>Para produtos <b>não personalizados</b> tem 14 dias após a receção para desistir sem indicar motivo. Os produtos feitos de acordo com as suas especificações ou claramente personalizados <b>não têm direito de livre resolução</b> (Decreto-Lei n.º 24/2014, art. 17.º, n.º 1, al. c)), mas mantém a garantia legal.</p>

      <h2>7. Garantia legal e reclamações</h2>
      <p>Os bens têm garantia legal de 3 anos. Se receber um produto com defeito ou diferente do que foi confirmado, contacte-nos com fotografias para o reparar, substituir ou reembolsar. Tem acesso ao <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noreferrer">Livro de Reclamações eletrónico</a> e pode recorrer a uma entidade de resolução alternativa de litígios de consumo (<a href="https://www.consumidor.gov.pt" target="_blank" rel="noreferrer">Portal do Consumidor</a>).</p>

      <h2>8. Dados pessoais e marketing</h2>
      <p>Tratamos os seus dados conforme a <Link to="/privacidade">Política de privacidade</Link>. As mensagens de marketing só são enviadas se marcar a caixa própria, que é opcional e independente destes Termos.</p>

      <h2>9. Conteúdo do site e IA</h2>
      <p>As marcas, textos e imagens do site pertencem à BeeCraft ou são usados com autorização. Alguns conteúdos foram gerados com IA e estão assinalados.</p>

      <h2>10. Lei aplicável</h2>
      <p>Aplica-se a lei portuguesa, sem prejuízo dos direitos imperativos de consumidor no país onde reside.</p>
    </div></main>
  );
}
