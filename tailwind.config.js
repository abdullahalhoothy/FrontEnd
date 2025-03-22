/** @type {import('tailwindcss').Config} */

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
      },
      colors: {
        primary: '#115740',
        secondary:"#42dc56",
        gem: {
          DEFAULT: '#7D00B8',
          dark: '#282d37',
          green: '#19802A',
        },
      },
      backgroundImage: {
        'gem-gradient': 'linear-gradient(162deg, #7D00B8 31%, #19802A 87%)',
      },
    },
  },
  plugins: [],
};
