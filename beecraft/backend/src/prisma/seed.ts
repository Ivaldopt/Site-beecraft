import {
  PrismaClient,
  ProductStatus,
  OptionType,
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
    update: {},
    create: {
      name: 'Agenda A5 Personalizada',
      slug: 'agenda-a5-personalizada',

      shortDesc:
        'Agenda A5 personalizada para organizar o seu dia a dia.',

      description:
        'Agenda A5 personalizada BeeCraft com diferentes opções de interior, capa, encadernação e personalização.',

      basePrice: 25,

      status: ProductStatus.ACTIVE,

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
      update: {},
      create: {
        productId: agenda.id,

        name: 'Encadernação',

        slug: 'encadernacao',

        type: OptionType.SELECT,

        required: true,

        sortOrder: 3,
      },
    });

  const encadernacoes = [
    {
      id: 'seed-encadernacao-wireo',
      name: 'Wire-O',
      value: 'wire-o',
      price: 0,
    },
    {
      id: 'seed-encadernacao-espiral',
      name: 'Espiral',
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
      update: {},
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
      id: 'seed-extra-elastico',
      name: 'Elástico',
      value: 'elastico',
      price: 1.5,
    },
    {
      id: 'seed-extra-marcador',
      name: 'Marcador',
      value: 'marcador',
      price: 2,
    },
    {
      id: 'seed-extra-separadores',
      name: 'Separadores',
      value: 'separadores',
      price: 3,
    },
  ];

  for (let i = 0; i < extrasValues.length; i++) {
    const item = extrasValues[i];

    await prisma.optionValue.upsert({
      where: {
        id: item.id,
      },
      update: {},
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
  