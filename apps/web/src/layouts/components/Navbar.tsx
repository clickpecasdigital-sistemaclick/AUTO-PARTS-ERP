import { CheckSquare, Menu, MessageSquare, Moon, Search, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useSidebarStore } from '@/stores/sidebar.store';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shell/Logo';
import { CompanyBranchSwitcher } from '@/components/shell/CompanyBranchSwitcher';
import { NotificationCenter } from '@/components/shell/NotificationCenter';
import { IconPopoverPlaceholder } from '@/components/shell/IconPopoverPlaceholder';
import { LanguageSwitcher } from '@/components/shell/LanguageSwitcher';
import { UserMenu } from '@/components/shell/UserMenu';
import { useCommandPaletteStore } from '@/stores/command-palette.store';

interface NavbarProps {
  /** Abre o `MobileSidebarDrawer` — botão só visível abaixo do breakpoint `md`. */
  onOpenMobileNav: () => void;
}

/**
 * Navbar premium do Shell: menu mobile (hamburguer, < 768px), Logo (quando
 * a Sidebar está colapsada), Empresa/Filial ativas, Busca Global (Ctrl+K),
 * Notificações, Mensagens, Tarefas, Idioma, Tema e Menu do Usuário. Layout
 * fixo do Shell — não deve ser alterado por módulos de negócio.
 */
export function Navbar({ onOpenMobileNav }: NavbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const openCommandPalette = useCommandPaletteStore((s) => s.open);
  const collapsed = useSidebarStore((s) => s.collapsed);
  const { notifications, markAllAsRead } = useRealtimeNotifications();

  useKeyboardShortcut('k', openCommandPalette);

  return (
    <header className="sticky top-0 z-sticky flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" onClick={onOpenMobileNav}>
        <Menu className="size-5" />
      </Button>
      {collapsed && <Logo iconOnly className="hidden md:flex" />}
      <div className="hidden sm:block">
        <CompanyBranchSwitcher />
      </div>

      <button
        onClick={openCommandPalette}
        className="ml-2 flex h-9 w-full max-w-sm items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground transition-colors duration-base hover:bg-muted"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left hidden sm:inline">Buscar em todo o sistema...</span>
        <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 font-numeric text-[10px] sm:inline">Ctrl K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <div className="hidden sm:flex sm:items-center sm:gap-1">
          <IconPopoverPlaceholder
            icon={MessageSquare}
            label="Mensagens"
            emptyTitle="Nenhuma mensagem"
            emptyDescription="O módulo de mensageria interna chega em uma próxima sprint."
          />
          <IconPopoverPlaceholder
            icon={CheckSquare}
            label="Tarefas"
            emptyTitle="Nenhuma tarefa pendente"
            emptyDescription="O módulo de tarefas/atribuições chega em uma próxima sprint."
          />
        </div>
        <NotificationCenter notifications={notifications} onMarkAllRead={markAllAsRead} />

        <Button
          variant="ghost"
          size="icon"
          aria-label="Alternar tema"
          className="hidden sm:inline-flex"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          {resolvedTheme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>

        <div className="hidden sm:block">
          <LanguageSwitcher />
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
