import { motion, type HTMLMotionProps } from 'framer-motion';
import { motion as motionTokens } from '@/config/design-tokens';

interface SlideInProps extends HTMLMotionProps<'div'> {
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  delay?: number;
}

const offsets = {
  up: (d: number) => ({ y: d }),
  down: (d: number) => ({ y: -d }),
  left: (d: number) => ({ x: d }),
  right: (d: number) => ({ x: -d }),
};

/** Entrada por deslocamento — uso padrão em Drawer, listas que entram em cascata, Toast. */
export function SlideIn({ direction = 'up', distance = 12, delay = 0, children, ...props }: SlideInProps) {
  const offset = offsets[direction](distance);
  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: motionTokens.duration.slow, ease: motionTokens.ease.out, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
