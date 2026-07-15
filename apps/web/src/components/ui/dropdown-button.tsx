import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface DropdownButtonProps extends ButtonProps {
  menuContent: React.ReactNode;
}

/**
 * Dropdown Button — botão único que sempre abre um menu (diferente do
 * Split Button, aqui não há ação direta no clique principal). Ex: "Exportar"
 * com opções de formato (CSV, PDF, XLSX).
 */
function DropdownButton({ menuContent, children, ...props }: DropdownButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button {...props}>
          {children}
          <ChevronDown className="size-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{menuContent}</DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DropdownButton };
