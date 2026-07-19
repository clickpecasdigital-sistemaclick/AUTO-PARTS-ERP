import { useQuery } from '@tanstack/react-query';
import { Fuel, Gauge, Truck } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { httpClient } from '@/api/http.client';
import { formatDate } from '@/utils/formatters';

interface CheckIn {
  id: string;
  odometerKm: number | null;
  fuelLevel: number | null;
  itemsLeftInVehicle: string | null;
  existingDamages: string | null;
  checkedInAt: string;
  serviceOrder: { code: string; status: string; customer: { name: string }; vehicle: { plate: string | null } };
}

/** Portaria — monitor de entrada de veículos na oficina (check-ins recentes, de todas as OS). */
export default function PortariaPage() {
  const { data: checkIns, isLoading } = useQuery({
    queryKey: ['workshop', 'portaria', 'recent'],
    queryFn: () => httpClient.get<CheckIn[]>('/workshop/portaria/recent'),
  });

  return (
    <div>
      <PageHeader title="Portaria" description="Controle de entrada de veículos na oficina — quilometragem, combustível, itens deixados e avarias registradas no check-in." />

      {isLoading ? (
        <LoadingScreen fullScreen={false} />
      ) : !checkIns || checkIns.length === 0 ? (
        <EmptyState icon={Truck} title="Nenhuma entrada registrada" description="O check-in acontece ao abrir uma Ordem de Serviço, na aba de entrada do veículo." />
      ) : (
        <div className="space-y-2">
          {checkIns.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-numeric font-medium">OS {c.serviceOrder.code}</span>
                    <Badge variant="outline">{c.serviceOrder.vehicle.plate ?? 'Sem placa'}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.serviceOrder.customer.name}</p>
                  {(c.itemsLeftInVehicle || c.existingDamages) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.itemsLeftInVehicle && <>Itens deixados: {c.itemsLeftInVehicle}. </>}
                      {c.existingDamages && <>Avarias: {c.existingDamages}.</>}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {c.odometerKm !== null && (
                    <span className="flex items-center gap-1">
                      <Gauge className="size-4" /> {c.odometerKm.toLocaleString('pt-BR')} km
                    </span>
                  )}
                  {c.fuelLevel !== null && (
                    <span className="flex items-center gap-1">
                      <Fuel className="size-4" /> {c.fuelLevel}%
                    </span>
                  )}
                  <span className="font-numeric text-xs">{formatDate(c.checkedInAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
