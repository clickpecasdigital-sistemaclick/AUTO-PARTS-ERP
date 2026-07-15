import { Test } from '@nestjs/testing';
import { TaxEngineService } from '../tax-engine.service';
import { PrismaService } from '@/database/prisma/prisma.service';
import { FiscalIssuanceService } from '../fiscal-issuance.service';
import { NfeXmlBuilderService } from '../xml/nfe-xml-builder.service';
import { AuditService } from '@/common/audit/audit.service';
import { resolveRejection } from '../rejection-catalog';

describe('TaxEngineService', () => {
  let service: TaxEngineService;
  let prisma: { taxCalculationRule: { findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = { taxCalculationRule: { findMany: jest.fn().mockResolvedValue([]) } };
    const moduleRef = await Test.createTestingModule({
      providers: [TaxEngineService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(TaxEngineService);
  });

  it('retorna zeros quando nenhuma regra fiscal está configurada', async () => {
    const result = await service.calculate({ tenantId: 't1', ncmCode: '84159000', cfopCode: '5102', originState: 'RS', destState: 'RS', taxRegime: 'simples_nacional', productValue: 1000, quantity: 1 });
    expect(result.icmsAmount).toBe(0);
    expect(result.pisAmount).toBe(0);
    expect(result.appliedRuleId).toBeNull();
  });

  it('aplica a regra com maior prioridade quando múltiplas são compatíveis', async () => {
    prisma.taxCalculationRule.findMany.mockResolvedValue([
      { id: 'rule-2', priority: 10, ncmCode: '84159000', destState: 'RS', icmsRate: 17, pisRate: 1.65, cofinsRate: 7.6, taxRegime: null, productId: null, cfopCode: null, originState: null, cstIcms: '00', csosnIcms: null, icmsOrigin: '0', icmsStRate: 0, mvaPercent: 0, fcpRate: 0, cstIpi: null, ipiRate: 0, cstPis: '01', cstCofins: '01', isActive: true },
      { id: 'rule-1', priority: 5, ncmCode: '84159000', destState: null, icmsRate: 12, pisRate: 1.65, cofinsRate: 7.6, taxRegime: null, productId: null, cfopCode: null, originState: null, cstIcms: '00', csosnIcms: null, icmsOrigin: '0', icmsStRate: 0, mvaPercent: 0, fcpRate: 0, cstIpi: null, ipiRate: 0, cstPis: '01', cstCofins: '01', isActive: true },
    ]);

    const result = await service.calculate({ tenantId: 't1', ncmCode: '84159000', cfopCode: '5102', originState: 'RS', destState: 'RS', taxRegime: 'simples_nacional', productValue: 1000, quantity: 1 });

    expect(result.icmsRate).toBe(17);
    expect(result.appliedRuleId).toBe('rule-2');
  });

  it('calcula ICMS-ST corretamente com MVA', async () => {
    prisma.taxCalculationRule.findMany.mockResolvedValue([
      { id: 'rule-st', priority: 1, ncmCode: null, destState: null, icmsRate: 12, icmsStRate: 17, mvaPercent: 40, pisRate: 0, cofinsRate: 0, taxRegime: null, productId: null, cfopCode: null, originState: null, cstIcms: '10', csosnIcms: null, icmsOrigin: '0', fcpRate: 0, cstIpi: null, ipiRate: 0, cstPis: '01', cstCofins: '01', isActive: true },
    ]);

    const result = await service.calculate({ tenantId: 't1', originState: 'SP', destState: 'MG', taxRegime: 'lucro_presumido', productValue: 1000, quantity: 1 });

    // BC-ST = 1000 * 1.40 = 1400; ICMS-ST = 1400 * 17% - (1000 * 12%) = 238 - 120 = 118
    expect(result.icmsStBcAmount).toBe(1400);
    expect(result.icmsStAmount).toBe(118);
  });

  it('calcula DIFAL para operacoes interestaduais', () => {
    const difal = service.calculateDifal(12, 18, 1000);
    expect(difal.difalAmount).toBe(60); // (18% - 12%) * 1000
  });
});

describe('Catalogo de Rejeicoes', () => {
  it('retorna explicacao/causa/correcao para codigo 539 (CFOP incompativel)', () => {
    const entry = resolveRejection('539');
    expect(entry.possibleCause).toBeDefined();
    expect(entry.suggestedFix).toBeDefined();
    expect(entry.internalLink).toBeDefined();
  });

  it('retorna entrada generica para codigo desconhecido', () => {
    const entry = resolveRejection('9999');
    expect(entry.message).toContain('9999');
    expect(entry.suggestedFix).toBeDefined();
  });

  it('retorna internalLink para codigos que requerem correcao de config', () => {
    const entry230 = resolveRejection('230'); // IE emitente invalida
    expect(entry230.internalLink).toBe('/configuracoes/empresa');

    const entry539 = resolveRejection('539'); // CFOP incompativel
    expect(entry539.internalLink).toBe('/fiscal/config');
  });
});

describe('FiscalIssuanceService — chave de acesso', () => {
  let service: FiscalIssuanceService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  beforeEach(async () => {
    prisma = {
      fiscalConfiguration: { findFirst: jest.fn().mockResolvedValue({ uf: 'RS', crt: 1, taxRegime: 'simples_nacional', ibgeCode: '4314902', environment: 'homologation', defaultNatureOfOperation: 'Venda', branchId: 'br-1' }) },
      fiscalSeries: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 's1', series: 1, nextNumber: 1 }), update: jest.fn().mockResolvedValue({ nextNumber: 2 }) },
      fiscalInvoice: { create: jest.fn().mockResolvedValue({ id: 'inv-1', number: 1, series: 1, accessKey: '12345678901234567890123456789012345678901234', status: 'pending_authorization', items: [] }) },
      taxCalculationRule: { findMany: jest.fn().mockResolvedValue([]) },
      branch: { findUnique: jest.fn().mockResolvedValue({ company: { document: '12345678000195', legalName: 'Empresa Teste', tradeName: 'Empresa' } }) },
      customer: { findUnique: jest.fn().mockResolvedValue({ document: '12345678901', name: 'Consumidor', tradeName: null }) },
      product: { findFirst: jest.fn().mockResolvedValue({ salePrice: 100 }) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        FiscalIssuanceService,
        NfeXmlBuilderService,
        { provide: PrismaService, useValue: prisma },
        { provide: TaxEngineService, useValue: new TaxEngineService({ taxCalculationRule: prisma.taxCalculationRule } as never) },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(FiscalIssuanceService);
  });

  it('gera chave de acesso com 44 digitos (43 + DV)', async () => {
    const invoice = await service.issueNfce('t1' as never, 'br-1', 'sale-1', [{ productId: 'p1', cfopCode: '5102', quantity: 1, unitPrice: 100 }]);
    expect(invoice.accessKey).toHaveLength(44);
  });

  it('armazena o XML gerado no campo xmlContent', async () => {
    await service.issueNfce('t1' as never, 'br-1', 'sale-1', [{ productId: 'p1', cfopCode: '5102', quantity: 1, unitPrice: 100 }]);
    const createCall = prisma.fiscalInvoice.create.mock.calls[0][0];
    expect(createCall.data.xmlContent).toContain('<?xml');
  });
});
