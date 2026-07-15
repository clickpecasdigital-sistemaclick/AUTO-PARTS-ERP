import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorPageLayout } from './ErrorPageLayout';

/** 401 — sessão ausente/expirada. Diferente de 403: aqui o usuário nem está autenticado. */
export function UnauthorizedPage() {
  return (
    <ErrorPageLayout
      icon={LockKeyhole}
      code="401"
      title="Sessão expirada"
      description="Sua sessão expirou ou você ainda não fez login. Entre novamente para continuar."
      action={
        <Button asChild>
          <a href="/login">Ir para o login</a>
        </Button>
      }
    />
  );
}
