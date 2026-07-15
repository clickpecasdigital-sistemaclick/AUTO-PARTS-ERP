import { lazy, Suspense, type JSX, type LazyExoticComponent } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { AuthGuard } from '@/app/guards/AuthGuard';
import { PermissionGuard } from '@/app/guards/PermissionGuard';
import { moduleRoutes } from '@/app/routes/module-routes';
import { navItems } from '@/navigation/nav-items';
import { NotFoundPage, UnauthorizedPage, ForbiddenPage, ServerErrorPage, OfflinePage } from '@/pages/errors';

// Lazy loading + code splitting por página/módulo.
const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/modules/auth/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@/modules/dashboard/pages/DashboardPage'));
const SettingsPage = lazy(() => import('@/modules/settings/pages/SettingsPage'));
const ProductListPage = lazy(() => import('@/modules/products/pages/ProductListPage'));
const ProductFormPage = lazy(() => import('@/modules/products/pages/ProductFormPage'));
const InventoryDashboardPage = lazy(() => import('@/modules/inventory/pages/InventoryDashboardPage'));
const StockMovementsPage = lazy(() => import('@/modules/inventory/pages/StockMovementsPage'));
const StockTransfersPage = lazy(() => import('@/modules/inventory/pages/StockTransfersPage'));
const StockInventoriesPage = lazy(() => import('@/modules/inventory/pages/StockInventoriesPage'));
const StockInventoryDetailPage = lazy(() => import('@/modules/inventory/pages/StockInventoryDetailPage'));
const PurchasingDashboardPage = lazy(() => import('@/modules/purchasing/pages/PurchasingDashboardPage'));
const PurchaseRequestsPage = lazy(() => import('@/modules/purchasing/pages/PurchaseRequestsPage'));
const PurchaseQuotationsPage = lazy(() => import('@/modules/purchasing/pages/PurchaseQuotationsPage'));
const PurchaseOrdersPage = lazy(() => import('@/modules/purchasing/pages/PurchaseOrdersPage'));
const GoodsReceiptsPage = lazy(() => import('@/modules/purchasing/pages/GoodsReceiptsPage'));
const CustomersListPage = lazy(() => import('@/modules/mdm/pages/CustomersListPage'));
const CustomerCreatePage = lazy(() => import('@/modules/mdm/pages/CustomerCreatePage'));
const Customer360Page = lazy(() => import('@/modules/mdm/pages/Customer360Page'));
const CrmDashboardPage = lazy(() => import('@/modules/crm/pages/CrmDashboardPage'));
const CrmPipelinePage = lazy(() => import('@/modules/crm/pages/CrmPipelinePage'));
const PdvDashboardPage = lazy(() => import('@/modules/pdv/pages/PdvDashboardPage'));
const PdvSalePage = lazy(() => import('@/modules/pdv/pages/PdvSalePage'));
const PdvQuotesPage = lazy(() => import('@/modules/pdv/pages/PdvQuotesPage'));
const PdvOrdersPage = lazy(() => import('@/modules/pdv/pages/PdvOrdersPage'));
const PdvCashRegisterPage = lazy(() => import('@/modules/pdv/pages/PdvCashRegisterPage'));
const PdvReturnsPage = lazy(() => import('@/modules/pdv/pages/PdvReturnsPage'));
const FinancialDashboardPage = lazy(() => import('@/modules/financial/pages/FinancialDashboardPage'));
const PayablesPage = lazy(() => import('@/modules/financial/pages/PayablesPage'));
const ReceivablesPage = lazy(() => import('@/modules/financial/pages/ReceivablesPage'));
const WorkshopDashboardPage = lazy(() => import('@/modules/workshop/pages/WorkshopDashboardPage'));
const ServiceOrdersListPage = lazy(() => import('@/modules/workshop/pages/ServiceOrdersListPage'));
const ServiceOrderCreatePage = lazy(() => import('@/modules/workshop/pages/ServiceOrderCreatePage'));
const ServiceOrderDetailPage = lazy(() => import('@/modules/workshop/pages/ServiceOrderDetailPage'));
const WorkshopAgendaPage = lazy(() => import('@/modules/workshop/pages/WorkshopAgendaPage'));
const FiscalMonitorPage = lazy(() => import('@/modules/fiscal/pages/FiscalMonitorPage'));
const FiscalInvoiceListPage = lazy(() => import('@/modules/fiscal/pages/FiscalInvoiceListPage'));
const FiscalConfigPage = lazy(() => import('@/modules/fiscal/pages/FiscalConfigPage'));
const ExecutiveDashboardPage = lazy(() => import('@/modules/bi/pages/ExecutiveDashboardPage'));
const AiAssistantPage = lazy(() => import('@/modules/bi/pages/AiAssistantPage'));
const AlertsCenterPage = lazy(() => import('@/modules/bi/pages/AlertsCenterPage'));
const PlansPage = lazy(() => import('@/modules/saas/pages/PlansPage'));
const SuperAdminDashboardPage = lazy(() => import('@/modules/saas/pages/SuperAdminDashboardPage'));
const SetupWizardPage = lazy(() => import('@/modules/setup-wizard/pages/SetupWizardPage'));

