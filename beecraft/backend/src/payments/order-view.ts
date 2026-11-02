import { Prisma } from '@prisma/client';

type StoredItem = {
  productName: string;
  quantity: number;
  unitPrice: Prisma.Decimal | number;
  totalPrice: Prisma.Decimal | number;
  configuration: Prisma.JsonValue;
};

type Configuration = {
  variantName?: string | null;
  options?: { name: string }[];
  customizationText?: string | null;
  customizationTextColor?: string | null;
  customizationDetails?: Record<string, string> | null;
  customizationFileName?: string | null;
};

/** Mesma forma que POST /orders devolve, para o site montar a mensagem de WhatsApp. */
export function toPublicItem(item: StoredItem) {
  const configuration = (item.configuration ?? {}) as Configuration;
  return {
    productName: item.productName,
    variantName: configuration.variantName ?? null,
    options: configuration.options ?? [],
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    total: Number(item.totalPrice),
    customizationText: configuration.customizationText ?? null,
    customizationTextColor: configuration.customizationTextColor ?? null,
    customizationDetails: configuration.customizationDetails ?? null,
    customizationFileName: configuration.customizationFileName ?? null,
  };
}

const DETAIL_LABELS: Record<string, string> = {
  orientation: 'Orientação',
  columns: 'Nº de colunas',
  startMonth: 'Início',
  appointmentHours: 'Horário',
  coverInstructions: 'Capa',
  elasticColor: 'Elástico',
  coilColor: 'Espiral',
};

/** Linhas de texto simples com a personalização, para o email. */
export function describeExtras(item: ReturnType<typeof toPublicItem>) {
  return [
    ...(item.customizationText ? [`Texto: ${item.customizationText}`] : []),
    ...(item.customizationTextColor
      ? [`Cor do texto: ${item.customizationTextColor}`]
      : []),
    ...Object.entries(item.customizationDetails ?? {})
      .filter(([, value]) => value)
      .map(([key, value]) => `${DETAIL_LABELS[key] ?? key}: ${value}`),
    ...(item.customizationFileName
      ? [`Ficheiro a enviar: ${item.customizationFileName}`]
      : []),
  ];
}
