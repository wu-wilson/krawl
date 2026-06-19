/** @type {import('tailwindcss').Config} */

/** Reference a channel-based CSS custom property so Tailwind opacity modifiers resolve. */
const ch = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: ch('--brand'),
          light: ch('--brand-light'),
          dark: ch('--brand-dark'),
          subtle: 'var(--brand-subtle)',
        },
        bg: {
          primary: ch('--bg-primary'),
          secondary: ch('--bg-secondary'),
          tertiary: ch('--bg-tertiary'),
        },
        border: {
          DEFAULT: ch('--border-color'),
          subtle: ch('--border-subtle'),
        },
        text: {
          primary: ch('--text-primary'),
          secondary: ch('--text-secondary'),
          tertiary: ch('--text-tertiary'),
        },
        surface: {
          hover: ch('--surface-hover'),
        },
        status: {
          healthy: ch('--status-healthy'),
          redirect: ch('--status-redirect'),
          broken: ch('--status-broken'),
          pending: ch('--status-pending'),
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
