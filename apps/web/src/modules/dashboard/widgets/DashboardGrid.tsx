import * as React from 'react';
import { useDashboardLayoutStore } from '@/stores/dashboard-layout.store';
import { DashboardWidgetCard } from './DashboardWidgetCard';
import { EmptyState } from '@/components/common/EmptyState';
import { LayoutGrid } from 'lucide-react';

interface DashboardGridProps {
  onAddWidgetClick: () => void;
}

/**
 * Grid configurável de 12 colunas (requisito: "Grid configurável") com
 * reordenação via Drag and Drop nativo (HTML5 Drag & Drop API — sem
 * dependência extra; suficiente para reordenar cards, que é o caso de uso
 * real aqui). Layout é lido/escrito em `useDashboardLayoutStore`,
 * persistido por usuário (localStorage nesta sprint, migrável para API
 * sem mudar este componente).
 */
export function DashboardGrid({ onAddWidgetClick }: DashboardGridProps) {
  const widgets = useDashboardLayoutStore((s) => s.widgets);
  const removeWidget = useDashboardLayoutStore((s) => s.removeWidget);
  const reorder = useDashboardLayoutStore((s) => s.reorder);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  if (sortedWidgets.length === 0) {
    return (
      <EmptyState
        icon={LayoutGrid}
        title="Seu dashboard está vazio"
        description="Adicione widgets para acompanhar indicadores, gráficos e listas dos módulos do ERP."
        actionLabel="Adicionar widget"
        onAction={onAddWidgetClick}
      />
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      {sortedWidgets.map((widget, index) => (
        <DashboardWidgetCard
          key={widget.id}
          widget={widget}
          onRemove={removeWidget}
          draggable
          isDragging={draggingId === widget.id}
          onDragStart={() => setDraggingId(widget.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (draggingId && draggingId !== widget.id) reorder(draggingId, index);
            setDraggingId(null);
          }}
        />
      ))}
    </div>
  );
}
