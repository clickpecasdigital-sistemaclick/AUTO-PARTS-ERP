import { useParams } from 'react-router-dom';
import { Car, User, Wrench } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorState } from '@/components/common/ErrorState';
import { formatCurrencyBRL } from '@/utils/formatters';
import { useServiceOrder } from '../hooks/useWorkshop';
import { priorityLabels, serviceOrderStatusLabels, type ServiceOrderPriority, type ServiceOrderStatus } from '../types/workshop.types';
import { StatusFlowBar } from '../components/StatusFlowBar';
import { DiagnosisTab, BudgetTab } from '../components/tabs/DiagnosisBudgetTabs';

const statusVariant: Record<ServiceOrderStatus, 'secondary' | 'warning' | 'success' | 'destructive' | 'default'> = {
  open: 'secondary',
  diagnosing: 'warning',
  awaiting_approval: 'warning',
  approved: 'default',
  in_progress: 'default',
  awaiting_parts: 'warning',
  completed: 'success',
  delivered: 'success',
  cancelled: 'destructive',
};

const priorityVariant: Record<ServiceOrderPriority, 'secondary' | 'warning' | 'destructive'> = {
  low: 'secondary',
  normal: 'secondary',
  high: 'warning',
  urgent: 'destructive',
};

/**
 * Detalhe da OS — a tela central do módulo Oficina. Cobre Diagnóstico e
 * Orçamento (peças/serviços) nesta entrega; Check-in/Checklist/Entrega têm
 * API completa e testada (ver `workshopService`), com UI dedicada
 * reservada para uma iteração de refinamento — mesma decisão de escopo já
 * adotada nas Sprints 09/10 para módulos com volume equivalente.
 */
export default function ServiceOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError, refetch } = useServiceOrder(id);

  if (isLoading) return <LoadingScreen message="Carregando OS..." fullScreen={false} />;
  if (isError || !order) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        title={order.code}
        description={order.isRework ? 'OS de retrabalho' : undefined}
        actions={
          <>
            <Badge variant={priorityVariant[order.priority]}>{priorityLabels[order.priority]}</Badge>
            <Badge variant={statusVariant[order.status]}>{serviceOrderStatusLabels[order.status]}</Badge>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <User className="size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="text-sm font-medium">{order.customer.tradeName ?? order.customer.name}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Car className="size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Veículo</p>
              <p className="font-numeric text-sm font-medium">{order.vehicle.plate ?? '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Wrench className="size-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Mecânico</p>
              <p className="text-sm font-medium">{order.mechanic?.employee.name ?? 'Não atribuído'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <StatusFlowBar order={order} />
        </CardContent>
      </Card>

      <Tabs defaultValue="diagnosis">
        <TabsList>
          <TabsTrigger value="diagnosis">Diagnóstico</TabsTrigger>
          <TabsTrigger value="budget">Orçamento</TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardContent className="p-6">
            <TabsContent value="diagnosis">
              <DiagnosisTab order={order} />
            </TabsContent>
            <TabsContent value="budget">
              <BudgetTab order={order} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <p className="mt-4 text-right font-numeric text-sm text-muted-foreground">Total: {formatCurrencyBRL(Number(order.totalAmount))}</p>
    </div>
  );
}
