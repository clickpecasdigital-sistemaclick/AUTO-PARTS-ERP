import { useState } from 'react';
import { Car, Search, Wrench } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { usePermissions } from '@/hooks/usePermissions';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate, formatCurrencyBRL } from '@/utils/formatters';
import { useUpdateVehicle, useVehicleDetail, useVehiclesDirectory, type UpdateVehiclePayload } from '../services/vehicles.service';

const statusLabel: Record<string, string> = { open: 'Aberta', in_progress: 'Em andamento', awaiting_parts: 'Aguardando peça', completed: 'Concluída', delivered: 'Entregue', cancelled: 'Cancelada' };

/** Ficha do Veículo — cadastro tenant-wide, integrado com Clientes (dono) e Oficina (histórico de OS). */
export default function VehicleDirectoryPage() {
  const { can } = usePermissions();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const { data: vehicles, isLoading } = useVehiclesDirectory(debouncedSearch);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: vehicle } = useVehicleDetail(selectedId ?? undefined);
  const updateVehicle = useUpdateVehicle();
  const [editForm, setEditForm] = useState<UpdateVehiclePayload>({});
  const [isEditing, setIsEditing] = useState(false);

  function openDetail(id: string) {
    setSelectedId(id);
    setIsEditing(false);
  }

  function startEdit() {
    if (!vehicle) return;
    setEditForm({
      plate: vehicle.plate ?? undefined,
      chassis: vehicle.chassis ?? undefined,
      renavam: vehicle.renavam ?? undefined,
      color: vehicle.color ?? undefined,
      modelYear: vehicle.modelYear ?? undefined,
      manufactureYear: vehicle.manufactureYear ?? undefined,
      currentKm: vehicle.currentKm ?? undefined,
      notes: vehicle.notes ?? undefined,
    });
    setIsEditing(true);
  }

  async function handleSave() {
    if (!selectedId) return;
    await updateVehicle.mutateAsync({ id: selectedId, payload: editForm });
    setIsEditing(false);
  }

  return (
    <div>
      <PageHeader title="Ficha do Veículo" description="Cadastro de veículos dos clientes — placa, chassi, motorização e histórico de manutenção." />

      <div className="mb-4 max-w-md">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por placa, chassi, renavam ou cliente..." leftIcon={<Search className="size-4" />} />
      </div>

      {isLoading ? null : !vehicles || vehicles.length === 0 ? (
        <EmptyState icon={Car} title="Nenhum veículo encontrado" description="Veículos são cadastrados na ficha do cliente (Customer 360)." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <Card key={v.id} className="cursor-pointer hover:border-primary" onClick={() => openDetail(v.id)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Car className="size-4 text-muted-foreground" />
                  <span className="font-numeric font-medium">{v.plate ?? 'Sem placa'}</span>
                </div>
                <p className="mt-1 text-sm">
                  {v.vehicleVersion ? `${v.vehicleVersion.model.make.name} ${v.vehicleVersion.model.name}` : 'Modelo não informado'}
                  {v.modelYear && ` · ${v.modelYear}`}
                </p>
                <p className="text-xs text-muted-foreground">{v.customer.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-xl">
          {vehicle && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Car className="size-5" /> {vehicle.plate ?? 'Veículo sem placa'}
                </DialogTitle>
              </DialogHeader>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Placa">
                      <Input value={editForm.plate ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, plate: e.target.value }))} />
                    </FormField>
                    <FormField label="Chassi">
                      <Input value={editForm.chassis ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, chassis: e.target.value }))} />
                    </FormField>
                    <FormField label="Renavam">
                      <Input value={editForm.renavam ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, renavam: e.target.value }))} />
                    </FormField>
                    <FormField label="Cor">
                      <Input value={editForm.color ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, color: e.target.value }))} />
                    </FormField>
                    <FormField label="Ano modelo">
                      <Input type="number" value={editForm.modelYear ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, modelYear: Number(e.target.value) }))} className="font-numeric" />
                    </FormField>
                    <FormField label="Ano fabricação">
                      <Input type="number" value={editForm.manufactureYear ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, manufactureYear: Number(e.target.value) }))} className="font-numeric" />
                    </FormField>
                    <FormField label="KM atual">
                      <Input type="number" value={editForm.currentKm ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, currentKm: Number(e.target.value) }))} className="font-numeric" />
                    </FormField>
                  </div>
                  <FormField label="Observações">
                    <Input value={editForm.notes ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
                  </FormField>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave} isLoading={updateVehicle.isPending}>
                      Salvar
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Proprietário</p>
                      <p>{vehicle.customer.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Modelo</p>
                      <p>{vehicle.vehicleVersion ? `${vehicle.vehicleVersion.model.make.name} ${vehicle.vehicleVersion.model.name}` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Chassi</p>
                      <p className="font-numeric">{vehicle.chassis ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Renavam</p>
                      <p className="font-numeric">{vehicle.renavam ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cor</p>
                      <p>{vehicle.color ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">KM atual</p>
                      <p className="font-numeric">{vehicle.currentKm?.toLocaleString('pt-BR') ?? '—'}</p>
                    </div>
                  </div>
                  {vehicle.notes && <p className="text-sm text-muted-foreground">{vehicle.notes}</p>}

                  <div>
                    <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Wrench className="size-4" /> Histórico de Ordens de Serviço
                    </p>
                    {vehicle.serviceOrders.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhuma OS registrada para este veículo.</p>
                    ) : (
                      <div className="space-y-1">
                        {vehicle.serviceOrders.map((os) => (
                          <div key={os.id} className="flex items-center justify-between rounded-md border border-border px-2 py-1.5 text-xs">
                            <span className="font-numeric">{os.code}</span>
                            <Badge variant="secondary">{statusLabel[os.status] ?? os.status}</Badge>
                            <span className="text-muted-foreground">{formatDate(os.openedAt)}</span>
                            <span className="font-numeric">{formatCurrencyBRL(Number(os.totalAmount))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {can('customers', 'update') && (
                    <DialogFooter>
                      <Button variant="outline" onClick={startEdit}>
                        Editar dados
                      </Button>
                    </DialogFooter>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
