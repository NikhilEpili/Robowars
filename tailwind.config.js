/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'robo-dark': '#0a0a0f',
        'robo-card': '#12121a',
        'robo-border': '#1e1e2e',
        'robo-accent': '#00f0ff',
        'robo-red': '#ff2d55',
        'robo-green': '#00e676',
        'robo-yellow': '#ffd600',
        'robo-orange': '#ff9100',
        'robo-purple': '#b388ff',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'display': ['Orbitron', 'sans-serif'],
        'body': ['Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 240, 255, 0.3)',
        'glow-red': '0 0 20px rgba(255, 45, 85, 0.3)',
        'glow-green': '0 0 20px rgba(0, 230, 118, 0.4)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scan-line': 'scanLine 3s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
}
