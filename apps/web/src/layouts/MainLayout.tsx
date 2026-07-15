import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/layouts/components/Sidebar';
import { MobileSidebarDrawer } from '@/layouts/components/MobileSidebarDrawer';
import { Navbar } from '@/layouts/components/Navbar';
import { CopilotWidget } from '@/modules/copilot/components/CopilotWidget';
import { Footer } from '@/components/ui/footer';
import { PageTransition } from '@/components/motion';
import { CommandPalette } from '@/components/shell/CommandPalette';
import { RouteProgressBar } from '@/components/shell/RouteProgressBar';
import { OfflineBanner } from '@/components/shell/OfflineBanner';
import { LoadingOverlay } from '@/components/shell/LoadingOverlay';
import { useRouteMiddleware } from '@/app/middlewares/useRouteMiddleware';
import { useSidebarStore } from '@/stores/sidebar.store';
import { cn } from '@/utils/cn';

/**
 * Layout principal autenticado — o "Application Shell" do AutoCore ERP.
 * Sidebar (fixa em desktop/tablet, Drawer em mobile — Mobile First) +
 * Navbar + área central (com Breadcrumb embutido via PageHeader) + Footer,
 * mais a camada transversal do Shell (Command Palette, barra de progresso
 * de rota, banner de offline, loading overlay global).
 *
 * Este componente é fixo: nenhum módulo de negócio deve alterá-lo — apenas
 * registrar rotas (app/router.tsx) e itens de navegação (navigation/nav-items.ts).
 */
export function MainLayout() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggleSidebar = useSidebarStore((s) => s.toggle);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useRouteMiddleware();

  return (
    <div className="min-h-screen bg-background">
      <RouteProgressBar />
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <MobileSidebarDrawer open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-base ease-out-smooth',
          collapsed ? 'md:ml-[72px]' : 'md:ml-64',
        )}
      >
        <OfflineBanner />
        <Navbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
        <Footer />
      </div>
      <CommandPalette />
      <LoadingOverlay />
      <CopilotWidget />
    </div>
  );
}
