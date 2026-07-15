import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Logo } from '@/components/shell/Logo';
import { SidebarNav } from '@/layouts/components/SidebarNav';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * Sidebar fixa do Shell (desktop/tablet — ver `MobileSidebarDrawer` para o
 * equivalente mobile, que reaproveita `SidebarNav` sem duplicar lógica).
 * Colapsável e com estado persistido (`useSidebarStore`, controlado pelo
 * `MainLayout`). Layout fixo — nenhum módulo de negócio deve modificar
 * este componente, apenas registrar seus itens em `navigation/nav-items.ts`.
 */
export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-sticky hidden flex-col border-r border-sidebar-border bg-sidebar md:flex',
        'text-sidebar-foreground transition-all duration-base ease-out-smooth',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && <Logo />}
        <button
          onClick={onToggle}
          className="ml-auto rounded-md p-1.5 transition-colors duration-base hover:bg-sidebar-accent"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      <SidebarNav collapsed={collapsed} />

      <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground/60">
        {!collapsed && <span>v0.1.0 · AutoCore ERP</span>}
      </div>
    </aside>
  );
}
