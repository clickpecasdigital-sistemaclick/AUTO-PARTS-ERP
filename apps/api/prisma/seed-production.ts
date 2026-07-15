/**
 * Seed de Produção — AutoCore ERP
 * Cria o primeiro tenant, admin e planos SaaS.
 * Executar UMA VEZ após deploy: npx ts-node prisma/seed-production.ts
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 AutoCore ERP — Seed de Produção iniciando...');

  // ---- 1. PLANOS SAAS -------------------------------------------------------
  const plans = [
    { name: 'Starter', tier: 'starter', priceMonthly: 99, trialDays: 14, sortOrder: 1, limits: { maxUsers: 3, maxProducts: 500, maxMonthlyNfes: 50, maxStorageMb: 1024 } },
    { name: 'Pro', tier: 'pro', priceMonthly: 199, trialDays: 14, sortOrder: 2, limits: { maxUsers: 10, maxProducts: 5000, maxMonthlyNfes: 500, maxStorageMb: 5120 } },
    { name: 'Business', tier: 'business', priceMonthly: 399, trialDays: 14, sortOrder: 3, limits: { maxUsers: 25, maxProducts: 20000, maxMonthlyNfes: 2000, maxStorageMb: 20480 } },
    { name: 'Enterprise', tier: 'enterprise', priceMonthly: 799, trialDays: 30, sortOrder: 4, limits: { maxUsers: null, maxProducts: null, maxMonthlyNfes: null, maxStorageMb: null } },
    { name: 'Ultimate', tier: 'ultimate', priceMonthly: null, trialDays: 30, sortOrder: 5, isPublic: false, limits: {} },
  ] as const;

  for (const p of plans) {
    const plan = await prisma.plan.upsert({
      where: { name: p.name },
      create: { name: p.name, tier: p.tier as never, priceMonthly: p.priceMonthly, trialDays: p.trialDays, sortOrder: p.sortOrder, isPublic: ('isPublic' in p ? p.isPublic : true) as boolean },
      update: { priceMonthly: p.priceMonthly, trialDays: p.trialDays },
    });

    if (p.limits && Object.keys(p.limits).length > 0) {
      await prisma.planLimits.upsert({
        where: { planId: plan.id },
        create: { planId: plan.id, ...p.limits } as never,
        update: p.limits as never,
      });
    }
    console.log(`  ✅ Plano: ${p.name}`);
  }

  // ---- 2. TENANT DEMO -------------------------------------------------------
  const tenantDoc = process.env.DEMO_TENANT_CNPJ ?? '11222333000181';
  const tenant = await prisma.tenant.upsert({
    where: { document: tenantDoc },
    create: {
      name: process.env.DEMO_TENANT_NAME ?? 'AutoCore Demo',
      document: tenantDoc,
      plan: 'enterprise',
    },
    update: {},
  });
  console.log(`  ✅ Tenant: ${tenant.name} (${tenant.id.slice(0, 8)})`);

  // ---- 3. EMPRESA -----------------------------------------------------------
  const company = await prisma.company.upsert({
    where: { id: tenant.id },
    create: { id: tenant.id, tenantId: tenant.id, name: process.env.DEMO_COMPANY_NAME ?? 'AutoCore Autopeças Ltda', tradeName: 'AutoCore', cnpj: tenantDoc, email: process.env.DEMO_ADMIN_EMAIL ?? 'admin@autocore.com', phone: '(11) 9999-9999' },
    update: {},
  });

  // ---- 4. FILIAL PRINCIPAL --------------------------------------------------
  const branch = await prisma.branch.upsert({
    where: { id: tenant.id },
    create: { id: tenant.id, tenantId: tenant.id, companyId: company.id, name: 'Matriz', code: '001', cnpj: tenantDoc, isHeadquarters: true },
    update: {},
  });

  // ---- 5. USUÁRIO ADMIN -----------------------------------------------------
  const adminEmail = process.env.DEMO_ADMIN_EMAIL ?? 'admin@autocore.com';
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD ?? 'Admin@123456';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    create: { tenantId: tenant.id, email: adminEmail, name: 'Administrador', passwordHash },
    update: { passwordHash },
  });
  console.log(`  ✅ Admin: ${adminEmail} / ${adminPassword}`);

  // ---- 6. PERFIL ADMIN -------------------------------------------------------
  await prisma.profile.upsert({
    where: { userId: adminUser.id },
    create: { userId: adminUser.id, tenantId: tenant.id, role: 'admin', branchId: branch.id },
    update: {},
  });

  // ---- 7. PERMISSÕES DO ADMIN -----------------------------------------------
  const modules = ['products', 'stock', 'purchases', 'sales', 'customers', 'employees', 'carriers', 'crm', 'financial', 'workshop', 'fiscal', 'settings', 'bi'];
  const actions = ['view', 'create', 'update', 'delete', 'export', 'print', 'approve', 'cancel'];

  for (const module of modules) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: { userId_module_action: { userId: adminUser.id, module, action } },
        create: { userId: adminUser.id, tenantId: tenant.id, module, action, granted: true },
        update: {},
      }).catch(() => null);
    }
  }
  console.log(`  ✅ Permissões: ${modules.length * actions.length} grants`);

  // ---- 8. ASSINATURA TRIAL --------------------------------------------------
  const proPlan = await prisma.plan.findUnique({ where: { name: 'Enterprise' } });
  if (proPlan) {
    await prisma.subscription.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        planId: proPlan.id,
        status: 'trial',
        trialEndsAt: new Date(Date.now() + 30 * 86400000),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
      },
      update: {},
    });
    console.log(`  ✅ Assinatura trial (30 dias)`);
  }

  // ---- 9. SETUP WIZARD -------------------------------------------------------
  await prisma.setupWizardProgress.upsert({
    where: { tenantId: tenant.id },
    create: { tenantId: tenant.id, currentStep: 1, steps: { company: true } as never },
    update: {},
  });

  console.log('\n🎉 Seed concluído!');
  console.log(`\n📋 Credenciais:`);
  console.log(`   URL:   ${process.env.VITE_APP_URL ?? 'https://seu-app.netlify.app'}`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Senha: ${adminPassword}`);
  console.log('\n⚠️  Altere a senha após o primeiro login!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
