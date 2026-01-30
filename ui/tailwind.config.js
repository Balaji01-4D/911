/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        cat: {
          base: '#1e1e2e',
          mantle: '#181825',
          crust: '#11111b',
          surface0: '#313244',
          surface1: '#45475a',
          text: '#cdd6f4',
          subtext0: '#a6adc8',
          blue: '#89b4fa',
          red: '#f38ba8',
          yellow: '#f9e2af',
          green: '#a6e3a1',
          peach: '#fab387',
          lavender: '#b4befe',
          overlay0: '#6c7086',
        }
      }
    },
  },
  plugins: [],
}
