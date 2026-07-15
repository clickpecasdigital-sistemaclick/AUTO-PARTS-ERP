import { useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardLayoutStore } from '@/stores/dashboard-layout.store';
import { DashboardGrid } from '@/modules/dashboard/widgets/DashboardGrid';
import { AddWidgetDialog } from '@/modules/dashboard/widgets/AddWidgetDialog';
import { StaggerList, StaggerItem } from '@/components/motion';

/**
 * Dashboard Base — grid de widgets configurável, removível e persistido
 * por usuário (ver `stores/dashboard-layout.store.ts` e `modules/dashboard/
 * widgets/`). Nenhum widget aqui exibe dado de negócio: cada módulo futuro
 * (Vendas, Estoque, Financeiro...) registra seu próprio widget no
 * `widget-registry.tsx` sem precisar alterar esta página.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);
  const widgets = useDashboardLayoutStore((s) => s.widgets);
  const resetToDefault = useDashboardLayoutStore((s) => s.resetToDefault);

  return (
    <div>
      <PageHeader
        title={`Olá, ${user?.fullName?.split(' ')[0] ?? 'bem-vindo'}`}
        description="Personalize seu dashboard com os widgets mais úteis para o seu dia a dia."
        actions={
          <>
            {widgets.length > 0 && (
              <Button variant="outline" size="sm" onClick={resetToDefault}>
                <RotateCcw /> Limpar
              </Button>
            )}
            <Button size="sm" onClick={() => setIsAddWidgetOpen(true)}>
              <Plus /> Adicionar widget
            </Button>
          </>
        }
      />

      <StaggerList>
        <StaggerItem>
          <DashboardGrid onAddWidgetClick={() => setIsAddWidgetOpen(true)} />
        </StaggerItem>
      </StaggerList>

      <AddWidgetDialog open={isAddWidgetOpen} onOpenChange={setIsAddWidgetOpen} />
    </div>
  );
}
