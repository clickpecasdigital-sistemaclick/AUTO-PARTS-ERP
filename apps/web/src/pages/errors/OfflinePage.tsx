import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorPageLayout } from './ErrorPageLayout';

/** Sem conexão — exibida pelo Service Worker (fallback PWA) ou pelo banner de status global. */
export function OfflinePage() {
  return (
    <ErrorPageLayout
      icon={WifiOff}
      code="Offline"
      title="Sem conexão com a internet"
      description="Verifique sua rede. Algumas telas já visitadas podem continuar disponíveis offline."
      action={<Button onClick={() => window.location.reload()}>Tentar novamente</Button>}
    />
  );
}
