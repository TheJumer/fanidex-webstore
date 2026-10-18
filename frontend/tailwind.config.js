/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#1a1625',
        card: '#262135',
        bar: '#322c44',
        gold: '#f5d168',
        greenpill: '#2ecc71',
      },
      borderRadius: {
        pill: '9999px',
      },
    },
  },
  plugins: [],
}
