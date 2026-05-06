import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

export default {
  darkMode: 'class',
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './content/**/*.md',
  ],
  theme: {
    extend: {
      colors: {
        // Light mode colors
        cream: {
          DEFAULT: '#F6EEE1',
          50: '#FDFCFA',
          100: '#F6EEE1',
          200: '#EDE0CB',
          300: '#E4D2B5',
        },
        navy: {
          DEFAULT: '#012C56',
          50: '#E6ECF2',
          100: '#B3C5D9',
          200: '#809EBF',
          300: '#4D77A6',
          400: '#26528C',
          500: '#012C56',
          600: '#012447',
          700: '#011C38',
          800: '#001429',
          900: '#000C1A',
        },
        coral: {
          DEFAULT: '#E14A39',
          50: '#FCE9E7',
          100: '#F8D3CF',
          200: '#F1A79F',
          300: '#EA7B6F',
          400: '#E35A4A',
          500: '#E14A39',
          600: '#C93A2B',
          700: '#A12F23',
          800: '#79241A',
          900: '#511812',
        },
        card: {
          light: '#D9D1C3',
          dark: '#3F4B5A',
        },
        // Dark mode colors
        slate: {
          850: '#2F3741',
        },
        cyan: {
          accent: '#1AD9D9',
        },
      },
      fontFamily: {
        sans: ['Lexend', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Bricolage Grotesque', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      typography: ({ theme }: { theme: (path: string) => string }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.navy.DEFAULT'),
            '--tw-prose-headings': theme('colors.navy.DEFAULT'),
            '--tw-prose-links': theme('colors.coral.DEFAULT'),
            '--tw-prose-bold': theme('colors.navy.DEFAULT'),
            '--tw-prose-code': theme('colors.navy.DEFAULT'),
            '--tw-prose-pre-bg': theme('colors.card.light'),
            maxWidth: 'none',
            code: {
              backgroundColor: theme('colors.card.light'),
              padding: '0.25rem 0.375rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': { content: 'none' },
            'code::after': { content: 'none' },
            a: {
              textDecoration: 'underline',
              textDecorationStyle: 'dashed',
              textUnderlineOffset: '4px',
              '&:hover': {
                color: theme('colors.coral.DEFAULT'),
              },
            },
          },
        },
        invert: {
          css: {
            '--tw-prose-body': theme('colors.gray.200'),
            '--tw-prose-headings': theme('colors.gray.100'),
            '--tw-prose-links': theme('colors.cyan.accent'),
            '--tw-prose-bold': theme('colors.gray.100'),
            '--tw-prose-code': theme('colors.gray.200'),
            '--tw-prose-pre-bg': theme('colors.card.dark'),
            code: {
              backgroundColor: theme('colors.card.dark'),
            },
            a: {
              '&:hover': {
                color: theme('colors.cyan.accent'),
              },
            },
          },
        },
      }),
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'pulse-dot': 'pulseDot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [typography],
} satisfies Config
