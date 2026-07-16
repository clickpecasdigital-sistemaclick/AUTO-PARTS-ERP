import { useState } from 'react';
import { ExternalLink, Link2, Link2Off } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Badge } from '@/components/ui/badge';
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
import { useConnectMercadoLivre, useDisconnectMercadoLivre, useMercadoLivreStatus } from '../services/mercado-livre.service';

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
  const { data: mlStatus } = useMercadoLivreStatus();
  const connectMl = useConnectMercadoLivre();
  const disconnectMl = useDisconnectMercadoLivre();
  const [mlClientId, setMlClientId] = useState('');
  const [mlClientSecret, setMlClientSecret] = useState('');
  const redirectUri = `${import.meta.env.VITE_API_URL ?? ''}/integrations/mercado-livre/callback`;

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

      <Card>
        <CardHeader>
          <CardTitle>Integração — Mercado Livre</CardTitle>
          <CardDescription>
            Conecte sua conta de vendedor do Mercado Livre. Crie um app em{' '}
            <a href="https://developers.mercadolivre.com.br" target="_blank" rel="noreferrer" className="text-primary underline">
              developers.mercadolivre.com.br <ExternalLink className="inline size-3" />
            </a>{' '}
            e cole a URL de redirecionamento abaixo lá, exatamente como está.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mlStatus?.connected ? (
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div className="flex items-center gap-2">
                <Badge variant="success">Conectado</Badge>
                <span className="text-sm">{mlStatus.mlNickname}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => disconnectMl.mutate()} isLoading={disconnectMl.isPending}>
                <Link2Off /> Desconectar
              </Button>
            </div>
          ) : (
            <>
              <FormField label="URL de redirecionamento (cole no app do Mercado Livre)">
                <Input value={redirectUri} readOnly onFocus={(e) => e.target.select()} className="font-numeric text-xs" />
              </FormField>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Client ID (App ID)" required>
                  <Input value={mlClientId} onChange={(e) => setMlClientId(e.target.value)} />
                </FormField>
                <FormField label="Client Secret" required>
                  <Input type="password" value={mlClientSecret} onChange={(e) => setMlClientSecret(e.target.value)} />
                </FormField>
              </div>
              <Button
                onClick={() => connectMl.mutate({ clientId: mlClientId, clientSecret: mlClientSecret, redirectUri })}
                isLoading={connectMl.isPending}
                disabled={!mlClientId || !mlClientSecret}
              >
                <Link2 /> Conectar ao Mercado Livre
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
