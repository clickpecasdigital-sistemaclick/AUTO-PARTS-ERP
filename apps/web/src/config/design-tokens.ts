/**
 * AutoCore ERP — Design Tokens (espelho em TypeScript)
 *
 * Mesma fonte de verdade de `src/styles/tokens.css`, exposta como objeto JS
 * para os casos em que CSS puro não alcança: cores de série de gráficos
 * (Recharts recebe `fill`/`stroke` como string, não consegue ler var() do
 * Tailwind em todos os contextos de SVG), durações de animação do Framer
 * Motion, e geração de QR Code/Barcode.
 *
 * Qualquer alteração de cor/espaçamento deve ser feita primeiro em
 * `tokens.css` e replicada aqui — nunca o contrário.
 */

export const colors = {
  orange: {
    50: '#fff6ed', 100: '#ffead4', 200: '#fed1a9', 300: '#fdb273', 400: '#fb8a3c',
    500: '#f2730f', 600: '#dd5c09', 700: '#b7460a', 800: '#93390f', 900: '#78300f',
  },
  petroleum: {
    50: '#eef6f7', 100: '#d5e9ec', 200: '#add3d9', 300: '#7fb7c0', 400: '#4d959f',
    500: '#2c7782', 600: '#1f5f69', 700: '#1c4c54', 800: '#1a3d43', 900: '#17333a',
  },
  graphite: {
    50: '#f6f6f7', 100: '#e7e8ea', 200: '#cccdd2', 300: '#a6aab1', 400: '#7c818b',
    500: '#5c616b', 600: '#454952', 700: '#34373e', 800: '#24262b', 900: '#16171a',
  },
  gray: {
    50: '#fafbfc', 100: '#f4f6f8', 200: '#e9ecf0', 300: '#d8dce3', 400: '#b9bfc9',
    500: '#9aa1ad', 600: '#7c8493', 700: '#636b79', 800: '#4b515c', 900: '#34383f',
  },
  green: {
    50: '#eefbf3', 100: '#d5f5e1', 200: '#aaeac4', 300: '#74d8a2', 400: '#43bf80',
    500: '#1fa866', 600: '#158652', 700: '#146943', 800: '#145336', 900: '#12442d',
  },
  yellow: {
    50: '#fffaeb', 100: '#fff0c2', 200: '#ffe08a', 300: '#ffc94d', 400: '#fab024',
    500: '#ef9407', 600: '#cc7405', 700: '#a3590a', 800: '#84480f', 900: '#6c3c10',
  },
  red: {
    50: '#fef2f2', 100: '#fddfdd', 200: '#fbc2be', 300: '#f69992', 400: '#ed6b63',
    500: '#e03e35', 600: '#c12a22', 700: '#9f221c', 800: '#84201c', 900: '#6f1e1b',
  },
  blue: {
    50: '#eff8ff', 100: '#daeeff', 200: '#b8dfff', 300: '#87cbff', 400: '#4fafff',
    500: '#1f8fef', 600: '#0f71cc', 700: '#0f5aa3', 800: '#134b82', 900: '#15406b',
  },
} as const;

/** Paleta padrão para séries de gráficos (LineChartWidget/BarChartWidget) — ordem pensada para até 6 séries simultâneas sem repetição visual. */
export const chartPalette = [
  colors.orange[500],
  colors.petroleum[500],
  colors.green[500],
  colors.blue[500],
  colors.yellow[500],
  colors.graphite[400],
] as const;

export const radius = {
  xs: 4, sm: 6, md: 10, lg: 14, xl: 20, '2xl': 28, '3xl': 36, full: 9999,
} as const;

export const shadow = {
  xs: '0 1px 2px 0 rgb(22 23 26 / 0.04)',
  sm: '0 1px 3px 0 rgb(22 23 26 / 0.05), 0 1px 2px -1px rgb(22 23 26 / 0.04)',
  md: '0 4px 12px -2px rgb(22 23 26 / 0.06), 0 2px 4px -2px rgb(22 23 26 / 0.04)',
  lg: '0 12px 24px -6px rgb(22 23 26 / 0.08), 0 4px 8px -4px rgb(22 23 26 / 0.04)',
  xl: '0 24px 48px -12px rgb(22 23 26 / 0.10), 0 8px 16px -8px rgb(22 23 26 / 0.05)',
  '2xl': '0 32px 64px -16px rgb(22 23 26 / 0.14)',
} as const;

/** Escala oficial de espaçamento (px) — usar como referência em cálculos de layout fora do CSS (ex: posicionamento de canvas/SVG). */
export const spacing = {
  1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 12: 48, 16: 64, 24: 96, 32: 128,
} as const;

/** Durações/easings de motion — espelham as variáveis CSS, para uso direto em `transition` do Framer Motion. */
export const motion = {
  duration: { fast: 0.12, base: 0.2, slow: 0.32, page: 0.42 }, // segundos (Framer Motion usa segundos, não ms)
  ease: {
    out: [0.16, 1, 0.3, 1] as [number, number, number, number],
    inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
  },
} as const;

export const breakpoints = {
  sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536,
} as const;

export const zIndex = {
  dropdown: 1000, sticky: 1100, drawer: 1200, modalOverlay: 1300, modal: 1310, popover: 1400, toast: 1500, tooltip: 1600,
} as const;

export const typography = {
  fontDisplay: "'Lexend', 'Inter', system-ui, sans-serif",
  fontBody: "'Inter', system-ui, sans-serif",
  fontNumeric: "'Inter', system-ui, sans-serif",
} as const;
