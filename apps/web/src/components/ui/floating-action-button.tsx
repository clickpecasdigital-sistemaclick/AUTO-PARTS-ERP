import * as React from 'react';
import { cn } from '@/utils/cn';

export interface FabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Posição fixa na viewport. Default: canto inferior direito. */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

/**
 * Floating Action Button — ação primária flutuante (ex: "Nova Venda",
 * "Nova OS") sempre visível independente do scroll. Usa o gradiente
 * "premium" do Design System para se diferenciar de botões comuns.
 */
const Fab = React.forwardRef<HTMLButtonElement, FabProps>(
  ({ className, position = 'bottom-right', children, ...props }, ref) => {
    const positionClasses = {
      'bottom-right': 'right-6 bottom-6',
      'bottom-left': 'left-6 bottom-6',
      'bottom-center': 'left-1/2 -translate-x-1/2 bottom-6',
    } as const;

    return (
      <button
        ref={ref}
        className={cn(
          'fixed z-sticky flex h-14 w-14 items-center justify-center rounded-full',
          'bg-gradient-primary text-primary-foreground shadow-xl transition-transform',
          'duration-base ease-out-smooth hover:scale-105 active:scale-95 [&_svg]:size-6',
          positionClasses[position],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Fab.displayName = 'Fab';

export { Fab };
