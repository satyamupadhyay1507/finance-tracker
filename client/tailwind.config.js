/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // custom colors for our app
        dark: {
          bg: '#0f0f23',
          secondary: '#1a1a2e',
          card: '#16213e',
          'card-hover': '#1a2744',
          border: '#2a2a4a',
          input: '#1e1e3a',
        },
        light: {
          bg: '#f0f2f5',
          card: '#ffffff',
          'card-hover': '#f8f9fb',
          border: '#e2e4e9',
          input: '#f3f4f6',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#818cf8',
          dark: '#4f46e5',
        },
        text: {
          primary: '#e4e4f0',
          secondary: '#8888a4',
          'light-primary': '#1a1a2e',
          'light-secondary': '#6b7280',
        },
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.3)',
        'card-light': '0 4px 24px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'modal-in': 'modalIn 0.2s ease',
      },
      keyframes: {
        modalIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
