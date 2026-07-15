import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ServerErrorPage } from '@/pages/errors';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary global da aplicação. Envolve toda a árvore de rotas em
 * app/providers.tsx para que uma falha em um módulo de negócio nunca
 * derrube a aplicação inteira — apenas exibe um fallback recuperável.
 *
 * Reaproveita `ServerErrorPage` (Shell, Sprint 04) como fallback padrão em
 * vez de duplicar o markup de "algo deu errado" — único lugar que define
 * a tela de erro 500 do produto.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // TODO: integrar com serviço de observabilidade (Sentry, Datadog, etc.)
    console.error('[ErrorBoundary] Erro não tratado:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return <ServerErrorPage onRetry={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * WidgetErrorBoundary — Error boundary compacto para widgets do dashboard
 * Adicionado Sprint 14 (Hardening Enterprise).
 */
export function WidgetErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex h-32 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5">
          <div className="text-center">
            <p className="mt-1 text-xs text-muted-foreground">Erro ao carregar widget</p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
