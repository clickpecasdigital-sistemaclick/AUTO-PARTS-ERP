import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/badge';

export interface KanbanCardData {
  id: string;
  title: string;
  subtitle?: string;
  tags?: string[];
}

export interface KanbanColumnData {
  id: string;
  title: string;
  accentClassName?: string; // ex: 'bg-info' para colorir o indicador da coluna
  cards: KanbanCardData[];
}

interface KanbanBoardProps {
  columns: KanbanColumnData[];
  onCardClick?: (cardId: string, columnId: string) => void;
  className?: string;
}

/**
 * Kanban somente-leitura/click (sem drag-and-drop nesta sprint — fundação
 * visual). Uso previsto: funil de Leads (CRM), andamento de Ordens de
 * Serviço por status, pipeline de Pedidos de Compra.
 */
function KanbanBoard({ columns, onCardClick, className }: KanbanBoardProps) {
  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-2 scrollbar-thin', className)}>
      {columns.map((column) => (
        <div key={column.id} className="flex w-72 shrink-0 flex-col gap-3 rounded-xl bg-muted/50 p-3">
          <div className="flex items-center gap-2 px-1">
            <span className={cn('size-2 rounded-full', column.accentClassName ?? 'bg-primary')} />
            <h3 className="text-sm font-semibold">{column.title}</h3>
            <span className="ml-auto text-xs font-numeric text-muted-foreground">{column.cards.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {column.cards.map((card) => (
              <button
                key={card.id}
                onClick={() => onCardClick?.(card.id, column.id)}
                className="rounded-lg border border-border bg-card p-3 text-left shadow-xs transition-shadow duration-base hover:shadow-md"
              >
                <p className="text-sm font-medium">{card.title}</p>
                {card.subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{card.subtitle}</p>}
                {card.tags && card.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {card.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export { KanbanBoard };
