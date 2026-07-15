import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/utils/cn';

const alertVariants = cva('relative flex w-full gap-3 rounded-lg border p-4 text-sm [&>svg]:size-5 [&>svg]:shrink-0', {
  variants: {
    variant: {
      default: 'border-border bg-card text-card-foreground',
      info: 'border-info/20 bg-info/10 text-info',
      success: 'border-success/20 bg-success/10 text-success',
      warning: 'border-warning/20 bg-warning/10 text-warning',
      destructive: 'border-destructive/20 bg-destructive/10 text-destructive',
    },
  },
  defaultVariants: { variant: 'default' },
});

const icons = { default: Info, info: Info, success: CheckCircle2, warning: TriangleAlert, destructive: AlertCircle };

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string;
  onDismiss?: () => void;
}

/**
 * Alert — banner de feedback persistente dentro da página (diferente do
 * Toast, que é transitório). Ex: "Seu plano expira em 3 dias", avisos de
 * estoque baixo em massa, etc.
 */
function Alert({ className, variant = 'default', title, onDismiss, children, ...props }: AlertProps) {
  const Icon = icons[variant ?? 'default'];
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      <Icon />
      <div className="flex-1">
        {title && <p className="font-medium leading-tight">{title}</p>}
        {children && <div className={cn('text-sm opacity-90', title && 'mt-1')}>{children}</div>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100" aria-label="Fechar alerta">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export { Alert };
