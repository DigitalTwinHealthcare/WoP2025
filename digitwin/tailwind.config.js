/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Using direct hex values instead of names
        primary: '#4C4741',    // walnut-brown
        secondary: '#B29D82',  // silestone
        accent: '#D3C0B2',     // white-mink
        neutral: '#B8B1AB',    // classic-cool
        light: '#DAE6E1',      // mint-cream
        muted: '#B5B8A5',      // pine-crush
        'dark-background': 'rgb(var(--color-bg))',
        'dark-card': 'rgb(var(--color-card))',
        'dark-primary': 'rgb(var(--color-text))',
        'dark-border': 'rgb(var(--color-border))',
        'dark-muted': 'rgb(var(--color-border))',
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
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  }
};

