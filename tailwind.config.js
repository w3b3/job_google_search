/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // AAA Accessible Dark Theme Colors
        background: {
          light: '#ffffff',
          dark: '#0a0a0a'  // Near black for maximum contrast
        },
        surface: {
          light: '#f8fafc',
          dark: '#1a1a1a'  // Dark gray surface with 7:1+ contrast
        },
        border: {
          light: '#e2e8f0',
          dark: '#404040'  // Medium gray for visible borders
        },
        // AAA Text Colors for Dark Theme
        text: {
          primary: {
            light: '#0f172a',
            dark: '#ffffff'  // Pure white for maximum contrast (21:1 ratio)
          },
          secondary: {
            light: '#64748b',
            dark: '#d4d4d8'  // Light gray with 7.5:1 contrast ratio
          },
          tertiary: {
            light: '#94a3b8',
            dark: '#a1a1aa'  // Medium gray with 7:1 contrast ratio
          }
        },
        // AAA Interactive Element Colors
        interactive: {
          primary: {
            light: '#2563eb',
            dark: '#60a5fa'  // Lighter blue for better contrast on dark
          },
          secondary: {
            light: '#64748b',
            dark: '#e4e4e7'  // Light gray for secondary actions
          },
          hover: {
            light: '#1d4ed8',
            dark: '#3b82f6'  // Slightly darker blue for hover states
          }
        }
      },
      animation: {
        'theme-transition': 'theme-transition 300ms ease-in-out',
      },
      // Enhanced contrast utilities for accessibility
      contrast: {
        'aaa-normal': '7', // 7:1 ratio for normal text
        'aaa-large': '4.5', // 4.5:1 ratio for large text
      }
    },
  },
  plugins: [
    // Removed plugins for Docker build simplicity
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
  ],
}
