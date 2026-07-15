import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Barra de progresso fina no topo da viewport durante transição de rota
 * (padrão Linear/Vercel) — feedback de "sistema rápido" enquanto o chunk
 * lazy-loaded da próxima página ainda está sendo baixado/montado.
 *
 * Implementação por timer (não por `useNavigation` do React Router): este
 * Shell usa `React.lazy` + `Suspense` por página (Sprint 01), não a API de
 * `route.lazy`/loaders do React Router — `useNavigation().state` não reflete
 * esse tipo de carregamento. Um timer curto e auto-resetável no `pathname`
 * é a forma correta de sinalizar a transição neste arranjo.
 */
export function RouteProgressBar() {
  const location = useLocation();
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    setIsVisible(true);
    const timeout = setTimeout(() => setIsVisible(false), 500);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-x-0 top-0 z-toast h-0.5 bg-gradient-primary"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 0.85, transition: { duration: 0.45, ease: 'easeOut' } }}
          exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.15 } }}
          style={{ transformOrigin: 'left' }}
        />
      )}
    </AnimatePresence>
  );
}
