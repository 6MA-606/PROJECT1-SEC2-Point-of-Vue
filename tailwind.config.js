import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      dropShadow: {
        'glow': '0px 0px 5px #ffc34e'
      },
      colors: {
        'mythmatch': {
          '100': '#ffc34e',
          '200': '#C8952B'
        }
      },
      fontFamily: {
        'mythmatch': "'Dancing Script', cursive"
      },
      screens: {
        'xs': '425px'
      }
    },
  },
  safelist: [
    'grid-cols-1',
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
    'grid-cols-5',
    'grid-cols-6'
  ],
  plugins: [daisyui],
}

