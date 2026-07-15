import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, Calendar as CalendarIcon, Gauge, ListChecks } from 'lucide-react';
import { StatsCard } from '@/components/ui/stats-card';
import { Calendar } from '@/components/ui/calendar';
import { EmptyState } from '@/components/common/EmptyState';
import type { DashboardWidgetInstance } from '@/stores/dashboard-layout.store';

export interface WidgetDefinition {
  type: string;
  label: string;
  description: string;
  icon: LucideIcon;
  defaultSpan: DashboardWidgetInstance['span'];
  render: () => ReactNode;
}

/**
 * Catálogo de tipos de widget disponíveis para o Dashboard. Nenhum widget
 * aqui exibe dado de negócio inventado — são placeholders estruturais
 * (preparados para receber dados reais quando os módulos correspondentes
 * existirem) ou utilitários genuinamente funcionais (ex: Calendário).
 * Novos widgets de módulos futuros (ex: "Vendas do dia") só precisam
 * registrar uma entrada aqui — o grid, drag-and-drop e persistência de
 * layout já funcionam para qualquer widget novo automaticamente.
 */
export const widgetRegistry: Record<string, WidgetDefinition> = {
  kpi: {
    type: 'kpi',
    label: 'Indicador (KPI)',
    description: 'Card de métrica única — conecte a um módulo para exibir o valor real.',
    icon: Gauge,
    defaultSpan: 3,
    render: () => <StatsCard label="Aguardando módulo" value="—" icon={Gauge} />,
  },
  chart: {
    type: 'chart',
    label: 'Gráfico',
    description: 'Espaço reservado para um gráfico de linha/barra de um módulo.',
    icon: BarChart3,
    defaultSpan: 6,
    render: () => (
      <EmptyState icon={BarChart3} title="Nenhum dado para exibir" description="Este gráfico será preenchido quando um módulo de negócio for conectado a ele." />
    ),
  },
  list: {
    type: 'list',
    label: 'Lista recente',
    description: 'Espaço reservado para uma lista (ex: últimos pedidos, OS abertas).',
    icon: ListChecks,
    defaultSpan: 4,
    render: () => (
      <EmptyState icon={ListChecks} title="Nenhum registro ainda" description="Esta lista será preenchida quando um módulo de negócio for conectado a ela." />
    ),
  },
  calendar: {
    type: 'calendar',
    label: 'Calendário',
    description: 'Calendário de referência rápida (agenda completa chega com o módulo de CRM).',
    icon: CalendarIcon,
    defaultSpan: 4,
    render: () => <Calendar mode="single" className="mx-auto" />,
  },
};

export const widgetDefinitionsList = Object.values(widgetRegistry);
