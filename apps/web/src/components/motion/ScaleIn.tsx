import { motion, type HTMLMotionProps } from 'framer-motion';
import { motion as motionTokens } from '@/config/design-tokens';

interface ScaleInProps extends HTMLMotionProps<'div'> {
  delay?: number;
}

/** Entrada por escala — uso padrão em Modal/Dialog/Popover/Card que "aparece" sobre a interface. */
export function ScaleIn({ delay = 0, children, ...props }: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.out, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
