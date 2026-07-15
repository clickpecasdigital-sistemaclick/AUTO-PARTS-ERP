-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'admin', 'manager', 'operator', 'viewer');

-- CreateEnum
CREATE TYPE "TenantPlan" AS ENUM ('trial', 'starter', 'professional', 'enterprise');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('active', 'suspended', 'cancelled');

-- CreateEnum
CREATE TYPE "CompanyTaxRegime" AS ENUM ('simples_nacional', 'lucro_presumido', 'lucro_real', 'mei');

-- CreateEnum
CREATE TYPE "CostingMethod" AS ENUM ('fifo', 'lifo', 'average', 'last_cost');

-- CreateEnum
CREATE TYPE "BranchType" AS ENUM ('matriz', 'filial', 'deposito_avancado');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('insert', 'update', 'delete', 'login', 'logout', 'nf_emit', 'nf_cancel', 'permission_change', 'stock_adjustment', 'price_change', 'export', 'approve', 'reject', 'receive', 'confer', 'credit_change', 'consent_change', 'anonymize', 'document_upload', 'document_download', 'sensitive_data_view');

-- CreateEnum
CREATE TYPE "SystemLogLevel" AS ENUM ('debug', 'info', 'warning', 'error', 'critical');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('individual', 'business');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('active', 'inactive', 'blocked');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('final_consumer', 'workshop', 'wholesale', 'retail');

-- CreateEnum
CREATE TYPE "CreditStatus" AS ENUM ('not_analyzed', 'approved', 'under_review', 'restricted', 'blocked');

-- CreateEnum
CREATE TYPE "ContactKind" AS ENUM ('primary', 'financial', 'purchasing', 'workshop', 'fiscal');

-- CreateEnum
CREATE TYPE "CreditEventType" AS ENUM ('limit_change', 'status_change', 'manual_review', 'automatic_block', 'automatic_unblock');

-- CreateEnum
CREATE TYPE "AddressKind" AS ENUM ('billing', 'shipping', 'fiscal', 'residential', 'commercial', 'other');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('active', 'inactive', 'blocked');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('active', 'on_leave', 'terminated');

-- CreateEnum
CREATE TYPE "FuelKind" AS ENUM ('gasolina', 'etanol', 'flex', 'diesel', 'gnv', 'eletrico', 'hibrido');

-- CreateEnum
CREATE TYPE "ProductOrigin" AS ENUM ('nacional', 'estrangeira_importacao_direta', 'estrangeira_mercado_interno', 'nacional_importacao_acima_40', 'nacional_processos_produtivos', 'nacional_importacao_menor_40', 'estrangeira_sem_similar_nacional', 'estrangeira_sem_similar_mercado', 'nacional_conteudo_importacao_70');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('active', 'inactive', 'discontinued');

-- CreateEnum
CREATE TYPE "ProductRelationType" AS ENUM ('similar', 'equivalent', 'complementary', 'substitute');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('percentage_discount', 'fixed_discount', 'fixed_price');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('purchase_in', 'sale_out', 'transfer_in', 'transfer_out', 'adjustment_in', 'adjustment_out', 'inventory_in', 'inventory_out', 'service_order_out', 'return_in', 'loss_out', 'breakage_out', 'internal_consumption_out', 'bonus_in');

-- CreateEnum
CREATE TYPE "ProductSerialStatus" AS ENUM ('in_stock', 'sold', 'returned', 'defective');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('open', 'counting', 'reconciled', 'cancelled');

-- CreateEnum
CREATE TYPE "InventoryType" AS ENUM ('general', 'cycle', 'by_location', 'by_group', 'by_manufacturer');

-- CreateEnum
CREATE TYPE "StockTransferStatus" AS ENUM ('pending', 'in_transit', 'received', 'cancelled');

-- CreateEnum
CREATE TYPE "StockReservationSourceType" AS ENUM ('sales_order', 'quote', 'service_order', 'purchase_order');

-- CreateEnum
CREATE TYPE "StockReservationStatus" AS ENUM ('active', 'released', 'consumed', 'expired');

-- CreateEnum
CREATE TYPE "PurchasePriority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'quoting', 'converted', 'cancelled');

-- CreateEnum
CREATE TYPE "PurchaseQuotationStatus" AS ENUM ('open', 'comparing', 'awarded', 'cancelled');

-- CreateEnum
CREATE TYPE "PurchaseApprovalDocumentType" AS ENUM ('purchase_request', 'purchase_order');

-- CreateEnum
CREATE TYPE "PurchaseApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "PurchaseSuggestionStatus" AS ENUM ('pending', 'converted', 'dismissed');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('draft', 'sent', 'partially_received', 'received', 'cancelled');

