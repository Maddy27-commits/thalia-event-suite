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
        // ── Plum: Luxury purple for AI + premium contexts ───────────────
        plum: {
          50:  '#F8F4FF',
          100: '#EEE5FD',
          200: '#DACCFB',
          300: '#BBA4F6',
          400: '#9B72EF',
          500: '#7C45E5',   // AI generator, premium features
          600: '#6630C8',
          700: '#5124A6',
          800: '#3C1A7E',
          900: '#271056',
          950: '#160837',
        },
        // ── Rose: Warmth for wedding/event contexts ─────────────────────
        rose: {
          50:  '#FFF5F6',
          100: '#FFE4E7',
          200: '#FECDD3',
          300: '#FCA5B0',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
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
      screens: {
        xs: '480px',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-in-out',
        'slide-up':   'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'slide-in':   'slideIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'shimmer':    'shimmer 1.8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:  { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideIn:  { '0%': { opacity: '0', transform: 'translateX(-16px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        pulseSoft:{ '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.55' } },
        shimmer:  { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        'brand-sm':  '0 2px 8px rgba(196,146,26,0.18)',
        'brand-md':  '0 4px 20px rgba(196,146,26,0.22)',
        'brand-lg':  '0 8px 32px rgba(196,146,26,0.28)',
        'plum-sm':   '0 2px 8px rgba(124,69,229,0.18)',
        'plum-md':   '0 4px 20px rgba(124,69,229,0.22)',
        'glow':      '0 0 30px rgba(196,146,26,0.12)',
        'glow-plum': '0 0 30px rgba(124,69,229,0.15)',
        'card':      '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
        'card-hover':'0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'gradient-brand':  'linear-gradient(135deg, #D6A530 0%, #C4921A 50%, #A87715 100%)',
        'gradient-plum':   'linear-gradient(135deg, #9B72EF 0%, #7C45E5 50%, #6630C8 100%)',
        'gradient-luxury': 'linear-gradient(135deg, #1E1B17 0%, #35312C 50%, #4F4A43 100%)',
      },
    },
  },
  plugins: [],
}
