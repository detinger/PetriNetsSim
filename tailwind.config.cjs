/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Semantic tokens; values live in src/index.css and switch with the theme
      colors: {
        app: 'var(--bg)',
        elevated: 'var(--bg-elevated)',
        subtle: 'var(--bg-subtle)',
        sunken: 'var(--bg-sunken)',
        hovered: 'var(--bg-hover)',
        canvas: 'var(--canvas-bg)',
        line: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        fg: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
          subtle: 'var(--text-subtle)',
          'on-primary': 'var(--text-on-primary)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          soft: 'var(--primary-soft)',
          strong: 'var(--primary-strong)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
        },
        error: { DEFAULT: 'var(--error)', soft: 'var(--error-soft)' },
        warning: { DEFAULT: 'var(--warning)', soft: 'var(--warning-soft)' },
        success: { DEFAULT: 'var(--success)', soft: 'var(--success-soft)' },
        info: { DEFAULT: 'var(--info)', soft: 'var(--info-soft)' },
        net: {
          stroke: 'var(--net-stroke)',
          fill: 'var(--net-fill)',
          label: 'var(--net-label)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        lg: 'var(--shadow-lg)',
        focus: 'var(--focus-ring)',
      },
    },
  },
  plugins: [],
}
