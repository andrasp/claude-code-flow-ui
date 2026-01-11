/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        // Custom color palette for Flow UI
        flow: {
          bg: '#0f0f0f',
          surface: '#1a1a1a',
          border: '#2a2a2a',
          muted: '#6b7280',
          accent: '#3b82f6',
        },
        status: {
          planned: '#6b7280',
          'in-progress': '#f59e0b',
          blocked: '#ef4444',
          completed: '#22c55e',
          cancelled: '#71717a',
        },
        priority: {
          p0: '#ef4444',
          p1: '#f59e0b',
          p2: '#3b82f6',
          p3: '#6b7280',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['SF Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
