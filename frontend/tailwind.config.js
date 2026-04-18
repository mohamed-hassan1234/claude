/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#18202f',
        mist: '#f6f8fb',
        ocean: '#0f7c90',
        aqua: '#18a8a8'
      },
      boxShadow: {
        soft: '0 16px 40px rgba(24, 32, 47, 0.08)'
      }
    }
  },
  plugins: []
};
