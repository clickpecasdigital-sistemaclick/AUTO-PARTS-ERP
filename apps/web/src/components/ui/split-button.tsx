import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button, buttonVariants, type ButtonProps } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/cn';

export interface SplitButtonProps extends Omit<ButtonProps, 'onClick'> {
  onMainAction: () => void;
  menuContent: React.ReactNode;
  mainLabel: React.ReactNode;
}

/**
 * Split Button — ação principal (clique direto) + menu de ações
 * secundárias relacionadas (ex: "Salvar" + "Salvar e duplicar",
 * "Salvar e fechar"). Visualmente um único botão dividido por um separador.
 */
function SplitButton({ onMainAction, menuContent, mainLabel, variant = 'default', size, className, ...props }: SplitButtonProps) {
  return (
    <div className={cn('inline-flex', className)}>
      <Button
        variant={variant}
        size={size}
        className="rounded-r-none border-r border-black/10"
        onClick={onMainAction}
        {...props}
      >
        {mainLabel}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Mais ações"
            className={cn(buttonVariants({ variant, size }), 'w-9 rounded-l-none px-0')}
          >
            <ChevronDown />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">{menuContent}</DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { SplitButton };
