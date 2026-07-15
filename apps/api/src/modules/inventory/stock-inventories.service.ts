import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { StockService } from './stock.service';
import { AuditService } from '@/common/audit/audit.service';
import type { CreateInventoryDto, CreateRecountDto, SubmitCountDto } from './dto/transfer-inventory-reservation.dto';
import type { RequestContext } from '@/common/types/request-context';

/**
 * Inventário físico — Geral, Rotativo, por Local, por Grupo, por
 * Fabricante (`Inventory.type`), com Contagem Cega (`isBlind`) e
 * Recontagem (`parentInventoryId`). Fluxo: `open()` tira a "foto" do saldo
 * de sistema para os produtos do escopo escolhido → operador registra
 * `submitCount()` por produto → `reconcile()` compara e gera
 * `StockMovement` de ajuste (inventory_in/inventory_out) para cada
 * diferença, fechando o inventário.
 */
@Injectable()
export class StockInventoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly audit: AuditService,
  ) {}

  async open(ctx: RequestContext, dto: CreateInventoryDto) {
    const productWhere = await this.buildProductScope(ctx.tenantId, dto);
    const stocks = await this.prisma.stock.findMany({
      where: { tenantId: ctx.tenantId, warehouseId: dto.warehouseId, product: productWhere },
      select: { productId: true, quantityOnHand: true },
    });

    if (stocks.length === 0) {
      throw new BadRequestException('Nenhum produto encontrado no escopo selecionado para este depósito');
    }

    const code = `INV-${Date.now()}`;
    const inventory = await this.prisma.inventory.create({
      data: {
        tenantId: ctx.tenantId,
        warehouseId: dto.warehouseId,
        type: dto.type as never,
        isBlind: dto.isBlind ?? false,
        groupId: dto.groupId,
        manufacturerId: dto.manufacturerId,
        locationId: dto.locationId,
        notes: dto.notes,
        code,
        createdBy: ctx.userId,
        items: {
          createMany: {
            data: stocks.map((s) => ({ tenantId: ctx.tenantId, productId: s.productId, systemQuantity: s.quantityOnHand })),
          },
        },
      },
      include: { items: true },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'insert', entity: 'Inventory', entityId: inventory.id, after: { type: dto.type, items: stocks.length } });
    return inventory;
  }

  async submitCount(ctx: RequestContext, inventoryId: string, dto: SubmitCountDto) {
    const inventory = await this.getOrThrow(ctx.tenantId, inventoryId);
    if (inventory.status === 'reconciled' || inventory.status === 'cancelled') {
      throw new BadRequestException('Inventário já finalizado');
    }

    await this.prisma.inventory.update({ where: { id: inventoryId }, data: { status: 'counting' } });

    return this.prisma.inventoryItem.update({
      where: { inventoryId_productId: { inventoryId, productId: dto.productId } },
      data: { countedQuantity: dto.countedQuantity, countedAt: new Date(), countedBy: ctx.userId },
    });
  }

  /** Visão de diferenças (sistema x contado) — usada pela tela de conferência antes de reconciliar. */
  async getDifferences(ctx: RequestContext, inventoryId: string) {
    const inventory = await this.getOrThrow(ctx.tenantId, inventoryId);
    return inventory.items
      .filter((item) => item.countedQuantity !== null)
      .map((item) => ({
        ...item,
        difference: Number(item.countedQuantity) - Number(item.systemQuantity),
      }));
  }

  async reconcile(ctx: RequestContext, inventoryId: string) {
    const inventory = await this.getOrThrow(ctx.tenantId, inventoryId);
    if (inventory.status === 'reconciled') throw new BadRequestException('Inventário já reconciliado');

    for (const item of inventory.items) {
      if (item.countedQuantity === null) continue;
      const diff = Number(item.countedQuantity) - Number(item.systemQuantity);
      if (diff === 0) continue;

      await this.stockService.move(ctx, {
        productId: item.productId,
        warehouseId: inventory.warehouseId,
        type: (diff > 0 ? 'inventory_in' : 'inventory_out') as never,
        quantity: Math.abs(diff),
        documentType: 'inventory',
        documentId: inventory.id,
        reason: `Ajuste de inventário ${inventory.code}`,
      });
    }

    const reconciled = await this.prisma.inventory.update({ where: { id: inventoryId }, data: { status: 'reconciled', closedAt: new Date() } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'update', entity: 'Inventory', entityId: inventoryId, after: { status: 'reconciled' } });
    return reconciled;
  }

  /** Recontagem — abre um novo Inventory (mesmo depósito) só com os produtos divergentes, ligado ao original. */
  async createRecount(ctx: RequestContext, inventoryId: string, dto: CreateRecountDto) {
    const inventory = await this.getOrThrow(ctx.tenantId, inventoryId);

    const code = `${inventory.code}-REC`;
    const recount = await this.prisma.inventory.create({
      data: {
        tenantId: ctx.tenantId,
        warehouseId: inventory.warehouseId,
        type: inventory.type,
        isBlind: inventory.isBlind,
        parentInventoryId: inventory.id,
        code,
        createdBy: ctx.userId,
        items: {
          createMany: {
            data: inventory.items
              .filter((item) => dto.productIds.includes(item.productId))
              .map((item) => ({ tenantId: ctx.tenantId, productId: item.productId, systemQuantity: item.countedQuantity ?? item.systemQuantity })),
          },
        },
      },
      include: { items: true },
    });

    return recount;
  }

  list(tenantId: string, warehouseId?: string) {
    return this.prisma.inventory.findMany({
      where: { tenantId, ...(warehouseId ? { warehouseId } : {}) },
      orderBy: { startedAt: 'desc' },
      include: { _count: { select: { items: true } } },
    });
  }

  async getOne(ctx: RequestContext, inventoryId: string) {
    return this.getOrThrow(ctx.tenantId, inventoryId);
  }

  private async getOrThrow(tenantId: string, id: string) {
    const inventory = await this.prisma.inventory.findFirst({
      where: { id, tenantId },
      include: { items: { include: { product: { select: { id: true, internalCode: true, shortDescription: true } } } } },
    });
    if (!inventory) throw new NotFoundException('Inventário não encontrado');
    return inventory;
  }

  private async buildProductScope(tenantId: string, dto: CreateInventoryDto) {
    switch (dto.type) {
      case 'by_group':
        return dto.groupId ? { groupId: dto.groupId } : {};
      case 'by_manufacturer':
        return dto.manufacturerId ? { manufacturerId: dto.manufacturerId } : {};
      case 'by_location':
        return dto.locationId ? { defaultLocationId: dto.locationId } : {};
      default:
        return {};
    }
  }
}
