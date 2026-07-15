import { z } from 'zod';

/**
 * Schemas Zod reutilizáveis entre formulários de diferentes módulos.
 * Validações de documentos brasileiros (CPF/CNPJ) ficam centralizadas aqui.
 */
export const emailSchema = z.string().email('E-mail inválido');

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter ao menos uma letra maiúscula')
  .regex(/[0-9]/, 'A senha deve conter ao menos um número');

export const cpfSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 11, 'CPF deve conter 11 dígitos');

export const cnpjSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 14, 'CNPJ deve conter 14 dígitos');

export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v.length === 10 || v.length === 11, 'Telefone inválido');
