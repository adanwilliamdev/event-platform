/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF6EA',
        'paper-dim': '#F1EBDA',
        ink: '#1C1B29',
        'ink-soft': '#4A4860',
        stub: '#E8484E',
        'stub-dark': '#C93540',
        teal: '#2F6F5E',
        gold: '#D6A419',
        line: '#D8CFB8'
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      backgroundImage: {
        grain: "radial-gradient(rgba(28,27,41,0.035) 1px, transparent 1px)"
      },
      backgroundSize: {
        grain: '4px 4px'
      }
    }
  },
  plugins: []
}
