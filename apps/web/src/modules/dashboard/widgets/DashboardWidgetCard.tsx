import * as React from 'react';
import { GripVertical, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';
import type { DashboardWidgetInstance } from '@/stores/dashboard-layout.store';
import { widgetRegistry } from './widget-registry';

const spanClasses: Record<DashboardWidgetInstance['span'], string> = {
  3: 'col-span-12 sm:col-span-6 lg:col-span-3',
  4: 'col-span-12 sm:col-span-6 lg:col-span-4',
  6: 'col-span-12 lg:col-span-6',
  12: 'col-span-12',
};

interface DashboardWidgetCardProps {
  widget: DashboardWidgetInstance;
  onRemove: (id: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragging?: boolean;
}

/**
 * Card de widget do Dashboard — wrapper sobre `Card` (Design System, nunca
 * recriado) com cabeçalho padronizado (título + handle de arraste + botão
 * remover). O conteúdo de fato vem de `widgetRegistry[widget.widgetType]`.
 */
export function DashboardWidgetCard({ widget, onRemove, draggable, onDragStart, onDragOver, onDrop, isDragging }: DashboardWidgetCardProps) {
  const definition = widgetRegistry[widget.widgetType];
  if (!definition) return null;

  return (
    <div
      className={cn(spanClasses[widget.span], 'transition-opacity duration-base', isDragging && 'opacity-40')}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <Card className="h-full">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            {draggable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-grab text-muted-foreground active:cursor-grabbing">
                    <GripVertical className="size-4" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Arraste para reordenar</TooltipContent>
              </Tooltip>
            )}
            <CardTitle className="text-sm font-medium text-muted-foreground">{definition.label}</CardTitle>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => onRemove(widget.id)} aria-label="Remover widget">
            <X className="size-3.5" />
          </Button>
        </CardHeader>
        <CardContent>{definition.render()}</CardContent>
      </Card>
    </div>
  );
}
