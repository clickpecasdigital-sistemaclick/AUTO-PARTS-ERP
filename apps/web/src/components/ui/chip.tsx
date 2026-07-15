import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  onRemove?: () => void;
  variant?: 'default' | 'outline';
}

/**
 * Chip removível — usado em filtros ativos de DataTables e seleção
 * múltipla (ex: filtrar peças por múltiplas categorias/fornecedores).
 */
function Chip({ className, onRemove, variant = 'default', children, ...props }: ChipProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        variant === 'default' ? 'bg-secondary text-secondary-foreground' : 'border border-input',
        className,
      )}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-0.5 hover:bg-foreground/10"
          aria-label="Remover"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}

export { Chip };
