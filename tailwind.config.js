/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      colors: {
        // ── Thalia Brand: Warm Champagne Gold ──────────────────────────
        brand: {
          50:  '#FDFBF4',
          100: '#F8EDCC',
          200: '#F0D896',
          300: '#E4BE58',
          400: '#D6A530',
          500: '#C4921A',   // primary action / brand gold
          600: '#A87715',
          700: '#875D10',
          800: '#65430C',
          900: '#422C07',
          950: '#231506',
        },
        // ── Client Side: Sage Green ─────────────────────────────────────
        sage: {
          50:  '#F2F8F4',
          100: '#DDEEE4',
          200: '#BADDCA',
          300: '#8EC9A9',
          400: '#5CAF85',
          500: '#3B9469',   // client primary
          600: '#2E7854',
          700: '#235E41',
          800: '#18442F',
          900: '#0E2C1F',
        },
        // ── Dark Surface (sidebar) ──────────────────────────────────────
        surface: {
          DEFAULT: '#0F0C1B',
          soft:    '#171425',
          border:  '#ffffff14',
          muted:   '#ffffff40',
          text:    '#ffffffb3',
        },
        // ── Neutral Warm (replaces pure gray) ──────────────────────────
        stone: {
          50:  '#FAFAF9',
          100: '#F5F5F3',
          200: '#E8E7E4',
          300: '#D2D0CB',
          400: '#AAA79F',
          500: '#857F77',
          600: '#68625A',
          700: '#4F4A43',
          800: '#35312C',
          900: '#1E1B17',
        },
        // ── App background ──────────────────────────────────────────────
        ivory: '#F9F7F2',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-in-out',
        'slide-up':   'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'shimmer':    'shimmer 1.8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:     { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:    { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft:  { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.55' } },
        shimmer:    { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        'brand-sm': '0 2px 8px rgba(196,146,26,0.18)',
        'brand-md': '0 4px 20px rgba(196,146,26,0.22)',
        'glow':     '0 0 30px rgba(196,146,26,0.12)',
      },
    },
  },
  plugins: [],
}
