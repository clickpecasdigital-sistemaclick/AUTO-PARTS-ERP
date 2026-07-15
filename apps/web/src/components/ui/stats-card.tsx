import type { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';

export interface StatsCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  /** Percentual de variação vs. período anterior. Positivo = verde, negativo = vermelho. */
  trend?: number;
  trendLabel?: string;
  className?: string;
}

/**
 * Card de KPI — bloco fundamental de todo dashboard do ERP (faturamento do
 * dia, ticket médio, OS abertas, estoque crítico...). Número sempre em
 * `font-numeric` para alinhamento tabular consistente entre cards vizinhos.
 */
function StatsCard({ label, value, icon: Icon, trend, trendLabel, className }: StatsCardProps) {
  const isPositive = (trend ?? 0) >= 0;

  return (
    <Card className={cn('transition-shadow duration-base hover:shadow-md', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <p className="text-label uppercase text-muted-foreground">{label}</p>
          {Icon && (
            <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="size-4.5" />
            </div>
          )}
        </div>
        <p className="mt-3 font-numeric text-h2 text-foreground">{value}</p>
        {trend !== undefined && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className={cn('flex items-center gap-0.5 font-medium', isPositive ? 'text-success' : 'text-destructive')}>
              {isPositive ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
            {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { StatsCard };