function withSuspense(Component: LazyExoticComponent<() => JSX.Element>) {
  return (
    <Suspense fallback={<LoadingScreen fullScreen={false} />}>
      <Component />
    </Suspense>
  );
}

const dashboardNavItem = navItems.find((item) => item.id === 'dashboard')!;
const settingsNavItem = navItems.find((item) => item.id === 'configuracoes')!;
const productsNavItem = navItems.find((item) => item.id === 'produtos')!;
const stockNavItem = navItems.find((item) => item.id === 'estoque')!;
const purchasingNavItem = navItems.find((item) => item.id === 'compras')!;
const customersNavItem = navItems.find((item) => item.id === 'clientes')!;
const crmNavItem = navItems.find((item) => item.id === 'crm')!;
const pdvNavItem = navItems.find((item) => item.id === 'pdv')!;
const financialNavItem = navItems.find((item) => item.id === 'financeiro')!;
const workshopNavItem = navItems.find((item) => item.id === 'oficina')!;
const fiscalNavItem = navItems.find((item) => item.id === 'fiscal')!;
const biNavItem = navItems.find((item) => item.id === 'ia')!;
const planosNavItem = navItems.find((item) => item.id === 'planos')!;
const superAdminNavItem = navItems.find((item) => item.id === 'superadmin')!;

/**
 * Árvore de rotas raiz do AutoCore ERP — o "Sistema de Rotas" da Sprint 04.
 *
 * - Rotas públicas (`AuthLayout`): login/registro.
 * - Rotas protegidas (`AuthGuard` + `MainLayout`): Dashboard, Configurações
 *   (implementados nesta sprint) + TODAS as rotas de módulo de negócio
 *   geradas automaticamente a partir de `navigation/nav-items.ts`
 *   (`moduleRoutes` — PDV, Estoque, Compras, Financeiro, Caixa, Clientes,
 *   Fornecedores, Produtos, Oficina, CRM, Relatórios, IA, Fiscal/NF-e,
 *   Usuários), cada uma já protegida por `PermissionGuard`.
 * - `*` cai na página 404 — sempre dentro do Shell (Sidebar/Navbar
 *   continuam visíveis, conforme o padrão de produtos enterprise).
 *
 * Módulos de negócio futuros (Sprint 05+) NÃO devem adicionar rotas aqui:
 * apenas substituir o elemento da rota correspondente em `moduleRoutes`
 * (trocando `ModulePlaceholderPage` pela página real) e, se precisarem de
 * sub-rotas de detalhe (ex: `/produtos/:id`), registrá-las como `children`
 * daquele item em `navigation/nav-items.ts`.
 */
