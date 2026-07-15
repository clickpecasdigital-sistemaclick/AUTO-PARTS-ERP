/**
 * Contexto de requisição autenticada — montado uma vez por endpoint
 * (Controller) a partir de `@CurrentUser()` + `Request`, e propagado para
 * todo Service/Repository que precise de `tenantId`/auditoria. Compartilhado
 * entre módulos (Produtos, Estoque, e os que vierem depois) para que nenhum
 * módulo declare sua própria cópia incompatível deste shape.
 */
export interface RequestContext {
  tenantId: string;
  userId: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}
