import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '@/database/prisma/prisma.service';
import { AccountsReceivableService } from './accounts-receivable.service';

/** CRC16/CCITT-FALSE (polinômio 0x1021, inicial 0xFFFF) — algoritmo exigido pelo padrão BR Code do PIX. Node `crypto` não tem CRC16 nativo, por isso a implementação manual. */
function crc16ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * PIX — estrutura preparada (briefing: "Geração de QR Code, PIX Copia e
 * Cola, Confirmação automática, Webhooks. Não integrar com PSP nesta
 * Sprint."). O payload BR Code (`buildBrCodePayload`) segue o formato
 * público EMV/Banco Central (TLV — Tag/Length/Value) — gerado 100%
 * localmente, sem nenhum PSP; é o mesmo texto que qualquer app de banco
 * decodifica para mostrar "Copia e Cola". `confirmWebhook()` é o ponto de
 * integração que ficará pronto para o PSP real plugar.
 */
@Injectable()
export class PixService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly receivables: AccountsReceivableService,
  ) {}

  async createCharge(tenantId: string, bankAccountId: string, amount: number, receivableId?: string, expiresInMinutes = 60) {
    const account = await this.prisma.bankAccount.findFirst({ where: { id: bankAccountId, tenantId } });
    if (!account) throw new NotFoundException('Conta bancária não encontrada');

    const txId = randomUUID().replace(/-/g, '').slice(0, 25);
    const pixKey = account.pixKey ?? (await this.prisma.bankAccountPixKey.findFirst({ where: { bankAccountId } }))?.value;
    const qrCodePayload = pixKey ? this.buildBrCodePayload(pixKey, amount, txId) : null;

    return this.prisma.pixCharge.create({
      data: { tenantId, bankAccountId, receivableId, amount, txId, qrCodePayload, expiresAt: new Date(Date.now() + 1000 * 60 * expiresInMinutes) },
    });
  }

  getCharge(tenantId: string, id: string) {
    return this.prisma.pixCharge.findFirst({ where: { id, tenantId } });
  }

  /** Ponto de integração para o webhook real do PSP — confirma a cobrança e baixa automaticamente o recebível, se houver. */
  async confirmWebhook(txId: string, webhookPayload: string) {
    const charge = await this.prisma.pixCharge.findUnique({ where: { txId } });
    if (!charge || charge.status !== 'pending') return null;

    const updated = await this.prisma.pixCharge.update({ where: { id: charge.id }, data: { status: 'paid', confirmedAt: new Date(), webhookPayload } });

    if (charge.receivableId) {
      await this.receivables.settleAutomatically(charge.receivableId, Number(charge.amount), charge.bankAccountId);
    }

    return updated;
  }

  /** Monta o payload BR Code (EMV/TLV) — formato público do Banco Central, sem dependência de PSP. */
  private buildBrCodePayload(pixKey: string, amount: number, txId: string): string {
    const merchantAccount = `0014BR.GOV.BCB.PIX01${String(pixKey.length).padStart(2, '0')}${pixKey}`;
    const amountStr = amount.toFixed(2);
    const payloadWithoutCrc = [
      '000201',
      `26${String(merchantAccount.length).padStart(2, '0')}${merchantAccount}`,
      '52040000',
      '5303986',
      `54${String(amountStr.length).padStart(2, '0')}${amountStr}`,
      '5802BR',
      '6304',
    ].join('');
    return `${payloadWithoutCrc}${crc16ccitt(payloadWithoutCrc)}-${txId}`;
  }
}

