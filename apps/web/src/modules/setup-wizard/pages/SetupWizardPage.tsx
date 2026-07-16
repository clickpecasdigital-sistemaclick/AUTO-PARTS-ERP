import { CheckCircle2, Circle, Loader2, Wand2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { httpClient } from '@/api/http.client';
import { toast } from '@/utils/toast';
import { Link } from 'react-router-dom';

const STEPS = [
  { id: 'company', label: 'Empresa', description: 'Configure razão social, CNPJ e dados da empresa', path: '/configuracoes' },
  { id: 'users', label: 'Usuários', description: 'Cadastre os usuários e defina permissões', path: '/configuracoes' },
  { id: 'products', label: 'Produtos', description: 'Importe ou cadastre seu catálogo de produtos', path: '/produtos' },
  { id: 'customers', label: 'Clientes', description: 'Importe ou cadastre seus clientes', path: '/clientes' },
  { id: 'suppliers', label: 'Fornecedores', description: 'Cadastre seus fornecedores', path: '/compras' },
  { id: 'financial', label: 'Financeiro', description: 'Configure contas bancárias e plano de contas', path: '/financeiro' },
  { id: 'fiscal', label: 'Fiscal', description: 'Configure regime tributário e CFOP padrão', path: '/fiscal/configuracao' },
  { id: 'certificate', label: 'Certificado Digital', description: 'Faça upload do certificado A1 para emissão de NF-e', path: '/fiscal/configuracao' },
  { id: 'smtp', label: 'E-mail', description: 'Configure o servidor de e-mail para notificações', path: '/configuracoes' },
  { id: 'whatsapp', label: 'WhatsApp', description: 'Conecte o WhatsApp Business para comunicação', path: '/configuracoes' },
  { id: 'backup', label: 'Backup', description: 'Configure o backup automático dos dados', path: '/configuracoes' },
  { id: 'permissions', label: 'Permissões', description: 'Revise e finalize as permissões de cada perfil', path: '/configuracoes' },
] as const;

interface WizardProgress {
  steps: Record<string, boolean>;
  currentStep: number;
  completedAt?: string | null;
  completedSteps: number;
  totalSteps: number;
}

export default function SetupWizardPage() {
  const qc = useQueryClient();

  const { data: progress, isLoading } = useQuery<WizardProgress>({
    queryKey: ['setup-wizard'],
    queryFn: () => httpClient.get('/copilot/setup-wizard'),
  });

  const autoDetect = useMutation({
    mutationFn: () => httpClient.post<{ autoDetected: string[] }>('/copilot/setup-wizard/auto-detect'),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ['setup-wizard'] }); toast.success(`${data.autoDetected.length} etapas detectadas automaticamente`); },
  });

  const completeStep = useMutation({
    mutationFn: (step: string) => httpClient.post(`/copilot/setup-wizard/step/${step}/complete`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['setup-wizard'] }),
  });

  const completedCount = progress?.completedSteps ?? 0;
  const totalCount = progress?.totalSteps ?? STEPS.length;
  const pct = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assistente de Implantação"
        description="Configure o Auto Parts ERP passo a passo para começar a operar."
        actions={
          <Button variant="outline" onClick={() => autoDetect.mutate()} isLoading={autoDetect.isPending}>
            <Wand2 className="size-4" /> Detectar automaticamente
          </Button>
        }
      />

      {progress?.completedAt && (
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 text-center">
          <CheckCircle2 className="mx-auto size-8 text-primary" />
          <p className="mt-2 font-medium">Configuração concluída!</p>
          <p className="text-sm text-muted-foreground">Seu Auto Parts ERP está pronto para operar.</p>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span>{completedCount} de {totalCount} etapas concluídas</span>
            <span className="font-numeric font-medium">{pct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div> : STEPS.map((step, i) => {
          const done = progress?.steps[step.id] ?? false;
          return (
            <Card key={step.id} className={done ? 'opacity-60' : ''}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full">
                  {done ? <CheckCircle2 className="size-6 text-primary" /> : <Circle className="size-6 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Etapa {i + 1}</span>
                    {!done && progress?.currentStep === i && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">Atual</span>}
                  </div>
                  <p className="font-medium text-sm">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                <div className="flex gap-2">
                  {!done && (
                    <>
                      <Button variant="outline" size="sm" asChild><Link to={step.path}>Configurar</Link></Button>
                      <Button variant="ghost" size="sm" onClick={() => completeStep.mutate(step.id)}>Marcar concluído</Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
