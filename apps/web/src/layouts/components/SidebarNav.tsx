import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Clock, Search, Star } from 'lucide-react';
import { cn } from '@/utils/cn';
import { navItems } from '@/navigation/nav-items';
import { categoryLabels, type NavCategory, type NavItem } from '@/navigation/nav-types';
import { usePermissions } from '@/hooks/usePermissions';
import { useFavoritesStore } from '@/stores/favorites.store';
import { useRecentsStore } from '@/stores/recents.store';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const categoryOrder: NavCategory[] = ['operacional', 'comercial', 'financeiro', 'gestao', 'sistema'];

interface SidebarNavProps {
  collapsed: boolean;
  /** Chamado ao navegar para um item — usado para fechar o Drawer no mobile. */
  onNavigate?: () => void;
}

/**
 * Conteúdo de navegação da Sidebar (busca, Favoritos, Recentes, categorias,
 * indicador de módulo ativo, filtragem por permissão). Extraído de
 * `Sidebar.tsx` para ser reaproveitado tanto na Sidebar fixa (desktop/
 * tablet) quanto dentro do `Drawer` no mobile (`MobileSidebarDrawer.tsx`)
 * —zero duplicação de markup/lógica entre os dois breakpoints.
 */
export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const location = useLocation();
  const { canAccess } = usePermissions();
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const recentIds = useRecentsStore((s) => s.recentIds);
  const [search, setSearch] = React.useState('');

  const visibleItems = React.useMemo(() => navItems.filter((item) => canAccess(item.permissions)), [canAccess]);

  const filteredItems = React.useMemo(() => {
    if (!search.trim()) return visibleItems;
    const normalized = search.toLowerCase();
    return visibleItems.filter((item) => item.label.toLowerCase().includes(normalized));
  }, [visibleItems, search]);

  const favoriteItems = visibleItems.filter((item) => favoriteIds.includes(item.id));
  const recentItems = recentIds.map((id) => visibleItems.find((item) => item.id === id)).filter(Boolean) as NavItem[];

  const groupedByCategory = categoryOrder
    .map((category) => ({ category, items: filteredItems.filter((item) => item.category === category) }))
    .filter((group) => group.items.length > 0);

  function renderNavLink(item: NavItem) {
    const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
    const isFavorite = favoriteIds.includes(item.id);

    const link = (
      <NavLink
        to={item.path}
        onClick={onNavigate}
        className={cn(
          'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-base',
          'hover:bg-sidebar-accent',
          isActive && 'bg-sidebar-accent text-white shadow-xs',
          collapsed && 'justify-center px-0',
        )}
      >
        <item.icon className="size-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && (
              <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{item.badge}</span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(item.id);
              }}
              className={cn(
                'opacity-0 transition-opacity duration-base group-hover:opacity-100',
                isFavorite && 'opacity-100 text-warning',
              )}
              aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Star className="size-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </>
        )}
      </NavLink>
    );

    if (!collapsed) return <li key={item.id}>{link}</li>;

    return (
      <li key={item.id}>
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      </li>
    );
  }

  return (
    <>
      {!collapsed && (
        <div className="px-3 pb-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar módulo..."
            leftIcon={<Search />}
            className="h-9 border-sidebar-border bg-sidebar-accent/40 text-sidebar-foreground placeholder:text-sidebar-foreground/50"
          />
        </div>
      )}

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-2 scrollbar-thin">
        {!search && favoriteItems.length > 0 && (
          <div>
            {!collapsed && (
              <p className="flex items-center gap-1.5 px-3 pb-1 text-xs font-medium uppercase tracking-wide text-sidebar-foreground/50">
                <Star className="size-3" /> Favoritos
              </p>
            )}
            <ul className="space-y-0.5">{favoriteItems.map(renderNavLink)}</ul>
          </div>
        )}

        {!search && recentItems.length > 0 && (
          <div>
            {!collapsed && (
              <p className="flex items-center gap-1.5 px-3 pb-1 text-xs font-medium uppercase tracking-wide text-sidebar-foreground/50">
                <Clock className="size-3" /> Recentes
              </p>
            )}
            <ul className="space-y-0.5">{recentItems.map(renderNavLink)}</ul>
          </div>
        )}

        {groupedByCategory.map(({ category, items }) => (
          <div key={category}>
            {!collapsed && (
              <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-sidebar-foreground/50">
                {categoryLabels[category]}
              </p>
            )}
            <ul className="space-y-0.5">{items.map(renderNavLink)}</ul>
          </div>
        ))}

        {search && filteredItems.length === 0 && !collapsed && (
          <p className="px-3 text-sm text-sidebar-foreground/50">Nenhum módulo encontrado.</p>
        )}
      </nav>
    </>
  );
}
