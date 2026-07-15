import { ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorPageLayout } from './ErrorPageLayout';

interface ServerErrorPageProps {
  onRetry?: () => void;
}

/** 500 — falha inesperada do servidor/API. */
export function ServerErrorPage({ onRetry }: ServerErrorPageProps) {
  return (
    <ErrorPageLayout
      icon={ServerCrash}
      code="500"
      title="Algo deu errado no servidor"
      description="Nossa equipe já foi notificada. Tente novamente em alguns instantes."
      action={onRetry && <Button onClick={onRetry}>Tentar novamente</Button>}
    />
  );
}
