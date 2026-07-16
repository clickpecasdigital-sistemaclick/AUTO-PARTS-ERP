import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';

/**
 * Contexto de "workspace" (empresas e filiais do tenant logado) —
 * peça que faltava desde a Sprint 02: o store do frontend
 * (`workspace.store.ts`) e boa parte do sistema (PDV, Financeiro, Fiscal,
 * Compras) dependem de uma empresa/filial ativa selecionada, mas nada
 * jamais buscava essa lista da API — o app sempre carregava com
 * "Nenhuma empresa configurada" e `activeBranchId: null`, quebrando
 * qualquer fluxo que precisasse desse contexto (ex: iniciar uma venda no
 * PDV, que exige `branchId`).
 */
@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkspace(tenantId: string) {
    const [companies, branches] = await Promise.all([
      this.prisma.company.findMany({ where: { tenantId, isActive: true }, select: { id: true, legalName: true, tradeName: true, document: true } }),
      this.prisma.branch.findMany({ where: { tenantId, isActive: true }, select: { id: true, companyId: true, code: true, name: true } }),
    ]);
    return { companies, branches };
  }
}
