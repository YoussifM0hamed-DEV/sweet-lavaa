/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm bakery palette: cream grounds, chocolate ink, caramel accents.
        cream: {
          50: '#FFFDFA',
          100: '#FDF8F1',
          200: '#F8F0E4',
          300: '#F1E4D2',
          400: '#E7D3BB',
        },
        cocoa: {
          50: '#F6F2EF',
          100: '#E7DDD6',
          200: '#C9B5A8',
          300: '#A48876',
          400: '#7C5F4C',
          500: '#5C4433',
          600: '#463225',
          700: '#33241A',
          800: '#241811',
          900: '#170F0A',
        },
        caramel: {
          50: '#FCF5EC',
          100: '#F6E6D0',
          200: '#EACCA3',
          300: '#DCAF75',
          400: '#CE9450',
          500: '#BE7B36',
          600: '#A2632B',
          700: '#814C24',
          800: '#5E3820',
        },
        blush: {
          50: '#FDF6F6',
          100: '#F9E9EA',
          200: '#F2D2D5',
          300: '#E6B1B7',
          400: '#D68B94',
        },
        gold: {
          400: '#DCAE4F',
          500: '#C99733',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2.75rem, 6vw, 5rem)', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.25rem, 4.5vw, 3.75rem)', { lineHeight: '1.06', letterSpacing: '-0.025em' }],
        'display-md': ['clamp(1.75rem, 3vw, 2.75rem)', { lineHeight: '1.12', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(1.375rem, 2.2vw, 1.875rem)', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(51, 36, 26, 0.04), 0 8px 24px -12px rgba(51, 36, 26, 0.12)',
        lift: '0 2px 4px rgba(51, 36, 26, 0.05), 0 24px 48px -20px rgba(51, 36, 26, 0.22)',
        inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.7)',
      },
      borderRadius: {
        card: '1.25rem',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        400: '400ms',
        600: '600ms',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'cart-bump': {
          '0%': { transform: 'scale(1)' },
          '35%': { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'scale-in': 'scale-in 0.24s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-right': 'slide-in-right 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        'cart-bump': 'cart-bump 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
