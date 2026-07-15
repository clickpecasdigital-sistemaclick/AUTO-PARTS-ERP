/**
 * Formatadores reutilizáveis em todo o ERP.
 * Centralizar aqui evita divergência de formatação (ex: moeda) entre módulos.
 */
export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(date: Date | string, withTime = false): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(d);
}

export function formatCNPJ(value: string): string {
  return value.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export function formatCPF(value: string): string {
  return value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length > 10
    ? digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    : digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

export function formatCEP(value: string): string {
  return value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
}

/** NCM: 8 dígitos, formatado como XXXX.XX.XX (padrão da tabela TIPI). */
export function formatNCM(value: string): string {
  return value.replace(/\D/g, '').replace(/(\d{4})(\d{2})(\d{0,2})/, (_m, a, b, c) => (c ? `${a}.${b}.${c}` : `${a}.${b}`));
}

/** CFOP: 4 dígitos, sem máscara visual além do agrupamento (ex: 5.102). */
export function formatCFOP(value: string): string {
  return value.replace(/\D/g, '').replace(/(\d)(\d{3})/, '$1.$2');
}

/** Formata um número (em reais) como string monetária BRL para exibição no input ("1234.5" -> "1.234,50"). */
export function formatMoneyInput(valueInCents: number): string {
  return (valueInCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Extrai centavos a partir do texto digitado em um input de moeda (somente dígitos, sempre 2 casas decimais ao final). */
export function parseMoneyInputToCents(rawText: string): number {
  const digitsOnly = rawText.replace(/\D/g, '');
  return digitsOnly ? parseInt(digitsOnly, 10) : 0;
}

export function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}
