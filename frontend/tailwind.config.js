/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#6366f1',
          600: '#4f46e5',
        },
        success: {
          500: '#10b981',
        },
        danger: {
          500: '#ef4444',
        },
        warning: {
          500: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
}