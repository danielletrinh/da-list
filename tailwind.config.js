/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        dirtyline: ['"Dirtyline 36Daysoftype 2022"', 'sans-serif'],
      },
      colors: {
        primary: {
          pitchBlack: '#000000',
          offBlack: '#1e1e1e',
          pureWhite: '#ffffff',
          offWhite: '#f1f1f1',
          grey: '#989da3',
          hiding: '#5f6266',
          primary: '#B09D89',
          tooltip: '#4b5563',
        },
      },
    },
  },
  plugins: [],
}