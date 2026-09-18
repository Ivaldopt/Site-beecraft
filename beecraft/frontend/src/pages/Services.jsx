import { Link } from 'react-router-dom';
import { createWhatsappUrl } from '../components/WhatsappFab';

const serviceGroups = [
  {
    id: 'agendas-organizacao',
    number: '01',
    eyebrow: 'Organize com identidade',
    title: 'Agendas & organização',
    intro: 'Projetos funcionais para o dia a dia, criados com a sua identidade.',
    sections: [
      { title: 'Agendas personalizadas', items: ['Agenda diária', 'Agenda semanal', 'Agenda permanente', 'Agenda profissional', 'Agenda empresarial', 'Agenda personalizada com nome', 'Agenda personalizada com logótipo', 'Agenda para profissionais e prestadores de serviços'] },
      { title: 'Planners', items: ['Planner diário', 'Planner semanal', 'Planner mensal', 'Planner anual', 'Planner financeiro', 'Planner de estudos', 'Planner personalizado para empresas'] },
      { title: 'Cadernos & blocos', items: ['Cadernos personalizados', 'Blocos de anotações', 'Blocos empresariais', 'Blocos personalizados com logótipo', 'Caderno de pedidos e encomendas', 'Cadernos para formação e eventos'] },
    ],
    note: 'Personalização de capa, nome, cores, logótipo e interior conforme o projeto.',
  },
  {
    id: 'albuns-memorias',
    number: '02',
    eyebrow: 'Histórias para guardar',
    title: 'Álbuns & memórias',
    intro: 'Peças feitas para preservar momentos especiais e acompanhar cada fase da vida.',
    sections: [
      { title: 'Álbuns fotográficos personalizados', items: ['Álbum para colagem de fotografias', 'Álbum infantil', 'Álbum de bebé', 'Álbum de mesversário', 'Álbum de aniversário', 'Álbum de chá de bebé', 'Álbum de família', 'Álbum de viagem', 'Álbum para ocasiões especiais'] },
      { title: 'Projetos personalizados', text: 'Criamos capa, contracapa e páginas internas de acordo com o tema escolhido. Disponíveis em diferentes formatos e quantidades de páginas.' },
    ],
  },
  {
    id: 'papelaria-infantil',
    number: '03',
    eyebrow: 'Criatividade para os pequenos',
    title: 'Papelaria infantil',
    intro: 'Produtos lúdicos e personalizados para aprender, brincar e celebrar.',
    sections: [
      { title: 'Produtos personalizados', items: ['Livros de colorir', 'Livros infantis personalizados', 'Cadernos de atividades', 'Capas personalizadas', 'Etiquetas', 'Tags', 'Marcadores de páginas', 'Lembranças em papel'] },
    ],
    note: 'Temas, personagens, nome e idade personalizados.',
  },
  {
    id: 'eventos',
    number: '04',
    eyebrow: 'Todos os detalhes em harmonia',
    title: 'Papelaria para eventos',
    intro: 'Casamentos, aniversários, conferências, festas e eventos corporativos.',
    sections: [
      { title: 'Criamos para o seu evento', items: ['Convites', 'Tags', 'Marcadores de páginas', 'Cartões de agradecimento', 'Cartões personalizados', 'Menus', 'Identificadores', 'Calendários personalizados', 'Ímanes personalizados', 'Sacolas personalizadas', 'Embalagens personalizadas', 'Lembranças em papel', 'Material personalizado para patrocinadores'] },
    ],
  },
];

export default function Services() {
  const quoteUrl = createWhatsappUrl('Olá! Gostaria de pedir um orçamento para um projeto personalizado BeeCraft.');

  return <main className="services-page">
    <section className="services-hero"><div className="container">
      <div className="eyebrow">Serviços BeeCraft</div>
      <h1>Personalizamos ideias.<br />Criamos memórias.<br /><span>Fortalecemos marcas.</span></h1>
      <p>Papelaria personalizada <b>•</b> Presentes <b>•</b> Eventos <b>•</b> Empresas</p>
      <div className="btns"><a className="btn primary" href={quoteUrl} target="_blank" rel="noreferrer">Pedir um orçamento</a><Link className="btn secondary" to="/loja">Ver produtos</Link></div>
    </div></section>

    <nav className="services-index container" aria-label="Áreas de serviço">
      {serviceGroups.map((group) => <Link key={group.id} to={`/servicos/${group.id}`}><small>{group.number}</small><span>{group.title}</span></Link>)}
    </nav>

    <div className="container services-groups">
      {serviceGroups.map((group) => <section className="service-group" id={group.id} key={group.id}>
        <header><span>{group.number}</span><div><div className="eyebrow">{group.eyebrow}</div><h2>{group.title}</h2><p>{group.intro}</p></div></header>
        <div className="service-columns">
          {group.sections.map((section) => <article key={section.title}><h3>{section.title}</h3>{section.text && <p>{section.text}</p>}{section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}</article>)}
        </div>
        {group.note && <p className="service-note">{group.note}</p>}
        <Link className="service-more" to={`/servicos/${group.id}`}>Ver este serviço em detalhe →</Link>
      </section>)}
    </div>

    <section className="services-cta"><div className="container"><div><div className="eyebrow">Um projeto só seu</div><h2>Conte-nos a sua ideia.</h2><p>Preparamos uma proposta de acordo com o produto, quantidade, tema e prazo pretendido.</p></div><a className="btn primary" href={quoteUrl} target="_blank" rel="noreferrer">Falar pelo WhatsApp</a></div></section>
  </main>;
}
