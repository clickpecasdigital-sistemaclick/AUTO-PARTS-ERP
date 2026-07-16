import * as React from 'react';
import { cn } from '@/utils/cn';

interface FooterProps extends React.HTMLAttributes<HTMLDivElement> {
  version?: string;
}

/**
 * Footer compacto do shell da aplicação (rodapé de páginas longas/relatórios
 * imprimíveis). O app principal usa a Sidebar para esse tipo de informação;
 * este componente serve telas standalone (ex: tela de impressão de OS).
 */
function Footer({ className, version = 'v0.1.0', children, ...props }: FooterProps) {
  return (
    <footer className={cn('flex items-center justify-between border-t border-border px-6 py-4 text-xs text-muted-foreground', className)} {...props}>
      <span>© {new Date().getFullYear()} Auto Parts ERP. Todos os direitos reservados. · Desenvolvido por Elismar</span>
      <div className="flex items-center gap-4">
        {children}
        <span className="font-numeric">{version}</span>
      </div>
    </footer>
  );
}

export { Footer };
