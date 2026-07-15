import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface StepperStep {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: StepperStep[];
  currentStep: number; // 0-indexed
  className?: string;
}

/**
 * Stepper horizontal — usado em fluxos multi-etapa (Wizard de cadastro de
 * produto com aplicações veiculares, fechamento de Ordem de Serviço, etc.).
 */
function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <ol className={cn('flex w-full items-start', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <li key={step.label} className={cn('flex items-center', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center gap-2 text-center">
              <div
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors duration-base',
                  isCompleted && 'border-primary bg-primary text-primary-foreground',
                  isCurrent && 'border-primary text-primary',
                  !isCompleted && !isCurrent && 'border-border text-muted-foreground',
                )}
              >
                {isCompleted ? <Check className="size-4" /> : index + 1}
              </div>
              <div className="max-w-[120px]">
                <p className={cn('text-xs font-medium', (isCompleted || isCurrent) ? 'text-foreground' : 'text-muted-foreground')}>
                  {step.label}
                </p>
                {step.description && <p className="text-xs text-muted-foreground">{step.description}</p>}
              </div>
            </div>
            {!isLast && (
              <div className={cn('mx-2 mt-4 h-0.5 flex-1 rounded-full transition-colors duration-base', isCompleted ? 'bg-primary' : 'bg-border')} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export { Stepper };
