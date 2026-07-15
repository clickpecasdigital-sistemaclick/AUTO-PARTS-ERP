import { motion, type HTMLMotionProps } from 'framer-motion';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

/** Lista com entrada em cascata (ex: cards de StatsCard de um dashboard, itens de uma listagem). */
export function StaggerList({ children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div initial="hidden" animate="show" variants={container} {...props}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div variants={item} {...props}>
      {children}
    </motion.div>
  );
}
