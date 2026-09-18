import {
  PrismaClient,
  ProductStatus,
  OptionType,
  ProductSaleType,
} from '@prisma/client';

import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL não definida');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('🌱 Iniciando seed BeeCraft...');

  // ============================================
  // CATEGORIAS
  // ============================================

  const agendas = await prisma.category.upsert({
    where: {
      slug: 'agendas',
    },
    update: {},
    create: {
      name: 'Agendas',
      slug: 'agendas',
      description: 'Agendas personalizadas BeeCraft',
      active: true,
    },
  });

  const planners = await prisma.category.upsert({
    where: {
      slug: 'planners',
    },
    update: {},
    create: {
      name: 'Planners',
      slug: 'planners',
      description: 'Planners personalizados',
      active: true,
    },
  });

  const cadernos = await prisma.category.upsert({
    where: {
      slug: 'cadernos',
    },
    update: {},
    create: {
      name: 'Cadernos',
      slug: 'cadernos',
      description: 'Cadernos personalizados',
      active: true,
    },
  });

  const blocos = await prisma.category.upsert({
    where: {
      slug: 'blocos',
    },
    update: {},
    create: {
      name: 'Blocos',
      slug: 'blocos',
      description: 'Blocos personalizados',
      active: true,
    },
  });

  console.log('✅ Categorias criadas');

  // ============================================
  // AGENDA A5
  // ============================================

  const agenda = await prisma.product.upsert({
    where: {
      slug: 'agenda-a5-personalizada',
    },
    update: { saleType: ProductSaleType.CUSTOMIZABLE },
    create: {
      name: 'Agenda A5 Personalizada',
      slug: 'agenda-a5-personalizada',

      shortDesc:
        'Agenda A5 personalizada para organizar o seu dia a dia.',

      description:
        'Agenda A5 personalizada BeeCraft com diferentes opções de interior, capa, encadernação e personalização.',

      basePrice: 25,

      status: ProductStatus.ACTIVE,
      saleType: ProductSaleType.CUSTOMIZABLE,

      categoryId: agendas.id,
    },
  });

  // ============================================
  // VARIANTES
  // ============================================

  await prisma.productVariant.upsert({
    where: {
      sku: 'AGENDA-A5-WIREO',
    },
    update: {},
    create: {
      productId: agenda.id,

      name: 'A5 Wire-O',

      sku: 'AGENDA-A5-WIREO',

      price: 25,

      width: 148,
      height: 210,

      pages: 200,

      active: true,
    },
  });

  // ============================================
  // OPÇÃO: FORMATO
  // ============================================

  const formato = await prisma.productOption.upsert({
    where: {
      productId_slug: {
        productId: agenda.id,
        slug: 'formato',
      },
    },
    update: {},
    create: {
      productId: agenda.id,

      name: 'Formato',

      slug: 'formato',

      type: OptionType.SELECT,

      required: true,

      sortOrder: 1,
    },
  });

  await prisma.optionValue.upsert({
    where: {
      id: 'seed-agenda-formato-a5',
    },
    update: {},
    create: {
      id: 'seed-agenda-formato-a5',

      optionId: formato.id,

      name: 'A5',

      value: 'a5',

      priceDelta: 0,

      sortOrder: 1,
    },
  });

  // ============================================
  // OPÇÃO: INTERIOR
  // ============================================

  const interior = await prisma.productOption.upsert({
    where: {
      productId_slug: {
        productId: agenda.id,
        slug: 'interior',
      },
    },
    update: {},
    create: {
      productId: agenda.id,

      name: 'Interior',

      slug: 'interior',

      type: OptionType.SELECT,

      required: true,

      sortOrder: 2,
    },
  });

  const interiores = [
    {
      id: 'seed-interior-diario',
      name: 'Diário',
      value: 'diario',
      price: 0,
    },
    {
      id: 'seed-interior-semanal',
      name: 'Semanal',
      value: 'semanal',
      price: 0,
    },
    {
      id: 'seed-interior-mensal',
      name: 'Mensal',
      value: 'mensal',
      price: 0,
    },
  ];

  for (let i = 0; i < interiores.length; i++) {
    const item = interiores[i];

    await prisma.optionValue.upsert({
      where: {
        id: item.id,
      },
      update: {},
      create: {
        id: item.id,

        optionId: interior.id,

        name: item.name,

        value: item.value,

        priceDelta: item.price,

        sortOrder: i + 1,
      },
    });
  }

  // ============================================
  // OPÇÃO: ENCADERNAÇÃO
  // ============================================

  const encadernacao =
    await prisma.productOption.upsert({
      where: {
        productId_slug: {
          productId: agenda.id,
          slug: 'encadernacao',
        },
      },
      update: { name: 'Tipo de espiral' },
      create: {
        productId: agenda.id,

        name: 'Tipo de espiral',

        slug: 'encadernacao',

        type: OptionType.SELECT,

        required: true,

        sortOrder: 3,
      },
    });

  const encadernacoes = [
    {
      id: 'seed-encadernacao-wireo',
      name: 'Wire-O duplo',
      value: 'wire-o',
      price: 0,
    },
    {
      id: 'seed-encadernacao-espiral',
      name: 'Espiral normal',
      value: 'espiral',
      price: 0,
    },
  ];

  for (let i = 0; i < encadernacoes.length; i++) {
    const item = encadernacoes[i];

    await prisma.optionValue.upsert({
      where: {
        id: item.id,
      },
      update: {
        name: item.name,
        value: item.value,
        priceDelta: item.price,
        sortOrder: i + 1,
      },
      create: {
        id: item.id,

        optionId: encadernacao.id,

        name: item.name,

        value: item.value,

        priceDelta: item.price,

        sortOrder: i + 1,
      },
    });
  }

  // ============================================
  // OPÇÃO: PERSONALIZAÇÃO
  // ============================================

  const personalizacao =
    await prisma.productOption.upsert({
      where: {
        productId_slug: {
          productId: agenda.id,
          slug: 'personalizacao',
        },
      },
      update: {},
      create: {
        productId: agenda.id,

        name: 'Personalização',

        slug: 'personalizacao',

        type: OptionType.SELECT,

        required: true,

        sortOrder: 4,
      },
    });

  const personalizacoes = [
    {
      id: 'seed-personalizacao-nome',
      name: 'Nome',
      value: 'nome',
      price: 0,
    },
    {
      id: 'seed-personalizacao-foto',
      name: 'Foto',
      value: 'foto',
      price: 2,
    },
    {
      id: 'seed-personalizacao-logo',
      name: 'Logótipo',
      value: 'logo',
      price: 2,
    },
  ];

  for (let i = 0; i < personalizacoes.length; i++) {
    const item = personalizacoes[i];

    await prisma.optionValue.upsert({
      where: {
        id: item.id,
      },
      update: {},
      create: {
        id: item.id,

        optionId: personalizacao.id,

        name: item.name,

        value: item.value,

        priceDelta: item.price,

        sortOrder: i + 1,
      },
    });
  }

  // ============================================
  // OPÇÃO: EXTRAS
  // ============================================

  const extras = await prisma.productOption.upsert({
    where: {
      productId_slug: {
        productId: agenda.id,
        slug: 'extras',
      },
    },
    update: {},
    create: {
      productId: agenda.id,

      name: 'Extras',

      slug: 'extras',

      type: OptionType.SELECT,

      required: false,

      sortOrder: 5,
    },
  });

  const extrasValues = [
    {
      id: 'seed-extra-cantoneira',
      name: 'Cantoneiras metálicas',
      value: 'cantoneira',
      price: 2.5,
    },
    {
      id: 'seed-extra-elastico',
      name: 'Elástico',
      value: 'elastico',
      price: 1.5,
    },
    {
      id: 'seed-extra-marcador',
      name: 'Marcador de página',
      value: 'marcador',
      price: 2,
    },
  ];

  await prisma.optionValue.deleteMany({
    where: { id: { in: ['seed-extra-caneta', 'seed-extra-separadores'] } },
  });

  const kitsProfissionais = await prisma.category.upsert({
    where: { slug: 'kits-profissionais' },
    update: { name: 'Kits profissionais', active: true },
    create: { name: 'Kits profissionais', slug: 'kits-profissionais', description: 'Kits personalizados para negócios, empresas e eventos', active: true },
  });
  const servicosCriativos = await prisma.category.upsert({
    where: { slug: 'servicos-criativos' },
    update: { name: 'Serviços criativos', active: true },
    create: { name: 'Serviços criativos', slug: 'servicos-criativos', description: 'Design gráfico e criação de sites', active: true },
  });
  const comercioLocal = await prisma.category.upsert({ where: { slug: 'comercio-local' }, update: { name: 'Comércio Local', active: true }, create: { name: 'Comércio Local', slug: 'comercio-local', description: 'Impressos para comércio local', active: true } });
  const restauracaoHotelaria = await prisma.category.upsert({ where: { slug: 'restauracao-hotelaria' }, update: { name: 'Restauração e Hotelaria', active: true }, create: { name: 'Restauração e Hotelaria', slug: 'restauracao-hotelaria', description: 'Impressos para restauração e hotelaria', active: true } });
  const eventosProfissionais = await prisma.category.upsert({ where: { slug: 'eventos-profissionais' }, update: { name: 'Eventos', active: true }, create: { name: 'Eventos', slug: 'eventos-profissionais', description: 'Papelaria personalizada para eventos', active: true } });
  const empresasProfissionais = await prisma.category.upsert({ where: { slug: 'empresas-profissionais' }, update: { name: 'Empresas', active: true }, create: { name: 'Empresas', slug: 'empresas-profissionais', description: 'Materiais personalizados para empresas', active: true } });

  for (let i = 0; i < extrasValues.length; i++) {
    const item = extrasValues[i];

    await prisma.optionValue.upsert({
      where: {
        id: item.id,
      },
      update: {
        name: item.name,
        value: item.value,
        priceDelta: item.price,
        sortOrder: i + 1,
      },
      create: {
        id: item.id,

        optionId: extras.id,

        name: item.name,

        value: item.value,

        priceDelta: item.price,

        sortOrder: i + 1,
      },
    });
  }

  console.log('✅ Agenda A5 criada');

  const corDaCapa = await prisma.productOption.upsert({
    where: {
      productId_slug: {
        productId: agenda.id,
        slug: 'cor-da-capa',
      },
    },
    update: { name: 'Cor da capa', sortOrder: 6 },
    create: {
      productId: agenda.id,
      name: 'Cor da capa',
      slug: 'cor-da-capa',
      type: OptionType.SELECT,
      required: false,
      sortOrder: 6,
    },
  });

  const coresDaCapa = [
    { id: 'seed-capa-branca', name: 'Branca', value: 'branca' },
    { id: 'seed-capa-preta', name: 'Preta', value: 'preta' },
    { id: 'seed-capa-rosa', name: 'Rosa', value: 'rosa' },
    { id: 'seed-capa-azul', name: 'Azul', value: 'azul' },
    { id: 'seed-capa-verde', name: 'Verde', value: 'verde' },
    { id: 'seed-capa-lilas', name: 'Lilás', value: 'lilas' },
    { id: 'seed-capa-bege', name: 'Bege', value: 'bege' },
    { id: 'seed-capa-vermelha', name: 'Vermelha', value: 'vermelha' },
  ];

  for (let i = 0; i < coresDaCapa.length; i++) {
    const item = coresDaCapa[i];
    await prisma.optionValue.upsert({
      where: { id: item.id },
      update: { name: item.name, value: item.value, sortOrder: i + 1 },
      create: {
        id: item.id,
        optionId: corDaCapa.id,
        name: item.name,
        value: item.value,
        priceDelta: 0,
        sortOrder: i + 1,
      },
    });
  }

  // ============================================
  // CADERNO PERSONALIZADO A4 / A5
  // ============================================

  const caderno = await prisma.product.upsert({
    where: { slug: 'caderno-personalizado' },
    update: { saleType: ProductSaleType.CUSTOMIZABLE, status: ProductStatus.ACTIVE },
    create: {
      name: 'Caderno Personalizado',
      slug: 'caderno-personalizado',
      shortDesc: 'Caderno A4 ou A5 com capa e interior personalizados.',
      description: 'Escolha o formato, a cor ou fotografia da capa e o interior pautado, quadriculado ou pontilhado.',
      basePrice: 15,
      status: ProductStatus.ACTIVE,
      saleType: ProductSaleType.CUSTOMIZABLE,
      categoryId: cadernos.id,
    },
  });

  const cadernoVariants = [
    { sku: 'CADERNO-A5-PERSONALIZADO', name: 'A5', price: 15, width: 148, height: 210 },
    { sku: 'CADERNO-A4-PERSONALIZADO', name: 'A4', price: 20, width: 210, height: 297 },
  ];
  for (const variant of cadernoVariants) {
    await prisma.productVariant.upsert({
      where: { sku: variant.sku },
      update: { name: variant.name, price: variant.price, active: true },
      create: { productId: caderno.id, ...variant, pages: 160, active: true },
    });
  }

  const cadernoPersonalizacao = await prisma.productOption.upsert({
    where: { productId_slug: { productId: caderno.id, slug: 'personalizacao' } },
    update: { name: 'Design da capa', sortOrder: 1 },
    create: { productId: caderno.id, name: 'Design da capa', slug: 'personalizacao', type: OptionType.SELECT, required: true, sortOrder: 1 },
  });
  const cadernoCapas = [
    { id: 'seed-caderno-capa-cor', name: 'Capa de cor lisa', value: 'cor-lisa' },
    { id: 'seed-caderno-capa-foto', name: 'Capa com imagem', value: 'foto' },
  ];
  for (let i = 0; i < cadernoCapas.length; i++) {
    const item = cadernoCapas[i];
    await prisma.optionValue.upsert({
      where: { id: item.id },
      update: { name: item.name, value: item.value, sortOrder: i + 1 },
      create: { id: item.id, optionId: cadernoPersonalizacao.id, name: item.name, value: item.value, priceDelta: 0, sortOrder: i + 1 },
    });
  }

  const cadernoInterior = await prisma.productOption.upsert({
    where: { productId_slug: { productId: caderno.id, slug: 'miolo-caderno' } },
    update: { name: 'Interior do caderno', sortOrder: 2 },
    create: { productId: caderno.id, name: 'Interior do caderno', slug: 'miolo-caderno', type: OptionType.SELECT, required: true, sortOrder: 2 },
  });
  const cadernoInteriores = [
    { id: 'seed-caderno-pautado', name: 'Pautado', value: 'pautado' },
    { id: 'seed-caderno-quadriculado', name: 'Quadriculado', value: 'quadriculado' },
    { id: 'seed-caderno-pontilhado', name: 'Pontilhado', value: 'pontilhado' },
  ];
  for (let i = 0; i < cadernoInteriores.length; i++) {
    const item = cadernoInteriores[i];
    await prisma.optionValue.upsert({
      where: { id: item.id },
      update: { name: item.name, value: item.value, sortOrder: i + 1 },
      create: { id: item.id, optionId: cadernoInterior.id, name: item.name, value: item.value, priceDelta: 0, sortOrder: i + 1 },
    });
  }

  const cadernoCor = await prisma.productOption.upsert({
    where: { productId_slug: { productId: caderno.id, slug: 'cor-da-capa' } },
    update: { name: 'Cor da capa', sortOrder: 3 },
    create: { productId: caderno.id, name: 'Cor da capa', slug: 'cor-da-capa', type: OptionType.SELECT, required: false, sortOrder: 3 },
  });
  for (let i = 0; i < coresDaCapa.length; i++) {
    const item = coresDaCapa[i];
    const id = `seed-caderno-capa-${item.value}`;
    await prisma.optionValue.upsert({
      where: { id },
      update: { name: item.name, value: item.value, sortOrder: i + 1 },
      create: { id, optionId: cadernoCor.id, name: item.name, value: item.value, priceDelta: 0, sortOrder: i + 1 },
    });
  }

  console.log('✅ Caderno personalizado criado');

  // ============================================
  // ÍMAN BUTTON PERSONALIZADO
  // ============================================

  const imanButton = await prisma.product.upsert({
    where: { slug: 'iman-button-personalizado' },
    update: { saleType: ProductSaleType.CUSTOMIZABLE, status: ProductStatus.ACTIVE },
    create: {
      name: 'Íman Button Personalizado',
      slug: 'iman-button-personalizado',
      shortDesc: 'Íman tipo button com fotografia, nome ou logótipo.',
      description: 'Personalize um íman button com a sua imagem, identidade visual, texto, formato e cor de fundo.',
      basePrice: 4.5,
      status: ProductStatus.ACTIVE,
      saleType: ProductSaleType.CUSTOMIZABLE,
      categoryId: blocos.id,
    },
  });

  const imanVariants = [
    { sku: 'IMAN-BUTTON-55', name: '55 mm', price: 4.5, width: 55, height: 55 },
    { sku: 'IMAN-BUTTON-75', name: '75 mm', price: 6.5, width: 75, height: 75 },
  ];
  for (const variant of imanVariants) {
    await prisma.productVariant.upsert({
      where: { sku: variant.sku },
      update: { name: variant.name, price: variant.price, active: true },
      create: { productId: imanButton.id, ...variant, active: true },
    });
  }

  const imanPersonalizacao = await prisma.productOption.upsert({
    where: { productId_slug: { productId: imanButton.id, slug: 'personalizacao' } },
    update: { name: 'Personalização', sortOrder: 1 },
    create: { productId: imanButton.id, name: 'Personalização', slug: 'personalizacao', type: OptionType.SELECT, required: true, sortOrder: 1 },
  });
  const imanPersonalizacoes = [
    { id: 'seed-iman-personalizacao-nome', name: 'Nome ou frase', value: 'nome' },
    { id: 'seed-iman-personalizacao-foto', name: 'Fotografia', value: 'foto' },
    { id: 'seed-iman-personalizacao-logo', name: 'Logótipo', value: 'logo' },
  ];
  for (let i = 0; i < imanPersonalizacoes.length; i++) {
    const item = imanPersonalizacoes[i];
    await prisma.optionValue.upsert({
      where: { id: item.id },
      update: { name: item.name, value: item.value, sortOrder: i + 1 },
      create: { id: item.id, optionId: imanPersonalizacao.id, name: item.name, value: item.value, priceDelta: 0, sortOrder: i + 1 },
    });
  }

  const imanFormato = await prisma.productOption.upsert({
    where: { productId_slug: { productId: imanButton.id, slug: 'formato-iman' } },
    update: { name: 'Formato', sortOrder: 2 },
    create: { productId: imanButton.id, name: 'Formato', slug: 'formato-iman', type: OptionType.SELECT, required: true, sortOrder: 2 },
  });
  const imanFormatos = [
    { id: 'seed-iman-formato-quadrado', name: 'Quadrado', value: 'quadrado' },
    { id: 'seed-iman-formato-redondo', name: 'Redondo', value: 'redondo' },
  ];
  for (let i = 0; i < imanFormatos.length; i++) {
    const item = imanFormatos[i];
    await prisma.optionValue.upsert({
      where: { id: item.id },
      update: { name: item.name, value: item.value, sortOrder: i + 1 },
      create: { id: item.id, optionId: imanFormato.id, name: item.name, value: item.value, priceDelta: 0, sortOrder: i + 1 },
    });
  }

  const imanCor = await prisma.productOption.upsert({
    where: { productId_slug: { productId: imanButton.id, slug: 'cor-da-capa' } },
    update: { name: 'Cor de fundo', sortOrder: 3 },
    create: { productId: imanButton.id, name: 'Cor de fundo', slug: 'cor-da-capa', type: OptionType.SELECT, required: false, sortOrder: 3 },
  });
  for (let i = 0; i < coresDaCapa.length; i++) {
    const item = coresDaCapa[i];
    const id = `seed-iman-cor-${item.value}`;
    await prisma.optionValue.upsert({
      where: { id },
      update: { name: item.name, value: item.value, sortOrder: i + 1 },
      create: { id, optionId: imanCor.id, name: item.name, value: item.value, priceDelta: 0, sortOrder: i + 1 },
    });
  }

  console.log('✅ Íman button personalizado criado');

  const agendaMediterranea = await prisma.product.upsert({
    where: { slug: 'agenda-a5-mediterranea' },
    update: { saleType: ProductSaleType.READY_MADE },
    create: {
      name: 'Agenda A5 Mediterrânea',
      slug: 'agenda-a5-mediterranea',
      shortDesc: 'Agenda A5 pronta, com design mediterrâneo e organização semanal.',
      description: 'Uma agenda pronta a comprar, inspirada nas cores e formas do Mediterrâneo. Ideal para quem quer começar a organizar-se sem configurar a capa.',
      basePrice: 29.9,
      status: ProductStatus.ACTIVE,
      saleType: ProductSaleType.READY_MADE,
      categoryId: agendas.id,
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: 'AGENDA-A5-MEDITERRANEA' },
    update: {},
    create: {
      productId: agendaMediterranea.id,
      name: 'A5 Semanal',
      sku: 'AGENDA-A5-MEDITERRANEA',
      price: 29.9,
      width: 148,
      height: 210,
      pages: 200,
      active: true,
    },
  });

  console.log('✅ Agenda A5 Mediterrânea pronta criada');

  console.log('🌱 Seed concluído!');
  const printProducts = [
    ['cartao-de-visita', 'Cartão de visita', 'CARTAO-VISITA', 18, comercioLocal.id, 'Cartões profissionais personalizados com a sua identidade.'],
    ['flyer-personalizado', 'Flyer personalizado', 'FLYER', 22, comercioLocal.id, 'Flyers para campanhas, novidades e divulgação local.'],
    ['cartao-fidelidade', 'Cartão de fidelidade', 'FIDELIDADE', 20, comercioLocal.id, 'Cartões personalizados para premiar clientes recorrentes.'],
    ['voucher-personalizado', 'Voucher personalizado', 'VOUCHER', 18, comercioLocal.id, 'Vouchers elegantes para produtos, serviços e experiências.'],
    ['iman-promocional', 'Íman promocional', 'IMAN-PROMO', 24, comercioLocal.id, 'Ímanes personalizados para manter a sua marca presente.'],
    ['etiqueta-agradecimento', 'Etiqueta ou cartão de agradecimento', 'AGRADECIMENTO', 16, comercioLocal.id, 'O acabamento especial para embalagens e encomendas.'],
    ['menu-personalizado', 'Menu personalizado', 'MENU', 28, restauracaoHotelaria.id, 'Menus personalizados para restaurantes, cafés e alojamentos.'],
    ['cartao-de-mesa', 'Cartão de mesa', 'CARTAO-MESA', 18, restauracaoHotelaria.id, 'Cartões de mesa para reservas, QR codes e informações.'],
    ['voucher-restauracao', 'Voucher para restauração e hotelaria', 'VOUCHER-HOTEL', 18, restauracaoHotelaria.id, 'Vouchers personalizados para oferecer experiências.'],
    ['cartao-informativo', 'Cartão informativo', 'INFO-HOTEL', 18, restauracaoHotelaria.id, 'Informações importantes apresentadas com cuidado.'],
    ['etiqueta-embalagem', 'Etiqueta para embalagem', 'ETIQUETA-EMB', 16, restauracaoHotelaria.id, 'Etiquetas personalizadas para takeaway e produtos.'],
    ['bloco-restauracao', 'Bloco personalizado', 'BLOCO-REST', 15, restauracaoHotelaria.id, 'Blocos para pedidos, notas e organização diária.'],
    ['convite-personalizado', 'Convite ou cartão de boas-vindas', 'CONVITE', 22, eventosProfissionais.id, 'Convites e cartões personalizados para iniciar o evento.'],
    ['menu-evento', 'Menu do evento', 'MENU-EVENTO', 24, eventosProfissionais.id, 'Menus coordenados com a identidade da celebração.'],
    ['marcador-de-mesa', 'Marcador de mesa', 'MARCADOR-MESA', 18, eventosProfissionais.id, 'Marcadores personalizados para organizar os convidados.'],
    ['etiqueta-evento', 'Etiqueta para evento', 'ETIQUETA-EVENTO', 16, eventosProfissionais.id, 'Etiquetas que unem todos os detalhes do evento.'],
    ['lembranca-personalizada', 'Íman ou lembrança personalizada', 'LEMBRANCA', 24, eventosProfissionais.id, 'Uma recordação personalizada para cada convidado.'],
    ['encadernacao-evento', 'Encadernação para evento', 'ENC-EVENTO', 35, eventosProfissionais.id, 'Organização do evento numa encadernação feita à medida.'],
    ['pasta-apresentacao', 'Pasta ou apresentação encadernada', 'PASTA-EMPRESA', 45, empresasProfissionais.id, 'Apresente propostas e documentos com identidade.'],
    ['bloco-empresarial', 'Bloco empresarial', 'BLOCO-EMPRESA', 25, empresasProfissionais.id, 'Blocos personalizados para equipas e clientes.'],
    ['cartao-empresarial', 'Cartão empresarial', 'CARTAO-EMPRESA', 18, empresasProfissionais.id, 'Cartões profissionais alinhados com a sua marca.'],
    ['kit-integracao-funcionario', 'Kit de integração de funcionário', 'ONBOARDING', 69, empresasProfissionais.id, 'Um conjunto de boas-vindas especial para novos colaboradores.'],
    ['material-promocional', 'Material promocional', 'PROMOCIONAL', 39, empresasProfissionais.id, 'Materiais coordenados para campanhas e eventos empresariais.'],
  ] as const;

  for (const [slug, name, sku, basePrice, categoryId, description] of printProducts) {
    const product = await prisma.product.upsert({ where: { slug }, update: { name, shortDesc: description, description, basePrice, categoryId, status: ProductStatus.ACTIVE, saleType: ProductSaleType.CUSTOMIZABLE }, create: { slug, name, shortDesc: description, description, basePrice, categoryId, status: ProductStatus.ACTIVE, saleType: ProductSaleType.CUSTOMIZABLE } });
    for (const pack of [{ suffix: '25', name: '25 unidades', multiplier: 1 }, { suffix: '50', name: '50 unidades', multiplier: 1.65 }, { suffix: '100', name: '100 unidades', multiplier: 2.7 }]) await prisma.productVariant.upsert({ where: { sku: `${sku}-${pack.suffix}` }, update: { name: pack.name, price: basePrice * pack.multiplier, active: true }, create: { productId: product.id, sku: `${sku}-${pack.suffix}`, name: pack.name, price: basePrice * pack.multiplier, active: true } });
    const personalization = await prisma.productOption.upsert({ where: { productId_slug: { productId: product.id, slug: 'personalizacao' } }, update: { name: 'Personalização', required: true, sortOrder: 1 }, create: { productId: product.id, name: 'Personalização', slug: 'personalizacao', type: OptionType.SELECT, required: true, sortOrder: 1 } });
    for (const [index, value] of ['logo', 'nome', 'apoio-design'].entries()) { const optionName = value === 'logo' ? 'Enviar logótipo ou arte' : value === 'nome' ? 'Usar nome da marca' : 'Preciso de apoio de design'; const id = `seed-${slug}-${value}`; await prisma.optionValue.upsert({ where: { id }, update: { name: optionName, value, priceDelta: value === 'apoio-design' ? 25 : 0, sortOrder: index + 1 }, create: { id, optionId: personalization.id, name: optionName, value, priceDelta: value === 'apoio-design' ? 25 : 0, sortOrder: index + 1 } }); }
    const finish = await prisma.productOption.upsert({ where: { productId_slug: { productId: product.id, slug: 'estilo' } }, update: { name: 'Papel e acabamento', required: true, sortOrder: 2 }, create: { productId: product.id, name: 'Papel e acabamento', slug: 'estilo', type: OptionType.SELECT, required: true, sortOrder: 2 } });
    for (const [index, finishName] of ['Mate', 'Brilhante', 'Natural'].entries()) { const value = finishName.toLowerCase(); const id = `seed-${slug}-acabamento-${value}`; await prisma.optionValue.upsert({ where: { id }, update: { name: finishName, value, sortOrder: index + 1 }, create: { id, optionId: finish.id, name: finishName, value, priceDelta: index === 0 ? 0 : 4, sortOrder: index + 1 } }); }
  }
  console.log('Produtos individuais para negócios e eventos criados');

  const businessProducts = [
    { slug: 'kit-comercio-local', name: 'Kit Comércio Local', sku: 'KIT-LOCAL', price: 49, categoryId: kitsProfissionais.id, shortDesc: 'A presença essencial para o seu negócio local.', description: 'Inclui cartão de visita, flyer, cartão de fidelidade, voucher, íman e etiqueta ou cartão de agradecimento.' },
    { slug: 'kit-restauracao-hotelaria', name: 'Kit Restauração e Hotelaria', sku: 'KIT-HOTELARIA', price: 59, categoryId: kitsProfissionais.id, shortDesc: 'Comunicação cuidada para receber melhor.', description: 'Inclui menu simples, cartão de mesa, voucher, cartão informativo, etiqueta para embalagem e bloco personalizado.' },
    { slug: 'kit-eventos', name: 'Kit Eventos', sku: 'KIT-EVENTOS', price: 65, categoryId: kitsProfissionais.id, shortDesc: 'Uma identidade coerente para cada momento do evento.', description: 'Inclui convite ou boas-vindas, menu, marcador de mesa, etiqueta, íman ou lembrança e pequena encadernação.' },
    { slug: 'kit-empresas', name: 'Kit Empresas', sku: 'KIT-EMPRESAS', price: 79, categoryId: kitsProfissionais.id, shortDesc: 'Materiais profissionais alinhados com a sua marca.', description: 'Inclui pasta ou apresentação encadernada, bloco, cartão, kit de integração e material promocional.' },
    { slug: 'servico-design-grafico', name: 'Criação de Design', sku: 'SERV-DESIGN', price: 45, categoryId: servicosCriativos.id, shortDesc: 'Design feito à medida para comunicar com personalidade.', description: 'Criação de logótipo, identidade visual, peças para redes sociais e materiais gráficos para impressão.' },
    { slug: 'criacao-de-site', name: 'Criação de Site', sku: 'SERV-SITE', price: 290, categoryId: servicosCriativos.id, shortDesc: 'Um site claro, bonito e preparado para o seu negócio.', description: 'Criação de landing page, site institucional ou loja online, com proposta ajustada ao projeto.' },
  ];

  for (const item of businessProducts) {
    const product = await prisma.product.upsert({ where: { slug: item.slug }, update: { name: item.name, shortDesc: item.shortDesc, description: item.description, basePrice: item.price, categoryId: item.categoryId, status: ProductStatus.ACTIVE, saleType: ProductSaleType.CUSTOMIZABLE }, create: { name: item.name, slug: item.slug, shortDesc: item.shortDesc, description: item.description, basePrice: item.price, categoryId: item.categoryId, status: ProductStatus.ACTIVE, saleType: ProductSaleType.CUSTOMIZABLE } });
    const packages = item.slug.startsWith('kit-') ? [{ suffix: '25', name: '25 unidades', multiplier: 1 }, { suffix: '50', name: '50 unidades', multiplier: 1.65 }, { suffix: '100', name: '100 unidades', multiplier: 2.7 }] : [{ suffix: 'ESSENCIAL', name: 'Pacote essencial', multiplier: 1 }, { suffix: 'PRO', name: 'Pacote profissional', multiplier: 1.8 }];
    for (const pack of packages) await prisma.productVariant.upsert({ where: { sku: `${item.sku}-${pack.suffix}` }, update: { name: pack.name, price: item.price * pack.multiplier, active: true }, create: { productId: product.id, sku: `${item.sku}-${pack.suffix}`, name: pack.name, price: item.price * pack.multiplier, active: true } });
    const personalization = await prisma.productOption.upsert({ where: { productId_slug: { productId: product.id, slug: 'personalizacao' } }, update: { name: 'Ponto de partida', required: true, sortOrder: 1 }, create: { productId: product.id, name: 'Ponto de partida', slug: 'personalizacao', type: OptionType.SELECT, required: true, sortOrder: 1 } });
    const starts = [{ value: 'logo', name: 'Enviar logótipo ou arte', delta: 0 }, { value: 'nome', name: 'Usar nome da marca', delta: 0 }, { value: 'apoio-design', name: 'Preciso de apoio de design', delta: item.slug === 'criacao-de-site' ? 0 : 25 }];
    for (let i = 0; i < starts.length; i++) { const value = starts[i]; const id = `seed-${item.slug}-${value.value}`; await prisma.optionValue.upsert({ where: { id }, update: { name: value.name, value: value.value, priceDelta: value.delta, sortOrder: i + 1 }, create: { id, optionId: personalization.id, name: value.name, value: value.value, priceDelta: value.delta, sortOrder: i + 1 } }); }
    const style = await prisma.productOption.upsert({ where: { productId_slug: { productId: product.id, slug: 'estilo' } }, update: { name: item.slug.startsWith('kit-') ? 'Estilo visual' : 'Tipo de projeto', required: true, sortOrder: 2 }, create: { productId: product.id, name: item.slug.startsWith('kit-') ? 'Estilo visual' : 'Tipo de projeto', slug: 'estilo', type: OptionType.SELECT, required: true, sortOrder: 2 } });
    const styles = item.slug === 'criacao-de-site' ? ['Landing page', 'Site institucional', 'Loja online'] : item.slug === 'servico-design-grafico' ? ['Logótipo', 'Identidade visual', 'Materiais gráficos'] : ['Clássico', 'Moderno', 'Artesanal'];
    for (let i = 0; i < styles.length; i++) { const name = styles[i]; const value = name.toLowerCase().replaceAll(' ', '-').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); const id = `seed-${item.slug}-estilo-${value}`; await prisma.optionValue.upsert({ where: { id }, update: { name, value, sortOrder: i + 1 }, create: { id, optionId: style.id, name, value, priceDelta: 0, sortOrder: i + 1 } }); }
  }
  console.log('Kits profissionais e serviços criativos criados');
}

main()
  .catch((error) => {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  
