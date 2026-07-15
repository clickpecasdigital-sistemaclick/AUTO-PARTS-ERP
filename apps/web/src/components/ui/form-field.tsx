import * as React from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/cn';

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  isLoading?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Wrapper padrão de TODO campo de formulário do ERP: label, estado de
 * validação (erro/sucesso/loading) e mensagem auxiliar, sempre no mesmo
 * lugar visual. Os inputs especializados (Money, CPF/CNPJ, Select...)
 * são compostos dentro deste wrapper — nunca implementam seu próprio
 * texto de erro/hint isoladamente.
 */
function FormField({ label, htmlFor, required, error, success, hint, isLoading, className, children }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={htmlFor} className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
          {isLoading && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
        </Label>
      )}
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" /> {error}
        </p>
      )}
      {!error && success && (
        <p className="flex items-center gap-1 text-xs text-success">
          <CheckCircle2 className="size-3.5 shrink-0" /> {success}
        </p>
      )}
      {!error && !success && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export { FormField };
