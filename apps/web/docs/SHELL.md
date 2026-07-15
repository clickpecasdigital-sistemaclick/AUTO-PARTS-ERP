# AutoCore ERP — Application Shell (Sprint 04)

> Núcleo visual e estrutural do produto. **Nenhum módulo de negócio (Sprint
> 05+) deve modificar os arquivos listados aqui** — apenas (1) registrar uma
> entrada em `navigation/nav-items.ts`, (2) substituir o elemento da rota
> correspondente em `app/routes/module-routes.tsx` e (3), se precisar de um
> widget de dashboard, registrar uma entrada em
> `modules/dashboard/widgets/widget-registry.tsx`. Tudo o mais já existe.

Todo componente visual deste Shell reaproveita exclusivamente o Design
System da Sprint 03 (`components/ui/*`, `components/motion/*`) — nenhum
Button/Input/Card/Table foi recriado. Os únicos componentes **novos**
desta sprint são composições de produto (Sidebar, Navbar, Command Palette,
Notification Center etc.), não primitivos.

---

## 1. Estrutura de pastas (o que cada uma faz)

```
src/
├── app/
│   ├── router.tsx              # árvore de rotas raiz (única fonte)
│   ├── providers.tsx           # composição de providers globais (Sprint 01)
│   ├── guards/
│   │   ├── AuthGuard.tsx       # exige sessão Supabase ativa
│   │   └── PermissionGuard.tsx # exige permissões granulares (RBAC, Sprint 02)
│   ├── middlewares/
│   │   └── useRouteMiddleware.ts # roda a cada navegação (título da aba, "Recentes")
│   └── routes/
│       └── module-routes.tsx   # gera 1 rota por item de navigation/nav-items.ts
├── navigation/
│   ├── nav-types.ts            # tipos: NavItem, PermissionAction, NavCategory
│   └── nav-items.ts            # CATÁLOGO ÚNICO de todos os módulos do ERP
├── stores/                     # estado client-side (Zustand), cada um persistido
│   ├── sidebar.store.ts        # colapso da Sidebar
│   ├── favorites.store.ts      # módulos favoritos
│   ├── recents.store.ts        # módulos recentes
│   ├── workspace.store.ts      # Empresa/Filial ativas (multiempresa/multifilial)
│   ├── settings.store.ts       # idioma/moeda/formato data/hora
│   ├── dashboard-layout.store.ts # layout de widgets do Dashboard, por usuário
│   ├── command-palette.store.ts  # estado de abertura da Busca Global
│   └── loading-overlay.store.ts  # Loading Overlay global
├── layouts/
│   ├── MainLayout.tsx          # o Shell propriamente dito
│   ├── AuthLayout.tsx          # layout público (login/registro)
│   └── components/
│       ├── Sidebar.tsx         # Sidebar fixa (desktop/tablet)
│       ├── SidebarNav.tsx      # conteúdo de navegação (reaproveitado por Sidebar E pelo Drawer mobile)
│       ├── MobileSidebarDrawer.tsx # equivalente mobile (Drawer do Design System)
│       ├── Navbar.tsx          # Navbar premium
│       └── Breadcrumb.tsx      # automático, a partir da rota
├── components/shell/            # composições do Shell (não são primitivos do Design System)
│   ├── Logo.tsx, CommandPalette.tsx, NotificationCenter.tsx,
│   ├── CompanyBranchSwitcher.tsx, UserMenu.tsx, LanguageSwitcher.tsx,
│   └── IconPopoverPlaceholder.tsx, RouteProgressBar.tsx, OfflineBanner.tsx, LoadingOverlay.tsx
├── pages/errors/                 # 401, 403, 404, 500, Offline
├── modules/
│   ├── shell/pages/ModulePlaceholderPage.tsx  # usada por TODA rota de módulo ainda não implementado
│   ├── dashboard/                              # Dashboard Base + sistema de widgets
│   └── settings/pages/SettingsPage.tsx         # Configurações Globais (implementada de verdade)
└── hooks/
    ├── usePermissions.ts        # RBAC granular (view/create/update/delete/export/print/approve/cancel)
    ├── useRealtimeNotifications.ts # estrutura Supabase Realtime para `notifications`
    ├── useOnlineStatus.ts
    └── useKeyboardShortcut.ts   # usado pelo Ctrl+K
```

