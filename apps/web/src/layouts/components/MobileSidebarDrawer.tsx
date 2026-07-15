import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Logo } from '@/components/shell/Logo';
import { SidebarNav } from '@/layouts/components/SidebarNav';

interface MobileSidebarDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Equivalente da Sidebar para viewport mobile (< 768px — abaixo do
 * breakpoint `md`). Reaproveita o `Drawer` do Design System (Sprint 03) e o
 * `SidebarNav` (mesma lógica/markup da Sidebar fixa) — nenhum componente
 * novo de navegação foi criado, apenas uma composição diferente dos
 * mesmos blocos para a tela pequena (requisito: Mobile First).
 */
export function MobileSidebarDrawer({ open, onOpenChange }: MobileSidebarDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
        <div className="flex h-16 items-center px-4">
          <Logo />
        </div>
        <SidebarNav collapsed={false} onNavigate={() => onOpenChange(false)} />
      </DrawerContent>
    </Drawer>
  );
}
