import { useEffect } from 'react';

interface ShortcutOptions {
  /** Exige Ctrl (Windows/Linux) ou Cmd (macOS). */
  meta?: boolean;
  ctrl?: boolean;
}

/** Registra um atalho de teclado global (ex: Ctrl+K / Cmd+K para a Busca Global; ou ESC sozinho, passando `{ meta: false, ctrl: false }`). */
export function useKeyboardShortcut(key: string, callback: () => void, options: ShortcutOptions = { meta: true, ctrl: true }) {
  useEffect(() => {
    const requiresModifier = options.meta || options.ctrl;
    function handler(event: KeyboardEvent) {
      const modifierPressed = (options.meta && event.metaKey) || (options.ctrl && event.ctrlKey);
      const modifierOk = requiresModifier ? modifierPressed : !event.ctrlKey && !event.metaKey;
      if (modifierOk && event.key.toLowerCase() === key.toLowerCase()) {
        event.preventDefault();
        callback();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, options.meta, options.ctrl]);
}
