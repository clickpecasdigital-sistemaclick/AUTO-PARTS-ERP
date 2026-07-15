import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma/prisma.service';
import { SupabaseStorageService } from '@/common/storage/supabase-storage.service';
import { AuditService } from '@/common/audit/audit.service';
import type { RequestContext } from '@/common/types/request-context';

const DOCUMENTS_BUCKET = 'mdm-documents';

/**
 * Documentos (briefing: "Upload para Supabase Storage. PDF, Imagem, XML,
 * DOCX, XLSX. Associação por entidade. Versionamento."). Reaproveita
 * `SupabaseStorageService` (Sprint 05) e o model `Attachment` genérico
 * (Sprint 02, entity/entityId) — nenhum bucket/serviço de storage novo.
 * Versionamento: enviar um novo arquivo para uma entidade que já tem
 * anexo do mesmo `fileName` cria uma nova linha apontando
 * `previousVersionId` para a anterior, nunca sobrescreve o arquivo físico.
 */
@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: SupabaseStorageService,
    private readonly audit: AuditService,
  ) {}

  list(tenantId: string, entity: string, entityId: string) {
    return this.prisma.attachment.findMany({ where: { tenantId, entity, entityId }, orderBy: { createdAt: 'desc' } });
  }

  /** Apenas a versão mais recente de cada `fileName` — visão "documentos atuais" (sem o histórico). */
  async listLatestVersions(tenantId: string, entity: string, entityId: string) {
    const all = await this.list(tenantId, entity, entityId);
    const latestByName = new Map<string, (typeof all)[number]>();
    for (const doc of all) {
      const key = doc.fileName ?? doc.id;
      const current = latestByName.get(key);
      if (!current || doc.version > current.version) latestByName.set(key, doc);
    }
    return [...latestByName.values()];
  }

  async upload(
    ctx: RequestContext,
    entity: string,
    entityId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
    kind: 'document' | 'photo' | 'signature' = 'document',
  ) {
    const previous = await this.prisma.attachment.findFirst({
      where: { tenantId: ctx.tenantId, entity, entityId, fileName: file.originalname },
      orderBy: { version: 'desc' },
    });

    const path = `${ctx.tenantId}/${entity}/${entityId}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    const { publicUrl } = await this.storage.upload(DOCUMENTS_BUCKET, path, file.buffer, file.mimetype);

    const attachment = await this.prisma.attachment.create({
      data: {
        tenantId: ctx.tenantId,
        entity,
        entityId,
        kind: kind as never,
        url: publicUrl,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.buffer.length,
        version: previous ? previous.version + 1 : 1,
        previousVersionId: previous?.id,
        uploadedBy: ctx.userId,
      },
    });

    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'document_upload', entity, entityId, after: { attachmentId: attachment.id, version: attachment.version } });
    return attachment;
  }

  async getVersionHistory(tenantId: string, attachmentId: string) {
    const root = await this.prisma.attachment.findFirst({ where: { id: attachmentId, tenantId } });
    if (!root) throw new NotFoundException('Documento não encontrado');
    return this.prisma.attachment.findMany({ where: { tenantId, entity: root.entity, entityId: root.entityId, fileName: root.fileName }, orderBy: { version: 'desc' } });
  }

  async recordDownload(ctx: RequestContext, attachmentId: string) {
    const attachment = await this.prisma.attachment.findFirst({ where: { id: attachmentId, tenantId: ctx.tenantId } });
    if (!attachment) throw new NotFoundException('Documento não encontrado');
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'document_download', entity: attachment.entity, entityId: attachment.entityId, after: { attachmentId } });
    return attachment;
  }

  async remove(ctx: RequestContext, attachmentId: string) {
    const attachment = await this.prisma.attachment.findFirst({ where: { id: attachmentId, tenantId: ctx.tenantId } });
    if (!attachment) throw new NotFoundException('Documento não encontrado');
    await this.prisma.attachment.delete({ where: { id: attachmentId } });
    await this.audit.log({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'delete', entity: attachment.entity, entityId: attachment.entityId, before: { attachmentId } });
  }
}
