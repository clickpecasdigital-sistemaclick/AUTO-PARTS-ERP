import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { usePermissions } from '@/hooks/usePermissions';
import { navItems } from '@/navigation/nav-items';
import { categoryLabels, type NavCategory, type NavItem } from '@/navigation/nav-types';
import { cn } from '@/utils/cn';

const categoryOrder: NavCategory[] = ['gestao', 'administracao', 'cadastro', 'veiculo', 'financeiro', 'oficina', 'produtos', 'escrita-fiscal', 'integracao'];

/**
 * Barra de navegação horizontal (estilo ERP clássico — categoria no topo,
 * módulos e submódulos em cascata) — alternativa à Sidebar lateral.
 * Reaproveita a mesma fonte de dados (`navigation/nav-items.ts`) e o mesmo
 * checkgrid de permissões da Sidebar, então nenhum item aparece pra quem
 * não tem acesso, dos dois jeitos.
 */
export function TopNavBar() {
  const { canAccess } = usePermissions();
  const location = useLocation();

  const visibleItems = navItems.filter((item) => canAccess(item.permissions));
  const grouped = categoryOrder
    .map((category) => ({ category, items: visibleItems.filter((item) => item.category === category) }))
    .filter((g) => g.items.length > 0);

  function isActive(item: NavItem): boolean {
    if (location.pathname === item.path) return true;
    return !!item.children?.some((child) => location.pathname.startsWith(child.path));
  }

  return (
    <nav className="hidden items-center gap-0.5 md:flex">
      {grouped.map(({ category, items }) => (
        <DropdownMenu key={category}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                items.some(isActive) && 'text-primary',
              )}
            >
              {categoryLabels[category]}
              <ChevronDown className="size-3.5 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {items.map((item) =>
              item.children?.length ? (
                <DropdownMenuSub key={item.id}>
                  <DropdownMenuSubTrigger>
                    <item.icon className="mr-2 size-4" />
                    {item.label}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem asChild>
                        <Link to={item.path}>Visão geral</Link>
                      </DropdownMenuItem>
                      {item.children.map((child) => (
                        <DropdownMenuItem key={child.id} asChild>
                          <Link to={child.path} className="flex items-center gap-2">
                            <child.icon className="size-4" />
                            {child.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              ) : (
                <DropdownMenuItem key={item.id} asChild>
                  <Link to={item.path} className="flex items-center gap-2">
                    <item.icon className="size-4" />
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>
              ),
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </nav>
  );
}
