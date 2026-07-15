import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'pt-BR' | 'en-US' | 'es-ES';
export type Currency = 'BRL' | 'USD' | 'EUR';
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type TimeFormat = '24h' | '12h';

interface SettingsState {
  language: Language;
  currency: Currency;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  setLanguage: (value: Language) => void;
  setCurrency: (value: Currency) => void;
  setDateFormat: (value: DateFormat) => void;
  setTimeFormat: (value: TimeFormat) => void;
}

/**
 * Configurações Globais (Tema fica no ThemeContext da Sprint 01 — aqui
 * idioma/moeda/formatos, que são preferências de exibição, não de tema
 * visual). Consumido pela página de Configurações e pelos formatadores
 * (`utils/formatters.ts`) nas próximas sprints.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'pt-BR',
      currency: 'BRL',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
      setDateFormat: (dateFormat) => set({ dateFormat }),
      setTimeFormat: (timeFormat) => set({ timeFormat }),
    }),
    { name: 'autocore:settings' },
  ),
);
