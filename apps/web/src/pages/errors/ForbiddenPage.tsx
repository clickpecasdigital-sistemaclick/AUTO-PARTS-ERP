import { ShieldAlert } from 'lucide-react';
import { ErrorPageLayout } from './ErrorPageLayout';

/** 403 — usuário autenticado, mas sem a permissão exigida pela rota (PermissionGuard). */
export function ForbiddenPage() {
  return (
    <ErrorPageLayout
      icon={ShieldAlert}
      code="403"
      title="Acesso não autorizado"
      description="Você não tem permissão para acessar esta área. Fale com um administrador do seu tenant se acredita que isso é um engano."
    />
  );
}
