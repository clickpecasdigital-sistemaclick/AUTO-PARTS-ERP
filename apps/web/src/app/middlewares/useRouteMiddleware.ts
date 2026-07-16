import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { findNavItemByPath } from '@/navigation/nav-items';
import { useRecentsStore } from '@/stores/recents.store';

/**
 * "Middleware" de rota — roda a cada navegação, antes de qualquer módulo de
 * negócio existir. Hoje resolve: título do documento e registro de "Recentes"
 * na Sidebar. É o ponto único para futuras políticas globais de navegação
 * (ex: tracking de analytics, verificação de filial obrigatória por módulo)
 * sem precisar tocar em cada módulo individualmente.
 */
export function useRouteMiddleware() {
  const location = useLocation();
  const registerVisit = useRecentsStore((state) => state.registerVisit);

  useEffect(() => {
    const navItem = findNavItemByPath(location.pathname);
    document.title = navItem ? `${navItem.label} · Auto Parts ERP` : 'Auto Parts ERP';
    if (navItem) registerVisit(navItem.id);
  }, [location.pathname, registerVisit]);
}
