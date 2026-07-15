import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes condicionalmente (clsx) e resolve conflitos do Tailwind (twMerge).
 * Utilizado por todos os componentes do Design System.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
