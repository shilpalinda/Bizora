/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17151b',
        lilac: '#b89bff',
        blush: '#f6dce7'
      }
    }
  },
  plugins: []
};
