import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * Loading global — usado pelo Suspense das rotas com lazy loading
 * e por qualquer estado de carregamento de página inteira.
 */
export function LoadingScreen({ message = 'Carregando...', fullScreen = true }: LoadingScreenProps) {
  return (
    <div
      className={
        fullScreen
          ? 'flex min-h-screen flex-col items-center justify-center gap-3'
          : 'flex min-h-[40vh] flex-col items-center justify-center gap-3'
      }
    >
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
