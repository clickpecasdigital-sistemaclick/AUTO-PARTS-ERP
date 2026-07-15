import type { LucideIcon } from 'lucide-react';
import { PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Estado vazio reutilizável: usado quando um módulo ainda não tem registros
 * (ex: nenhuma peça cadastrada, nenhum pedido aberto). Sempre convida a uma ação.
 */
export function EmptyState({
  icon: Icon = PackageSearch,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
      <Icon className="size-10 text-muted-foreground" />
      <div className="space-y-1">
        <h3 className="font-medium">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