export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: withSuspense(LoginPage) },
      { path: '/register', element: withSuspense(RegisterPage) },
    ],
  },
  {
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: dashboardNavItem.path,
        element: (
          <PermissionGuard permissions={dashboardNavItem.permissions}>{withSuspense(DashboardPage)}</PermissionGuard>
        ),
      },
      {
        path: settingsNavItem.path,
        element: (
          <PermissionGuard permissions={settingsNavItem.permissions}>{withSuspense(SettingsPage)}</PermissionGuard>
        ),
      },
      {
        path: productsNavItem.path,
        element: (
          <PermissionGuard permissions={productsNavItem.permissions}>{withSuspense(ProductListPage)}</PermissionGuard>
        ),
      },
      {
        path: `${productsNavItem.path}/novo`,
        element: (
          <PermissionGuard permissions={{ module: 'products', required: ['create'] }}>
            {withSuspense(ProductFormPage)}
          </PermissionGuard>
        ),
      },
      {
        path: `${productsNavItem.path}/:id`,
        element: (
          <PermissionGuard permissions={{ module: 'products', required: ['view'] }}>
            {withSuspense(ProductFormPage)}
          </PermissionGuard>
        ),
      },
      {
        path: stockNavItem.path,
        element: (
          <PermissionGuard permissions={stockNavItem.permissions}>{withSuspense(InventoryDashboardPage)}</PermissionGuard>
        ),
      },
      {
        path: `${stockNavItem.path}/movimentacoes`,
        element: (
          <PermissionGuard permissions={{ module: 'stock', required: ['view'] }}>{withSuspense(StockMovementsPage)}</PermissionGuard>
        ),
      },
      {
        path: `${stockNavItem.path}/transferencias`,
        element: (
          <PermissionGuard permissions={{ module: 'stock', required: ['view'] }}>{withSuspense(StockTransfersPage)}</PermissionGuard>
        ),
      },
      {
        path: `${stockNavItem.path}/inventarios`,
        element: (
          <PermissionGuard permissions={{ module: 'stock', required: ['view'] }}>{withSuspense(StockInventoriesPage)}</PermissionGuard>
        ),
      },
      {
        path: `${stockNavItem.path}/inventarios/:id`,
        element: (
          <PermissionGuard permissions={{ module: 'stock', required: ['view'] }}>{withSuspense(StockInventoryDetailPage)}</PermissionGuard>
        ),
      },
      {
        path: purchasingNavItem.path,
        element: (
          <PermissionGuard permissions={purchasingNavItem.permissions}>{withSuspense(PurchasingDashboardPage)}</PermissionGuard>
        ),
      },
      {
        path: `${purchasingNavItem.path}/solicitacoes`,
        element: (
          <PermissionGuard permissions={{ module: 'purchases', required: ['view'] }}>{withSuspense(PurchaseRequestsPage)}</PermissionGuard>
        ),
      },
      {
        path: `${purchasingNavItem.path}/cotacoes`,
        element: (
          <PermissionGuard permissions={{ module: 'purchases', required: ['view'] }}>{withSuspense(PurchaseQuotationsPage)}</PermissionGuard>
        ),
      },
      {
        path: `${purchasingNavItem.path}/pedidos`,
        element: (
          <PermissionGuard permissions={{ module: 'purchases', required: ['view'] }}>{withSuspense(PurchaseOrdersPage)}</PermissionGuard>
        ),
      },
      {
        path: `${purchasingNavItem.path}/recebimentos`,
        element: (
          <PermissionGuard permissions={{ module: 'purchases', required: ['view'] }}>{withSuspense(GoodsReceiptsPage)}</PermissionGuard>
        ),
      },
      {
        path: customersNavItem.path,
        element: (
          <PermissionGuard permissions={customersNavItem.permissions}>{withSuspense(CustomersListPage)}</PermissionGuard>
        ),
      },
      {
        path: `${customersNavItem.path}/novo`,
        element: (
          <PermissionGuard permissions={{ module: 'customers', required: ['create'] }}>{withSuspense(CustomerCreatePage)}</PermissionGuard>
        ),
      },
      {
        path: `${customersNavItem.path}/:id`,
        element: (
          <PermissionGuard permissions={{ module: 'customers', required: ['view'] }}>{withSuspense(Customer360Page)}</PermissionGuard>
        ),
      },
      {
        path: crmNavItem.path,
        element: (
          <PermissionGuard permissions={crmNavItem.permissions}>{withSuspense(CrmDashboardPage)}</PermissionGuard>
        ),
      },
      {
        path: `${crmNavItem.path}/pipeline`,
        element: (
          <PermissionGuard permissions={{ module: 'crm', required: ['view'] }}>{withSuspense(CrmPipelinePage)}</PermissionGuard>
        ),
      },
      {
        path: pdvNavItem.path,
        element: (
          <PermissionGuard permissions={pdvNavItem.permissions}>{withSuspense(PdvDashboardPage)}</PermissionGuard>
        ),
      },
      {
        path: `${pdvNavItem.path}/venda`,
        element: (
          <PermissionGuard permissions={{ module: 'sales', required: ['create'] }}>{withSuspense(PdvSalePage)}</PermissionGuard>
        ),
      },
      {
        path: `${pdvNavItem.path}/orcamentos`,
        element: (
          <PermissionGuard permissions={{ module: 'sales', required: ['view'] }}>{withSuspense(PdvQuotesPage)}</PermissionGuard>
        ),
      },
      {
        path: `${pdvNavItem.path}/pedidos`,
        element: (
          <PermissionGuard permissions={{ module: 'sales', required: ['view'] }}>{withSuspense(PdvOrdersPage)}</PermissionGuard>
        ),
      },
      {
        path: `${pdvNavItem.path}/caixa`,
        element: (
          <PermissionGuard permissions={{ module: 'sales', required: ['view'] }}>{withSuspense(PdvCashRegisterPage)}</PermissionGuard>
        ),
      },
      {
        path: `${pdvNavItem.path}/devolucoes`,
        element: (
          <PermissionGuard permissions={{ module: 'sales', required: ['view'] }}>{withSuspense(PdvReturnsPage)}</PermissionGuard>
        ),
      },
      {
        path: financialNavItem.path,
        element: (
          <PermissionGuard permissions={financialNavItem.permissions}>{withSuspense(FinancialDashboardPage)}</PermissionGuard>
        ),
      },
      {
        path: `${financialNavItem.path}/contas-a-pagar`,
        element: (
          <PermissionGuard permissions={{ module: 'financial', required: ['view'] }}>{withSuspense(PayablesPage)}</PermissionGuard>
        ),
      },
      {
        path: `${financialNavItem.path}/contas-a-receber`,
        element: (
          <PermissionGuard permissions={{ module: 'financial', required: ['view'] }}>{withSuspense(ReceivablesPage)}</PermissionGuard>
        ),
      },
      {
        path: workshopNavItem.path,
        element: (
          <PermissionGuard permissions={workshopNavItem.permissions}>{withSuspense(WorkshopDashboardPage)}</PermissionGuard>
        ),
      },
      {
        path: `${workshopNavItem.path}/ordens`,
        element: (
          <PermissionGuard permissions={{ module: 'workshop', required: ['view'] }}>{withSuspense(ServiceOrdersListPage)}</PermissionGuard>
        ),
      },
      {
        path: `${workshopNavItem.path}/ordens/nova`,
        element: (
          <PermissionGuard permissions={{ module: 'workshop', required: ['create'] }}>{withSuspense(ServiceOrderCreatePage)}</PermissionGuard>
        ),
      },
      {
        path: `${workshopNavItem.path}/ordens/:id`,
        element: (
          <PermissionGuard permissions={{ module: 'workshop', required: ['view'] }}>{withSuspense(ServiceOrderDetailPage)}</PermissionGuard>
        ),
      },
      {
        path: `${workshopNavItem.path}/agenda`,
        element: (
          <PermissionGuard permissions={{ module: 'workshop', required: ['view'] }}>{withSuspense(WorkshopAgendaPage)}</PermissionGuard>
        ),
      },
      {
        path: fiscalNavItem.path,
        element: (
          <PermissionGuard permissions={fiscalNavItem.permissions}>{withSuspense(FiscalMonitorPage)}</PermissionGuard>
        ),
      },
      {
        path: `${fiscalNavItem.path}/notas`,
        element: (
          <PermissionGuard permissions={{ module: 'fiscal', required: ['view'] }}>{withSuspense(FiscalInvoiceListPage)}</PermissionGuard>
        ),
      },
      {
        path: `${fiscalNavItem.path}/configuracao`,
        element: (
          <PermissionGuard permissions={{ module: 'fiscal', required: ['view'] }}>{withSuspense(FiscalConfigPage)}</PermissionGuard>
        ),
      },
      {
        path: biNavItem.path,
        element: (
          <PermissionGuard permissions={biNavItem.permissions}>{withSuspense(ExecutiveDashboardPage)}</PermissionGuard>
        ),
      },
      {
        path: `${biNavItem.path}/ia`,
        element: (
          <PermissionGuard permissions={{ module: 'bi', required: ['view'] }}>{withSuspense(AiAssistantPage)}</PermissionGuard>
        ),
      },
      {
        path: `${biNavItem.path}/alertas`,
        element: (
          <PermissionGuard permissions={{ module: 'bi', required: ['view'] }}>{withSuspense(AlertsCenterPage)}</PermissionGuard>
        ),
      },
      {
        path: planosNavItem.path,
        element: (
          <PermissionGuard permissions={{ module: 'settings', required: ['view'] }}>{withSuspense(PlansPage)}</PermissionGuard>
        ),
      },
      {
        path: superAdminNavItem.path,
        element: (
          <PermissionGuard permissions={{ module: 'settings', required: ['view'] }}>{withSuspense(SuperAdminDashboardPage)}</PermissionGuard>
        ),
      },
      { path: '/setup-wizard', element: withSuspense(SetupWizardPage) },
      ...moduleRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/401', element: <UnauthorizedPage /> },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '/500', element: <ServerErrorPage /> },
  { path: '/offline', element: <OfflinePage /> },
  { path: '*', element: <NotFoundPage /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
