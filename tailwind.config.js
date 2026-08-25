/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-kanit)', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#3B82F6', // Blue 500
          hover: '#2563EB',
          light: '#EFF6FF',
          dark: '#1D4ED8',
        },
        secondary: {
          DEFAULT: '#A855F7', // Purple 500
          hover: '#9333EA',
          light: '#FAF5FF',
          dark: '#7E22CE',
        },
        accent: {
          DEFAULT: '#EC4899', // Pink 500
          hover: '#DB2777',
          light: '#FDF2F8',
          dark: '#BE185D',
        },
        warning: {
          DEFAULT: '#F97316', // Orange 500
          light: '#FFF7ED',
          dark: '#C2410C',
        },
        success: {
          DEFAULT: '#22C55E', // Green 500
          light: '#F0FDF4',
          dark: '#15803D',
        },
        danger: {
          DEFAULT: '#EF4444', // Red 500
          light: '#FEF2F2',
          dark: '#B91C1C',
        },
        background: '#F8FAFC',
        card: '#FFFFFF',
        dark: '#1E293B',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft-sm': '0 2px 10px rgba(0, 0, 0, 0.03)',
        'soft-md': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 10px 40px rgba(0, 0, 0, 0.06)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.15)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
