import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FiscalEventsService } from '../fiscal-events-config-cert.service';
import { NfeXmlBuilderService } from '../xml/nfe-xml-builder.service';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditService } from '@/common/audit/audit.service';

describe('FiscalEventsService', () => {
  let service: FiscalEventsService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const ctx = { tenantId: 'tenant-1', userId: 'user-1' };
  const authorizedInvoice = { id: 'inv-1', tenantId: 'tenant-1', status: 'authorized', branchId: 'br-1', accessKey: '12345678901234567890123456789012345678901234', protocolNumber: '123', fiscalSeries: { series: 1 } };

  beforeEach(async () => {
    prisma = {
      fiscalInvoice: { findFirst: jest.fn().mockResolvedValue(authorizedInvoice), update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...authorizedInvoice, ...data })) },
      fiscalInvoiceEvent: { create: jest.fn().mockResolvedValue({ id: 'evt-1' }), findFirst: jest.fn().mockResolvedValue(null) },
      fiscalConfiguration: { findFirst: jest.fn().mockResolvedValue({ environment: 'homologation' }) },
      fiscalVoidingRange: { create: jest.fn().mockResolvedValue({ id: 'void-1' }) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [FiscalEventsService, NfeXmlBuilderService, { provide: PrismaService, useValue: prisma }, { provide: AuditService, useValue: { log: jest.fn() } }],
    }).compile();

    service = moduleRef.get(FiscalEventsService);
  });

  describe('cancel', () => {
    it('rejeita justificativa com menos de 15 caracteres (limite SEFAZ)', async () => {
      await expect(service.cancel(ctx, 'inv-1', 'Cancelado')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('cancela nota autorizada com justificativa suficiente', async () => {
      const result = await service.cancel(ctx, 'inv-1', 'Cancelamento a pedido do cliente por erro nos valores');
      expect(prisma.fiscalInvoice.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'cancelled' }) }));
      expect(result.event).toBeDefined();
      expect(result.eventXml).toContain('Cancelamento');
    });

    it('rejeita cancelar nota que nao esta autorizada', async () => {
      prisma.fiscalInvoice.findFirst.mockResolvedValue({ ...authorizedInvoice, status: 'rejected' });
      await expect(service.cancel(ctx, 'inv-1', 'Justificativa de 15 chars ou mais para cancelar')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('issueCorrectionLetter (CC-e)', () => {
    it('rejeita correcao com menos de 15 caracteres', async () => {
      await expect(service.issueCorrectionLetter(ctx, 'inv-1', 'Erro no CEP')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('emite CC-e com sequencia 1 quando nao ha evento anterior', async () => {
      prisma.fiscalInvoiceEvent.findFirst.mockResolvedValue(null);
      const result = await service.issueCorrectionLetter(ctx, 'inv-1', 'Correcao do endereco do destinatario conforme cadastro');
      expect(prisma.fiscalInvoiceEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ sequence: 1, type: 'correction_letter' }) }));
      expect(result.eventXml).toContain('Carta de Correcao');
    });

    it('incrementa a sequencia corretamente quando CC-e anterior tinha sequencia 5', async () => {
      prisma.fiscalInvoiceEvent.findFirst.mockResolvedValue({ sequence: 5 });
      const result = await service.issueCorrectionLetter(ctx, 'inv-1', 'Segunda correcao do endereco do destinatario nesta nota');
      expect(prisma.fiscalInvoiceEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ sequence: 6 }) }));
      expect(result.event).toBeDefined();
    });

    it('rejeita emitir CC-e quando ja ha 20 cartas emitidas (limite SEFAZ)', async () => {
      prisma.fiscalInvoiceEvent.findFirst.mockResolvedValue({ sequence: 20 });
      await expect(service.issueCorrectionLetter(ctx, 'inv-1', 'Tentativa de 21a carta de correcao na mesma nota')).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
