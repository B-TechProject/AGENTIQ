/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: {
          primary:   '#050d1a',
          secondary: '#091221',
          tertiary:  '#0d1a2e',
        },
        card: {
          DEFAULT: '#0a1628',
          2: '#0f1e35',
        },
        border: {
          DEFAULT: '#1a3050',
          2: '#1e3d60',
        },
        teal:   { DEFAULT: '#00d4aa', dim: '#00d4aa22' },
        green:  { DEFAULT: '#22c55e', dim: '#22c55e18' },
        orange: { DEFAULT: '#f97316', dim: '#f9731620' },
        purple: { DEFAULT: '#a855f7', dim: '#a855f718' },
        red:    { DEFAULT: '#ef4444', dim: '#ef444420' },
        blue:   { DEFAULT: '#3b82f6', dim: '#3b82f618' },
        text: {
          primary:   '#e2e8f0',
          secondary: '#94a3b8',
          muted:     '#64748b',
        },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0,212,170,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,0.04) 1px, transparent 1px)",
        'teal-purple':  'linear-gradient(135deg, #00d4aa, #a855f7)',
        'teal-green':   'linear-gradient(135deg, #00d4aa, #00b890)',
        'orange-red':   'linear-gradient(135deg, #f97316, #ea6a0a)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':    'fadeIn 0.3s ease',
        'slide-in':   'slideIn 0.3s ease',
        'spin-slow':  'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        lg: '16px',
        xl: '20px',
      },
      boxShadow: {
        teal:   '0 0 30px rgba(0,212,170,0.12)',
        card:   '0 0 24px rgba(0,212,170,0.06)',
        glow:   '0 4px 20px rgba(0,212,170,0.3)',
        orange: '0 4px 20px rgba(249,115,22,0.3)',
      },
    },
  },
  plugins: [],
}
