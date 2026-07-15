import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { buildBreadcrumbTrail } from '@/navigation/nav-items';
import type { BreadcrumbItem } from '@/types/navigation.types';

interface BreadcrumbProps {
  /** Override manual — só necessário em casos muito específicos. Por padrão (omitido), a trilha é gerada automaticamente a partir da rota atual. */
  items?: BreadcrumbItem[];
}

/**
 * Breadcrumb automático: deriva a trilha a partir da rota atual e do
 * catálogo `navigation/nav-items.ts` — nenhuma página precisa declarar seu
 * próprio breadcrumb manualmente.
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  const location = useLocation();
  const trail = items ?? buildBreadcrumbTrail(location.pathname);

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link to="/dashboard" className="flex items-center hover:text-foreground">
        <Home className="size-3.5" />
      </Link>
      {trail.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          <ChevronRight className="size-3.5" />
          {item.path ? (
            <Link to={item.path} className="hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
