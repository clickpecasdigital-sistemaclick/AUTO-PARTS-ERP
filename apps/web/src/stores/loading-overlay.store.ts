import { create } from 'zustand';

interface LoadingOverlayState {
  isVisible: boolean;
  message: string;
  show: (message?: string) => void;
  hide: () => void;
}

/**
 * Loading Overlay GLOBAL — para operações de tela inteira (ex: gerando
 * relatório pesado, processando importação). Diferente do `isLoading` de
 * Button/Input (que é local ao componente), este bloqueia a interação com
 * toda a aplicação. Qualquer módulo futuro chama
 * `useLoadingOverlay.getState().show('Processando...')` / `.hide()`.
 */
export const useLoadingOverlay = create<LoadingOverlayState>((set) => ({
  isVisible: false,
  message: 'Carregando...',
  show: (message = 'Carregando...') => set({ isVisible: true, message }),
  hide: () => set({ isVisible: false }),
}));
