import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceStore } from '@/stores/workspace.store';
import { useFiscalConfig, useUpsertFiscalConfig, useFiscalCertificates, useExpiryAlerts } from '../services/fiscal.service';
import { formatDate } from '@/utils/formatters';

const TAX_REGIMES = [
  { value: 'simples_nacional', label: 'Simples Nacional' },
  { value: 'lucro_presumido', label: 'Lucro Presumido' },
  { value: 'lucro_real', label: 'Lucro Real' },
  { value: 'mei', label: 'MEI' },
];

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

interface ConfigFormValues {
  taxRegime: string;
  crt: number;
  environment: 'production' | 'homologation';
  uf: string;
  ibgeCode: string;
  defaultCfopInState: string;
  defaultCfopOutState: string;
  defaultNatureOfOperation: string;
  fiscalObservations: string;
}

/** Painel de Configuração Fiscal (briefing: empresa, regime tributário, CRT, ambiente, séries, CSC, UF, município, CFOP padrão, natureza da operação, tributações, observações). */
export default function FiscalConfigPage() {
  const activeBranchId = useWorkspaceStore((s) => s.activeBranchId);
  const { data: config } = useFiscalConfig(activeBranchId ?? undefined);
  const upsert = useUpsertFiscalConfig(activeBranchId ?? '');
  const { data: certificates } = useFiscalCertificates();
  const { data: expiryAlerts } = useExpiryAlerts();

  const form = useForm<ConfigFormValues>({
    defaultValues: { taxRegime: 'simples_nacional', crt: 1, environment: 'homologation', uf: 'RS', ibgeCode: '', defaultCfopInState: '1102', defaultCfopOutState: '5102', defaultNatureOfOperation: 'Venda de Mercadoria', fiscalObservations: '' },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        taxRegime: config.taxRegime,
        crt: config.crt,
        environment: config.environment,
        uf: config.uf,
        ibgeCode: config.ibgeCode ?? '',
        defaultCfopInState: config.defaultCfopInState ?? '',
        defaultCfopOutState: config.defaultCfopOutState ?? '',
        defaultNatureOfOperation: config.defaultNatureOfOperation ?? '',
      });
    }
  }, [config, form]);

  function onSubmit(values: ConfigFormValues) {
    upsert.mutate(values as never);
  }

  const certs = Array.isArray(certificates) ? certificates : [];
  const alerts = Array.isArray(expiryAlerts) ? expiryAlerts : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Configuração Fiscal" description="Regime tributário, ambiente, séries, CFOP padrão, certificado A1." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados Fiscais da Filial</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <FormField label="Regime Tributário" required>
              <Select onValueChange={(v) => form.setValue('taxRegime', v)} value={form.watch('taxRegime')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TAX_REGIMES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="CRT (Código de Regime Tributário)" required>
              <Select onValueChange={(v) => form.setValue('crt', Number(v))} value={String(form.watch('crt'))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 — Simples Nacional</SelectItem>
                  <SelectItem value="2">2 — Simples Nacional (excesso)</SelectItem>
                  <SelectItem value="3">3 — Regime Normal</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Ambiente" required>
              <Select onValueChange={(v) => form.setValue('environment', v as 'production' | 'homologation')} value={form.watch('environment')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="homologation">Homologação (Testes)</SelectItem>
                  <SelectItem value="production">Produção</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="UF" required>
              <Select onValueChange={(v) => form.setValue('uf', v)} value={form.watch('uf')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Código IBGE do Município">
              <Input {...form.register('ibgeCode')} className="font-numeric" placeholder="0000000" maxLength={7} />
            </FormField>

            <FormField label="CFOP Padrão Dentro do Estado">
              <Input {...form.register('defaultCfopInState')} className="font-numeric" placeholder="5102" />
            </FormField>

            <FormField label="CFOP Padrão Fora do Estado">
              <Input {...form.register('defaultCfopOutState')} className="font-numeric" placeholder="6102" />
            </FormField>

            <FormField label="Natureza da Operação Padrão">
              <Input {...form.register('defaultNatureOfOperation')} placeholder="Venda de Mercadoria" />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Observações Fiscais">
                <Input {...form.register('fiscalObservations')} placeholder="Texto livre para observações no campo infAdic da NF-e" />
              </FormField>
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" isLoading={upsert.isPending}>
                <Save /> Salvar Configuração
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4" /> Certificados Digitais A1
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {alerts.length > 0 && (
            <div className="mb-3 rounded-md border border-warning/40 bg-warning/5 p-3 text-sm">
              {alerts.length} certificado(s) vencendo em até 30 dias — renove com urgência.
            </div>
          )}
          {certs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum certificado cadastrado. Faça upload de um certificado A1 (.pfx) para habilitar a emissão.</p>
          ) : (
            certs.map((cert: { id: string; alias: string; validUntil: string; isActive: boolean }) => (
              <div key={cert.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span>{cert.alias}</span>
                <div className="flex items-center gap-2">
                  <span className="font-numeric text-xs text-muted-foreground">Válido até {formatDate(cert.validUntil)}</span>
                  <Badge variant={cert.isActive ? 'success' : 'secondary'}>{cert.isActive ? 'Ativo' : 'Inativo'}</Badge>
                </div>
              </div>
            ))
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            A senha do certificado nunca é armazenada — é usada apenas na camada de aplicação durante a assinatura.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
