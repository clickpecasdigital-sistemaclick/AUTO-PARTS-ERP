import { motion, type HTMLMotionProps } from 'framer-motion';
import { motion as motionTokens } from '@/config/design-tokens';

interface FadeInProps extends HTMLMotionProps<'div'> {
  delay?: number;
}

/** Entrada por fade — uso padrão em conteúdo de página/seção que aparece após loading. */
export function FadeIn({ delay = 0, children, ...props }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.out, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