---

## 2. Sistema de Rotas

`navigation/nav-items.ts` é a **fonte única de verdade**: cada entrada gera
automaticamente (via `app/routes/module-routes.tsx`) uma rota protegida por
`PermissionGuard`, renderizando `ModulePlaceholderPage` até que o módulo
real exista. Hoje cobre: Dashboard, PDV, Vendas, Clientes, Produtos,
Estoque, Compras, Fornecedores, Oficina, Caixa, Financeiro, Fiscal (+ NF-e
como submódulo), CRM, Relatórios, IA, Usuários e Configurações.

**Para implementar um módulo de negócio numa sprint futura:**
1. Criar a página real em `modules/<modulo>/pages/`.
2. Em `app/routes/module-routes.tsx`, adicionar o `id` do módulo a
   `IMPLEMENTED_NAV_IDS` e registrar a rota explícita no `router.tsx`
   (mesmo padrão usado para `dashboard`/`configuracoes` nesta sprint).
3. Nada na Sidebar, Breadcrumb, Busca Global ou guard de permissão precisa
   mudar — todos já leem de `nav-items.ts`.

Rotas standalone fora do Shell: `/login`, `/register`, `/401`, `/403`,
`/500`, `/offline`. Qualquer rota não mapeada cai em `NotFoundPage` (404),
mantida DENTRO do Shell (Sidebar/Navbar visíveis), pois o usuário já está
autenticado e só "errou o caminho".

---

## 3. Permissões (RBAC)

`navigation/nav-types.ts` define as 8 ações do catálogo de Permission da
Sprint 02: `view · create · update · delete · export · print · approve ·
cancel`. Cada `NavItem` declara `permissions: { module, required }`.
`usePermissions().canAccess()` resolve isso contra `user.role` e
`user.permissions` (Sprint 02: `Profile` → `ProfilePermission` →
`Permission`).

**Política de bootstrap** (documentada em `usePermissions.ts`): enquanto o
backend não popula `user.permissions` (Sprint 05+), a ação `view` é
liberada por padrão para qualquer usuário autenticado — o Shell precisa
ser navegável mesmo antes do RBAC granular existir de fato. Ações que
alteram dados (create/update/delete/export/print/approve/cancel) **sempre**
exigem grant explícito, mesmo nesse modo bootstrap. `super_admin`/`admin`
têm acesso irrestrito.

---

## 4. Multiempresa / Multifilial

`stores/workspace.store.ts` guarda `companies`, `branches`,
`activeCompanyId`, `activeBranchId`, persistidos. `CompanyBranchSwitcher`
(Navbar) lê/escreve nesse store. A população real de `companies`/`branches`
é responsabilidade do módulo de Tenancy (Sprint 05+, consumindo `Company`/
`Branch` da Sprint 02); até lá, o switcher mostra honestamente "Nenhuma
empresa configurada" em vez de inventar dados — qualquer tela que precise
do contexto ativo (`activeCompanyId`/`activeBranchId`) já pode ler do
store hoje.

---

## 5. Busca Global (Command Palette)

`Ctrl+K`/`Cmd+K` (via `useKeyboardShortcut`) abre o `CommandPalette`
(`components/ui/command.tsx`, primitivo novo baseado em `cmdk` — não
existia equivalente nos Sprints 01–03). Sem digitação: mostra Favoritos e
Recentes. Com digitação: chama `services/search.service.ts`, que hoje
resolve buscas de **módulo** (síncrono) e expõe stubs assíncronos
tipados e documentados via JSDoc para Produtos, Clientes, Fornecedores,
Notas, Pedidos, Compras, Ordens de Serviço e Usuários — cada stub já
documenta a consulta Supabase exata que o substituirá quando o módulo
correspondente existir, sem qualquer mudança no `CommandPalette`.

---

## 6. Dashboard Base

`modules/dashboard/widgets/widget-registry.tsx` é o catálogo de tipos de
widget. Nenhum widget exibe dado de negócio inventado — são placeholders
estruturais (`kpi`, `chart`, `list`) ou utilitários reais (`calendar`).
`DashboardGrid` renderiza em grid de 12 colunas com reordenação via HTML5
Drag and Drop nativo; `stores/dashboard-layout.store.ts` persiste o layout
por usuário (localStorage nesta sprint — migrável para uma tabela de
preferências via API sem mudar a interface do store). Widgets são
removíveis (`X` no card) e a galeria de adição (`AddWidgetDialog`) já
sinaliza favoritos.

