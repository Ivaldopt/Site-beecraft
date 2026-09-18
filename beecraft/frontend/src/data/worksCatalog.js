import commerceImage from '../assets/works/comercio-local.png';
import hospitalityImage from '../assets/works/restauracao-hotelaria.png';
import eventsImage from '../assets/works/eventos.png';
import companiesImage from '../assets/works/empresas.png';

export const workCategories = {
  'comercio-local': { title: 'Comércio Local', eyebrow: 'Faça a sua marca crescer', description: 'Peças essenciais para apresentar, divulgar e fidelizar clientes.', image: commerceImage, products: [
    ['cartao-de-visita', 'Cartão de visita', 'Desde 18 €', 'Standard, quadrado ou cantos arredondados.'], ['flyer-personalizado', 'Flyer', 'Desde 22 €', 'Divulgue campanhas, aberturas e novidades.'], ['cartao-fidelidade', 'Cartão de fidelidade', 'Desde 20 €', 'Transforme visitas em relações duradouras.'], ['voucher-personalizado', 'Voucher', 'Desde 18 €', 'Uma oferta bonita e pronta a entregar.'], ['iman-promocional', 'Íman promocional', 'Desde 24 €', 'A sua marca sempre à vista.'], ['etiqueta-agradecimento', 'Etiqueta ou agradecimento', 'Desde 16 €', 'O detalhe final de cada encomenda.'],
  ]},
  'restauracao-hotelaria': { title: 'Restauração & Hotelaria', eyebrow: 'Receba com personalidade', description: 'Materiais coordenados para uma experiência cuidada à mesa e na estadia.', image: hospitalityImage, products: [
    ['menu-personalizado', 'Menu personalizado', 'Desde 28 €', 'Menus resistentes e alinhados com o espaço.'], ['cartao-de-mesa', 'Cartão de mesa', 'Desde 18 €', 'Reservas, QR codes e mensagens à mesa.'], ['voucher-restauracao', 'Voucher', 'Desde 18 €', 'Experiências prontas para oferecer.'], ['cartao-informativo', 'Cartão informativo', 'Desde 18 €', 'Horários, serviços e informações úteis.'], ['etiqueta-embalagem', 'Etiqueta para embalagem', 'Desde 16 €', 'Embalagens com identidade própria.'], ['bloco-restauracao', 'Bloco personalizado', 'Desde 15 €', 'Notas, pedidos e organização diária.'],
  ]},
  eventos: { title: 'Eventos', eyebrow: 'Tudo combina, tudo conta', description: 'Uma coleção visual completa para receber, celebrar e recordar.', image: eventsImage, products: [
    ['convite-personalizado', 'Convite ou boas-vindas', 'Desde 22 €', 'A primeira impressão do seu evento.'], ['menu-evento', 'Menu do evento', 'Desde 24 €', 'Informação com um acabamento especial.'], ['marcador-de-mesa', 'Marcador de mesa', 'Desde 18 €', 'Cada convidado encontra o seu lugar.'], ['etiqueta-evento', 'Etiqueta personalizada', 'Desde 16 €', 'Pequenos detalhes que ligam todo o tema.'], ['lembranca-personalizada', 'Íman ou lembrança', 'Desde 24 €', 'Uma memória para levar para casa.'], ['encadernacao-evento', 'Encadernação do evento', 'Desde 35 €', 'Planeamento e organização num só lugar.'],
  ]},
  empresas: { title: 'Empresas', eyebrow: 'Consistência em cada contacto', description: 'Materiais profissionais para equipas, apresentações e campanhas.', image: companiesImage, products: [
    ['pasta-apresentacao', 'Pasta ou apresentação', 'Desde 45 €', 'Propostas e documentos bem apresentados.'], ['bloco-empresarial', 'Bloco empresarial', 'Desde 25 €', 'A sua marca no trabalho diário.'], ['cartao-empresarial', 'Cartão empresarial', 'Desde 18 €', 'Contactos profissionais com presença.'], ['kit-integracao-funcionario', 'Kit de integração', 'Desde 69 €', 'Uma receção memorável para a equipa.'], ['material-promocional', 'Material promocional', 'Desde 39 €', 'Campanhas e eventos com unidade visual.'],
  ]},
};

export const findWorkProduct = (slug) => Object.values(workCategories).flatMap((category) => category.products).find(([productSlug]) => productSlug === slug);
export const findWorkCategory = (productSlug) => Object.entries(workCategories).find(([, category]) => category.products.some(([slug]) => slug === productSlug));
