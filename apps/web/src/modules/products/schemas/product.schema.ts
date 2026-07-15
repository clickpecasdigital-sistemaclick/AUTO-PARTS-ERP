import { z } from 'zod';

/**
 * Schemas Zod do cadastro de Produto, um por aba (Dados Gerais, Tributação,
 * Estoque, Preços) — mesclados em `productFormSchema` para a validação
 * completa do formulário com React Hook Form. Mensagens em pt-BR, alinhadas
 * aos `class-validator` do backend (`CreateProductDto`) para que o erro que
 * o usuário vê seja consistente, do front ou de uma eventual resposta 400
 * da API.
 */

export const generalInfoSchema = z.object({
  internalCode: z.string().max(60).optional().or(z.literal('')),
  barcode: z.string().max(60).optional().or(z.literal('')),
  manufacturerCode: z.string().max(60).optional().or(z.literal('')),
  originalCode: z.string().max(60).optional().or(z.literal('')),
  similarCode: z.string().max(60).optional().or(z.literal('')),
  shortDescription: z.string().min(3, 'Descrição curta é obrigatória').max(180),
  fullDescription: z.string().optional().or(z.literal('')),
  brandId: z.string().uuid().optional().or(z.literal('')),
  manufacturerId: z.string().uuid().optional().or(z.literal('')),
  groupId: z.string().uuid().optional().or(z.literal('')),
  subgroupId: z.string().uuid().optional().or(z.literal('')),
  categoryId: z.string().uuid().optional().or(z.literal('')),
  unitId: z.string().uuid({ message: 'Selecione a unidade de medida' }),
  weightKg: z.coerce.number().min(0).optional(),
  heightCm: z.coerce.number().min(0).optional(),
  widthCm: z.coerce.number().min(0).optional(),
  lengthCm: z.coerce.number().min(0).optional(),
  warrantyDays: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export const taxationSchema = z.object({
  ncmCode: z.string().max(10).optional().or(z.literal('')),
  cestCode: z.string().max(10).optional().or(z.literal('')),
  defaultCfopCode: z.string().max(10).optional().or(z.literal('')),
  defaultCstCode: z.string().max(5).optional().or(z.literal('')),
  defaultCsosnCode: z.string().max(5).optional().or(z.literal('')),
  origin: z.enum([
    'nacional',
    'estrangeira_importacao_direta',
    'estrangeira_mercado_interno',
    'nacional_importacao_acima_40',
    'nacional_processos_produtivos',
    'nacional_importacao_menor_40',
    'estrangeira_sem_similar_nacional',
    'estrangeira_sem_similar_mercado',
    'nacional_conteudo_importacao_70',
  ]),
  ipiRate: z.coerce.number().min(0).max(100).default(0),
  icmsRate: z.coerce.number().min(0).max(100).default(0),
  pisRate: z.coerce.number().min(0).max(100).default(0),
  cofinsRate: z.coerce.number().min(0).max(100).default(0),
});

const stockBaseSchema = z.object({
  minStock: z.coerce.number().min(0).default(0),
  maxStock: z.coerce.number().min(0).optional(),
  defaultLocationId: z.string().uuid().optional().or(z.literal('')),
});

/** Versão com a regra cruzada (máximo >= mínimo) — usada isoladamente na aba de Estoque. */
export const stockSchema = stockBaseSchema.refine((data) => !data.maxStock || data.maxStock >= data.minStock, {
  message: 'Estoque máximo deve ser maior ou igual ao mínimo',
  path: ['maxStock'],
});

export const pricingSchema = z.object({
  costPrice: z.coerce.number().min(0).default(0),
  salePrice: z.coerce.number().min(0).default(0),
  wholesalePrice: z.coerce.number().min(0).optional(),
  workshopPrice: z.coerce.number().min(0).optional(),
  distributorPrice: z.coerce.number().min(0).optional(),
  primarySupplierId: z.string().uuid().optional().or(z.literal('')),
});

/** Schema completo — usado no submit final do formulário (todas as abas validadas juntas). */
export const productFormSchema = generalInfoSchema
  .merge(taxationSchema)
  .merge(stockBaseSchema)
  .merge(pricingSchema)
  .refine((data) => !data.maxStock || data.maxStock >= data.minStock, {
    message: 'Estoque máximo deve ser maior ou igual ao mínimo',
    path: ['maxStock'],
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type GeneralInfoFormValues = z.infer<typeof generalInfoSchema>;
export type TaxationFormValues = z.infer<typeof taxationSchema>;
export type StockFormValues = z.infer<typeof stockSchema>;
export type PricingFormValues = z.infer<typeof pricingSchema>;

export const productSupplierSchema = z.object({
  supplierId: z.string().uuid({ message: 'Selecione um fornecedor' }),
  supplierSku: z.string().optional().or(z.literal('')),
  lastPurchasePrice: z.coerce.number().min(0).optional(),
  leadTimeDays: z.coerce.number().int().min(0).optional(),
  isPreferred: z.boolean().default(false),
});
export type ProductSupplierFormValues = z.infer<typeof productSupplierSchema>;

export const productApplicationSchema = z.object({
  vehicleVersionId: z.string().uuid({ message: 'Selecione uma versão de veículo' }),
  position: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});
export type ProductApplicationFormValues = z.infer<typeof productApplicationSchema>;

export const productCrossReferenceSchema = z.object({
  relatedProductId: z.string().uuid({ message: 'Selecione um produto' }),
  type: z.enum(['similar', 'equivalent', 'complementary', 'substitute']),
  notes: z.string().optional().or(z.literal('')),
});
export type ProductCrossReferenceFormValues = z.infer<typeof productCrossReferenceSchema>;
