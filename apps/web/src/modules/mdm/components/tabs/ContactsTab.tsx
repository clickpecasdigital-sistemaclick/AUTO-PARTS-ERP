import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
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
import { useAddContact, useRemoveContact } from '../../hooks/useMdm';
import { contactKindLabels, type ContactKind, type CustomerContact } from '../../types/mdm.types';

interface ContactsTabProps {
  customerId: string;
  contacts: CustomerContact[];
}

interface ContactFormValues {
  kind: ContactKind;
  name: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
}

/** Aba Contatos — múltiplos contatos por tipo (principal, financeiro, compras, oficina, fiscal). */
export function ContactsTab({ customerId, contacts }: ContactsTabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const addContact = useAddContact(customerId);
  const removeContact = useRemoveContact(customerId);
  const form = useForm<ContactFormValues>({ defaultValues: { kind: 'primary' } });

  async function onSubmit(values: ContactFormValues) {
    await addContact.mutateAsync(values as unknown as Record<string, unknown>);
    form.reset({ kind: 'primary' });
    setIsOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{contacts.length} contato(s) cadastrado(s).</p>
        <Button size="sm" onClick={() => setIsOpen(true)}>
          <Plus /> Novo contato
        </Button>
      </div>

      {contacts.length === 0 ? (
        <EmptyState title="Nenhum contato adicional" description="Cadastre contatos financeiro, de compras, oficina ou fiscal." />
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{contactKindLabels[contact.kind]}</Badge>
                    <span className="font-medium">{contact.name}</span>
                  </div>
                  <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
                    {contact.phone && <span className="flex items-center gap-1"><Phone className="size-3" /> {contact.phone}</span>}
                    {contact.email && <span className="flex items-center gap-1"><Mail className="size-3" /> {contact.email}</span>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeContact.mutate(contact.id)} aria-label="Remover contato">
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
            <DialogTitle>Novo contato</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Tipo" required>
              <Select onValueChange={(v) => form.setValue('kind', v as ContactKind)} value={form.watch('kind')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(contactKindLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Nome" required>
              <Input {...form.register('name', { required: true })} />
            </FormField>
            <FormField label="Telefone">
              <Input {...form.register('phone')} />
            </FormField>
            <FormField label="WhatsApp">
              <Input {...form.register('whatsapp')} />
            </FormField>
            <FormField label="E-mail">
              <Input type="email" {...form.register('email')} />
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={addContact.isPending}>
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