**Para um módulo futuro adicionar seu próprio widget** (ex: "Vendas do
dia"): registrar uma entrada em `widget-registry.tsx` com seu `render()` —
grid, drag-and-drop, remoção e persistência já funcionam automaticamente.

---

## 7. Responsividade (Mobile First)

- **Desktop/Tablet** (`≥ md`, 768px): `Sidebar` fixa, colapsável.
- **Mobile** (`< md`): `Sidebar` oculta; `MobileSidebarDrawer` (reaproveita
  o `Drawer` do Design System + o mesmo `SidebarNav` da Sidebar fixa — zero
  duplicação) abre via botão hamburguer no `Navbar`.
- Navbar esconde progressivamente elementos secundários (Empresa/Filial,
  Mensagens, Tarefas, Tema, Idioma) abaixo de `sm` (640px), priorizando
  hamburguer + busca + notificações + avatar — sempre visíveis.

---

## 8. PWA

`public/manifest.webmanifest` (ícones em `public/icons/`, atalho de
instalação para `/dashboard`), `public/sw.js` (Service Worker: cache do app
shell mínimo + fallback `public/offline.html` para navegação sem rede) e
`public/offline.html` (página estática, usada quando nem o bundle React
carregou). Registrado em `main.tsx` apenas em produção
(`import.meta.env.PROD`), para não interferir no HMR do Vite em
desenvolvimento. Distinta da rota `/offline` (React, dentro do Shell) e do
`OfflineBanner` (faixa não-bloqueante exibida sobre a tela atual quando a
conexão cai em runtime) — três camadas, cada uma cobrindo um cenário
diferente de perda de conectividade.

---

## 9. Loading (3 camadas)

| Camada | Uso |
|---|---|
| `Skeleton` (Design System, Sprint 03) | Loading local de um componente (linha de tabela, card). |
| `RouteProgressBar` | Feedback de transição de rota (topo da tela, padrão Linear/Vercel). |
| `LoadingOverlay` (`stores/loading-overlay.store.ts`) | Bloqueio de tela inteira para operações pesadas — qualquer módulo futuro chama `useLoadingOverlay.getState().show('Processando...')`/`.hide()`. |

---

## 10. Checklist de entrega (Sprint 04)

- [x] Layout Principal, Sidebar, Navbar, Footer, Área Central — implementados e funcionando
- [x] Sistema de Rotas completo (todos os módulos listados no briefing têm rota + guard)
- [x] Breadcrumb automático
- [x] Página Inicial (`/` → `/dashboard`) e Dashboard Base com widgets
- [x] Sidebar: colapsável e persistida, ícones Lucide, busca, favoritos, recentes, categorias, scroll independente, indicador de módulo ativo, permissões, dark mode
- [x] Navbar: logo, busca global (Ctrl+K), notificações, mensagens, tarefas, perfil, empresa/filial ativas, tema, idioma, avatar, menu do usuário
- [x] Command Palette preparado para Supabase (estrutura completa, stubs documentados)
- [x] Permissões: 8 ações (view/create/update/delete/export/print/approve/cancel) integradas à arquitetura da Sprint 02
- [x] Loading: Skeleton (reaproveitado), Loading Overlay, Progress Bar
- [x] Páginas de erro: 401, 403, 404, 500, Offline
- [x] Responsividade Desktop/Tablet/Mobile (Sidebar → Drawer)
- [x] PWA: manifest, ícones, Service Worker, fallback offline
- [x] Notificações: Toast (Sprint 01) + Alert (Sprint 03) + Central de Notificações + estrutura Realtime
- [x] Configurações Globais: Tema, Idioma, Moeda, Formato de Data/Hora, Empresa, Filial (página real, não placeholder)
- [x] `tsc --noEmit`, `eslint` e `vite build` executados com sucesso (ver histórico de validação desta sprint)

Nenhuma tela de negócio foi implementada — exclusivamente o Shell, conforme
escopo definido.
