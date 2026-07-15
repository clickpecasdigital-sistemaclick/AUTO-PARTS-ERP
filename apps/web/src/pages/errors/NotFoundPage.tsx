import { Compass } from 'lucide-react';
import { ErrorPageLayout } from './ErrorPageLayout';

/** 404 — rota inexistente. */
export function NotFoundPage() {
  return (
    <ErrorPageLayout
      icon={Compass}
      code="404"
      title="Página não encontrada"
      description="O endereço acessado não existe ou foi movido. Verifique o link ou volte ao início."
    />
  );
}