/** Boletos — estrutura preparada (briefing: "Registro, Baixa, Retorno CNAB, Remessa CNAB"). */
@Injectable()
export class BankSlipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly receivables: AccountsReceivableService,
  ) {}

  async register(tenantId: string, bankAccountId: string, amount: number, dueDate: string, receivableId?: string) {
    const ourNumber = `${Date.now()}`.slice(-10);
    return this.prisma.bankSlip.create({ data: { tenantId, bankAccountId, amount, dueDate: new Date(dueDate), receivableId, ourNumber } });
  }

  getSlip(tenantId: string, id: string) {
    return this.prisma.bankSlip.findFirst({ where: { id, tenantId } });
  }

  /** Baixa manual (ex: confirmação visual pelo financeiro antes do retorno CNAB chegar). */
  async settle(slipId: string) {
    const slip = await this.prisma.bankSlip.update({ where: { id: slipId }, data: { status: 'paid' } });
    if (slip.receivableId) await this.receivables.settleAutomatically(slip.receivableId, Number(slip.amount), slip.bankAccountId);
    return slip;
  }

  /** Estrutura preparada para o arquivo de remessa CNAB (gerado e enviado ao banco) — geração real do layout fica para a Sprint de Integrações. */
  async generateRemittanceBatch(tenantId: string, slipIds: string[]) {
    const batchId = `REM-${Date.now()}`;
    await this.prisma.bankSlip.updateMany({ where: { id: { in: slipIds }, tenantId }, data: { remittanceBatchId: batchId } });
    return { batchId, count: slipIds.length };
  }

  /** Estrutura preparada para processar o arquivo de retorno CNAB — aceita uma lista já parseada (nosso número + status), sem o parser binário do CNAB em si. */
  async processReturnFile(tenantId: string, entries: { ourNumber: string; paid: boolean }[]) {
    let settledCount = 0;
    for (const entry of entries) {
      const slip = await this.prisma.bankSlip.findFirst({ where: { tenantId, ourNumber: entry.ourNumber } });
      if (!slip) continue;
      await this.prisma.bankSlip.update({ where: { id: slip.id }, data: { status: entry.paid ? 'paid' : slip.status, returnFileProcessedAt: new Date() } });
      if (entry.paid && slip.receivableId) {
        await this.receivables.settleAutomatically(slip.receivableId, Number(slip.amount), slip.bankAccountId);
        settledCount++;
      }
    }
    return { processed: entries.length, settled: settledCount };
  }
}

/** Cartões — operadoras, taxas, antecipações, parcelamentos, recebimentos futuros (briefing). */
@Injectable()
export class CardTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  listOperators(tenantId: string) {
    return this.prisma.cardOperator.findMany({ where: { tenantId, isActive: true } });
  }

  createOperator(tenantId: string, data: { name: string; debitFeePercent: number; creditFeePercent: number; settlementDays: number; anticipationFeePercent?: number }) {
    return this.prisma.cardOperator.create({ data: { tenantId, ...data } });
  }

  async registerTransaction(tenantId: string, operatorId: string, salePaymentId: string, grossAmount: number, installments: number) {
    const operator = await this.prisma.cardOperator.findFirst({ where: { id: operatorId, tenantId } });
    if (!operator) throw new NotFoundException('Operadora não encontrada');

    const feePercent = installments > 1 ? Number(operator.creditFeePercent) : Number(operator.debitFeePercent);
    const created = [];
    const installmentGross = Number((grossAmount / installments).toFixed(2));

    for (let i = 1; i <= installments; i++) {
      const feeAmount = Number((installmentGross * (feePercent / 100)).toFixed(2));
      const expectedSettlementDate = new Date();
      expectedSettlementDate.setDate(expectedSettlementDate.getDate() + operator.settlementDays * i);

      const transaction = await this.prisma.cardTransaction.create({
        data: {
          tenantId,
          cardOperatorId: operatorId,
          salePaymentId,
          installmentNumber: i,
          totalInstallments: installments,
          grossAmount: installmentGross,
          feeAmount,
          netAmount: installmentGross - feeAmount,
          expectedSettlementDate,
        },
      });
      created.push(transaction);
    }
    return created;
  }

  listPendingSettlement(tenantId: string) {
    return this.prisma.cardTransaction.findMany({ where: { tenantId, status: 'pending_settlement' }, include: { cardOperator: true }, orderBy: { expectedSettlementDate: 'asc' } });
  }

  /** Antecipação — recebe agora, aplicando a taxa de antecipação da operadora. */
  async anticipate(tenantId: string, transactionId: string) {
    const transaction = await this.prisma.cardTransaction.findFirst({ where: { id: transactionId, tenantId }, include: { cardOperator: true } });
    if (!transaction) throw new NotFoundException('Recebível não encontrado');

    const anticipationFee = Number(transaction.netAmount) * (Number(transaction.cardOperator.anticipationFeePercent) / 100);
    return this.prisma.cardTransaction.update({
      where: { id: transactionId },
      data: { status: 'anticipated', netAmount: Number(transaction.netAmount) - anticipationFee, anticipatedAt: new Date() },
    });
  }

  settle(transactionId: string) {
    return this.prisma.cardTransaction.update({ where: { id: transactionId }, data: { status: 'settled' } });
  }
}
