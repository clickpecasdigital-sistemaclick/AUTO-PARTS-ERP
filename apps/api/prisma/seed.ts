import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed estrutural da Sprint 02.
 *
 * Contém exclusivamente:
 *  (a) um tenant técnico de desenvolvimento (já existente desde a Sprint 01);
 *  (b) catálogos GLOBAIS de referência cujo conteúdo é definido por norma
 *      oficial (CFOP, combustíveis) — não são "dados fictícios de negócio",
 *      são tabelas de domínio público necessárias para o sistema funcionar.
 *
 * Catálogos massivos (NCM com ~10.000 códigos, todas as Montadoras/Modelos/
 * Versões de veículos, CEST, CST/CSOSN completos) NÃO são inseridos aqui.
 * Ver estratégia de importação em docs/DATABASE.md, seção "Estratégia de Seeds".
 */
async function main() {
  // --- (a) Tenant técnico de desenvolvimento ---
  await prisma.tenant.upsert({
    where: { document: '00000000000000' },
    update: {},
    create: {
      name: 'AutoCore — Tenant de Desenvolvimento',
      document: '00000000000000',
      plan: 'trial',
    },
  });

  // --- (b) Combustíveis (enum fechado, norma SEFAZ) ---
  const fuels: { kind: 'gasolina' | 'etanol' | 'flex' | 'diesel' | 'gnv' | 'eletrico' | 'hibrido'; name: string }[] = [
    { kind: 'gasolina', name: 'Gasolina' },
    { kind: 'etanol', name: 'Etanol' },
    { kind: 'flex', name: 'Flex (Gasolina/Etanol)' },
    { kind: 'diesel', name: 'Diesel' },
    { kind: 'gnv', name: 'GNV' },
    { kind: 'eletrico', name: 'Elétrico' },
    { kind: 'hibrido', name: 'Híbrido' },
  ];
  for (const fuel of fuels) {
    await prisma.fuelType.upsert({ where: { kind: fuel.kind }, update: {}, create: fuel });
  }

  // --- (b) CFOP mais usados em operações de autopeças (amostra essencial) ---
  const cfops: { code: string; description: string; type: 'entrada' | 'saida' }[] = [
    { code: '5102', description: 'Venda de mercadoria adquirida de terceiros', type: 'saida' },
    { code: '5405', description: 'Venda de mercadoria sujeita a ST (consumidor final)', type: 'saida' },
    { code: '1102', description: 'Compra para comercialização', type: 'entrada' },
    { code: '5915', description: 'Remessa para conserto ou reparo', type: 'saida' },
    { code: '1916', description: 'Retorno de mercadoria em conserto/reparo', type: 'entrada' },
  ];
  for (const cfop of cfops) {
    await prisma.cfop.upsert({ where: { code: cfop.code }, update: {}, create: cfop });
  }

  // --- (b) Permissões base por módulo (catálogo global de RBAC) ---
  // Ações alinhadas ao tipo canônico `PermissionAction` do frontend
  // (apps/web/src/navigation/nav-types.ts, Sprint 04): view, create,
  // update, delete, export, print, approve, cancel. O catálogo original
  // desta seed usava ['create','read','update','delete','approve'] — uma
  // inconsistência pré-existente (Sprint 02) com 'read' em vez de 'view' e
  // sem 'export'/'print'/'cancel', nunca usados por nenhum
  // `@RequirePermission`/`can()` real do código (todos usam 'view' desde
  // a Sprint 04). Corrigido aqui para o catálogo efetivamente checado.
  const modules = [
    'products', 'stock', 'sales', 'purchases', 'financial', 'workshop', 'crm', 'settings',
    'customers', 'employees', 'carriers', 'fiscal',
  ];
  const actions = ['view', 'create', 'update', 'delete', 'export', 'print', 'approve', 'cancel'];
  for (const module of modules) {
    for (const action of actions) {
      const key = `${module}.${action}`;
      await prisma.permission.upsert({
        where: { key },
        update: {},
        create: { module, action, key },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
