import { WifiOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

/** Faixa fixa exibida no topo do Shell quando a conexão cai — não navega para /offline (preserva o estado da tela atual). */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-warning px-4 py-1.5 text-xs font-medium text-warning-foreground">
            <WifiOff className="size-3.5" /> Sem conexão com a internet — alterações podem não ser salvas.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
