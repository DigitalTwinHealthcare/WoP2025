/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neuro: {
          bg: '#0f172a',       // Dark Slate (Medical Background)
          panel: '#1e293b',    // Slate-800 (Card Background)
          primary: '#0ea5e9',  // Sky Blue (Primary Brand)
          accent: '#38bdf8',   // Light Blue (Highlights)
          
          // Status Colors
          safe: '#10b981',     // Emerald-500
          warning: '#f59e0b',  // Amber-500
          critical: '#ef4444', // Red-500
          
          text: '#f8fafc',     // Slate-50
          muted: '#94a3b8'     // Slate-400
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}