import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from '@/hooks/useTheme';
import { useWorkspaceStore } from '@/stores/workspace.store';
import {
  useSettingsStore,
  type Currency,
  type DateFormat,
  type Language,
  type TimeFormat,
} from '@/stores/settings.store';

/**
 * Configurações Globais do Shell: Tema, Idioma, Moeda, Formato de Data/Hora
 * e a Empresa/Filial ativas. Todos os campos reutilizam exclusivamente
 * `Select`/`Card`/`Label` do Design System — nenhum input novo foi criado.
 * Preferências por módulo de negócio (ex: regras fiscais) pertencem às
 * próprias telas de configuração desses módulos nas próximas sprints.
 */
export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { language, currency, dateFormat, timeFormat, setLanguage, setCurrency, setDateFormat, setTimeFormat } = useSettingsStore();
  const { companies, branches, activeCompanyId, activeBranchId } = useWorkspaceStore();

  const activeCompany = companies.find((c) => c.id === activeCompanyId);
  const activeBranch = branches.find((b) => b.id === activeBranchId);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Configurações" description="Preferências globais da sua conta e da sua sessão de trabalho." />

      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>Tema visual da interface.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Tema</Label>
            <Select value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Escuro</SelectItem>
                <SelectItem value="system">Seguir o sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Localização</CardTitle>
          <CardDescription>Idioma, moeda e formatos de exibição de data e hora.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Idioma</Label>
            <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es-ES">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Moeda</Label>
            <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">Real (R$)</SelectItem>
                <SelectItem value="USD">Dólar (US$)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Formato de data</Label>
            <Select value={dateFormat} onValueChange={(value) => setDateFormat(value as DateFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/AAAA</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/AAAA</SelectItem>
                <SelectItem value="YYYY-MM-DD">AAAA-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Formato de hora</Label>
            <Select value={timeFormat} onValueChange={(value) => setTimeFormat(value as TimeFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 horas</SelectItem>
                <SelectItem value="12h">12 horas (AM/PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empresa e Filial</CardTitle>
          <CardDescription>Contexto ativo da sua sessão (use o seletor no topo da tela para trocar rapidamente).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Empresa ativa</Label>
            <p className="text-sm text-muted-foreground">
              {activeCompany ? (activeCompany.tradeName ?? activeCompany.legalName) : 'Nenhuma empresa configurada ainda.'}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Filial ativa</Label>
            <p className="text-sm text-muted-foreground">{activeBranch ? activeBranch.name : 'Nenhuma filial configurada ainda.'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
