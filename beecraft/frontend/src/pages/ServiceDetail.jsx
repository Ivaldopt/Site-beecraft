import { Link, useParams } from 'react-router-dom';
import { createWhatsappUrl } from '../components/WhatsappFab';
import agendasImage from '../assets/services/agendas-organizacao.jpg';
import albumsImage from '../assets/services/albuns-memorias.jpg';
import childrenImage from '../assets/services/papelaria-infantil.jpg';
import eventsImage from '../assets/services/eventos.jpg';

const services = {
  'agendas-organizacao': {
    eyebrow: 'Organize com identidade', title: 'Agendas & organização', image: agendasImage,
    lead: 'Criamos ferramentas de organização bonitas, funcionais e totalmente adaptadas à sua rotina ou empresa.',
    groups: [
      ['Agendas personalizadas', ['Agenda diária', 'Agenda semanal', 'Agenda permanente', 'Agenda profissional', 'Agenda empresarial', 'Agenda com nome ou logótipo', 'Agenda para profissionais e prestadores de serviços']],
      ['Planners', ['Planner diário', 'Planner semanal', 'Planner mensal', 'Planner anual', 'Planner financeiro', 'Planner de estudos', 'Planner para empresas']],
      ['Cadernos & blocos', ['Cadernos personalizados', 'Blocos de anotações', 'Blocos empresariais com logótipo', 'Caderno de pedidos e encomendas', 'Cadernos para formação e eventos']],
    ],
    customization: ['Formato e interior', 'Cores e acabamentos', 'Nome ou frase', 'Fotografia ou logótipo'],
  },
  'albuns-memorias': {
    eyebrow: 'Histórias para guardar', title: 'Álbuns & memórias', image: albumsImage,
    lead: 'Transformamos fotografias e momentos especiais em álbuns artesanais feitos para atravessar gerações.',
    groups: [
      ['Álbuns fotográficos', ['Álbum para colagem de fotografias', 'Álbum infantil', 'Álbum de bebé e mesversário', 'Álbum de aniversário', 'Álbum de chá de bebé', 'Álbum de família', 'Álbum de viagem', 'Álbum para ocasiões especiais']],
      ['Projeto completo', ['Capa e contracapa personalizadas', 'Páginas internas de acordo com o tema', 'Diferentes formatos', 'Escolha da quantidade de páginas']],
    ],
    customization: ['Tema e paleta', 'Capa personalizada', 'Formato do álbum', 'Quantidade de páginas'],
  },
  'papelaria-infantil': {
    eyebrow: 'Criatividade para os pequenos', title: 'Papelaria infantil', image: childrenImage,
    lead: 'Produtos lúdicos e delicados, preparados especialmente para aprender, brincar, oferecer e celebrar.',
    groups: [
      ['Produtos personalizados', ['Livros de colorir', 'Livros infantis personalizados', 'Cadernos de atividades', 'Capas personalizadas', 'Etiquetas', 'Tags', 'Marcadores de páginas', 'Lembranças em papel']],
      ['Para cada ocasião', ['Aniversários', 'Atividades escolares', 'Lembranças de turma', 'Presentes especiais']],
    ],
    customization: ['Tema escolhido', 'Nome e idade', 'Cores favoritas', 'Formato e quantidade'],
  },
  eventos: {
    eyebrow: 'Todos os detalhes em harmonia', title: 'Papelaria para eventos', image: eventsImage,
    lead: 'Criamos uma identidade visual coerente em papel para tornar cada celebração ou evento profissional verdadeiramente memorável.',
    groups: [
      ['Papelaria do evento', ['Convites', 'Tags', 'Marcadores de páginas', 'Cartões de agradecimento', 'Cartões personalizados', 'Menus', 'Identificadores', 'Calendários personalizados']],
      ['Brindes & apresentação', ['Ímanes personalizados', 'Sacolas personalizadas', 'Embalagens personalizadas', 'Lembranças em papel', 'Material para patrocinadores']],
      ['Ocasiões', ['Casamentos', 'Aniversários', 'Conferências', 'Festas', 'Eventos corporativos']],
    ],
    customization: ['Identidade visual', 'Cores e tema', 'Conjunto coordenado', 'Quantidade e prazo'],
  },
};

export default function ServiceDetail() {
  const { serviceSlug } = useParams();
  const service = services[serviceSlug];
  if (!service) return <main className="not-found-page"><span>404</span><h1>Serviço não encontrado</h1><Link className="btn primary" to="/servicos">Ver serviços</Link></main>;
  const quoteUrl = createWhatsappUrl(`Olá! Gostaria de pedir um orçamento para: ${service.title}.`);

  return <main className="service-detail-page">
    <section className="service-detail-hero"><div className="container service-detail-grid">
      <div><div className="eyebrow">{service.eyebrow}</div><h1>{service.title}</h1><p>{service.lead}</p><div className="btns"><a className="btn primary" href={quoteUrl} target="_blank" rel="noreferrer">Pedir orçamento</a><Link className="btn secondary" to="/servicos">Todos os serviços</Link></div></div>
      <img src={service.image} alt={`Exemplos de ${service.title.toLowerCase()} personalizados`} />
    </div></section>

    <section className="service-offer container"><div className="section-head"><div><div className="eyebrow">Possibilidades</div><h2>O que podemos criar</h2></div><p>Cada projeto é preparado de acordo com a sua ideia e necessidade.</p></div>
      <div className="service-offer-grid">{service.groups.map(([title, items]) => <article key={title}><h3>{title}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div>
    </section>

    <section className="service-personalization"><div className="container service-personalization-grid"><div><div className="eyebrow">Feito para si</div><h2>Personalização cuidada em cada detalhe</h2><p>Antes da produção, alinhamos consigo os elementos essenciais do projeto.</p></div><div>{service.customization.map((item, index) => <span key={item}><b>{String(index + 1).padStart(2, '0')}</b>{item}</span>)}</div></div></section>

    <section className="service-process container"><div className="section-head"><div><div className="eyebrow">Como funciona</div><h2>Da ideia ao produto final</h2></div></div><div><article><b>01</b><h3>Conte-nos a ideia</h3><p>Produto, quantidade, tema e data pretendida.</p></article><article><b>02</b><h3>Receba a proposta</h3><p>Confirmamos possibilidades, valor e prazo.</p></article><article><b>03</b><h3>Aprove e receba</h3><p>Produzimos artesanalmente e preparamos a entrega.</p></article></div></section>

    <section className="services-cta"><div className="container"><div><div className="eyebrow">Vamos criar juntos?</div><h2>Peça uma proposta personalizada.</h2><p>Envie-nos os detalhes e responderemos pelo WhatsApp.</p></div><a className="btn primary" href={quoteUrl} target="_blank" rel="noreferrer">Começar o pedido</a></div></section>
  </main>;
}
