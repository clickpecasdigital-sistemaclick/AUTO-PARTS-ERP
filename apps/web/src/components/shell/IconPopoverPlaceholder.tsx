import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EmptyState } from '@/components/common/EmptyState';

interface IconPopoverPlaceholderProps {
  icon: LucideIcon;
  label: string;
  emptyTitle: string;
  emptyDescription: string;
}

/**
 * Botão de ícone do Navbar com Popover de estado vazio — usado por
 * "Mensagens" e "Tarefas" (Sprint 04 entrega apenas a estrutura do Shell;
 * os módulos de Mensageria/Tarefas em si ficam para sprints futuras). Evita
 * duplicar o markup de Popover+EmptyState em cada um dos dois ícones.
 */
export function IconPopoverPlaceholder({ icon: Icon, label, emptyTitle, emptyDescription }: IconPopoverPlaceholderProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label}>
          <Icon className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">{label}</h3>
        </div>
        <div className="p-6">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
