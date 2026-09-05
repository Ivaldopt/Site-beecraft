import { Link, useParams } from 'react-router-dom';

const pages = {
  'sobre-nos': { eyebrow: 'A nossa história', title: 'Feito à mão em Loulé', paragraphs: ['A BeeCraft nasceu do gosto por transformar papel, cor e ideias em peças que acompanham a vida real.', 'Cada agenda, planner e caderno é preparado com atenção aos detalhes. Você escolhe o formato, o interior e a personalização; nós cuidamos da produção artesanal.'] },
  contactos: { eyebrow: 'Fale connosco', title: 'Contactos', paragraphs: ['Tem uma ideia especial ou precisa de ajuda com uma encomenda? Fale connosco pelo WhatsApp. Respondemos assim que possível em dias úteis.'] },
  faq: { eyebrow: 'Ajuda', title: 'Perguntas frequentes', sections: [['Quanto demora a produção?', 'O prazo depende da personalização e será confirmado antes do pagamento. O prazo de envio começa depois da produção.'], ['Posso enviar uma fotografia?', 'Sim. Nos produtos compatíveis, pode carregar a fotografia durante a personalização e ver uma pré-visualização.'], ['Vou aprovar a personalização?', 'O resumo completo segue com o pedido. Se houver alguma dúvida na arte, entraremos em contacto antes de produzir.']] },
  'metodos-pagamento': { eyebrow: 'Comprar com confiança', title: 'Métodos de pagamento', paragraphs: ['As opções disponíveis são confirmadas durante o atendimento: MB Way, transferência bancária e outros meios indicados no momento da encomenda.'] },
  'garantia-devolucoes': { eyebrow: 'Apoio ao cliente', title: 'Garantia e devoluções', paragraphs: ['Queremos que receba a sua encomenda em perfeitas condições. Se encontrar defeito ou dano, contacte-nos com fotografias logo após a receção.', 'Produtos feitos segundo especificações do cliente ou claramente personalizados podem estar abrangidos por exceções ao direito de livre resolução. Esta informação será apresentada antes da compra.'] },
  'politica-privacidade': { eyebrow: 'RGPD', title: 'Política de privacidade', paragraphs: ['Recolhemos apenas os dados necessários para responder a pedidos, preparar encomendas e cumprir obrigações legais. Não vendemos dados pessoais.', 'A versão final desta política incluirá a identificação legal da responsável, contactos, prazos de conservação e meios para exercer os seus direitos.'] },
  'termos-condicoes': { eyebrow: 'Informação legal', title: 'Termos e condições', paragraphs: ['Antes do lançamento, esta página apresentará a identificação da vendedora, preços, impostos, processo de encomenda, produção, entrega, cancelamento e resolução de litígios.'] },
  blog: { eyebrow: 'Inspiração', title: 'Blog BeeCraft', paragraphs: ['Em breve: ideias de organização, bastidores da produção e inspirações para personalizar a sua papelaria.'] },
};

export default function ContentPage() {
  const { page } = useParams();
  const content = pages[page];
  if (!content) return <main className="not-found-page"><span>404</span><h1>Página não encontrada</h1><Link className="btn primary" to="/">Voltar ao início</Link></main>;
  return <main className="content-page"><div className="container content-page-inner"><div className="eyebrow">{content.eyebrow}</div><h1>{content.title}</h1>{content.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{content.sections?.map(([heading, text]) => <section key={heading}><h2>{heading}</h2><p>{text}</p></section>)}{(page === 'contactos' || page === 'sobre-nos') && <Link className="btn primary" to="/loja">Conhecer os produtos</Link>}</div></main>;
}
