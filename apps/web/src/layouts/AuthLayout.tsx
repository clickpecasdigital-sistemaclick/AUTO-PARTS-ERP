import { Outlet } from 'react-router-dom';
import { Logo } from '@/components/shell/Logo';

/**
 * Layout para telas públicas de autenticação (login, recuperação de senha,
 * onboarding de tenant). Sem sidebar/navbar.
 */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo size="lg" />
          <p className="text-sm text-muted-foreground">Gestão completa para Autopeças</p>
        </div>
        <Outlet />
        <p className="text-center text-xs text-muted-foreground">Desenvolvido por Elismar</p>
      </div>
    </div>
  );
}
