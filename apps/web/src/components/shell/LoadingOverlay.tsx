import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLoadingOverlay } from '@/stores/loading-overlay.store';

/** Renderiza o Loading Overlay global controlado por `useLoadingOverlay` (ver stores/loading-overlay.store.ts). */
export function LoadingOverlay() {
  const { isVisible, message } = useLoadingOverlay();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-modal flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm"
        >
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
