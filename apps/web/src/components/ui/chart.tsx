import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { chartPalette } from '@/config/design-tokens';

interface SeriesConfig {
  key: string;
  label: string;
  /** Opcional — se omitido, usa a paleta oficial do Design System (chartPalette) na ordem das séries. */
  color?: string;
}

interface ChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  series: SeriesConfig[];
  height?: number;
}

/**
 * Wrappers finos sobre Recharts com os tokens visuais do Design System,
 * para que cada módulo (BI de Vendas, Financeiro, Estoque) não precise
 * reconfigurar grid/tooltip/legenda manualmente.
 */
export function LineChartWidget({ data, xKey, series, height = 300 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey={xKey} className="text-xs fill-muted-foreground" />
        <YAxis className="text-xs fill-muted-foreground" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgb(var(--popover))',
            border: '1px solid rgb(var(--border))',
            borderRadius: 'var(--radius)',
          }}
        />
        <Legend />
        {series.map((s, i) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color ?? chartPalette[i % chartPalette.length]} strokeWidth={2} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BarChartWidget({ data, xKey, series, height = 300 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey={xKey} className="text-xs fill-muted-foreground" />
        <YAxis className="text-xs fill-muted-foreground" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgb(var(--popover))',
            border: '1px solid rgb(var(--border))',
            borderRadius: 'var(--radius)',
          }}
        />
        <Legend />
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color ?? chartPalette[i % chartPalette.length]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
