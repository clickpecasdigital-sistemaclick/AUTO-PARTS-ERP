import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MobileSidebarDrawer } from '@/layouts/components/MobileSidebarDrawer';
import { Navbar } from '@/layouts/components/Navbar';
import { TopNavBar } from '@/layouts/components/TopNavBar';
import { CopilotWidget } from '@/modules/copilot/components/CopilotWidget';
import { Footer } from '@/components/ui/footer';
import { PageTransition } from '@/components/motion';
import { CommandPalette } from '@/components/shell/CommandPalette';
import { RouteProgressBar } from '@/components/shell/RouteProgressBar';
import { OfflineBanner } from '@/components/shell/OfflineBanner';
import { LoadingOverlay } from '@/components/shell/LoadingOverlay';
import { useRouteMiddleware } from '@/app/middlewares/useRouteMiddleware';

/**
 * Layout principal autenticado — o "Application Shell" do Auto Parts ERP.
 * Menu horizontal no topo (categoria > módulo > submódulo, em cascata,
 * inspirado em referências de ERPs automotivos) + área central (com
 * Breadcrumb embutido via PageHeader) + Footer, mais a camada transversal
 * do Shell (Command Palette, barra de progresso de rota, banner de
 * offline, loading overlay global).
 *
 * Este componente é fixo: nenhum módulo de negócio deve alterá-lo — apenas
 * registrar rotas (app/router.tsx) e itens de navegação (navigation/nav-items.ts).
 */
export function MainLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useRouteMiddleware();

  return (
    <div className="min-h-screen bg-background">
      <RouteProgressBar />
      <MobileSidebarDrawer open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <div className="flex min-h-screen flex-col">
        <OfflineBanner />
        <Navbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <div className="sticky top-16 z-sticky border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
          <TopNavBar />
        </div>
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
