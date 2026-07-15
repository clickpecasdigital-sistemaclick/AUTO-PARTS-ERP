import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/hooks/useTheme';

/**
 * Toast global da aplicação (baseado em sonner). Renderizado uma única vez
 * em app/providers.tsx — qualquer módulo dispara notificações via `toast()`
 * (ver utils/toast.ts) sem precisar montar nada localmente.
 */
export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={resolvedTheme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'font-sans',
        },
      }}
    />
  );
}
