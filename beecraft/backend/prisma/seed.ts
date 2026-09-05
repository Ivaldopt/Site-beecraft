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
}

main()
  .catch((error) => {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  
