/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#fad7ac',
          300: '#f6ba77',
          400: '#f1933e',
          500: '#ed7519',
          600: '#de5a0f',
          700: '#b8430f',
          800: '#933514',
          900: '#762e14',
        },
        coffee: {
          primary: '#80684f',
          secondary: '#bd9e7b',
          headerBg: '#e8d7c5',
          pageBg: '#f5efe9',
        },
        bubbleTea: {
          primary: '#5a7a4a',
          secondary: '#8fb573',
          headerBg: '#cfe3c3',
          pageBg: '#f1f7eb',
        },
      },
    },
  },
  plugins: [],
}