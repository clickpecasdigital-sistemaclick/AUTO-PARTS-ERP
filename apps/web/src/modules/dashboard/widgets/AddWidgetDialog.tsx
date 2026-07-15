import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useDashboardLayoutStore } from '@/stores/dashboard-layout.store';
import { useFavoritesStore } from '@/stores/favorites.store';
import { widgetDefinitionsList } from './widget-registry';

interface AddWidgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Galeria de widgets disponíveis para adicionar ao Dashboard (requisito: "Widgets favoritos"). */
export function AddWidgetDialog({ open, onOpenChange }: AddWidgetDialogProps) {
  const addWidget = useDashboardLayoutStore((s) => s.addWidget);
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar widget</DialogTitle>
          <DialogDescription>Escolha um widget para adicionar ao seu Dashboard.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {widgetDefinitionsList.map((definition) => (
            <button
              key={definition.type}
              onClick={() => {
                addWidget(definition.type, definition.defaultSpan);
                onOpenChange(false);
              }}
              className="flex flex-col gap-2 rounded-lg border border-border p-4 text-left transition-colors duration-base hover:border-primary hover:bg-primary/5"
            >
              <div className="flex items-center justify-between">
                <definition.icon className="size-5 text-primary" />
                {favoriteIds.includes(definition.type) && <Badge variant="warning">Favorito</Badge>}
              </div>
              <div>
                <p className="text-sm font-medium">{definition.label}</p>
                <p className="text-xs text-muted-foreground">{definition.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
