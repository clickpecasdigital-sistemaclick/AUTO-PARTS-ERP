import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed de DESENVOLVIMENTO/TESTE (Sprint 05 — explicitamente solicitado
 * como entrega desta sprint: "Testes: ... Seeds de desenvolvimento").
 *
 * Diferente de `prisma/seed.ts` (estrutural, seguro para produção), este
 * arquivo cria um pequeno catálogo de exemplo para permitir testar o
 * Módulo de Produtos de ponta a ponta localmente. NUNCA executar em
 * produção — roda apenas via `npm run seed:dev`, comando separado do
 * `npm run seed` (que continua 100% livre de dados de negócio fictícios).
 */
async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { document: '00000000000000' },
    update: {},
    create: { name: 'AutoCore — Tenant de Desenvolvimento', document: '00000000000000', plan: 'trial' },
  });

  const unit = await prisma.unit.upsert({
    where: { code: 'UN' },
    update: {},
    create: { code: 'UN', description: 'Unidade', allowsDecimal: false },
  });

  const brand = await prisma.brand.upsert({
    where: { name: 'Bosch' },
    update: {},
    create: { name: 'Bosch' },
  });

  const manufacturer = await prisma.manufacturer.upsert({
    where: { name: 'Robert Bosch Ltda' },
    update: {},
    create: { name: 'Robert Bosch Ltda', country: 'BR' },
  });

  const group = await prisma.productGroup.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Freios' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Freios' },
  });

  const subgroup = await prisma.productSubgroup.upsert({
    where: { groupId_name: { groupId: group.id, name: 'Pastilhas' } },
    update: {},
    create: { tenantId: tenant.id, groupId: group.id, name: 'Pastilhas' },
  });

  await prisma.product.upsert({
    where: { tenantId_internalCode: { tenantId: tenant.id, internalCode: 'PRD-000001' } },
    update: {},
    create: {
      tenantId: tenant.id,
      internalCode: 'PRD-000001',
      barcode: '7891234567890',
      manufacturerCode: '0986424815',
      shortDescription: 'Pastilha de freio dianteira',
      fullDescription: 'Jogo de pastilhas de freio dianteiras, fricção cerâmica.',
      brandId: brand.id,
      manufacturerId: manufacturer.id,
      groupId: group.id,
      subgroupId: subgroup.id,
      unitId: unit.id,
      ncmCode: '87083099',
      costPrice: 45.9,
      averageCostPrice: 45.9,
      salePrice: 89.9,
      marginPercent: 48.94,
      minStock: 5,
      maxStock: 50,
      status: 'active',
    },
  });

  console.log('Seed de desenvolvimento concluído: 1 produto de exemplo criado no tenant de dev.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
