import { Module } from '@nestjs/common';
import { AccountsPayableController } from './accounts-payable.controller';
import { AccountsReceivableController } from './accounts-receivable.controller';
import { BankAccountsController, BankReconciliationController } from './bank-accounts.controller';
import { PixController, BankSlipController, CardTransactionsController } from './pix-bankslip-card.controller';
import { ChartOfAccountsController, CostCentersController, CommissionsController } from './chart-cost-center-commission.controller';
import { CashFlowController, DreController, FinancialProjectionsController, FinancialAnalyticsController } from './financial-analytics.controller';
import { AccountsPayableService } from './accounts-payable.service';
import { AccountsReceivableService } from './accounts-receivable.service';
import { BankAccountsService } from './bank-accounts.service';
import { BankReconciliationService } from './bank-reconciliation.service';
import { PixService, BankSlipService, CardTransactionsService } from './pix-bankslip-card.service';
import { ChartOfAccountsService, CostCentersService, CommissionRulesService } from './chart-cost-center-commission.service';
import { CashFlowService, DreService } from './cash-flow-dre.service';
import { FinancialProjectionsService, FinancialAnalyticsService } from './financial-projections-analytics.service';

/**
 * Financeiro Enterprise (Sprint 10) — controle financeiro completo:
 * Contas a Pagar/Receber (com baixa/renegociação/estorno/juros/multa/
 * desconto), Bancos/PIX/Boletos/Cartões (estruturas preparadas, sem PSP
 * real), Conciliação Bancária, Fluxo de Caixa, DRE, Plano de Contas,
 * Centros de Custo/Rateio, Comissões configuráveis, Projeções e Dashboard
 * Executivo. "Caixa" (abertura/fechamento/sangria/suprimento/conferência)
 * é 100% reaproveitado de `PdvModule`/`CashRegister` (Sprint 09) — não
 * duplicado aqui.
 */
@Module({
  controllers: [
    AccountsPayableController,
    AccountsReceivableController,
    BankAccountsController,
    BankReconciliationController,
    PixController,
    BankSlipController,
    CardTransactionsController,
    ChartOfAccountsController,
    CostCentersController,
    CommissionsController,
    CashFlowController,
    DreController,
    FinancialProjectionsController,
    FinancialAnalyticsController,
  ],
  providers: [
    AccountsPayableService,
    AccountsReceivableService,
    BankAccountsService,
    BankReconciliationService,
    PixService,
    BankSlipService,
    CardTransactionsService,
    ChartOfAccountsService,
    CostCentersService,
    CommissionRulesService,
    CashFlowService,
    DreService,
    FinancialProjectionsService,
    FinancialAnalyticsService,
  ],
  exports: [AccountsPayableService, AccountsReceivableService, BankAccountsService, CommissionRulesService],
})
export class FinancialModule {}
