/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm off-white page background
        paper: {
          DEFAULT: "#F8F7F2",
          dark: "#F1EFE8",
        },
        // University blue — primary actions and navigation
        brand: {
          50: "#F0F5FA",
          100: "#DCE8F2",
          200: "#B7CEE3",
          300: "#8AADD2",
          400: "#5B8CBF",
          500: "#3E6FA3",
          600: "#315E8A",
          700: "#2A4F74",
          800: "#24405E",
          900: "#1F334B",
          950: "#16223A",
        },
        // Deep navy — headings and dark accents
        navy: {
          DEFAULT: "#233247",
          100: "#D6DEE8",
          200: "#AEBED0",
          300: "#8699B3",
          400: "#667487",
          500: "#4E5D70",
          600: "#3A495C",
          700: "#2E3D50",
          800: "#233247",
          900: "#1D2A3C",
          950: "#16202E",
        },
        // Natural green — confirmed success
        leaf: {
          50: "#EEF6F1",
          100: "#D8EBE0",
          200: "#AED7C2",
          300: "#7DBE9E",
          400: "#4CA17B",
          500: "#2E9068",
          600: "#27835B",
          700: "#1F6A49",
          800: "#19533B",
          900: "#123A29",
        },
        // Soft borders
        line: {
          DEFAULT: "#E1E5E8",
          strong: "#CBD3D9",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