-- CreateEnum
CREATE TYPE "GoodsReceiptStatus" AS ENUM ('pending', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "GoodsReceiptItemDisposition" AS ENUM ('pending', 'accepted', 'partially_accepted', 'rejected');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('draft', 'sent', 'approved', 'rejected', 'expired', 'converted');

-- CreateEnum
CREATE TYPE "SalesOrderStatus" AS ENUM ('pending', 'confirmed', 'invoiced', 'cancelled');

-- CreateEnum
CREATE TYPE "SalesOrderSeparationStatus" AS ENUM ('pending', 'separating', 'separated', 'shipped');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('open', 'paid', 'partially_paid', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "SaleMode" AS ENUM ('balcony', 'workshop', 'quick', 'future_sale', 'telesales', 'pre_sale');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('cash', 'debit_card', 'credit_card', 'pix', 'bank_slip', 'bank_transfer', 'store_credit', 'in_house_installment');

-- CreateEnum
CREATE TYPE "CashRegisterStatus" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "CashMovementType" AS ENUM ('sale', 'reinforcement', 'withdrawal', 'expense', 'adjustment');

-- CreateEnum
CREATE TYPE "DiscountRuleScope" AS ENUM ('user', 'profile', 'customer', 'product', 'campaign');

-- CreateEnum
CREATE TYPE "SaleReturnType" AS ENUM ('partial', 'total', 'exchange');

-- CreateEnum
CREATE TYPE "SaleReturnStatus" AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- CreateEnum
CREATE TYPE "ChartOfAccountType" AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('checking', 'savings');

-- CreateEnum
CREATE TYPE "BankStatementEntryStatus" AS ENUM ('unmatched', 'matched', 'ignored');

-- CreateEnum
CREATE TYPE "BankReconciliationStatus" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "PixChargeStatus" AS ENUM ('pending', 'paid', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "BankSlipStatus" AS ENUM ('registered', 'paid', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "CardTransactionStatus" AS ENUM ('pending_settlement', 'settled', 'anticipated', 'cancelled');

-- CreateEnum
CREATE TYPE "PayableStatus" AS ENUM ('open', 'paid', 'partially_paid', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "ReceivableStatus" AS ENUM ('open', 'paid', 'partially_paid', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('pending', 'approved', 'paid', 'cancelled');

-- CreateEnum
CREATE TYPE "CommissionRuleScope" AS ENUM ('salesperson', 'mechanic', 'product', 'service', 'campaign');

-- CreateEnum
CREATE TYPE "ProjectionScenario" AS ENUM ('realistic', 'optimistic', 'pessimistic');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('maintenance', 'repair', 'diagnostics', 'bodywork', 'electrical', 'other');

-- CreateEnum
CREATE TYPE "ServiceOrderStatus" AS ENUM ('open', 'diagnosing', 'awaiting_approval', 'approved', 'in_progress', 'awaiting_parts', 'completed', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "ServiceOrderPriority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "ChecklistItemResult" AS ENUM ('ok', 'attention', 'not_applicable', 'not_checked');

-- CreateEnum
CREATE TYPE "WarrantyStatus" AS ENUM ('active', 'expired', 'claimed', 'voided');

-- CreateEnum
CREATE TYPE "WarrantyType" AS ENUM ('part', 'service');

-- CreateEnum
CREATE TYPE "WorkshopAppointmentStatus" AS ENUM ('scheduled', 'confirmed', 'waitlisted', 'checked_in', 'rescheduled', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "ServiceFollowUpType" AS ENUM ('revision_reminder', 'scheduled_return', 'satisfaction_call');

-- CreateEnum
CREATE TYPE "ServiceFollowUpStatus" AS ENUM ('pending', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('photo', 'document', 'video', 'other');

-- CreateEnum
CREATE TYPE "LegalBasis" AS ENUM ('consent', 'contract', 'legal_obligation', 'legitimate_interest');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('given', 'revoked');

-- CreateEnum
CREATE TYPE "DataSubjectRequestType" AS ENUM ('export', 'deletion', 'anonymization', 'correction');

-- CreateEnum
CREATE TYPE "DataSubjectRequestStatus" AS ENUM ('pending', 'in_progress', 'completed', 'rejected');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('website', 'whatsapp', 'phone', 'instagram', 'facebook', 'referral', 'walk_in', 'other');

-- CreateEnum
CREATE TYPE "InteractionChannel" AS ENUM ('phone', 'whatsapp', 'email', 'in_person', 'chat');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('service', 'sales_followup', 'delivery', 'other');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('scheduled', 'confirmed', 'completed', 'no_show', 'cancelled');

-- CreateEnum
CREATE TYPE "CrmTaskType" AS ENUM ('call', 'visit', 'follow_up', 'email', 'whatsapp', 'generic');

-- CreateEnum
CREATE TYPE "CrmTaskStatus" AS ENUM ('pending', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "CrmCampaignStatus" AS ENUM ('draft', 'active', 'finished', 'cancelled');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "SupportTicketPriority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('info', 'warning', 'success', 'error');

-- CreateEnum
CREATE TYPE "AiFeedbackRating" AS ENUM ('positive', 'negative');

-- CreateEnum
CREATE TYPE "CfopType" AS ENUM ('entrada', 'saida');

-- CreateEnum
CREATE TYPE "FiscalInvoiceModel" AS ENUM ('nfe', 'nfce', 'sat');

-- CreateEnum
CREATE TYPE "FiscalInvoiceStatus" AS ENUM ('draft', 'pending_authorization', 'authorized', 'rejected', 'cancelled', 'denied', 'contingency');

-- CreateEnum
CREATE TYPE "FiscalEnvironment" AS ENUM ('production', 'homologation');

-- CreateEnum
CREATE TYPE "TaxRegime" AS ENUM ('simples_nacional', 'lucro_presumido', 'lucro_real', 'mei');

-- CreateEnum
CREATE TYPE "FiscalEventType" AS ENUM ('cancellation', 'correction_letter', 'manifestation', 'voiding');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('active', 'acknowledged', 'resolved', 'snoozed');

-- CreateEnum
CREATE TYPE "AutomationTrigger" AS ENUM ('stock_below_minimum', 'customer_overdue', 'certificate_expiring', 'sale_above_target', 'sale_below_target', 'margin_below_threshold', 'cash_flow_negative', 'invoice_rejected', 'order_delayed');

-- CreateEnum
CREATE TYPE "AutomationAction" AS ENUM ('create_purchase_suggestion', 'send_notification', 'create_alert', 'send_email', 'webhook');

-- CreateEnum
CREATE TYPE "AutomationStatus" AS ENUM ('active', 'paused', 'error');

-- CreateEnum
CREATE TYPE "LgpdConsentType" AS ENUM ('terms_of_use', 'privacy_policy', 'marketing', 'data_processing', 'third_party_sharing');

-- CreateEnum
CREATE TYPE "LgpdRequestType" AS ENUM ('access', 'export', 'rectification', 'erasure', 'portability', 'objection');

-- CreateEnum
CREATE TYPE "LgpdRequestStatus" AS ENUM ('pending', 'in_progress', 'completed', 'rejected');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('full', 'incremental', 'schema_only');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('running', 'completed', 'failed', 'validating', 'restored');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('starter', 'pro', 'business', 'enterprise', 'ultimate');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trial', 'active', 'past_due', 'suspended', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "BillingProvider" AS ENUM ('stripe', 'asaas', 'mercadopago', 'pagseguro', 'manual');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded', 'void');

-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('saas_subscription', 'perpetual', 'trial', 'nfr', 'developer');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('active', 'expired', 'revoked', 'suspended');

-- CreateEnum
CREATE TYPE "PluginCategory" AS ENUM ('integration', 'automation', 'report', 'widget', 'payment', 'fiscal', 'crm', 'communication', 'utility');

-- CreateEnum
CREATE TYPE "PortalType" AS ENUM ('customer', 'supplier', 'accountant');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('draft', 'active', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('email', 'whatsapp', 'sms', 'push');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('queued', 'sent', 'delivered', 'failed', 'bounced');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('pending', 'processing', 'done', 'failed', 'partial');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "plan" "TenantPlan" NOT NULL DEFAULT 'trial',
    "status" "TenantStatus" NOT NULL DEFAULT 'active',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "legal_name" TEXT NOT NULL,
    "trade_name" TEXT,
    "document" TEXT NOT NULL,
    "state_registration" TEXT,
    "municipal_registration" TEXT,
    "tax_regime" "CompanyTaxRegime" NOT NULL DEFAULT 'simples_nacional',
    "costing_method" "CostingMethod" NOT NULL DEFAULT 'average',
    "base_currency" TEXT NOT NULL DEFAULT 'BRL',
    "email" TEXT,
    "phone" TEXT,
    "zip_code" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" CHAR(2),
    "country" TEXT NOT NULL DEFAULT 'BR',
    "logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BranchType" NOT NULL DEFAULT 'filial',
    "document" TEXT,
    "state_registration" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "zip_code" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" CHAR(2),
    "country" TEXT NOT NULL DEFAULT 'BR',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "profile_id" UUID,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "phone" TEXT,
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'viewer',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_branches" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_permissions" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" UUID,
    "before" JSONB,
    "after" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "level" "SystemLogLevel" NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "origin_branch_id" UUID,
    "person_type" "PersonType" NOT NULL,
    "customer_type" "CustomerType" NOT NULL DEFAULT 'retail',
    "document" TEXT NOT NULL,
    "state_registration" TEXT,
    "municipal_registration" TEXT,
    "rg" TEXT,
    "suframa_code" TEXT,
    "name" TEXT NOT NULL,
    "trade_name" TEXT,
    "classification" TEXT,
    "category" TEXT,
    "segment" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "birth_date" DATE,
    "zip_code" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" CHAR(2),
    "country" TEXT NOT NULL DEFAULT 'BR',
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "credit_limit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit_score" INTEGER,
    "credit_status" "CreditStatus" NOT NULL DEFAULT 'not_analyzed',
    "credit_analyzed_at" TIMESTAMP(3),
    "last_purchase_at" TIMESTAMP(3),
    "total_purchases_count" INTEGER NOT NULL DEFAULT 0,
    "average_ticket_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "largest_purchase_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "CustomerStatus" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_contacts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "kind" "ContactKind" NOT NULL DEFAULT 'primary',
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_credit_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "type" "CreditEventType" NOT NULL,
    "previous_limit" DECIMAL(15,2),
    "new_limit" DECIMAL(15,2),
    "previous_status" "CreditStatus",
    "new_status" "CreditStatus",
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "customer_credit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "kind" "AddressKind" NOT NULL DEFAULT 'shipping',
    "label" TEXT,
    "zip_code" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT NOT NULL,
    "state" CHAR(2) NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'BR',
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "person_type" "PersonType" NOT NULL,
    "document" TEXT NOT NULL,
    "state_registration" TEXT,
    "name" TEXT NOT NULL,
    "trade_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "zip_code" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" CHAR(2),
    "country" TEXT NOT NULL DEFAULT 'BR',
    "payment_term_days" INTEGER,
    "status" "SupplierStatus" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_contacts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "kind" "ContactKind" NOT NULL DEFAULT 'primary',
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "department_id" UUID,
    "user_id" UUID,
    "document" TEXT NOT NULL,
    "rg" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "photo_url" TEXT,
    "signature_url" TEXT,
    "hired_at" DATE,
    "terminated_at" DATE,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_salaries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "base_salary" DECIMAL(15,2) NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "employee_salaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salespersons" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "commission_rate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "monthly_goal" DECIMAL(15,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salespersons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mechanics" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "specialties" TEXT[],
    "commission_rate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mechanics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mechanic_certifications" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "mechanic_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "issued_at" DATE,
    "expires_at" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mechanic_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mechanic_time_entries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "mechanic_id" UUID NOT NULL,
    "service_order_id" UUID,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "mechanic_time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carriers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "document" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state_registration" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "state" CHAR(2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "carriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carrier_freight_tables" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "carrier_id" UUID NOT NULL,
    "region" TEXT NOT NULL,
    "price_per_kg" DECIMAL(10,4),
    "flat_rate" DECIMAL(10,2),
    "lead_time_days" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carrier_freight_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carrier_vehicles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "carrier_id" UUID NOT NULL,
    "plate" TEXT NOT NULL,
    "model" TEXT,
    "capacity_kg" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carrier_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carrier_drivers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "carrier_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "license_number" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carrier_drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_makes" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_makes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_models" (
    "id" UUID NOT NULL,
    "make_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engines" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "displacement" DECIMAL(4,1),
    "cylinders" INTEGER,
    "power_hp" INTEGER,
    "description" TEXT,

    CONSTRAINT "engines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_types" (
    "id" UUID NOT NULL,
    "kind" "FuelKind" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "fuel_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_versions" (
    "id" UUID NOT NULL,
    "model_id" UUID NOT NULL,
    "engine_id" UUID,
    "fuel_type_id" UUID,
    "name" TEXT NOT NULL,
    "year_start" INTEGER NOT NULL,
    "year_end" INTEGER,
    "body_type" TEXT,
    "chassis_prefix" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_vehicles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "vehicle_version_id" UUID,
    "plate" TEXT,
    "chassis" TEXT,
    "renavam" TEXT,
    "color" TEXT,
    "model_year" INTEGER,
    "manufacture_year" INTEGER,
    "current_km" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customer_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "country" TEXT DEFAULT 'BR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manufacturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "allows_decimal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_groups" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_subgroups" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_subgroups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "internal_code" TEXT NOT NULL,
    "barcode" TEXT,
    "manufacturer_code" TEXT,
    "original_code" TEXT,
    "similar_code" TEXT,
    "short_description" TEXT NOT NULL,
    "full_description" TEXT,
    "brand_id" UUID,
    "manufacturer_id" UUID,
    "group_id" UUID,
    "subgroup_id" UUID,
    "category_id" UUID,
    "unit_id" UUID NOT NULL,
    "ncm_code" TEXT,
    "cest_code" TEXT,
    "default_cfop_code" TEXT,
    "default_cst_code" TEXT,
    "default_csosn_code" TEXT,
    "origin" "ProductOrigin" NOT NULL DEFAULT 'nacional',
    "ipi_rate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "icms_rate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "pis_rate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "cofins_rate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "weight_kg" DECIMAL(10,3),
    "height_cm" DECIMAL(10,2),
    "width_cm" DECIMAL(10,2),
    "length_cm" DECIMAL(10,2),
    "default_location_id" UUID,
    "min_stock" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "max_stock" DECIMAL(15,4),
    "cost_price" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "average_cost_price" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "sale_price" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "wholesale_price" DECIMAL(15,4),
    "workshop_price" DECIMAL(15,4),
    "distributor_price" DECIMAL(15,4),
    "margin_percent" DECIMAL(7,4),
    "primary_supplier_id" UUID,
    "warranty_days" INTEGER,
    "notes" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_photos" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_suppliers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "supplier_sku" TEXT,
    "last_purchase_price" DECIMAL(15,4),
    "lead_time_days" INTEGER,
    "is_preferred" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_cross_references" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "related_product_id" UUID NOT NULL,
    "type" "ProductRelationType" NOT NULL DEFAULT 'similar',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_cross_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_vehicle_applications" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "vehicle_version_id" UUID NOT NULL,
    "position" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_vehicle_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_promotions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "type" "PromotionType" NOT NULL,
    "value" DECIMAL(15,4) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "product_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aisles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aisles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streets" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "aisle_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "streets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelves" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "street_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shelves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_locations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "shelf_id" UUID NOT NULL,
    "level" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "full_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_by_location" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_by_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "quantity_on_hand" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "quantity_reserved" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "quantity_on_order" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "location_id" UUID,
    "batch_id" UUID,
    "serial_id" UUID,
    "type" "StockMovementType" NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_cost" DECIMAL(15,4),
    "total_value" DECIMAL(15,2),
    "reason" TEXT,
    "document_type" TEXT,
    "document_id" UUID,
    "notes" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_batches" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "supplier_id" UUID,
    "batch_number" TEXT NOT NULL,
    "manufactured_at" DATE,
    "expires_at" DATE,
    "quantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_serials" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "serial_number" TEXT NOT NULL,
    "imei" TEXT,
    "asset_tag" TEXT,
    "warranty_end_date" DATE,
    "status" "ProductSerialStatus" NOT NULL DEFAULT 'in_stock',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_serials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventories" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "parent_inventory_id" UUID,
    "type" "InventoryType" NOT NULL DEFAULT 'general',
    "code" TEXT NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'open',
    "is_blind" BOOLEAN NOT NULL DEFAULT false,
    "group_id" UUID,
    "manufacturer_id" UUID,
    "location_id" UUID,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by" UUID,

    CONSTRAINT "inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "inventory_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "system_quantity" DECIMAL(15,4) NOT NULL,
    "counted_quantity" DECIMAL(15,4),
    "recounted_quantity" DECIMAL(15,4),
    "counted_at" TIMESTAMP(3),
    "counted_by" UUID,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "origin_warehouse_id" UUID NOT NULL,
    "destination_warehouse_id" UUID NOT NULL,
    "status" "StockTransferStatus" NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "shipped_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfer_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "stock_transfer_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "origin_location_id" UUID,
    "destination_location_id" UUID,

    CONSTRAINT "stock_transfer_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_reservations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "source_type" "StockReservationSourceType" NOT NULL,
    "source_id" UUID NOT NULL,
    "status" "StockReservationStatus" NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_requests" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "cost_center_id" UUID,
    "department_id" UUID,
    "code" TEXT NOT NULL,
    "priority" "PurchasePriority" NOT NULL DEFAULT 'normal',
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "justification" TEXT NOT NULL,
    "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'draft',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_request_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "purchase_request_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "purchase_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_quotations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "purchase_request_id" UUID,
    "code" TEXT NOT NULL,
    "status" "PurchaseQuotationStatus" NOT NULL DEFAULT 'open',
    "deadline" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "purchase_quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_quotation_suppliers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "quotation_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "freight_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payment_terms" TEXT,
    "delivery_days" INTEGER,
    "warranty_days" INTEGER,
    "discount_percent" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "is_winner" BOOLEAN NOT NULL DEFAULT false,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_quotation_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_quotation_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "quotation_supplier_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_price" DECIMAL(15,4) NOT NULL,
    "ipi_rate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "icms_rate" DECIMAL(7,4) NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_approval_rules" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "department_id" UUID,
    "level" INTEGER NOT NULL DEFAULT 1,
    "min_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "max_value" DECIMAL(15,2),
    "approver_role" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "purchase_approval_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_approvals" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "document_type" "PurchaseApprovalDocumentType" NOT NULL,
    "purchase_request_id" UUID,
    "purchase_order_id" UUID,
    "level" INTEGER NOT NULL DEFAULT 1,
    "approver_id" UUID NOT NULL,
    "status" "PurchaseApprovalStatus" NOT NULL DEFAULT 'pending',
    "comments" TEXT,
    "signature_ref" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_suggestions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "suggested_quantity" DECIMAL(15,4) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "PurchaseSuggestionStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "purchase_request_id" UUID,
    "quotation_supplier_id" UUID,
    "parent_order_id" UUID,
    "code" TEXT NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'draft',
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "issue_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_date" DATE,
    "freight_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "received_quantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(15,4) NOT NULL,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "carrier_id" UUID,
    "code" TEXT NOT NULL,
    "status" "GoodsReceiptStatus" NOT NULL DEFAULT 'pending',
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoice_number" TEXT,
    "volumes" INTEGER,
    "weight_kg" DECIMAL(10,3),
    "freight_amount" DECIMAL(15,2),
    "driver_name" TEXT,
    "notes" TEXT,
    "created_by" UUID,

    CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "goods_receipt_id" UUID NOT NULL,
    "purchase_order_item_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_cost" DECIMAL(15,4) NOT NULL,
    "accepted_quantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "rejected_quantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "disposition" "GoodsReceiptItemDisposition" NOT NULL DEFAULT 'pending',
    "conferred_via" TEXT,
    "occurrence_notes" TEXT,
    "conferred_at" TIMESTAMP(3),
    "conferred_by" UUID,

    CONSTRAINT "goods_receipt_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "salesperson_id" UUID,
    "code" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'draft',
    "valid_until" DATE,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "sent_at" TIMESTAMP(3),
    "sent_to" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "quote_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_price" DECIMAL(15,4) NOT NULL,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "salesperson_id" UUID,
    "quote_id" UUID,
    "code" TEXT NOT NULL,
    "status" "SalesOrderStatus" NOT NULL DEFAULT 'pending',
    "separation_status" "SalesOrderSeparationStatus" NOT NULL DEFAULT 'pending',
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "separated_at" TIMESTAMP(3),
    "shipped_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" UUID,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "sales_order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_price" DECIMAL(15,4) NOT NULL,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "customer_vehicle_id" UUID,
    "salesperson_id" UUID,
    "sales_order_id" UUID,
    "cash_register_id" UUID,
    "terminal_id" UUID,
    "warehouse_id" UUID,
    "mode" "SaleMode" NOT NULL DEFAULT 'balcony',
    "code" TEXT NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'open',
    "subtotal_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by" UUID,
    "cancel_reason" TEXT,
    "refunded_at" TIMESTAMP(3),
    "refunded_by" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_price" DECIMAL(15,4) NOT NULL,
    "unit_cost" DECIMAL(15,4) NOT NULL,
    "discount_percent" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "surcharge_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "commission_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "reservation_id" UUID,

    CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "kind" "PaymentKind" NOT NULL,
    "name" TEXT NOT NULL,
    "fee_percent" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "settlement_days" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_payments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "payment_method_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tef_transaction_id" TEXT,
    "tef_authorization_code" TEXT,
    "tef_nsu" TEXT,

    CONSTRAINT "sale_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_registers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "opened_by" UUID NOT NULL,
    "closed_by" UUID,
    "status" "CashRegisterStatus" NOT NULL DEFAULT 'open',
    "opening_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "closing_amount" DECIMAL(15,2),
    "expected_amount" DECIMAL(15,2),
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "cash_registers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_movements" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "cash_register_id" UUID NOT NULL,
    "type" "CashMovementType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "cash_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_register_reconciliations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "cash_register_id" UUID NOT NULL,
    "payment_method_id" UUID NOT NULL,
    "expected_amount" DECIMAL(15,2) NOT NULL,
    "counted_amount" DECIMAL(15,2) NOT NULL,
    "difference_amount" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_register_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdv_terminals" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pdv_terminals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_rules" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "scope" "DiscountRuleScope" NOT NULL,
    "scope_ref_id" UUID,
    "max_discount_percent" DECIMAL(7,4) NOT NULL,
    "requires_approval_above_percent" DECIMAL(7,4),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_returns" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "type" "SaleReturnType" NOT NULL,
    "status" "SaleReturnStatus" NOT NULL DEFAULT 'pending',
    "reason" TEXT NOT NULL,
    "credit_issued" BOOLEAN NOT NULL DEFAULT false,
    "credit_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "sale_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_return_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "sale_return_id" UUID NOT NULL,
    "sale_item_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_price" DECIMAL(15,4) NOT NULL,

    CONSTRAINT "sale_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_centers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chart_of_accounts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "parent_id" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ChartOfAccountType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "bank_id" UUID,
    "bank_code" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "agency" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_type" "BankAccountType" NOT NULL DEFAULT 'checking',
    "pix_key" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "initial_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "current_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit_limit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance_updated_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banks" (
    "id" UUID NOT NULL,
    "febraban" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_account_pix_keys" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "bank_account_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_account_pix_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_statement_entries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "bank_account_id" UUID NOT NULL,
    "posted_at" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "external_id" TEXT,
    "status" "BankStatementEntryStatus" NOT NULL DEFAULT 'unmatched',
    "matched_payable_id" UUID,
    "matched_receivable_id" UUID,
    "import_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_statement_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_reconciliations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "bank_account_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "status" "BankReconciliationStatus" NOT NULL DEFAULT 'open',
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "bank_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_reconciliation_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "reconciliation_id" UUID NOT NULL,
    "statement_entry_id" UUID NOT NULL,
    "matchMethod" TEXT NOT NULL,
    "divergence_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_reconciliation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pix_charges" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "bank_account_id" UUID NOT NULL,
    "receivable_id" UUID,
    "amount" DECIMAL(15,2) NOT NULL,
    "tx_id" TEXT NOT NULL,
    "qr_code_payload" TEXT,
    "status" "PixChargeStatus" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "webhook_payload" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pix_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_slips" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "bank_account_id" UUID NOT NULL,
    "receivable_id" UUID,
    "our_number" TEXT,
    "barcode_number" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "BankSlipStatus" NOT NULL DEFAULT 'registered',
    "remittance_batch_id" TEXT,
    "return_file_processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_slips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_operators" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "debit_fee_percent" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "credit_fee_percent" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "settlement_days" INTEGER NOT NULL DEFAULT 1,
    "anticipation_fee_percent" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_operators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_transactions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "card_operator_id" UUID NOT NULL,
    "sale_payment_id" UUID,
    "installment_number" INTEGER NOT NULL DEFAULT 1,
    "total_installments" INTEGER NOT NULL DEFAULT 1,
    "gross_amount" DECIMAL(15,2) NOT NULL,
    "fee_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(15,2) NOT NULL,
    "expected_settlement_date" DATE NOT NULL,
    "status" "CardTransactionStatus" NOT NULL DEFAULT 'pending_settlement',
    "anticipated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_payable" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "supplier_id" UUID,
    "purchase_order_id" UUID,
    "cost_center_id" UUID,
    "chart_of_account_id" UUID,
    "bank_account_id" UUID,
    "parent_id" UUID,
    "renegotiated_from_id" UUID,
    "document_number" TEXT,
    "installment_number" INTEGER NOT NULL DEFAULT 1,
    "total_installments" INTEGER NOT NULL DEFAULT 1,
    "amount" DECIMAL(15,2) NOT NULL,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "interest_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fine_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "due_date" DATE NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "reversed_at" TIMESTAMP(3),
    "reversed_by" UUID,
    "status" "PayableStatus" NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "accounts_payable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_receivable" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "customer_id" UUID,
    "sale_id" UUID,
    "cost_center_id" UUID,
    "chart_of_account_id" UUID,
    "bank_account_id" UUID,
    "parent_id" UUID,
    "renegotiated_from_id" UUID,
    "document_number" TEXT,
    "installment_number" INTEGER NOT NULL DEFAULT 1,
    "total_installments" INTEGER NOT NULL DEFAULT 1,
    "amount" DECIMAL(15,2) NOT NULL,
    "received_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "interest_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fine_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "due_date" DATE NOT NULL,
    "received_at" TIMESTAMP(3),
    "reversed_at" TIMESTAMP(3),
    "reversed_by" UUID,
    "status" "ReceivableStatus" NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "accounts_receivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "salesperson_id" UUID,
    "mechanic_id" UUID,
    "sale_id" UUID,
    "service_order_id" UUID,
    "base_amount" DECIMAL(15,2) NOT NULL,
    "rate" DECIMAL(7,4) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_center_allocations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "cost_center_id" UUID NOT NULL,
    "payable_id" UUID,
    "receivable_id" UUID,
    "percent" DECIMAL(7,4) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cost_center_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rules" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "scope" "CommissionRuleScope" NOT NULL,
    "scope_ref_id" UUID,
    "rate_percent" DECIMAL(7,4) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_projections" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "scenario" "ProjectionScenario" NOT NULL DEFAULT 'realistic',
    "reference_month" DATE NOT NULL,
    "projected_revenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "projected_expense" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "financial_projections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ServiceCategory" NOT NULL DEFAULT 'maintenance',
    "specialty" TEXT,
    "standard_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "estimated_minutes" INTEGER,
    "warranty_days" INTEGER NOT NULL DEFAULT 90,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_boxes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_boxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_orders" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "mechanic_id" UUID,
    "consultant_id" UUID,
    "box_id" UUID,
    "appointment_id" UUID,
    "code" TEXT NOT NULL,
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'open',
    "priority" "ServiceOrderPriority" NOT NULL DEFAULT 'normal',
    "complaint" TEXT,
    "technical_diagnosis" TEXT,
    "proposed_solution" TEXT,
    "estimated_minutes" INTEGER,
    "odometer_km" INTEGER,
    "labor_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "parts_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "expected_delivery_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "is_rework" BOOLEAN NOT NULL DEFAULT false,
    "rework_of_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_status_history" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "service_order_id" UUID NOT NULL,
    "from_status" "ServiceOrderStatus",
    "to_status" "ServiceOrderStatus" NOT NULL,
    "notes" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" UUID,

    CONSTRAINT "service_order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_services" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "service_order_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "service_order_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_parts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "service_order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_price" DECIMAL(15,4) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "service_order_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_template_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "checklist_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_checklists" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "service_order_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "filled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filled_by" UUID,

    CONSTRAINT "service_order_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_checklist_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "checklist_id" UUID NOT NULL,
    "template_item_id" UUID NOT NULL,
    "result" "ChecklistItemResult" NOT NULL DEFAULT 'not_checked',
    "notes" TEXT,

    CONSTRAINT "service_order_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranties" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "service_order_id" UUID NOT NULL,
    "type" "WarrantyType" NOT NULL DEFAULT 'service',
    "product_id" UUID,
    "service_id" UUID,
    "description" TEXT NOT NULL,
    "term_days" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "WarrantyStatus" NOT NULL DEFAULT 'active',
    "claimed_at" TIMESTAMP(3),
    "claim_cost" DECIMAL(15,2),
    "claim_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warranties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_check_ins" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "service_order_id" UUID NOT NULL,
    "odometer_km" INTEGER,
    "fuel_level" INTEGER,
    "items_left_in_vehicle" TEXT,
    "existing_damages" TEXT,
    "notes" TEXT,
    "signature_url" TEXT,
    "checked_in_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checked_in_by" UUID,

    CONSTRAINT "service_order_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_deliveries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "service_order_id" UUID NOT NULL,
    "sale_id" UUID,
    "signature_url" TEXT,
    "delivered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_by" UUID,
    "notes" TEXT,

    CONSTRAINT "service_order_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_appointments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "vehicle_id" UUID,
    "mechanic_id" UUID,
    "box_id" UUID,
    "service_id" UUID,
    "status" "WorkshopAppointmentStatus" NOT NULL DEFAULT 'scheduled',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 60,
    "rescheduled_from_id" UUID,
    "cancel_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "workshop_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_satisfaction_surveys" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "service_order_id" UUID NOT NULL,
    "nps_score" INTEGER,
    "satisfaction_score" INTEGER,
    "comments" TEXT,
    "responded_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_satisfaction_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_follow_ups" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "service_order_id" UUID,
    "customer_id" UUID NOT NULL,
    "type" "ServiceFollowUpType" NOT NULL,
    "status" "ServiceFollowUpStatus" NOT NULL DEFAULT 'pending',
    "dueDate" DATE NOT NULL,
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "kind" "AttachmentKind" NOT NULL DEFAULT 'document',
    "url" TEXT NOT NULL,
    "file_name" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previous_version_id" UUID,
    "uploaded_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_consents" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID,
    "supplier_id" UUID,
    "purpose" TEXT NOT NULL,
    "legal_basis" "LegalBasis" NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'given',
    "given_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "created_by" UUID,

    CONSTRAINT "data_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_subject_requests" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID,
    "type" "DataSubjectRequestType" NOT NULL,
    "status" "DataSubjectRequestStatus" NOT NULL DEFAULT 'pending',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "completed_by" UUID,
    "result_url" TEXT,
    "notes" TEXT,

    CONSTRAINT "data_subject_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'other',
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "interest" TEXT,
    "converted_customer_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID,
    "lead_id" UUID,
    "channel" "InteractionChannel" NOT NULL,
    "summary" TEXT NOT NULL,
    "user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "customer_id" UUID,
    "lead_id" UUID,
    "type" "AppointmentType" NOT NULL DEFAULT 'other',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'scheduled',
    "title" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "assigned_to" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_pipeline_stages" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_won" BOOLEAN NOT NULL DEFAULT false,
    "is_lost" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_pipeline_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_opportunities" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "lead_id" UUID,
    "customer_id" UUID,
    "pipeline_stage_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "probability" INTEGER NOT NULL DEFAULT 50,
    "expected_close_date" DATE,
    "assigned_to" UUID,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "crm_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_tasks" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "opportunity_id" UUID,
    "customer_id" UUID,
    "lead_id" UUID,
    "type" "CrmTaskType" NOT NULL DEFAULT 'generic',
    "status" "CrmTaskStatus" NOT NULL DEFAULT 'pending',
    "title" TEXT NOT NULL,
    "due_at" TIMESTAMP(3),
    "assigned_to" UUID,
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_tags" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#6B7280',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_tag_assignments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_tag_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_campaigns" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CrmCampaignStatus" NOT NULL DEFAULT 'draft',
    "startDate" DATE,
    "endDate" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_campaign_members" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "customer_id" UUID,
    "lead_id" UUID,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "crm_campaign_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'open',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'normal',
    "assigned_to" UUID,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "kind" "NotificationKind" NOT NULL DEFAULT 'info',
    "category" TEXT NOT NULL DEFAULT 'system',
    "channel" TEXT NOT NULL DEFAULT 'in_app',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_prompt_templates" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_interactions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "prompt_template_id" UUID,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "context" JSONB,
    "model" TEXT,
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "latency_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_feedback" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "interaction_id" UUID NOT NULL,
    "rating" "AiFeedbackRating" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "ai_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ncms" (
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ipi_rate" DECIMAL(7,4),

    CONSTRAINT "ncms_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "cests" (
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ncm_code" TEXT,

    CONSTRAINT "cests_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "cfops" (
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "CfopType" NOT NULL,

    CONSTRAINT "cfops_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "cst_icms" (
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "cst_icms_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "csosn_icms" (
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "csosn_icms_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "tax_rules" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "origin_state" CHAR(2) NOT NULL,
    "dest_state" CHAR(2) NOT NULL,
    "ncm_code" TEXT,
    "icms_rate" DECIMAL(7,4) NOT NULL,
    "icms_st_rate" DECIMAL(7,4),
    "mva_percent" DECIMAL(7,4),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_configurations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "tax_regime" "TaxRegime" NOT NULL DEFAULT 'simples_nacional',
    "crt" INTEGER NOT NULL DEFAULT 1,
    "environment" "FiscalEnvironment" NOT NULL DEFAULT 'homologation',
    "uf" CHAR(2) NOT NULL,
    "ibge_code" CHAR(7),
    "default_cfop_in_state" TEXT,
    "default_cfop_out_state" TEXT,
    "default_nature_of_operation" TEXT,
    "fiscal_observations" TEXT,
    "nfe_certificate_id" UUID,
    "csc_id" TEXT,
    "csc_token" TEXT,
    "sefaz_token" TEXT,
    "offline_nfce_enabled" BOOLEAN NOT NULL DEFAULT false,
    "contingency_reason" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_certificates" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "alias" TEXT NOT NULL,
    "storage_ref" TEXT NOT NULL,
    "valid_from" DATE NOT NULL,
    "valid_until" DATE NOT NULL,
    "serial_number" TEXT,
    "subject_cn" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "renewed_from_id" UUID,
    "expiry_alert_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiscal_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_series" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "model" "FiscalInvoiceModel" NOT NULL,
    "series" INTEGER NOT NULL,
    "next_number" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "fiscal_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_invoices" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "fiscal_series_id" UUID NOT NULL,
    "sale_id" UUID,
    "purchase_order_id" UUID,
    "service_order_id" UUID,
    "customer_id" UUID,
    "supplier_id" UUID,
    "carrier_id" UUID,
    "model" "FiscalInvoiceModel" NOT NULL,
    "number" INTEGER NOT NULL,
    "series" INTEGER NOT NULL,
    "access_key" CHAR(44),
    "status" "FiscalInvoiceStatus" NOT NULL DEFAULT 'draft',
    "total_products" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_freight" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorized_at" TIMESTAMP(3),
    "protocol_number" TEXT,
    "xml_path" TEXT,
    "xml_content" TEXT,
    "contingency_justification" TEXT,
    "rejection_reason" TEXT,
    "rejection_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "fiscal_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_invoice_items" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "fiscal_invoice_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "cfop_code" TEXT NOT NULL,
    "ncm_code" TEXT,
    "cest_code" TEXT,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_price" DECIMAL(15,4) NOT NULL,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "freight_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "insurance_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cst_icms" TEXT,
    "csosn_icms" TEXT,
    "icms_origin" CHAR(1),
    "icms_rate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "icms_bc_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "icms_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "icms_st_bc_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "icms_st_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fcp_rate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "fcp_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cst_ipi" TEXT,
    "ipi_rate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "ipi_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cst_pis" TEXT,
    "pis_rate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "pis_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cst_cofins" TEXT,
    "cofins_rate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "cofins_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "fiscal_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_invoice_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "fiscal_invoice_id" UUID NOT NULL,
    "type" "FiscalEventType" NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "reason" TEXT NOT NULL,
    "protocol_number" TEXT,
    "xml_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "fiscal_invoice_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_calculation_rules" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "ncm_code" TEXT,
    "cfop_code" TEXT,
    "origin_state" CHAR(2),
    "dest_state" CHAR(2),
    "tax_regime" "TaxRegime",
    "product_id" UUID,
    "cst_icms" TEXT,
    "csosn_icms" TEXT,
    "icms_rate" DECIMAL(7,4),
    "icms_st_rate" DECIMAL(7,4),
    "mva_percent" DECIMAL(7,4),
    "fcp_rate" DECIMAL(7,4),
    "icms_origin" CHAR(1),
    "difal_rate" DECIMAL(7,4),
    "cst_ipi" TEXT,
    "ipi_rate" DECIMAL(7,4),
    "cst_pis" TEXT,
    "pis_rate" DECIMAL(7,4),
    "cst_cofins" TEXT,
    "cofins_rate" DECIMAL(7,4),
    "iss_rate" DECIMAL(7,4),
    "service_code" TEXT,
    "irpj_ret_rate" DECIMAL(7,4),
    "csll_ret_rate" DECIMAL(7,4),
    "pis_ret_rate" DECIMAL(7,4),
    "cofins_ret_rate" DECIMAL(7,4),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_calculation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_rejection_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "fiscal_invoice_id" UUID NOT NULL,
    "rejection_code" TEXT NOT NULL,
    "rejection_message" TEXT NOT NULL,
    "explanation" TEXT,
    "possible_cause" TEXT,
    "suggested_fix" TEXT,
    "internal_link" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiscal_rejection_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_voiding_ranges" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "model" "FiscalInvoiceModel" NOT NULL,
    "series" INTEGER NOT NULL,
    "number_from" INTEGER NOT NULL,
    "number_to" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "protocol_number" TEXT,
    "xml_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "fiscal_voiding_ranges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_time" (
    "dateKey" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "day_of_month" INTEGER NOT NULL,
    "month_name" TEXT NOT NULL,
    "weekday_name" TEXT NOT NULL,
    "is_weekend" BOOLEAN NOT NULL,
    "is_holiday" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "dim_time_pkey" PRIMARY KEY ("dateKey")
);

-- CreateTable
CREATE TABLE "fact_sales" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "date_key" INTEGER NOT NULL,
    "branch_id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "sale_item_id" UUID,
    "product_id" UUID,
    "customer_id" UUID,
    "salesperson_id" UUID,
    "category_id" UUID,
    "brand_id" UUID,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_price" DECIMAL(15,4) NOT NULL,
    "unit_cost" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "gross_revenue" DECIMAL(15,2) NOT NULL,
    "net_revenue" DECIMAL(15,2) NOT NULL,
    "gross_profit" DECIMAL(15,2) NOT NULL,
    "margin" DECIMAL(7,4) NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_purchases" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "date_key" INTEGER NOT NULL,
    "branch_id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "purchase_item_id" UUID,
    "product_id" UUID,
    "supplier_id" UUID,
    "category_id" UUID,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_cost" DECIMAL(15,4) NOT NULL,
    "total_cost" DECIMAL(15,2) NOT NULL,
    "lead_time_days" INTEGER,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_stock" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "date_key" INTEGER NOT NULL,
    "product_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "category_id" UUID,
    "quantity_on_hand" DECIMAL(15,4) NOT NULL,
    "quantity_reserved" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "average_cost" DECIMAL(15,4) NOT NULL,
    "total_value" DECIMAL(15,2) NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_financial" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "date_key" INTEGER NOT NULL,
    "paid_date_key" INTEGER,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "customer_id" UUID,
    "supplier_id" UUID,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_financial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_workshop" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "date_key" INTEGER NOT NULL,
    "closed_date_key" INTEGER,
    "service_order_id" UUID NOT NULL,
    "mechanic_id" UUID,
    "customer_id" UUID,
    "vehicle_id" UUID,
    "labor_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "parts_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "duration_hours" DECIMAL(7,2),
    "is_rework" BOOLEAN NOT NULL DEFAULT false,
    "nps_score" INTEGER,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_workshop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etl_sync_controls" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "entity" TEXT NOT NULL,
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_status" TEXT NOT NULL DEFAULT 'idle',
    "last_error" TEXT,
    "rows_processed" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etl_sync_controls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "rule_id" UUID,
    "severity" "AlertSeverity" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'active',
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "internal_link" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "acknowledged_by" UUID,
    "resolved_at" TIMESTAMP(3),
    "snoozed_until" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'warning',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "check_query" TEXT NOT NULL,
    "params" JSONB NOT NULL DEFAULT '{}',
    "internal_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" "AutomationTrigger" NOT NULL,
    "trigger_params" JSONB NOT NULL DEFAULT '{}',
    "action" "AutomationAction" NOT NULL,
    "action_params" JSONB NOT NULL DEFAULT '{}',
    "status" "AutomationStatus" NOT NULL DEFAULT 'active',
    "last_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "automation_id" UUID NOT NULL,
    "triggered_by" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_queries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "query" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "tokens_used" INTEGER,
    "model_used" TEXT,
    "latency_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_dashboards" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "layout" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_widgets" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "dashboard_id" UUID NOT NULL,
    "widget_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "position" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_definitions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_executions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "file_path" TEXT,
    "row_count" INTEGER,
    "error" TEXT,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "report_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jwt_blacklist" (
    "id" UUID NOT NULL,
    "jti" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'logout',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jwt_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "device_info" TEXT,
    "ip_address" TEXT,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factor_auth" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "secret" TEXT,
    "backup_codes" TEXT[],
    "enabled_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "two_factor_auth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_history" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lgpd_consents" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "LgpdConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "version" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lgpd_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lgpd_requests" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "LgpdRequestType" NOT NULL,
    "status" "LgpdRequestStatus" NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "file_path" TEXT,
    "processed_at" TIMESTAMP(3),
    "processed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lgpd_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_jobs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "type" "BackupType" NOT NULL,
    "status" "BackupStatus" NOT NULL DEFAULT 'running',
    "file_path" TEXT,
    "size_bytes" BIGINT,
    "checksum_sha256" TEXT,
    "is_encrypted" BOOLEAN NOT NULL DEFAULT true,
    "is_compressed" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "backup_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "PlanTier" NOT NULL,
    "description" TEXT,
    "price_monthly" DECIMAL(10,2),
    "price_yearly" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "trial_days" INTEGER NOT NULL DEFAULT 14,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_limits" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "max_users" INTEGER,
    "max_branches" INTEGER,
    "max_products" INTEGER,
    "max_customers" INTEGER,
    "max_suppliers" INTEGER,
    "max_monthly_nfes" INTEGER,
    "max_monthly_os" INTEGER,
    "max_storage_mb" INTEGER,
    "max_ai_query_month" INTEGER,
    "max_api_req_day" INTEGER,
    "max_dashboards" INTEGER,
    "max_reports" INTEGER,
    "max_plugins" INTEGER,
    "max_webhooks" INTEGER,

    CONSTRAINT "plan_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_features" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "feature" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "plan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'trial',
    "trial_ends_at" TIMESTAMP(3),
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "external_id" TEXT,
    "payment_provider" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_history" (
    "id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "from_plan_id" UUID,
    "to_plan_id" UUID,
    "performed_by" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_usage" (
    "id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "resource" TEXT NOT NULL,
    "current_value" INTEGER NOT NULL DEFAULT 0,
    "reset_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_records" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "subscription_id" UUID,
    "provider" "BillingProvider" NOT NULL DEFAULT 'manual',
    "external_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "BillingStatus" NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "invoice_url" TEXT,
    "paid_at" TIMESTAMP(3),
    "due_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" "LicenseType" NOT NULL DEFAULT 'saas_subscription',
    "status" "LicenseStatus" NOT NULL DEFAULT 'active',
    "features" TEXT[],
    "max_users" INTEGER,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "revoked_by" UUID,
    "metadata" JSONB,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_keys" (
    "id" UUID NOT NULL,
    "license_id" UUID NOT NULL,
    "key_hash" TEXT NOT NULL,
    "activated_at" TIMESTAMP(3),
    "activated_ip" TEXT,
    "hardware_id" TEXT,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "license_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_branding" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "app_name" TEXT NOT NULL DEFAULT 'AutoCore ERP',
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#0f172a',
    "secondary_color" TEXT NOT NULL DEFAULT '#3b82f6',
    "accent_color" TEXT,
    "font_family" TEXT NOT NULL DEFAULT 'Inter',
    "custom_css" TEXT,
    "login_bg_url" TEXT,
    "login_welcome" TEXT,
    "support_email" TEXT,
    "support_phone" TEXT,
    "privacy_policy_url" TEXT,
    "terms_url" TEXT,
    "custom_domain" TEXT,
    "subdomain" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "email_from_name" TEXT,
    "email_from_addr" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_branding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plugins" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "PluginCategory" NOT NULL,
    "version" TEXT NOT NULL,
    "author" TEXT,
    "logo_url" TEXT,
    "price" DECIMAL(10,2),
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "avg_rating" DECIMAL(3,2) DEFAULT 0,
    "total_installs" INTEGER NOT NULL DEFAULT 0,
    "dependencies" TEXT[],
    "required_plan" "PlanTier",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plugins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plugin_installations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "plugin_id" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "installed_by" UUID NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plugin_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "ip_whitelist" TEXT[],
    "rate_limit" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "secret" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 3,
    "timeout_ms" INTEGER NOT NULL DEFAULT 5000,
    "last_ping_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "endpoint_id" UUID NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "response_status" INTEGER,
    "response_body" TEXT,
    "duration" INTEGER,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "next_retry_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_tokens" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" "PortalType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "email" TEXT,
    "scopes" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_access_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "i18n_keys" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "pt_br" TEXT NOT NULL,
    "en_us" TEXT,
    "es_es" TEXT,
    "category" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "i18n_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copilot_sessions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "context" JSONB NOT NULL DEFAULT '{}',
    "messages" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "copilot_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_predictions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" UUID,
    "prediction" JSONB NOT NULL,
    "confidence" DECIMAL(5,4),
    "horizon" INTEGER,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_definitions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" TEXT NOT NULL,
    "trigger_params" JSONB NOT NULL DEFAULT '{}',
    "status" "WorkflowStatus" NOT NULL DEFAULT 'draft',
    "steps" JSONB NOT NULL,
    "run_count" INTEGER NOT NULL DEFAULT 0,
    "last_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_executions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "workflow_id" UUID NOT NULL,
    "triggered_by" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "steps_result" JSONB,
    "error" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "channel" "MessageChannel" NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "variables" TEXT[],
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_history" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "template_id" UUID,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'queued',
    "external_id" TEXT,
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_tickets" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'open',
    "priority" "TicketPriority" NOT NULL DEFAULT 'medium',
    "category" TEXT,
    "assigned_to" UUID,
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "help_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "help_messages" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "is_agent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "help_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "session_id" TEXT,
    "event" TEXT NOT NULL,
    "screen" TEXT,
    "duration" INTEGER,
    "metadata" JSONB,
    "app_version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetry_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setup_wizard_progress" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "steps" JSONB NOT NULL DEFAULT '{}',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setup_wizard_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "entity" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "file_path" TEXT,
    "mapping" JSONB,
    "status" "ImportStatus" NOT NULL DEFAULT 'pending',
    "total_rows" INTEGER,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "entity" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "filters" JSONB,
    "status" "ImportStatus" NOT NULL DEFAULT 'pending',
    "file_path" TEXT,
    "row_count" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_document_key" ON "tenants"("document");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE UNIQUE INDEX "companies_document_key" ON "companies"("document");

-- CreateIndex
CREATE INDEX "companies_tenant_id_idx" ON "companies"("tenant_id");

-- CreateIndex
CREATE INDEX "companies_document_idx" ON "companies"("document");

-- CreateIndex
CREATE INDEX "branches_tenant_id_idx" ON "branches"("tenant_id");

-- CreateIndex
CREATE INDEX "branches_company_id_idx" ON "branches"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "branches_company_id_code_key" ON "branches"("company_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "users_profile_id_idx" ON "users"("profile_id");

-- CreateIndex
CREATE INDEX "user_branches_branch_id_idx" ON "user_branches"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_branches_user_id_branch_id_key" ON "user_branches"("user_id", "branch_id");

-- CreateIndex
CREATE INDEX "profiles_tenant_id_idx" ON "profiles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_tenant_id_name_key" ON "profiles"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "permissions"("module");

-- CreateIndex
CREATE INDEX "profile_permissions_permission_id_idx" ON "profile_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_permissions_profile_id_permission_id_key" ON "profile_permissions"("profile_id", "permission_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_entity_entity_id_idx" ON "audit_logs"("tenant_id", "entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "system_logs_tenant_id_level_created_at_idx" ON "system_logs"("tenant_id", "level", "created_at");

-- CreateIndex
CREATE INDEX "customers_tenant_id_idx" ON "customers"("tenant_id");

-- CreateIndex
CREATE INDEX "customers_company_id_name_idx" ON "customers"("company_id", "name");

-- CreateIndex
CREATE INDEX "customers_document_idx" ON "customers"("document");

-- CreateIndex
CREATE INDEX "customers_customer_type_idx" ON "customers"("customer_type");

-- CreateIndex
CREATE INDEX "customers_credit_status_idx" ON "customers"("credit_status");

-- CreateIndex
CREATE UNIQUE INDEX "customers_company_id_document_key" ON "customers"("company_id", "document");

-- CreateIndex
CREATE INDEX "customer_contacts_tenant_id_idx" ON "customer_contacts"("tenant_id");

-- CreateIndex
CREATE INDEX "customer_contacts_customer_id_idx" ON "customer_contacts"("customer_id");

-- CreateIndex
CREATE INDEX "customer_credit_events_tenant_id_idx" ON "customer_credit_events"("tenant_id");

-- CreateIndex
CREATE INDEX "customer_credit_events_customer_id_idx" ON "customer_credit_events"("customer_id");

-- CreateIndex
CREATE INDEX "customer_addresses_tenant_id_idx" ON "customer_addresses"("tenant_id");

-- CreateIndex
CREATE INDEX "customer_addresses_customer_id_idx" ON "customer_addresses"("customer_id");

-- CreateIndex
CREATE INDEX "suppliers_tenant_id_idx" ON "suppliers"("tenant_id");

-- CreateIndex
CREATE INDEX "suppliers_company_id_name_idx" ON "suppliers"("company_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_company_id_document_key" ON "suppliers"("company_id", "document");

-- CreateIndex
CREATE INDEX "supplier_contacts_tenant_id_idx" ON "supplier_contacts"("tenant_id");

-- CreateIndex
CREATE INDEX "supplier_contacts_supplier_id_idx" ON "supplier_contacts"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_document_key" ON "employees"("document");

-- CreateIndex
CREATE INDEX "employees_tenant_id_idx" ON "employees"("tenant_id");

-- CreateIndex
CREATE INDEX "employees_company_id_idx" ON "employees"("company_id");

-- CreateIndex
CREATE INDEX "employees_branch_id_idx" ON "employees"("branch_id");

-- CreateIndex
CREATE INDEX "employees_department_id_idx" ON "employees"("department_id");

-- CreateIndex
CREATE INDEX "employee_salaries_tenant_id_idx" ON "employee_salaries"("tenant_id");

-- CreateIndex
CREATE INDEX "employee_salaries_employee_id_idx" ON "employee_salaries"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "salespersons_employee_id_key" ON "salespersons"("employee_id");

-- CreateIndex
CREATE INDEX "salespersons_tenant_id_idx" ON "salespersons"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "mechanics_employee_id_key" ON "mechanics"("employee_id");

-- CreateIndex
CREATE INDEX "mechanics_tenant_id_idx" ON "mechanics"("tenant_id");

-- CreateIndex
CREATE INDEX "mechanic_certifications_tenant_id_idx" ON "mechanic_certifications"("tenant_id");

-- CreateIndex
CREATE INDEX "mechanic_certifications_mechanic_id_idx" ON "mechanic_certifications"("mechanic_id");

-- CreateIndex
CREATE INDEX "mechanic_time_entries_tenant_id_idx" ON "mechanic_time_entries"("tenant_id");

-- CreateIndex
CREATE INDEX "mechanic_time_entries_mechanic_id_idx" ON "mechanic_time_entries"("mechanic_id");

-- CreateIndex
CREATE INDEX "carriers_tenant_id_idx" ON "carriers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "carriers_company_id_document_key" ON "carriers"("company_id", "document");

-- CreateIndex
CREATE INDEX "carrier_freight_tables_tenant_id_idx" ON "carrier_freight_tables"("tenant_id");

-- CreateIndex
CREATE INDEX "carrier_freight_tables_carrier_id_idx" ON "carrier_freight_tables"("carrier_id");

-- CreateIndex
CREATE INDEX "carrier_vehicles_tenant_id_idx" ON "carrier_vehicles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "carrier_vehicles_carrier_id_plate_key" ON "carrier_vehicles"("carrier_id", "plate");

-- CreateIndex
CREATE INDEX "carrier_drivers_tenant_id_idx" ON "carrier_drivers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_makes_name_key" ON "vehicle_makes"("name");

-- CreateIndex
CREATE INDEX "vehicle_models_make_id_idx" ON "vehicle_models"("make_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_models_make_id_name_key" ON "vehicle_models"("make_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "engines_code_key" ON "engines"("code");

-- CreateIndex
CREATE UNIQUE INDEX "fuel_types_kind_key" ON "fuel_types"("kind");

-- CreateIndex
CREATE INDEX "vehicle_versions_model_id_idx" ON "vehicle_versions"("model_id");

-- CreateIndex
CREATE INDEX "vehicle_versions_year_start_year_end_idx" ON "vehicle_versions"("year_start", "year_end");

-- CreateIndex
CREATE INDEX "customer_vehicles_tenant_id_idx" ON "customer_vehicles"("tenant_id");

-- CreateIndex
CREATE INDEX "customer_vehicles_customer_id_idx" ON "customer_vehicles"("customer_id");

-- CreateIndex
CREATE INDEX "customer_vehicles_plate_idx" ON "customer_vehicles"("plate");

-- CreateIndex
CREATE INDEX "customer_vehicles_chassis_idx" ON "customer_vehicles"("chassis");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturers_name_key" ON "manufacturers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "units_code_key" ON "units"("code");

-- CreateIndex
CREATE INDEX "product_groups_tenant_id_idx" ON "product_groups"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_groups_tenant_id_name_key" ON "product_groups"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "product_categories_tenant_id_idx" ON "product_categories"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_tenant_id_name_key" ON "product_categories"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "product_subgroups_tenant_id_idx" ON "product_subgroups"("tenant_id");

-- CreateIndex
CREATE INDEX "product_subgroups_group_id_idx" ON "product_subgroups"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_subgroups_group_id_name_key" ON "product_subgroups"("group_id", "name");

-- CreateIndex
CREATE INDEX "products_tenant_id_idx" ON "products"("tenant_id");

-- CreateIndex
CREATE INDEX "products_tenant_id_barcode_idx" ON "products"("tenant_id", "barcode");

-- CreateIndex
CREATE INDEX "products_tenant_id_manufacturer_code_idx" ON "products"("tenant_id", "manufacturer_code");

-- CreateIndex
CREATE INDEX "products_tenant_id_original_code_idx" ON "products"("tenant_id", "original_code");

-- CreateIndex
CREATE INDEX "products_tenant_id_short_description_idx" ON "products"("tenant_id", "short_description");

-- CreateIndex
CREATE INDEX "products_brand_id_idx" ON "products"("brand_id");

-- CreateIndex
CREATE INDEX "products_group_id_idx" ON "products"("group_id");

-- CreateIndex
CREATE INDEX "products_subgroup_id_idx" ON "products"("subgroup_id");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_ncm_code_idx" ON "products"("ncm_code");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenant_id_internal_code_key" ON "products"("tenant_id", "internal_code");

-- CreateIndex
CREATE INDEX "product_photos_tenant_id_idx" ON "product_photos"("tenant_id");

-- CreateIndex
CREATE INDEX "product_photos_product_id_idx" ON "product_photos"("product_id");

-- CreateIndex
CREATE INDEX "product_suppliers_tenant_id_idx" ON "product_suppliers"("tenant_id");

-- CreateIndex
CREATE INDEX "product_suppliers_supplier_id_idx" ON "product_suppliers"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_suppliers_product_id_supplier_id_key" ON "product_suppliers"("product_id", "supplier_id");

-- CreateIndex
CREATE INDEX "product_cross_references_tenant_id_idx" ON "product_cross_references"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_cross_references_product_id_related_product_id_type_key" ON "product_cross_references"("product_id", "related_product_id", "type");

-- CreateIndex
CREATE INDEX "product_vehicle_applications_tenant_id_idx" ON "product_vehicle_applications"("tenant_id");

-- CreateIndex
CREATE INDEX "product_vehicle_applications_vehicle_version_id_idx" ON "product_vehicle_applications"("vehicle_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_vehicle_applications_product_id_vehicle_version_id__key" ON "product_vehicle_applications"("product_id", "vehicle_version_id", "position");

-- CreateIndex
CREATE INDEX "product_promotions_tenant_id_idx" ON "product_promotions"("tenant_id");

-- CreateIndex
CREATE INDEX "product_promotions_product_id_start_date_end_date_idx" ON "product_promotions"("product_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "warehouses_tenant_id_idx" ON "warehouses"("tenant_id");

-- CreateIndex
CREATE INDEX "warehouses_branch_id_idx" ON "warehouses"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_branch_id_code_key" ON "warehouses"("branch_id", "code");

-- CreateIndex
CREATE INDEX "aisles_tenant_id_idx" ON "aisles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "aisles_warehouse_id_code_key" ON "aisles"("warehouse_id", "code");

-- CreateIndex
CREATE INDEX "streets_tenant_id_idx" ON "streets"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "streets_aisle_id_code_key" ON "streets"("aisle_id", "code");

-- CreateIndex
CREATE INDEX "shelves_tenant_id_idx" ON "shelves"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "shelves_street_id_code_key" ON "shelves"("street_id", "code");

-- CreateIndex
CREATE INDEX "storage_locations_tenant_id_idx" ON "storage_locations"("tenant_id");

-- CreateIndex
CREATE INDEX "storage_locations_full_address_idx" ON "storage_locations"("full_address");

-- CreateIndex
CREATE UNIQUE INDEX "storage_locations_shelf_id_level_position_key" ON "storage_locations"("shelf_id", "level", "position");

-- CreateIndex
CREATE INDEX "stock_by_location_tenant_id_idx" ON "stock_by_location"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_by_location_product_id_location_id_key" ON "stock_by_location"("product_id", "location_id");

-- CreateIndex
CREATE INDEX "stocks_tenant_id_idx" ON "stocks"("tenant_id");

-- CreateIndex
CREATE INDEX "stocks_warehouse_id_idx" ON "stocks"("warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_product_id_warehouse_id_key" ON "stocks"("product_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "stock_movements_tenant_id_idx" ON "stock_movements"("tenant_id");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_warehouse_id_idx" ON "stock_movements"("product_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "stock_movements_document_type_document_id_idx" ON "stock_movements"("document_type", "document_id");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- CreateIndex
CREATE INDEX "product_batches_tenant_id_idx" ON "product_batches"("tenant_id");

-- CreateIndex
CREATE INDEX "product_batches_expires_at_idx" ON "product_batches"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_batches_product_id_batch_number_key" ON "product_batches"("product_id", "batch_number");

-- CreateIndex
CREATE INDEX "product_serials_tenant_id_idx" ON "product_serials"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_serials_product_id_serial_number_key" ON "product_serials"("product_id", "serial_number");

-- CreateIndex
CREATE INDEX "inventories_tenant_id_idx" ON "inventories"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventories_warehouse_id_code_key" ON "inventories"("warehouse_id", "code");

-- CreateIndex
CREATE INDEX "inventory_items_tenant_id_idx" ON "inventory_items"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_inventory_id_product_id_key" ON "inventory_items"("inventory_id", "product_id");

-- CreateIndex
CREATE INDEX "stock_transfers_tenant_id_idx" ON "stock_transfers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfers_tenant_id_code_key" ON "stock_transfers"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "stock_transfer_items_tenant_id_idx" ON "stock_transfer_items"("tenant_id");

-- CreateIndex
CREATE INDEX "stock_transfer_items_stock_transfer_id_idx" ON "stock_transfer_items"("stock_transfer_id");

-- CreateIndex
CREATE INDEX "stock_reservations_tenant_id_idx" ON "stock_reservations"("tenant_id");

-- CreateIndex
CREATE INDEX "stock_reservations_product_id_warehouse_id_status_idx" ON "stock_reservations"("product_id", "warehouse_id", "status");

-- CreateIndex
CREATE INDEX "stock_reservations_source_type_source_id_idx" ON "stock_reservations"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "departments_tenant_id_idx" ON "departments"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_tenant_id_name_key" ON "departments"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "purchase_requests_tenant_id_idx" ON "purchase_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "purchase_requests_branch_id_idx" ON "purchase_requests"("branch_id");

-- CreateIndex
CREATE INDEX "purchase_requests_status_idx" ON "purchase_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_requests_tenant_id_code_key" ON "purchase_requests"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "purchase_request_items_tenant_id_idx" ON "purchase_request_items"("tenant_id");

-- CreateIndex
CREATE INDEX "purchase_request_items_purchase_request_id_idx" ON "purchase_request_items"("purchase_request_id");

-- CreateIndex
CREATE INDEX "purchase_quotations_tenant_id_idx" ON "purchase_quotations"("tenant_id");

-- CreateIndex
CREATE INDEX "purchase_quotations_branch_id_idx" ON "purchase_quotations"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_quotations_tenant_id_code_key" ON "purchase_quotations"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "purchase_quotation_suppliers_tenant_id_idx" ON "purchase_quotation_suppliers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_quotation_suppliers_quotation_id_supplier_id_key" ON "purchase_quotation_suppliers"("quotation_id", "supplier_id");

-- CreateIndex
CREATE INDEX "purchase_quotation_items_tenant_id_idx" ON "purchase_quotation_items"("tenant_id");

-- CreateIndex
CREATE INDEX "purchase_quotation_items_quotation_supplier_id_idx" ON "purchase_quotation_items"("quotation_supplier_id");

-- CreateIndex
CREATE INDEX "purchase_approval_rules_tenant_id_idx" ON "purchase_approval_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "purchase_approvals_tenant_id_idx" ON "purchase_approvals"("tenant_id");

-- CreateIndex
CREATE INDEX "purchase_approvals_purchase_request_id_idx" ON "purchase_approvals"("purchase_request_id");

-- CreateIndex
CREATE INDEX "purchase_approvals_purchase_order_id_idx" ON "purchase_approvals"("purchase_order_id");

-- CreateIndex
CREATE INDEX "purchase_suggestions_tenant_id_idx" ON "purchase_suggestions"("tenant_id");

-- CreateIndex
CREATE INDEX "purchase_suggestions_product_id_warehouse_id_status_idx" ON "purchase_suggestions"("product_id", "warehouse_id", "status");

-- CreateIndex
CREATE INDEX "purchase_orders_tenant_id_idx" ON "purchase_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "purchase_orders_branch_id_idx" ON "purchase_orders"("branch_id");

-- CreateIndex
CREATE INDEX "purchase_orders_supplier_id_idx" ON "purchase_orders"("supplier_id");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_tenant_id_code_key" ON "purchase_orders"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "purchase_order_items_tenant_id_idx" ON "purchase_order_items"("tenant_id");

-- CreateIndex
CREATE INDEX "purchase_order_items_purchase_order_id_idx" ON "purchase_order_items"("purchase_order_id");

-- CreateIndex
CREATE INDEX "purchase_order_items_product_id_idx" ON "purchase_order_items"("product_id");

-- CreateIndex
CREATE INDEX "goods_receipts_tenant_id_idx" ON "goods_receipts"("tenant_id");

-- CreateIndex
CREATE INDEX "goods_receipts_purchase_order_id_idx" ON "goods_receipts"("purchase_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipts_tenant_id_code_key" ON "goods_receipts"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "goods_receipt_items_tenant_id_idx" ON "goods_receipt_items"("tenant_id");

-- CreateIndex
CREATE INDEX "goods_receipt_items_goods_receipt_id_idx" ON "goods_receipt_items"("goods_receipt_id");

-- CreateIndex
CREATE INDEX "quotes_tenant_id_idx" ON "quotes"("tenant_id");

-- CreateIndex
CREATE INDEX "quotes_branch_id_idx" ON "quotes"("branch_id");

-- CreateIndex
CREATE INDEX "quotes_customer_id_idx" ON "quotes"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_tenant_id_code_key" ON "quotes"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "quote_items_tenant_id_idx" ON "quote_items"("tenant_id");

-- CreateIndex
CREATE INDEX "quote_items_quote_id_idx" ON "quote_items"("quote_id");

-- CreateIndex
CREATE INDEX "sales_orders_tenant_id_idx" ON "sales_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "sales_orders_branch_id_idx" ON "sales_orders"("branch_id");

-- CreateIndex
CREATE INDEX "sales_orders_customer_id_idx" ON "sales_orders"("customer_id");

-- CreateIndex
CREATE INDEX "sales_orders_status_idx" ON "sales_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_tenant_id_code_key" ON "sales_orders"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "sales_order_items_tenant_id_idx" ON "sales_order_items"("tenant_id");

-- CreateIndex
CREATE INDEX "sales_order_items_sales_order_id_idx" ON "sales_order_items"("sales_order_id");

-- CreateIndex
CREATE INDEX "sales_tenant_id_idx" ON "sales"("tenant_id");

-- CreateIndex
CREATE INDEX "sales_branch_id_idx" ON "sales"("branch_id");

-- CreateIndex
CREATE INDEX "sales_customer_id_idx" ON "sales"("customer_id");

-- CreateIndex
CREATE INDEX "sales_status_idx" ON "sales"("status");

-- CreateIndex
CREATE INDEX "sales_issued_at_idx" ON "sales"("issued_at");

-- CreateIndex
CREATE INDEX "sales_mode_idx" ON "sales"("mode");

-- CreateIndex
CREATE UNIQUE INDEX "sales_tenant_id_code_key" ON "sales"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "sale_items_tenant_id_idx" ON "sale_items"("tenant_id");

-- CreateIndex
CREATE INDEX "sale_items_sale_id_idx" ON "sale_items"("sale_id");

-- CreateIndex
CREATE INDEX "sale_items_product_id_idx" ON "sale_items"("product_id");

-- CreateIndex
CREATE INDEX "payment_methods_tenant_id_idx" ON "payment_methods"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_tenant_id_name_key" ON "payment_methods"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "sale_payments_tenant_id_idx" ON "sale_payments"("tenant_id");

-- CreateIndex
CREATE INDEX "sale_payments_sale_id_idx" ON "sale_payments"("sale_id");

-- CreateIndex
CREATE INDEX "cash_registers_tenant_id_idx" ON "cash_registers"("tenant_id");

-- CreateIndex
CREATE INDEX "cash_registers_branch_id_idx" ON "cash_registers"("branch_id");

-- CreateIndex
CREATE INDEX "cash_movements_tenant_id_idx" ON "cash_movements"("tenant_id");

-- CreateIndex
CREATE INDEX "cash_movements_cash_register_id_idx" ON "cash_movements"("cash_register_id");

-- CreateIndex
CREATE INDEX "cash_register_reconciliations_tenant_id_idx" ON "cash_register_reconciliations"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "cash_register_reconciliations_cash_register_id_payment_meth_key" ON "cash_register_reconciliations"("cash_register_id", "payment_method_id");

-- CreateIndex
CREATE INDEX "pdv_terminals_tenant_id_idx" ON "pdv_terminals"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "pdv_terminals_tenant_id_code_key" ON "pdv_terminals"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "discount_rules_tenant_id_idx" ON "discount_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "discount_rules_scope_scope_ref_id_idx" ON "discount_rules"("scope", "scope_ref_id");

-- CreateIndex
CREATE INDEX "sale_returns_tenant_id_idx" ON "sale_returns"("tenant_id");

-- CreateIndex
CREATE INDEX "sale_returns_sale_id_idx" ON "sale_returns"("sale_id");

-- CreateIndex
CREATE INDEX "sale_return_items_tenant_id_idx" ON "sale_return_items"("tenant_id");

-- CreateIndex
CREATE INDEX "sale_return_items_sale_return_id_idx" ON "sale_return_items"("sale_return_id");

-- CreateIndex
CREATE INDEX "cost_centers_tenant_id_idx" ON "cost_centers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "cost_centers_company_id_code_key" ON "cost_centers"("company_id", "code");

-- CreateIndex
CREATE INDEX "chart_of_accounts_tenant_id_idx" ON "chart_of_accounts"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_company_id_code_key" ON "chart_of_accounts"("company_id", "code");

-- CreateIndex
CREATE INDEX "bank_accounts_tenant_id_idx" ON "bank_accounts"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "banks_febraban_key" ON "banks"("febraban");

-- CreateIndex
CREATE INDEX "bank_account_pix_keys_tenant_id_idx" ON "bank_account_pix_keys"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_account_pix_keys_bank_account_id_value_key" ON "bank_account_pix_keys"("bank_account_id", "value");

-- CreateIndex
CREATE INDEX "bank_statement_entries_tenant_id_idx" ON "bank_statement_entries"("tenant_id");

-- CreateIndex
CREATE INDEX "bank_statement_entries_bank_account_id_status_idx" ON "bank_statement_entries"("bank_account_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "bank_statement_entries_bank_account_id_external_id_key" ON "bank_statement_entries"("bank_account_id", "external_id");

-- CreateIndex
CREATE INDEX "bank_reconciliations_tenant_id_idx" ON "bank_reconciliations"("tenant_id");

-- CreateIndex
CREATE INDEX "bank_reconciliation_items_tenant_id_idx" ON "bank_reconciliation_items"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "pix_charges_tx_id_key" ON "pix_charges"("tx_id");

-- CreateIndex
CREATE INDEX "pix_charges_tenant_id_idx" ON "pix_charges"("tenant_id");

-- CreateIndex
CREATE INDEX "bank_slips_tenant_id_idx" ON "bank_slips"("tenant_id");

-- CreateIndex
CREATE INDEX "card_operators_tenant_id_idx" ON "card_operators"("tenant_id");

-- CreateIndex
CREATE INDEX "card_transactions_tenant_id_idx" ON "card_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "card_transactions_status_expected_settlement_date_idx" ON "card_transactions"("status", "expected_settlement_date");

-- CreateIndex
CREATE INDEX "accounts_payable_tenant_id_idx" ON "accounts_payable"("tenant_id");

-- CreateIndex
CREATE INDEX "accounts_payable_company_id_idx" ON "accounts_payable"("company_id");

-- CreateIndex
CREATE INDEX "accounts_payable_supplier_id_idx" ON "accounts_payable"("supplier_id");

-- CreateIndex
CREATE INDEX "accounts_payable_status_due_date_idx" ON "accounts_payable"("status", "due_date");

-- CreateIndex
CREATE INDEX "accounts_receivable_tenant_id_idx" ON "accounts_receivable"("tenant_id");

-- CreateIndex
CREATE INDEX "accounts_receivable_company_id_idx" ON "accounts_receivable"("company_id");

-- CreateIndex
CREATE INDEX "accounts_receivable_customer_id_idx" ON "accounts_receivable"("customer_id");

-- CreateIndex
CREATE INDEX "accounts_receivable_status_due_date_idx" ON "accounts_receivable"("status", "due_date");

-- CreateIndex
CREATE INDEX "commissions_tenant_id_idx" ON "commissions"("tenant_id");

-- CreateIndex
CREATE INDEX "commissions_salesperson_id_idx" ON "commissions"("salesperson_id");

-- CreateIndex
CREATE INDEX "commissions_mechanic_id_idx" ON "commissions"("mechanic_id");

-- CreateIndex
CREATE INDEX "commissions_status_idx" ON "commissions"("status");

-- CreateIndex
CREATE INDEX "cost_center_allocations_tenant_id_idx" ON "cost_center_allocations"("tenant_id");

-- CreateIndex
CREATE INDEX "commission_rules_tenant_id_idx" ON "commission_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "commission_rules_scope_scope_ref_id_idx" ON "commission_rules"("scope", "scope_ref_id");

-- CreateIndex
CREATE INDEX "financial_projections_tenant_id_idx" ON "financial_projections"("tenant_id");

-- CreateIndex
CREATE INDEX "services_tenant_id_idx" ON "services"("tenant_id");

-- CreateIndex
CREATE INDEX "services_category_idx" ON "services"("category");

-- CreateIndex
CREATE UNIQUE INDEX "services_tenant_id_name_key" ON "services"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "service_boxes_tenant_id_idx" ON "service_boxes"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_boxes_tenant_id_branch_id_code_key" ON "service_boxes"("tenant_id", "branch_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_appointment_id_key" ON "service_orders"("appointment_id");

-- CreateIndex
CREATE INDEX "service_orders_tenant_id_idx" ON "service_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "service_orders_branch_id_idx" ON "service_orders"("branch_id");

-- CreateIndex
CREATE INDEX "service_orders_customer_id_idx" ON "service_orders"("customer_id");

-- CreateIndex
CREATE INDEX "service_orders_vehicle_id_idx" ON "service_orders"("vehicle_id");

-- CreateIndex
CREATE INDEX "service_orders_status_idx" ON "service_orders"("status");

-- CreateIndex
CREATE INDEX "service_orders_priority_idx" ON "service_orders"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_tenant_id_code_key" ON "service_orders"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "service_order_status_history_tenant_id_idx" ON "service_order_status_history"("tenant_id");

-- CreateIndex
CREATE INDEX "service_order_status_history_service_order_id_idx" ON "service_order_status_history"("service_order_id");

-- CreateIndex
CREATE INDEX "service_order_services_tenant_id_idx" ON "service_order_services"("tenant_id");

-- CreateIndex
CREATE INDEX "service_order_services_service_order_id_idx" ON "service_order_services"("service_order_id");

-- CreateIndex
CREATE INDEX "service_order_parts_tenant_id_idx" ON "service_order_parts"("tenant_id");

-- CreateIndex
CREATE INDEX "service_order_parts_service_order_id_idx" ON "service_order_parts"("service_order_id");

-- CreateIndex
CREATE INDEX "checklist_templates_tenant_id_idx" ON "checklist_templates"("tenant_id");

-- CreateIndex
CREATE INDEX "checklist_template_items_tenant_id_idx" ON "checklist_template_items"("tenant_id");

-- CreateIndex
CREATE INDEX "service_order_checklists_tenant_id_idx" ON "service_order_checklists"("tenant_id");

-- CreateIndex
CREATE INDEX "service_order_checklists_service_order_id_idx" ON "service_order_checklists"("service_order_id");

-- CreateIndex
CREATE INDEX "service_order_checklist_items_tenant_id_idx" ON "service_order_checklist_items"("tenant_id");

-- CreateIndex
CREATE INDEX "warranties_tenant_id_idx" ON "warranties"("tenant_id");

-- CreateIndex
CREATE INDEX "warranties_service_order_id_idx" ON "warranties"("service_order_id");

-- CreateIndex
CREATE INDEX "warranties_status_end_date_idx" ON "warranties"("status", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "service_order_check_ins_service_order_id_key" ON "service_order_check_ins"("service_order_id");

-- CreateIndex
CREATE INDEX "service_order_check_ins_tenant_id_idx" ON "service_order_check_ins"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_order_deliveries_service_order_id_key" ON "service_order_deliveries"("service_order_id");

-- CreateIndex
CREATE INDEX "service_order_deliveries_tenant_id_idx" ON "service_order_deliveries"("tenant_id");

-- CreateIndex
CREATE INDEX "workshop_appointments_tenant_id_idx" ON "workshop_appointments"("tenant_id");

-- CreateIndex
CREATE INDEX "workshop_appointments_branch_id_idx" ON "workshop_appointments"("branch_id");

-- CreateIndex
CREATE INDEX "workshop_appointments_scheduled_at_idx" ON "workshop_appointments"("scheduled_at");

-- CreateIndex
CREATE INDEX "workshop_appointments_mechanic_id_idx" ON "workshop_appointments"("mechanic_id");

-- CreateIndex
CREATE INDEX "workshop_appointments_box_id_idx" ON "workshop_appointments"("box_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_satisfaction_surveys_service_order_id_key" ON "customer_satisfaction_surveys"("service_order_id");

-- CreateIndex
CREATE INDEX "customer_satisfaction_surveys_tenant_id_idx" ON "customer_satisfaction_surveys"("tenant_id");

-- CreateIndex
CREATE INDEX "service_follow_ups_tenant_id_idx" ON "service_follow_ups"("tenant_id");

-- CreateIndex
CREATE INDEX "service_follow_ups_dueDate_status_idx" ON "service_follow_ups"("dueDate", "status");

-- CreateIndex
CREATE INDEX "attachments_tenant_id_idx" ON "attachments"("tenant_id");

-- CreateIndex
CREATE INDEX "attachments_entity_entity_id_idx" ON "attachments"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "data_consents_tenant_id_idx" ON "data_consents"("tenant_id");

-- CreateIndex
CREATE INDEX "data_consents_customer_id_idx" ON "data_consents"("customer_id");

-- CreateIndex
CREATE INDEX "data_consents_supplier_id_idx" ON "data_consents"("supplier_id");

-- CreateIndex
CREATE INDEX "data_subject_requests_tenant_id_idx" ON "data_subject_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "data_subject_requests_customer_id_idx" ON "data_subject_requests"("customer_id");

-- CreateIndex
CREATE INDEX "leads_tenant_id_idx" ON "leads"("tenant_id");

-- CreateIndex
CREATE INDEX "leads_company_id_idx" ON "leads"("company_id");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "interactions_tenant_id_idx" ON "interactions"("tenant_id");

-- CreateIndex
CREATE INDEX "interactions_customer_id_idx" ON "interactions"("customer_id");

-- CreateIndex
CREATE INDEX "interactions_lead_id_idx" ON "interactions"("lead_id");

-- CreateIndex
CREATE INDEX "appointments_tenant_id_idx" ON "appointments"("tenant_id");

-- CreateIndex
CREATE INDEX "appointments_branch_id_idx" ON "appointments"("branch_id");

-- CreateIndex
CREATE INDEX "appointments_scheduled_at_idx" ON "appointments"("scheduled_at");

-- CreateIndex
CREATE INDEX "crm_pipeline_stages_tenant_id_idx" ON "crm_pipeline_stages"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_pipeline_stages_tenant_id_name_key" ON "crm_pipeline_stages"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "crm_opportunities_tenant_id_idx" ON "crm_opportunities"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_opportunities_pipeline_stage_id_idx" ON "crm_opportunities"("pipeline_stage_id");

-- CreateIndex
CREATE INDEX "crm_opportunities_customer_id_idx" ON "crm_opportunities"("customer_id");

-- CreateIndex
CREATE INDEX "crm_tasks_tenant_id_idx" ON "crm_tasks"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_tasks_opportunity_id_idx" ON "crm_tasks"("opportunity_id");

-- CreateIndex
CREATE INDEX "crm_tasks_assigned_to_status_idx" ON "crm_tasks"("assigned_to", "status");

-- CreateIndex
CREATE INDEX "crm_tags_tenant_id_idx" ON "crm_tags"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_tags_tenant_id_name_key" ON "crm_tags"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "crm_tag_assignments_tenant_id_idx" ON "crm_tag_assignments"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_tag_assignments_tag_id_opportunity_id_key" ON "crm_tag_assignments"("tag_id", "opportunity_id");

-- CreateIndex
CREATE INDEX "crm_campaigns_tenant_id_idx" ON "crm_campaigns"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_campaign_members_tenant_id_idx" ON "crm_campaign_members"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_campaign_members_campaign_id_idx" ON "crm_campaign_members"("campaign_id");

-- CreateIndex
CREATE INDEX "support_tickets_tenant_id_idx" ON "support_tickets"("tenant_id");

-- CreateIndex
CREATE INDEX "support_tickets_customer_id_idx" ON "support_tickets"("customer_id");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_idx" ON "notifications"("tenant_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "ai_prompt_templates_tenant_id_key_key" ON "ai_prompt_templates"("tenant_id", "key");

-- CreateIndex
CREATE INDEX "ai_interactions_tenant_id_idx" ON "ai_interactions"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_interactions_user_id_idx" ON "ai_interactions"("user_id");

-- CreateIndex
CREATE INDEX "ai_interactions_created_at_idx" ON "ai_interactions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_feedback_interaction_id_key" ON "ai_feedback"("interaction_id");

-- CreateIndex
CREATE INDEX "ai_feedback_tenant_id_idx" ON "ai_feedback"("tenant_id");

-- CreateIndex
CREATE INDEX "tax_rules_tenant_id_idx" ON "tax_rules"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tax_rules_tenant_id_origin_state_dest_state_ncm_code_key" ON "tax_rules"("tenant_id", "origin_state", "dest_state", "ncm_code");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_configurations_branch_id_key" ON "fiscal_configurations"("branch_id");

-- CreateIndex
CREATE INDEX "fiscal_configurations_tenant_id_idx" ON "fiscal_configurations"("tenant_id");

-- CreateIndex
CREATE INDEX "fiscal_certificates_tenant_id_idx" ON "fiscal_certificates"("tenant_id");

-- CreateIndex
CREATE INDEX "fiscal_certificates_company_id_idx" ON "fiscal_certificates"("company_id");

-- CreateIndex
CREATE INDEX "fiscal_certificates_valid_until_idx" ON "fiscal_certificates"("valid_until");

-- CreateIndex
CREATE INDEX "fiscal_series_tenant_id_idx" ON "fiscal_series"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_series_branch_id_model_series_key" ON "fiscal_series"("branch_id", "model", "series");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_invoices_access_key_key" ON "fiscal_invoices"("access_key");

-- CreateIndex
CREATE INDEX "fiscal_invoices_tenant_id_idx" ON "fiscal_invoices"("tenant_id");

-- CreateIndex
CREATE INDEX "fiscal_invoices_branch_id_idx" ON "fiscal_invoices"("branch_id");

-- CreateIndex
CREATE INDEX "fiscal_invoices_status_idx" ON "fiscal_invoices"("status");

-- CreateIndex
CREATE INDEX "fiscal_invoices_access_key_idx" ON "fiscal_invoices"("access_key");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_invoices_branch_id_model_series_number_key" ON "fiscal_invoices"("branch_id", "model", "series", "number");

-- CreateIndex
CREATE INDEX "fiscal_invoice_items_tenant_id_idx" ON "fiscal_invoice_items"("tenant_id");

-- CreateIndex
CREATE INDEX "fiscal_invoice_items_fiscal_invoice_id_idx" ON "fiscal_invoice_items"("fiscal_invoice_id");

-- CreateIndex
CREATE INDEX "fiscal_invoice_events_tenant_id_idx" ON "fiscal_invoice_events"("tenant_id");

-- CreateIndex
CREATE INDEX "fiscal_invoice_events_fiscal_invoice_id_idx" ON "fiscal_invoice_events"("fiscal_invoice_id");

-- CreateIndex
CREATE INDEX "tax_calculation_rules_tenant_id_idx" ON "tax_calculation_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "tax_calculation_rules_ncm_code_idx" ON "tax_calculation_rules"("ncm_code");

-- CreateIndex
CREATE INDEX "tax_calculation_rules_priority_idx" ON "tax_calculation_rules"("priority");

-- CreateIndex
CREATE INDEX "fiscal_rejection_logs_tenant_id_idx" ON "fiscal_rejection_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "fiscal_rejection_logs_rejection_code_idx" ON "fiscal_rejection_logs"("rejection_code");

-- CreateIndex
CREATE INDEX "fiscal_voiding_ranges_tenant_id_idx" ON "fiscal_voiding_ranges"("tenant_id");

-- CreateIndex
CREATE INDEX "fiscal_voiding_ranges_branch_id_model_series_idx" ON "fiscal_voiding_ranges"("branch_id", "model", "series");

-- CreateIndex
CREATE INDEX "fact_sales_tenant_id_date_key_idx" ON "fact_sales"("tenant_id", "date_key");

-- CreateIndex
CREATE INDEX "fact_sales_tenant_id_product_id_idx" ON "fact_sales"("tenant_id", "product_id");

-- CreateIndex
CREATE INDEX "fact_sales_tenant_id_customer_id_idx" ON "fact_sales"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "fact_sales_tenant_id_branch_id_date_key_idx" ON "fact_sales"("tenant_id", "branch_id", "date_key");

-- CreateIndex
CREATE UNIQUE INDEX "fact_sales_tenant_id_sale_item_id_key" ON "fact_sales"("tenant_id", "sale_item_id");

-- CreateIndex
CREATE INDEX "fact_purchases_tenant_id_date_key_idx" ON "fact_purchases"("tenant_id", "date_key");

-- CreateIndex
CREATE INDEX "fact_purchases_tenant_id_supplier_id_idx" ON "fact_purchases"("tenant_id", "supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "fact_purchases_tenant_id_purchase_item_id_key" ON "fact_purchases"("tenant_id", "purchase_item_id");

-- CreateIndex
CREATE INDEX "fact_stock_tenant_id_date_key_idx" ON "fact_stock"("tenant_id", "date_key");

-- CreateIndex
CREATE INDEX "fact_stock_tenant_id_product_id_idx" ON "fact_stock"("tenant_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "fact_stock_tenant_id_date_key_product_id_warehouse_id_key" ON "fact_stock"("tenant_id", "date_key", "product_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "fact_financial_tenant_id_date_key_idx" ON "fact_financial"("tenant_id", "date_key");

-- CreateIndex
CREATE INDEX "fact_financial_tenant_id_type_status_idx" ON "fact_financial"("tenant_id", "type", "status");

-- CreateIndex
CREATE INDEX "fact_workshop_tenant_id_date_key_idx" ON "fact_workshop"("tenant_id", "date_key");

-- CreateIndex
CREATE INDEX "fact_workshop_tenant_id_mechanic_id_idx" ON "fact_workshop"("tenant_id", "mechanic_id");

-- CreateIndex
CREATE UNIQUE INDEX "fact_workshop_tenant_id_service_order_id_key" ON "fact_workshop"("tenant_id", "service_order_id");

-- CreateIndex
CREATE INDEX "etl_sync_controls_tenant_id_idx" ON "etl_sync_controls"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "etl_sync_controls_tenant_id_entity_key" ON "etl_sync_controls"("tenant_id", "entity");

-- CreateIndex
CREATE INDEX "alerts_tenant_id_status_idx" ON "alerts"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "alerts_tenant_id_severity_status_idx" ON "alerts"("tenant_id", "severity", "status");

-- CreateIndex
CREATE INDEX "alert_rules_tenant_id_idx" ON "alert_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "automations_tenant_id_idx" ON "automations"("tenant_id");

-- CreateIndex
CREATE INDEX "automations_trigger_idx" ON "automations"("trigger");

-- CreateIndex
CREATE INDEX "automation_logs_tenant_id_automation_id_idx" ON "automation_logs"("tenant_id", "automation_id");

-- CreateIndex
CREATE INDEX "ai_queries_tenant_id_user_id_idx" ON "ai_queries"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "custom_dashboards_tenant_id_user_id_idx" ON "custom_dashboards"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "dashboard_widgets_tenant_id_dashboard_id_idx" ON "dashboard_widgets"("tenant_id", "dashboard_id");

-- CreateIndex
CREATE INDEX "report_definitions_tenant_id_user_id_idx" ON "report_definitions"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "report_executions_tenant_id_user_id_idx" ON "report_executions"("tenant_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "jwt_blacklist_jti_key" ON "jwt_blacklist"("jti");

-- CreateIndex
CREATE INDEX "jwt_blacklist_jti_idx" ON "jwt_blacklist"("jti");

-- CreateIndex
CREATE INDEX "jwt_blacklist_expires_at_idx" ON "jwt_blacklist"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_is_revoked_idx" ON "refresh_tokens"("user_id", "is_revoked");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_auth_user_id_key" ON "two_factor_auth"("user_id");

-- CreateIndex
CREATE INDEX "two_factor_auth_user_id_idx" ON "two_factor_auth"("user_id");

-- CreateIndex
CREATE INDEX "password_history_user_id_created_at_idx" ON "password_history"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "login_attempts_identifier_created_at_idx" ON "login_attempts"("identifier", "created_at");

-- CreateIndex
CREATE INDEX "login_attempts_ip_address_created_at_idx" ON "login_attempts"("ip_address", "created_at");

-- CreateIndex
CREATE INDEX "lgpd_consents_tenant_id_user_id_idx" ON "lgpd_consents"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "lgpd_consents_tenant_id_type_idx" ON "lgpd_consents"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "lgpd_requests_tenant_id_user_id_idx" ON "lgpd_requests"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "lgpd_requests_status_idx" ON "lgpd_requests"("status");

-- CreateIndex
CREATE INDEX "backup_jobs_type_status_idx" ON "backup_jobs"("type", "status");

-- CreateIndex
CREATE INDEX "backup_jobs_started_at_idx" ON "backup_jobs"("started_at");

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "plan_limits_plan_id_key" ON "plan_limits"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_features_plan_id_feature_key" ON "plan_features"("plan_id", "feature");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_tenant_id_key" ON "subscriptions"("tenant_id");

-- CreateIndex
CREATE INDEX "subscriptions_tenant_id_idx" ON "subscriptions"("tenant_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscription_history_tenant_id_idx" ON "subscription_history"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_usage_tenant_id_resource_key" ON "subscription_usage"("tenant_id", "resource");

-- CreateIndex
CREATE INDEX "billing_records_tenant_id_idx" ON "billing_records"("tenant_id");

-- CreateIndex
CREATE INDEX "billing_records_provider_external_id_idx" ON "billing_records"("provider", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_tenant_id_key" ON "licenses"("tenant_id");

-- CreateIndex
CREATE INDEX "licenses_status_idx" ON "licenses"("status");

-- CreateIndex
CREATE UNIQUE INDEX "license_keys_key_hash_key" ON "license_keys"("key_hash");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_branding_tenant_id_key" ON "tenant_branding"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_branding_subdomain_key" ON "tenant_branding"("subdomain");

-- CreateIndex
CREATE INDEX "tenant_branding_subdomain_idx" ON "tenant_branding"("subdomain");

-- CreateIndex
CREATE INDEX "tenant_branding_custom_domain_idx" ON "tenant_branding"("custom_domain");

-- CreateIndex
CREATE UNIQUE INDEX "plugins_slug_key" ON "plugins"("slug");

-- CreateIndex
CREATE INDEX "plugin_installations_tenant_id_idx" ON "plugin_installations"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "plugin_installations_tenant_id_plugin_id_key" ON "plugin_installations"("tenant_id", "plugin_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_tenant_id_idx" ON "api_keys"("tenant_id");

-- CreateIndex
CREATE INDEX "api_keys_key_hash_idx" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "webhook_endpoints_tenant_id_idx" ON "webhook_endpoints"("tenant_id");

-- CreateIndex
CREATE INDEX "webhook_deliveries_tenant_id_event_idx" ON "webhook_deliveries"("tenant_id", "event");

-- CreateIndex
CREATE INDEX "webhook_deliveries_endpoint_id_created_at_idx" ON "webhook_deliveries"("endpoint_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "portal_tokens_token_hash_key" ON "portal_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "portal_tokens_tenant_id_type_idx" ON "portal_tokens"("tenant_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "i18n_keys_key_key" ON "i18n_keys"("key");

-- CreateIndex
CREATE INDEX "copilot_sessions_tenant_id_user_id_idx" ON "copilot_sessions"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "ai_predictions_tenant_id_type_idx" ON "ai_predictions"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "ai_predictions_tenant_id_entity_id_idx" ON "ai_predictions"("tenant_id", "entity_id");

-- CreateIndex
CREATE INDEX "workflow_definitions_tenant_id_idx" ON "workflow_definitions"("tenant_id");

-- CreateIndex
CREATE INDEX "workflow_executions_tenant_id_workflow_id_idx" ON "workflow_executions"("tenant_id", "workflow_id");

-- CreateIndex
CREATE INDEX "message_templates_tenant_id_channel_idx" ON "message_templates"("tenant_id", "channel");

-- CreateIndex
CREATE INDEX "message_history_tenant_id_channel_status_idx" ON "message_history"("tenant_id", "channel", "status");

-- CreateIndex
CREATE INDEX "help_tickets_tenant_id_status_idx" ON "help_tickets"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "help_messages_ticket_id_idx" ON "help_messages"("ticket_id");

-- CreateIndex
CREATE INDEX "telemetry_events_tenant_id_event_idx" ON "telemetry_events"("tenant_id", "event");

-- CreateIndex
CREATE INDEX "telemetry_events_created_at_idx" ON "telemetry_events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "setup_wizard_progress_tenant_id_key" ON "setup_wizard_progress"("tenant_id");

-- CreateIndex
CREATE INDEX "import_jobs_tenant_id_idx" ON "import_jobs"("tenant_id");

-- CreateIndex
CREATE INDEX "export_jobs_tenant_id_idx" ON "export_jobs"("tenant_id");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_permissions" ADD CONSTRAINT "profile_permissions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_permissions" ADD CONSTRAINT "profile_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credit_events" ADD CONSTRAINT "customer_credit_events_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_contacts" ADD CONSTRAINT "supplier_contacts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_salaries" ADD CONSTRAINT "employee_salaries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salespersons" ADD CONSTRAINT "salespersons_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mechanics" ADD CONSTRAINT "mechanics_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mechanic_certifications" ADD CONSTRAINT "mechanic_certifications_mechanic_id_fkey" FOREIGN KEY ("mechanic_id") REFERENCES "mechanics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mechanic_time_entries" ADD CONSTRAINT "mechanic_time_entries_mechanic_id_fkey" FOREIGN KEY ("mechanic_id") REFERENCES "mechanics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mechanic_time_entries" ADD CONSTRAINT "mechanic_time_entries_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carriers" ADD CONSTRAINT "carriers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_freight_tables" ADD CONSTRAINT "carrier_freight_tables_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_vehicles" ADD CONSTRAINT "carrier_vehicles_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_drivers" ADD CONSTRAINT "carrier_drivers_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_make_id_fkey" FOREIGN KEY ("make_id") REFERENCES "vehicle_makes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_versions" ADD CONSTRAINT "vehicle_versions_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "vehicle_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_versions" ADD CONSTRAINT "vehicle_versions_engine_id_fkey" FOREIGN KEY ("engine_id") REFERENCES "engines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_versions" ADD CONSTRAINT "vehicle_versions_fuel_type_id_fkey" FOREIGN KEY ("fuel_type_id") REFERENCES "fuel_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_vehicles" ADD CONSTRAINT "customer_vehicles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_vehicles" ADD CONSTRAINT "customer_vehicles_vehicle_version_id_fkey" FOREIGN KEY ("vehicle_version_id") REFERENCES "vehicle_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_subgroups" ADD CONSTRAINT "product_subgroups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "product_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "product_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_subgroup_id_fkey" FOREIGN KEY ("subgroup_id") REFERENCES "product_subgroups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_default_location_id_fkey" FOREIGN KEY ("default_location_id") REFERENCES "storage_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_primary_supplier_id_fkey" FOREIGN KEY ("primary_supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_photos" ADD CONSTRAINT "product_photos_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_cross_references" ADD CONSTRAINT "product_cross_references_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_cross_references" ADD CONSTRAINT "product_cross_references_related_product_id_fkey" FOREIGN KEY ("related_product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_vehicle_applications" ADD CONSTRAINT "product_vehicle_applications_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_vehicle_applications" ADD CONSTRAINT "product_vehicle_applications_vehicle_version_id_fkey" FOREIGN KEY ("vehicle_version_id") REFERENCES "vehicle_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_promotions" ADD CONSTRAINT "product_promotions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aisles" ADD CONSTRAINT "aisles_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streets" ADD CONSTRAINT "streets_aisle_id_fkey" FOREIGN KEY ("aisle_id") REFERENCES "aisles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelves" ADD CONSTRAINT "shelves_street_id_fkey" FOREIGN KEY ("street_id") REFERENCES "streets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_locations" ADD CONSTRAINT "storage_locations_shelf_id_fkey" FOREIGN KEY ("shelf_id") REFERENCES "shelves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_by_location" ADD CONSTRAINT "stock_by_location_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_by_location" ADD CONSTRAINT "stock_by_location_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "storage_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "storage_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "product_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_serial_id_fkey" FOREIGN KEY ("serial_id") REFERENCES "product_serials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_serials" ADD CONSTRAINT "product_serials_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_parent_inventory_id_fkey" FOREIGN KEY ("parent_inventory_id") REFERENCES "inventories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "product_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "storage_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_origin_warehouse_id_fkey" FOREIGN KEY ("origin_warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_destination_warehouse_id_fkey" FOREIGN KEY ("destination_warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_stock_transfer_id_fkey" FOREIGN KEY ("stock_transfer_id") REFERENCES "stock_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_origin_location_id_fkey" FOREIGN KEY ("origin_location_id") REFERENCES "storage_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_destination_location_id_fkey" FOREIGN KEY ("destination_location_id") REFERENCES "storage_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_request_items_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_request_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_quotations" ADD CONSTRAINT "purchase_quotations_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_quotations" ADD CONSTRAINT "purchase_quotations_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_quotation_suppliers" ADD CONSTRAINT "purchase_quotation_suppliers_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "purchase_quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_quotation_suppliers" ADD CONSTRAINT "purchase_quotation_suppliers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_quotation_items" ADD CONSTRAINT "purchase_quotation_items_quotation_supplier_id_fkey" FOREIGN KEY ("quotation_supplier_id") REFERENCES "purchase_quotation_suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_quotation_items" ADD CONSTRAINT "purchase_quotation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_approval_rules" ADD CONSTRAINT "purchase_approval_rules_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_approvals" ADD CONSTRAINT "purchase_approvals_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_approvals" ADD CONSTRAINT "purchase_approvals_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_suggestions" ADD CONSTRAINT "purchase_suggestions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_suggestions" ADD CONSTRAINT "purchase_suggestions_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_quotation_supplier_id_fkey" FOREIGN KEY ("quotation_supplier_id") REFERENCES "purchase_quotation_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_parent_order_id_fkey" FOREIGN KEY ("parent_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_goods_receipt_id_fkey" FOREIGN KEY ("goods_receipt_id") REFERENCES "goods_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_purchase_order_item_id_fkey" FOREIGN KEY ("purchase_order_item_id") REFERENCES "purchase_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_salesperson_id_fkey" FOREIGN KEY ("salesperson_id") REFERENCES "salespersons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_salesperson_id_fkey" FOREIGN KEY ("salesperson_id") REFERENCES "salespersons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_vehicle_id_fkey" FOREIGN KEY ("customer_vehicle_id") REFERENCES "customer_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_salesperson_id_fkey" FOREIGN KEY ("salesperson_id") REFERENCES "salespersons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "pdv_terminals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "stock_reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_register_reconciliations" ADD CONSTRAINT "cash_register_reconciliations_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_register_reconciliations" ADD CONSTRAINT "cash_register_reconciliations_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdv_terminals" ADD CONSTRAINT "pdv_terminals_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_returns" ADD CONSTRAINT "sale_returns_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_return_items" ADD CONSTRAINT "sale_return_items_sale_return_id_fkey" FOREIGN KEY ("sale_return_id") REFERENCES "sale_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_return_items" ADD CONSTRAINT "sale_return_items_sale_item_id_fkey" FOREIGN KEY ("sale_item_id") REFERENCES "sale_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_return_items" ADD CONSTRAINT "sale_return_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_account_pix_keys" ADD CONSTRAINT "bank_account_pix_keys_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statement_entries" ADD CONSTRAINT "bank_statement_entries_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statement_entries" ADD CONSTRAINT "bank_statement_entries_matched_payable_id_fkey" FOREIGN KEY ("matched_payable_id") REFERENCES "accounts_payable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statement_entries" ADD CONSTRAINT "bank_statement_entries_matched_receivable_id_fkey" FOREIGN KEY ("matched_receivable_id") REFERENCES "accounts_receivable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_reconciliation_items" ADD CONSTRAINT "bank_reconciliation_items_reconciliation_id_fkey" FOREIGN KEY ("reconciliation_id") REFERENCES "bank_reconciliations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_reconciliation_items" ADD CONSTRAINT "bank_reconciliation_items_statement_entry_id_fkey" FOREIGN KEY ("statement_entry_id") REFERENCES "bank_statement_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pix_charges" ADD CONSTRAINT "pix_charges_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pix_charges" ADD CONSTRAINT "pix_charges_receivable_id_fkey" FOREIGN KEY ("receivable_id") REFERENCES "accounts_receivable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_slips" ADD CONSTRAINT "bank_slips_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_slips" ADD CONSTRAINT "bank_slips_receivable_id_fkey" FOREIGN KEY ("receivable_id") REFERENCES "accounts_receivable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_transactions" ADD CONSTRAINT "card_transactions_card_operator_id_fkey" FOREIGN KEY ("card_operator_id") REFERENCES "card_operators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_transactions" ADD CONSTRAINT "card_transactions_sale_payment_id_fkey" FOREIGN KEY ("sale_payment_id") REFERENCES "sale_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_chart_of_account_id_fkey" FOREIGN KEY ("chart_of_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "accounts_payable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_renegotiated_from_id_fkey" FOREIGN KEY ("renegotiated_from_id") REFERENCES "accounts_payable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_chart_of_account_id_fkey" FOREIGN KEY ("chart_of_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "accounts_receivable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_renegotiated_from_id_fkey" FOREIGN KEY ("renegotiated_from_id") REFERENCES "accounts_receivable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_salesperson_id_fkey" FOREIGN KEY ("salesperson_id") REFERENCES "salespersons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_mechanic_id_fkey" FOREIGN KEY ("mechanic_id") REFERENCES "mechanics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_center_allocations" ADD CONSTRAINT "cost_center_allocations_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_center_allocations" ADD CONSTRAINT "cost_center_allocations_payable_id_fkey" FOREIGN KEY ("payable_id") REFERENCES "accounts_payable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_center_allocations" ADD CONSTRAINT "cost_center_allocations_receivable_id_fkey" FOREIGN KEY ("receivable_id") REFERENCES "accounts_receivable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_projections" ADD CONSTRAINT "financial_projections_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_boxes" ADD CONSTRAINT "service_boxes_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "customer_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_mechanic_id_fkey" FOREIGN KEY ("mechanic_id") REFERENCES "mechanics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "service_boxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "workshop_appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_rework_of_id_fkey" FOREIGN KEY ("rework_of_id") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_status_history" ADD CONSTRAINT "service_order_status_history_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_services" ADD CONSTRAINT "service_order_services_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_services" ADD CONSTRAINT "service_order_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_parts" ADD CONSTRAINT "service_order_parts_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_parts" ADD CONSTRAINT "service_order_parts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_template_items" ADD CONSTRAINT "checklist_template_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_checklists" ADD CONSTRAINT "service_order_checklists_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_checklists" ADD CONSTRAINT "service_order_checklists_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_checklist_items" ADD CONSTRAINT "service_order_checklist_items_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "service_order_checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_checklist_items" ADD CONSTRAINT "service_order_checklist_items_template_item_id_fkey" FOREIGN KEY ("template_item_id") REFERENCES "checklist_template_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_check_ins" ADD CONSTRAINT "service_order_check_ins_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_deliveries" ADD CONSTRAINT "service_order_deliveries_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_deliveries" ADD CONSTRAINT "service_order_deliveries_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_appointments" ADD CONSTRAINT "workshop_appointments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_appointments" ADD CONSTRAINT "workshop_appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_appointments" ADD CONSTRAINT "workshop_appointments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "customer_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_appointments" ADD CONSTRAINT "workshop_appointments_mechanic_id_fkey" FOREIGN KEY ("mechanic_id") REFERENCES "mechanics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_appointments" ADD CONSTRAINT "workshop_appointments_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "service_boxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_appointments" ADD CONSTRAINT "workshop_appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_appointments" ADD CONSTRAINT "workshop_appointments_rescheduled_from_id_fkey" FOREIGN KEY ("rescheduled_from_id") REFERENCES "workshop_appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_satisfaction_surveys" ADD CONSTRAINT "customer_satisfaction_surveys_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_follow_ups" ADD CONSTRAINT "service_follow_ups_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_follow_ups" ADD CONSTRAINT "service_follow_ups_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_previous_version_id_fkey" FOREIGN KEY ("previous_version_id") REFERENCES "attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_consents" ADD CONSTRAINT "data_consents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_consents" ADD CONSTRAINT "data_consents_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_pipeline_stage_id_fkey" FOREIGN KEY ("pipeline_stage_id") REFERENCES "crm_pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "crm_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_tag_assignments" ADD CONSTRAINT "crm_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "crm_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_tag_assignments" ADD CONSTRAINT "crm_tag_assignments_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "crm_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_campaign_members" ADD CONSTRAINT "crm_campaign_members_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "crm_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_campaign_members" ADD CONSTRAINT "crm_campaign_members_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_campaign_members" ADD CONSTRAINT "crm_campaign_members_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_prompt_template_id_fkey" FOREIGN KEY ("prompt_template_id") REFERENCES "ai_prompt_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_interaction_id_fkey" FOREIGN KEY ("interaction_id") REFERENCES "ai_interactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_configurations" ADD CONSTRAINT "fiscal_configurations_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_configurations" ADD CONSTRAINT "fiscal_configurations_nfe_certificate_id_fkey" FOREIGN KEY ("nfe_certificate_id") REFERENCES "fiscal_certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_certificates" ADD CONSTRAINT "fiscal_certificates_renewed_from_id_fkey" FOREIGN KEY ("renewed_from_id") REFERENCES "fiscal_certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_certificates" ADD CONSTRAINT "fiscal_certificates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_series" ADD CONSTRAINT "fiscal_series_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoices" ADD CONSTRAINT "fiscal_invoices_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoices" ADD CONSTRAINT "fiscal_invoices_fiscal_series_id_fkey" FOREIGN KEY ("fiscal_series_id") REFERENCES "fiscal_series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoices" ADD CONSTRAINT "fiscal_invoices_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoices" ADD CONSTRAINT "fiscal_invoices_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoices" ADD CONSTRAINT "fiscal_invoices_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoices" ADD CONSTRAINT "fiscal_invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoices" ADD CONSTRAINT "fiscal_invoices_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoices" ADD CONSTRAINT "fiscal_invoices_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoice_items" ADD CONSTRAINT "fiscal_invoice_items_fiscal_invoice_id_fkey" FOREIGN KEY ("fiscal_invoice_id") REFERENCES "fiscal_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoice_items" ADD CONSTRAINT "fiscal_invoice_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_invoice_events" ADD CONSTRAINT "fiscal_invoice_events_fiscal_invoice_id_fkey" FOREIGN KEY ("fiscal_invoice_id") REFERENCES "fiscal_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_rejection_logs" ADD CONSTRAINT "fiscal_rejection_logs_fiscal_invoice_id_fkey" FOREIGN KEY ("fiscal_invoice_id") REFERENCES "fiscal_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_voiding_ranges" ADD CONSTRAINT "fiscal_voiding_ranges_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "alert_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_logs" ADD CONSTRAINT "automation_logs_automation_id_fkey" FOREIGN KEY ("automation_id") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_dashboard_id_fkey" FOREIGN KEY ("dashboard_id") REFERENCES "custom_dashboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_executions" ADD CONSTRAINT "report_executions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "report_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_limits" ADD CONSTRAINT "plan_limits_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_usage" ADD CONSTRAINT "subscription_usage_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plugin_installations" ADD CONSTRAINT "plugin_installations_plugin_id_fkey" FOREIGN KEY ("plugin_id") REFERENCES "plugins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_executions" ADD CONSTRAINT "workflow_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "help_messages" ADD CONSTRAINT "help_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "help_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
