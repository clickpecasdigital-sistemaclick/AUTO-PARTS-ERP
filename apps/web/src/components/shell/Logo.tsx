import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

interface LogoProps {
  className?: string;
  /** Esconde o texto "AutoCore ERP", mantendo só a marca — usado no Navbar quando a Sidebar está colapsada. */
  iconOnly?: boolean;
  size?: 'default' | 'lg';
}

/**
 * Marca do produto — usada na Sidebar (expandida), no Navbar (quando a
 * Sidebar está colapsada, garantindo que a marca nunca desapareça da tela)
 * e na tela de autenticação (`size="lg"`). Único lugar que define o
 * lockup visual do logo, reaproveitado em todos os pontos do Shell.
 */
export function Logo({ className, iconOnly = false, size = 'default' }: LogoProps) {
  return (
    <Link to="/dashboard" className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md bg-gradient-primary font-display font-bold text-white',
          size === 'lg' ? 'size-10 text-base' : 'size-7 text-xs',
        )}
      >
        AC
      </span>
      {!iconOnly && (
        <span className={cn('font-display font-bold tracking-tight', size === 'lg' ? 'text-2xl' : 'text-base')}>AutoCore ERP</span>
      )}
    </Link>
  );
}
