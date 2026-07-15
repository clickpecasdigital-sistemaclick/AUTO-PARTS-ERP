import * as React from 'react';
import { Eye, EyeOff, Search } from 'lucide-react';
import { Input, type InputProps } from '@/components/ui/input';
import {
  formatCEP,
  formatCFOP,
  formatCNPJ,
  formatCPF,
  formatMoneyInput,
  formatNCM,
  formatPhone,
  parseMoneyInputToCents,
} from '@/utils/formatters';

/**
 * Biblioteca de inputs especializados do ERP. Todos são controlados,
 * compostos sobre `Input` (herdando ícones/loading/erro/sucesso) e expõem
 * o valor já formatado para o usuário e o valor "cru" via callback dedicado,
 * para que o formulário sempre envie ao backend o dado limpo.
 */

// --- Search -----------------------------------------------------------------
const SearchInput = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <Input ref={ref} type="search" leftIcon={<Search />} placeholder="Buscar..." {...props} />
));
SearchInput.displayName = 'SearchInput';

// --- Password -----------------------------------------------------------------
const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const [visible, setVisible] = React.useState(false);
  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      rightIcon={
        <button
          type="button"
          tabIndex={-1}
          className="pointer-events-auto"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      }
      {...props}
    />
  );
});
PasswordInput.displayName = 'PasswordInput';

// --- Money (BRL) --------------------------------------------------------------
export interface MoneyInputProps extends Omit<InputProps, 'value' | 'onChange' | 'type'> {
  /** Valor em centavos (evita ponto flutuante em valores monetários). */
  valueInCents: number;
  onValueChange: (cents: number) => void;
}

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ valueInCents, onValueChange, ...props }, ref) => (
    <Input
      ref={ref}
      inputMode="numeric"
      leftIcon={<span className="text-sm font-medium">R$</span>}
      value={formatMoneyInput(valueInCents)}
      onChange={(e) => onValueChange(parseMoneyInputToCents(e.target.value))}
      className="text-right font-numeric"
      {...props}
    />
  ),
);
MoneyInput.displayName = 'MoneyInput';

// --- Helper genérico para inputs com máscara baseada em formatador puro -------
function createMaskedInput(formatter: (raw: string) => string, defaultProps: Partial<InputProps> = {}) {
  const Component = React.forwardRef<HTMLInputElement, Omit<InputProps, 'value' | 'onChange'> & {
    value: string;
    onValueChange: (formatted: string) => void;
  }>(({ value, onValueChange, ...props }, ref) => (
    <Input
      ref={ref}
      value={formatter(value)}
      onChange={(e) => onValueChange(formatter(e.target.value))}
      {...defaultProps}
      {...props}
    />
  ));
  return Component;
}

const PhoneInput = createMaskedInput(formatPhone, { inputMode: 'tel', placeholder: '(00) 00000-0000' });
PhoneInput.displayName = 'PhoneInput';

const CpfCnpjInput = createMaskedInput(
  (raw) => (raw.replace(/\D/g, '').length > 11 ? formatCNPJ(raw) : formatCPF(raw)),
  { inputMode: 'numeric', placeholder: 'CPF ou CNPJ' },
);
CpfCnpjInput.displayName = 'CpfCnpjInput';

const CepInput = createMaskedInput(formatCEP, { inputMode: 'numeric', placeholder: '00000-000' });
CepInput.displayName = 'CepInput';

const NcmInput = createMaskedInput(formatNCM, { inputMode: 'numeric', placeholder: '0000.00.00' });
NcmInput.displayName = 'NcmInput';

const CfopInput = createMaskedInput(formatCFOP, { inputMode: 'numeric', placeholder: '0.000' });
CfopInput.displayName = 'CfopInput';

// --- Date / Time / DateTime ---------------------------------------------------
const DateInput = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <Input ref={ref} type="date" className="font-numeric" {...props} />
));
DateInput.displayName = 'DateInput';

const TimeInput = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <Input ref={ref} type="time" className="font-numeric" {...props} />
));
TimeInput.displayName = 'TimeInput';

const DateTimeInput = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => (
  <Input ref={ref} type="datetime-local" className="font-numeric" {...props} />
));
DateTimeInput.displayName = 'DateTimeInput';

export {
  SearchInput,
  PasswordInput,
  MoneyInput,
  PhoneInput,
  CpfCnpjInput,
  CepInput,
  NcmInput,
  CfopInput,
  DateInput,
  TimeInput,
  DateTimeInput,
};
