import type { LucideIcon } from 'lucide-react';
import { Circle } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const variantClasses: Record<NonNullable<TimelineItem['variant']>, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
};

/**
 * Timeline vertical — histórico de eventos (auditoria de um registro,
 * andamento de uma Ordem de Serviço, status de uma Nota Fiscal).
 */
function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn('relative space-y-6 border-l border-border pl-6', className)}>
      {items.map((item) => {
        const Icon = item.icon ?? Circle;
        return (
          <li key={item.id} className="relative">
            <span
              className={cn(
                'absolute -left-[33px] flex size-6 items-center justify-center rounded-full ring-4 ring-background [&_svg]:size-3.5',
                variantClasses[item.variant ?? 'default'],
              )}
            >
              <Icon />
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium">{item.title}</p>
              <time className="text-xs text-muted-foreground font-numeric">{item.timestamp}</time>
            </div>
            {item.description && <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>}
          </li>
        );
      })}
    </ol>
  );
}

export { Timeline };
