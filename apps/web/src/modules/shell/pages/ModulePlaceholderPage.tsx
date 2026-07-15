import type { LucideIcon } from 'lucide-react';
import { Construction } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';

interface ModulePlaceholderPageProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

/**
 * Página reutilizada por toda rota de módulo de negócio ainda não
 * implementado (Sprint 04 entrega apenas o Shell + Sistema de Rotas — ver
 * briefing). Garante que a rota exista, renderize dentro do layout
 * definitivo (Sidebar/Navbar/Breadcrumb) e respeite o Design System,
 * sem nenhuma lógica de negócio.
 */
export function ModulePlaceholderPage({ title, description, icon = Construction }: ModulePlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={icon}
            title="Módulo em construção"
            description="Esta área está reservada e a navegação já está pronta. A implementação completa deste módulo chega em uma próxima sprint."
          />
        </CardContent>
      </Card>
    </div>
  );
}
