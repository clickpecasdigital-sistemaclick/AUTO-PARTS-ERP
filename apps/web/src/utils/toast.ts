import { toast as sonnerToast } from 'sonner';

/**
 * Wrapper único sobre o sonner. Qualquer módulo de negócio deve importar
 * `toast` daqui (e nunca de 'sonner' diretamente), garantindo um vocabulário
 * consistente de feedback em toda a aplicação.
 */
export const toast = {
  success: (message: string, description?: string) => sonnerToast.success(message, { description }),
  error: (message: string, description?: string) => sonnerToast.error(message, { description }),
  warning: (message: string, description?: string) => sonnerToast.warning(message, { description }),
  info: (message: string, description?: string) => sonnerToast.info(message, { description }),
  promise: sonnerToast.promise,
};
