/*
  Warnings:

  - Added the required column `encrypted_password` to the `fiscal_certificates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "fiscal_certificates" ADD COLUMN     "encrypted_password" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "mercado_livre_integrations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "client_id" TEXT NOT NULL,
    "encrypted_client_secret" TEXT NOT NULL,
    "redirect_uri" TEXT NOT NULL,
    "ml_user_id" TEXT,
    "ml_nickname" TEXT,
    "encrypted_access_token" TEXT,
    "encrypted_refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mercado_livre_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mercado_livre_integrations_tenant_id_key" ON "mercado_livre_integrations"("tenant_id");

-- CreateIndex
CREATE INDEX "mercado_livre_integrations_tenant_id_idx" ON "mercado_livre_integrations"("tenant_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
