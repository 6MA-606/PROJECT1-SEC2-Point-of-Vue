import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      dropShadow: {
        glow: '0px 0px 5px #ffc34e',
      },
      colors: {
        mythmatch: {
          50: '#fff3d9',
          100: '#ffc34e',
          200: '#C8952B',
          300: '#A66708',
          400: '#7D4F06',
          500: '#543907',
          600: '#2B2104',
        },
        mythpurple: {
          200: '#e3b8f7',
          300: '#a64b9e',
          400: '#6e1f7f',
          500: '#4c0f72',
          600: '#3f0a5f',
          700: '#2f0847',
          800: '#1f0630',
        },
      },
      fontFamily: {
        mythmatch: "'Dancing Script', cursive",
        'mythmatch-mono': "'Xanh Mono', monospace",
      },
      screens: {
        xs: '426px',
        'y-xs': { raw: '(min-height: 364px)' },
      },
    },
  },
  safelist: [
    'grid-cols-1',
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
    'grid-cols-5',
    'grid-cols-6',
    'xs:grid-cols-1',
    'xs:grid-cols-2',
    'xs:grid-cols-3',
    'xs:grid-cols-4',
    'xs:grid-cols-5',
    'xs:grid-cols-6',
  ],
  // daisyui: {
  //   styled: true,
  //   themes: false,
  //   base: true,
  //   utils: true,
  //   logs: true,
  //   rtl: false,
  //   themes: [
  //     {
  //       mytheme: {
  //         primary: '#ffc34e',
  //       },
  //     },
  //   ],
  // },
  plugins: [daisyui],
}
