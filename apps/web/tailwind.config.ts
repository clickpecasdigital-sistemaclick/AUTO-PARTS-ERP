import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * AutoCore ERP — Design System (Sprint 03)
 *
 * Este arquivo é a ÚNICA fonte de configuração visual consumida pelos
 * componentes via classes utilitárias. Os valores crus (hex, px) vivem em
 * `src/styles/tokens.css`; aqui apenas referenciamos as variáveis CSS,
 * nunca duplicamos um valor literal.
 */
const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        // Escalas cruas de marca/neutros/semântica — uso pontual (ex: text-orange-600)
        orange: {
          50: 'var(--color-orange-50)', 100: 'var(--color-orange-100)', 200: 'var(--color-orange-200)',
          300: 'var(--color-orange-300)', 400: 'var(--color-orange-400)', 500: 'var(--color-orange-500)',
          600: 'var(--color-orange-600)', 700: 'var(--color-orange-700)', 800: 'var(--color-orange-800)',
          900: 'var(--color-orange-900)',
        },
        petroleum: {
          50: 'var(--color-petroleum-50)', 100: 'var(--color-petroleum-100)', 200: 'var(--color-petroleum-200)',
          300: 'var(--color-petroleum-300)', 400: 'var(--color-petroleum-400)', 500: 'var(--color-petroleum-500)',
          600: 'var(--color-petroleum-600)', 700: 'var(--color-petroleum-700)', 800: 'var(--color-petroleum-800)',
          900: 'var(--color-petroleum-900)',
        },
        graphite: {
          50: 'var(--color-graphite-50)', 100: 'var(--color-graphite-100)', 200: 'var(--color-graphite-200)',
          300: 'var(--color-graphite-300)', 400: 'var(--color-graphite-400)', 500: 'var(--color-graphite-500)',
          600: 'var(--color-graphite-600)', 700: 'var(--color-graphite-700)', 800: 'var(--color-graphite-800)',
          900: 'var(--color-graphite-900)',
        },
        gray: {
          50: 'var(--color-gray-50)', 100: 'var(--color-gray-100)', 200: 'var(--color-gray-200)',
          300: 'var(--color-gray-300)', 400: 'var(--color-gray-400)', 500: 'var(--color-gray-500)',
          600: 'var(--color-gray-600)', 700: 'var(--color-gray-700)', 800: 'var(--color-gray-800)',
          900: 'var(--color-gray-900)',
        },
        green: {
          50: 'var(--color-green-50)', 100: 'var(--color-green-100)', 200: 'var(--color-green-200)',
          300: 'var(--color-green-300)', 400: 'var(--color-green-400)', 500: 'var(--color-green-500)',
          600: 'var(--color-green-600)', 700: 'var(--color-green-700)', 800: 'var(--color-green-800)',
          900: 'var(--color-green-900)',
        },
        yellow: {
          50: 'var(--color-yellow-50)', 100: 'var(--color-yellow-100)', 200: 'var(--color-yellow-200)',
          300: 'var(--color-yellow-300)', 400: 'var(--color-yellow-400)', 500: 'var(--color-yellow-500)',
          600: 'var(--color-yellow-600)', 700: 'var(--color-yellow-700)', 800: 'var(--color-yellow-800)',
          900: 'var(--color-yellow-900)',
        },
        red: {
          50: 'var(--color-red-50)', 100: 'var(--color-red-100)', 200: 'var(--color-red-200)',
          300: 'var(--color-red-300)', 400: 'var(--color-red-400)', 500: 'var(--color-red-500)',
          600: 'var(--color-red-600)', 700: 'var(--color-red-700)', 800: 'var(--color-red-800)',
          900: 'var(--color-red-900)',
        },
        blue: {
          50: 'var(--color-blue-50)', 100: 'var(--color-blue-100)', 200: 'var(--color-blue-200)',
          300: 'var(--color-blue-300)', 400: 'var(--color-blue-400)', 500: 'var(--color-blue-500)',
          600: 'var(--color-blue-600)', 700: 'var(--color-blue-700)', 800: 'var(--color-blue-800)',
          900: 'var(--color-blue-900)',
        },

        // Tokens semânticos — uso padrão em 95% dos componentes.
        // Envolvidos em rgb(var(--x) / <alpha-value>) para suportar
        // modificadores de opacidade (bg-primary/90, bg-muted/50 etc.) —
        // exige que as variáveis em globals.css estejam no formato "R G B".
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          hover: 'rgb(var(--primary-hover) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          hover: 'rgb(var(--secondary-hover) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
          hover: 'rgb(var(--destructive-hover) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          hover: 'rgb(var(--success-hover) / <alpha-value>)',
          foreground: 'rgb(var(--success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
          hover: 'rgb(var(--warning-hover) / <alpha-value>)',
          foreground: 'rgb(var(--warning-foreground) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--info) / <alpha-value>)',
          hover: 'rgb(var(--info-hover) / <alpha-value>)',
          foreground: 'rgb(var(--info-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        sidebar: {
          DEFAULT: 'rgb(var(--sidebar-background) / <alpha-value>)',
          foreground: 'rgb(var(--sidebar-foreground) / <alpha-value>)',
          border: 'rgb(var(--sidebar-border) / <alpha-value>)',
          accent: 'rgb(var(--sidebar-accent) / <alpha-value>)',
        },
      },

      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: 'var(--radius-full)',
      },

      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        'focus-ring': 'var(--shadow-focus-ring)',
      },

      spacing: {
        // Aliases nomeados da escala oficial do briefing — os valores numéricos
        // padrão do Tailwind (1=4px ... 32=128px) já cobrem a mesma escala;
        // estes aliases existem para legibilidade em código de layout.
        'grid-1': 'var(--space-1)',
        'grid-2': 'var(--space-2)',
        'grid-3': 'var(--space-3)',
        'grid-4': 'var(--space-4)',
        'grid-6': 'var(--space-6)',
        'grid-8': 'var(--space-8)',
        'grid-12': 'var(--space-12)',
        'grid-16': 'var(--space-16)',
        'grid-24': 'var(--space-24)',
        'grid-32': 'var(--space-32)',
      },

      fontFamily: {
        display: ['Lexend', 'Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        numeric: ['Inter', 'sans-serif'],
      },

      fontSize: {
        h1: ['var(--text-h1-size)', { lineHeight: 'var(--text-h1-line)', letterSpacing: 'var(--text-h1-tracking)', fontWeight: 'var(--text-h1-weight)' }],
        h2: ['var(--text-h2-size)', { lineHeight: 'var(--text-h2-line)', letterSpacing: 'var(--text-h2-tracking)', fontWeight: 'var(--text-h2-weight)' }],
        h3: ['var(--text-h3-size)', { lineHeight: 'var(--text-h3-line)', letterSpacing: 'var(--text-h3-tracking)', fontWeight: 'var(--text-h3-weight)' }],
        h4: ['var(--text-h4-size)', { lineHeight: 'var(--text-h4-line)', letterSpacing: 'var(--text-h4-tracking)', fontWeight: 'var(--text-h4-weight)' }],
        body: ['var(--text-body-size)', { lineHeight: 'var(--text-body-line)' }],
        caption: ['var(--text-caption-size)', { lineHeight: 'var(--text-caption-line)' }],
        label: ['var(--text-label-size)', { lineHeight: 'var(--text-label-line)', fontWeight: 'var(--text-label-weight)' }],
      },

      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)',
        page: 'var(--duration-page)',
      },

      transitionTimingFunction: {
        'out-smooth': 'var(--ease-out)',
        'in-out-smooth': 'var(--ease-in-out)',
      },

      zIndex: {
        dropdown: 'var(--z-dropdown)',
        sticky: 'var(--z-sticky)',
        drawer: 'var(--z-drawer)',
        'modal-overlay': 'var(--z-modal-overlay)',
        modal: 'var(--z-modal)',
        popover: 'var(--z-popover)',
        toast: 'var(--z-toast)',
        tooltip: 'var(--z-tooltip)',
      },

      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in var(--duration-base) var(--ease-out)',
        'scale-in': 'scale-in var(--duration-base) var(--ease-out)',
        'slide-up': 'slide-up var(--duration-slow) var(--ease-out)',
        shimmer: 'shimmer 2s infinite linear',
      },
    },
  },
  plugins: [animate],
};

export default config;
