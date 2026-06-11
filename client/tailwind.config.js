/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-black': '#0a0a0f',
        'cyber-dark': '#12121a',
        'cyber-green': '#00ff88',
        'cyber-blue': '#00ccff',
        'cyber-purple': '#aa00ff',
        'cyber-red': '#ff3366',
      },
      fontFamily: {
        'mono': ['"Courier New"', 'Courier', 'monospace'],
      }
    },
  },
  plugins: [],
}
