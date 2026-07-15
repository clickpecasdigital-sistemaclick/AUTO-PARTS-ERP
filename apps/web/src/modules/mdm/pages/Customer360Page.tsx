import { useParams } from 'react-router-dom';
import {
  Car,
  Download,
  MapPin,
  Phone,
  ShieldAlert,
  ShoppingBag,
  Ticket,
  UserX,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { Timeline, type TimelineItem } from '@/components/ui/timeline';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { formatCurrencyBRL, formatDate } from '@/utils/formatters';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useAnonymizeCustomer,
  useCustomer,
  useCustomer360Summary,
  useCustomer360Timeline,
  useExportCustomerData,
} from '../hooks/useMdm';
import { customerTypeLabels, creditStatusLabels, type CreditStatus } from '../types/mdm.types';
import { CreditTab } from '../components/tabs/CreditTab';
import { ContactsTab } from '../components/tabs/ContactsTab';
import { AddressesTab } from '../components/tabs/AddressesTab';
import { VehiclesTab } from '../components/tabs/VehiclesTab';

const creditVariant: Record<CreditStatus, 'secondary' | 'success' | 'warning' | 'destructive'> = {
  not_analyzed: 'secondary',
  approved: 'success',
  under_review: 'warning',
  restricted: 'warning',
  blocked: 'destructive',
};

const timelineIcon: Record<string, TimelineItem['icon']> = {
  sale: ShoppingBag,
  quote: Ticket,
  sales_order: ShoppingBag,
  service_order: Car,
  invoice: Ticket,
  payment: Ticket,
  interaction: Phone,
  appointment: Phone,
  support_ticket: ShieldAlert,
  opportunity: Ticket,
};

/**
 * Visão 360° do Cliente — a peça central do CRM (briefing): identificação,
 * crédito, contatos, endereços, veículos, LGPD e o histórico unificado
 * (compras, orçamentos, OS, financeiro, interações, chamados,
 * oportunidades) numa única tela com abas.
 */
export default function Customer360Page() {
  const { id } = useParams<{ id: string }>();
  const { can } = usePermissions();
  const { data: customer, isLoading, isError, refetch } = useCustomer(id);
  const { data: summary } = useCustomer360Summary(id);
  const { data: timeline, isLoading: timelineLoading } = useCustomer360Timeline(id);
  const exportData = useExportCustomerData();
  const anonymize = useAnonymizeCustomer();
  const [confirmAnonymize, setConfirmAnonymize] = useState(false);

  if (isLoading) return <LoadingScreen message="Carregando cliente..." fullScreen={false} />;
  if (isError || !customer || !id) return <ErrorState onRetry={() => refetch()} />;

  const timelineItems: TimelineItem[] = (timeline ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.value !== undefined ? formatCurrencyBRL(item.value) : item.status,
    timestamp: formatDate(item.occurredAt, true),
    icon: timelineIcon[item.type] ?? Ticket,
    variant: item.type === 'support_ticket' ? 'warning' : 'default',
  }));

  return (
    <div>
      <PageHeader
        title={customer.tradeName ?? customer.name}
        description={`${customer.document} — ${customerTypeLabels[customer.customerType]}`}
        actions={
          <>
            <Badge variant={creditVariant[customer.creditStatus]}>{creditStatusLabels[customer.creditStatus]}</Badge>
            {can('customers', 'export') && (
              <Button variant="outline" onClick={() => exportData.mutate(id)} isLoading={exportData.isPending}>
                <Download /> Exportar dados (LGPD)
              </Button>
            )}
            {can('customers', 'delete') && (
              <Button variant="destructive" onClick={() => setConfirmAnonymize(true)}>
                <UserX /> Anonimizar
              </Button>
            )}
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Compras realizadas" value={String(summary?.salesCount ?? customer.totalPurchasesCount)} icon={ShoppingBag} />
        <StatsCard label="Ticket médio" value={formatCurrencyBRL(Number(customer.averageTicketValue))} icon={Ticket} />
        <StatsCard label="Chamados abertos" value={String(summary?.openTickets ?? 0)} icon={ShieldAlert} />
        <StatsCard label="Veículos" value={String(summary?.vehiclesCount ?? customer.vehicles.length)} icon={Car} />
      </div>

      <Tabs defaultValue="timeline">
        <TabsList className="flex-wrap">
          <TabsTrigger value="timeline">Histórico Unificado</TabsTrigger>
          <TabsTrigger value="credit">Crédito</TabsTrigger>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
          <TabsTrigger value="addresses">Endereços</TabsTrigger>
          <TabsTrigger value="vehicles">Veículos</TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardContent className="p-6">
            <TabsContent value="timeline">
              {timelineLoading ? null : timelineItems.length === 0 ? (
                <EmptyState title="Sem histórico ainda" description="Compras, orçamentos, OS, interações e chamados aparecerão aqui." />
              ) : (
                <Timeline items={timelineItems} />
              )}
            </TabsContent>
            <TabsContent value="credit">
              <CreditTab customerId={id} creditLimit={Number(customer.creditLimit)} />
            </TabsContent>
            <TabsContent value="contacts">
              <ContactsTab customerId={id} contacts={customer.contacts} />
            </TabsContent>
            <TabsContent value="addresses">
              <AddressesTab customerId={id} addresses={customer.addresses} />
            </TabsContent>
            <TabsContent value="vehicles">
              <VehiclesTab customerId={id} vehicles={customer.vehicles} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <Dialog open={confirmAnonymize} onOpenChange={setConfirmAnonymize}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="size-4 text-destructive" /> Anonimizar cliente
            </DialogTitle>
            <DialogDescription>
              Esta ação é <strong>irreversível</strong>. Nome, documento, e-mail, telefone, contatos e endereços serão
              substituídos por dados anônimos. O histórico de compras/OS permanece para fins contábeis, mas sem
              vínculo nominal. Use apenas em atendimento a uma solicitação formal de exclusão (LGPD).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAnonymize(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                anonymize.mutate(id);
                setConfirmAnonymize(false);
              }}
            >
              Confirmar anonimização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
