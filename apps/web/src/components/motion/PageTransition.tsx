import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { motion as motionTokens } from '@/config/design-tokens';

/**
 * Envolve o <Outlet /> do MainLayout para dar uma transição suave de fade +
 * leve slide-up a cada troca de rota — sensação de "app nativo" (referência
 * Linear/Vercel) em vez de troca de tela abrupta.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: motionTokens.duration.page, ease: motionTokens.ease.out }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
