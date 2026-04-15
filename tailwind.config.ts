import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        surface: '#0d0d0d',
        accent: '#ff6600',
        muted: '#2c2c2c',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,102,0,0.12), 0 20px 60px rgba(0,0,0,0.45)',
      },
    },
  },
  plugins: [],
};

export default config;
