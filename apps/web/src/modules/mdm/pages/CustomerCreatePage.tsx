import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { CpfCnpjInput } from '@/components/ui/masked-inputs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useCreateCustomer } from '../hooks/useMdm';
import { customerTypeLabels, type CustomerType, type PersonType } from '../types/mdm.types';

interface CustomerFormValues {
  personType: PersonType;
  customerType: CustomerType;
  document: string;
  name: string;
  tradeName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
}

/**
 * Cadastro inicial do cliente — depois de criado, a tela vira a Visão
 * 360° completa (`Customer360Page`), com crédito/contatos/endereços/
 * veículos/histórico. Esta página existe só para o primeiro passo, onde
 * nenhuma dessas abas tem sentido ainda (cliente não existe).
 */
export default function CustomerCreatePage() {
  const navigate = useNavigate();
  const activeCompanyId = useWorkspaceStore((s) => s.activeCompanyId);
  const createCustomer = useCreateCustomer();
  const form = useForm<CustomerFormValues>({ defaultValues: { personType: 'individual', customerType: 'retail' } });

  async function onSubmit(values: CustomerFormValues) {
    if (!activeCompanyId) return;
    const created = await createCustomer.mutateAsync({ companyId: activeCompanyId, payload: values as unknown as Record<string, unknown> });
    navigate(`/clientes/${created.id}`, { replace: true });
  }

  return (
    <div>
      <PageHeader title="Novo cliente" description="Cadastro Mestre — após criado, a ficha completa (crédito, contatos, veículos, histórico) fica disponível." />

      <Card>
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <FormField label="Tipo de pessoa" required>
              <Select onValueChange={(v) => form.setValue('personType', v as PersonType)} value={form.watch('personType')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Pessoa Física</SelectItem>
                  <SelectItem value="business">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Classificação comercial" required>
              <Select onValueChange={(v) => form.setValue('customerType', v as CustomerType)} value={form.watch('customerType')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(customerTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={form.watch('personType') === 'business' ? 'CNPJ' : 'CPF'} required>
              <CpfCnpjInput value={form.watch('document') ?? ''} onValueChange={(v) => form.setValue('document', v)} />
            </FormField>
            <FormField label={form.watch('personType') === 'business' ? 'Razão Social' : 'Nome'} required>
              <Input {...form.register('name', { required: true })} />
            </FormField>
            {form.watch('personType') === 'business' && (
              <FormField label="Nome Fantasia">
                <Input {...form.register('tradeName')} />
              </FormField>
            )}
            <FormField label="E-mail">
              <Input type="email" {...form.register('email')} />
            </FormField>
            <FormField label="Telefone">
              <Input {...form.register('phone')} />
            </FormField>
            <FormField label="WhatsApp">
              <Input {...form.register('whatsapp')} />
            </FormField>
            <div className="sm:col-span-2">
              <Button type="submit" isLoading={createCustomer.isPending}>
                <Save /> Criar cliente
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
