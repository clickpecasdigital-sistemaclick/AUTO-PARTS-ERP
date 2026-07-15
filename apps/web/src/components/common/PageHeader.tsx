import type { ReactNode } from 'react';
import { Breadcrumb } from '@/layouts/components/Breadcrumb';
import type { BreadcrumbItem } from '@/types/navigation.types';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Override manual — por padrão o breadcrumb é gerado automaticamente a partir da rota atual (ver Breadcrumb.tsx). */
  breadcrumbs?: BreadcrumbItem[];
  /** Esconde o breadcrumb completamente (raro — ex: páginas de erro). */
  hideBreadcrumb?: boolean;
  actions?: ReactNode;
}

/**
 * Cabeçalho padrão de página de módulo: título, descrição, breadcrumb
 * (automático) e slot de ações (ex: botão "Novo registro"). Garante
 * consistência visual entre todos os módulos de negócio.
 */
export function PageHeader({ title, description, breadcrumbs, hideBreadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {!hideBreadcrumb && <Breadcrumb items={breadcrumbs} />}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
