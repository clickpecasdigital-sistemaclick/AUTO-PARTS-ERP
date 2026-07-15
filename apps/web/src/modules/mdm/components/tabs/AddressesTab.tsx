import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MapPin, Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { CepInput } from '@/components/ui/masked-inputs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useAddAddress, useRemoveAddress } from '../../hooks/useMdm';
import { addressKindLabels, type AddressKind, type CustomerAddress } from '../../types/mdm.types';

interface AddressesTabProps {
  customerId: string;
  addresses: CustomerAddress[];
}

interface AddressFormValues {
  kind: AddressKind;
  zipCode: string;
  street: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
}

/** Aba Endereços — entrega, cobrança, fiscal, residencial, comercial, com CEP automático (ViaCEP). */
export function AddressesTab({ customerId, addresses }: AddressesTabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const addAddress = useAddAddress(customerId);
  const removeAddress = useRemoveAddress(customerId);
  const form = useForm<AddressFormValues>({ defaultValues: { kind: 'shipping' } });

  async function onSubmit(values: AddressFormValues) {
    await addAddress.mutateAsync(values as unknown as Record<string, unknown>);
    form.reset({ kind: 'shipping' });
    setIsOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{addresses.length} endereço(s) cadastrado(s).</p>
        <Button size="sm" onClick={() => setIsOpen(true)}>
          <Plus /> Novo endereço
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState icon={MapPin} title="Nenhum endereço adicional" description="Cadastre endereços de entrega, cobrança ou fiscal." />
      ) : (
        <div className="space-y-2">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{addressKindLabels[address.kind]}</Badge>
                    {address.isDefault && (
                      <Badge variant="warning">
                        <Star className="size-3" /> Padrão
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm">
                    {address.street}, {address.number ?? 's/n'} {address.complement && `— ${address.complement}`}
                  </p>
                  <p className="text-sm text-muted-foreground">{address.neighborhood} — {address.city}/{address.state} — {address.zipCode}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeAddress.mutate(address.id)} aria-label="Remover endereço">
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo endereço</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Tipo" required>
              <Select onValueChange={(v) => form.setValue('kind', v as AddressKind)} value={form.watch('kind')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(addressKindLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="CEP" required hint="Preenchimento automático via ViaCEP">
              <CepInput value={form.watch('zipCode') ?? ''} onValueChange={(v) => form.setValue('zipCode', v)} />
            </FormField>
            <FormField label="Logradouro" required>
              <Input {...form.register('street', { required: true })} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Número">
                <Input {...form.register('number')} />
              </FormField>
              <FormField label="Complemento">
                <Input {...form.register('complement')} />
              </FormField>
            </div>
            <FormField label="Bairro">
              <Input {...form.register('neighborhood')} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Cidade" required>
                <Input {...form.register('city', { required: true })} />
              </FormField>
              <FormField label="UF" required>
                <Input {...form.register('state', { required: true })} maxLength={2} />
              </FormField>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={addAddress.isPending}>
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
