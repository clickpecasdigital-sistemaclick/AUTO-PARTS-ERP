import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

interface LogoProps {
  className?: string;
  /** Esconde o texto "Auto Parts ERP", mantendo só a marca — usado no Navbar quando a Sidebar está colapsada. */
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
      <img
        src="/logo.png"
        alt="Auto Parts ERP"
        className={cn('shrink-0 rounded-md object-contain', size === 'lg' ? 'size-10' : 'size-7')}
      />
      {!iconOnly && (
        <span className={cn('font-display font-bold tracking-tight', size === 'lg' ? 'text-2xl' : 'text-base')}>Auto Parts ERP</span>
      )}
    </Link>
  );
}
