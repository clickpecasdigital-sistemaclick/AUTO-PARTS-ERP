import { History as HistoryIcon, PackagePlus, Pencil, Tag, Trash2, Truck } from 'lucide-react';
import { Timeline, type TimelineItem } from '@/components/ui/timeline';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { useProductHistory } from '../../hooks/useProducts';

const actionMeta: Record<string, { label: string; icon: TimelineItem['icon']; variant: TimelineItem['variant'] }> = {
  insert: { label: 'Produto criado', icon: PackagePlus, variant: 'success' },
  update: { label: 'Cadastro alterado', icon: Pencil, variant: 'default' },
  delete: { label: 'Produto excluído', icon: Trash2, variant: 'destructive' },
  price_change: { label: 'Preço alterado', icon: Tag, variant: 'warning' },
  stock_adjustment: { label: 'Estoque ajustado', icon: Truck, variant: 'default' },
};

interface HistoryTabProps {
  productId: string;
}

/**
 * Aba 9 — Histórico: criação, alterações, mudanças de preço e de
 * fornecedor — 1:1 com a tabela `audit_logs` (Sprint 02), gravada pelo
 * `AuditService` em toda escrita do `ProductsService` (Sprint 05).
 */
export function HistoryTab({ productId }: HistoryTabProps) {
  const { data, isLoading } = useProductHistory(productId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState icon={HistoryIcon} title="Sem histórico" description="Nenhuma alteração registrada para este produto ainda." />;
  }

  const items: TimelineItem[] = data.map((entry) => {
    const meta = actionMeta[entry.action] ?? { label: entry.action, icon: HistoryIcon, variant: 'default' as const };
    return {
      id: entry.id,
      title: meta.label,
      description: entry.user?.fullName ?? entry.user?.email ?? 'Sistema',
      timestamp: new Date(entry.createdAt).toLocaleString('pt-BR'),
      icon: meta.icon,
      variant: meta.variant,
    };
  });

  return <Timeline items={items} />;
}
