import { useEffect } from 'react';

interface ShortcutOptions {
  /** Exige Ctrl (Windows/Linux) ou Cmd (macOS). */
  meta?: boolean;
  ctrl?: boolean;
}

/** Registra um atalho de teclado global (ex: Ctrl+K / Cmd+K para a Busca Global). */
export function useKeyboardShortcut(key: string, callback: () => void, options: ShortcutOptions = { meta: true, ctrl: true }) {
  useEffect(() => {
    function handler(event: KeyboardEvent) {
      const modifierPressed = (options.meta && event.metaKey) || (options.ctrl && event.ctrlKey);
      if (modifierPressed && event.key.toLowerCase() === key.toLowerCase()) {
        event.preventDefault();
        callback();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, options.meta, options.ctrl]);
}
