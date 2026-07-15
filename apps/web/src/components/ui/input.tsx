import * as React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  success?: boolean;
  isLoading?: boolean;
  /** Ícone exibido à esquerda do texto (ex: ícone de busca, cadeado). */
  leftIcon?: React.ReactNode;
  /** Ícone exibido à direita — sobrescrito automaticamente por isLoading/success quando ativos. */
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, isLoading, leftIcon, rightIcon, ...props }, ref) => {
    const showRightSlot = isLoading || success || rightIcon;

    return (
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 flex items-center text-muted-foreground [&_svg]:size-4">
            {leftIcon}
          </span>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground transition-colors duration-base focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            leftIcon && 'pl-9',
            showRightSlot && 'pr-9',
            error && 'border-destructive focus-visible:ring-destructive',
            success && !error && 'border-success focus-visible:ring-success',
            className,
          )}
          ref={ref}
          {...props}
        />
        {showRightSlot && (
          <span className="pointer-events-none absolute right-3 flex items-center [&_svg]:size-4">
            {isLoading ? (
              <Loader2 className="animate-spin text-muted-foreground" />
            ) : success ? (
              <CheckCircle2 className="text-success" />
            ) : (
              <span className="text-muted-foreground">{rightIcon}</span>
            )}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
