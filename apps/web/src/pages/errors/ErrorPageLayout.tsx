import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/motion';

interface ErrorPageLayoutProps {
  icon: LucideIcon;
  code: string;
  title: string;
  description: string;
  action?: ReactNode;
}

/**
 * Esqueleto visual compartilhado pelas 5 páginas de erro do Shell (401/403/
 * 404/500/Offline) — único lugar que define o layout, todas as páginas de
 * erro só fornecem conteúdo (reuso, zero duplicação de markup/estilo).
 *
 * Usa `<a href>` puro (não `<Link>` do React Router) propositalmente: estas
 * páginas precisam funcionar mesmo quando renderizadas FORA do contexto do
 * Router (ex: pelo ErrorBoundary global, que envolve o próprio `<AppRouter
 * />` em app/providers.tsx) ou antes da sessão estar resolvida.
 */
export function ErrorPageLayout({ icon: Icon, code, title, description, action }: ErrorPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <FadeIn className="flex flex-col items-center gap-6">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-muted">
          <Icon className="size-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <p className="font-numeric text-sm font-semibold uppercase tracking-wider text-primary">Erro {code}</p>
          <h1 className="text-h2 font-display text-foreground">{title}</h1>
          <p className="max-w-md text-muted-foreground">{description}</p>
        </div>
        {action ?? (
          <Button asChild>
            <a href="/dashboard">Voltar ao início</a>
          </Button>
        )}
      </FadeIn>
    </div>
  );
}
