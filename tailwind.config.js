/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "brand-red": "#c41e24",
        "brand-red-light": "rgba(196,30,36,0.063)",
        "brand-black": "#111111",
        "brand-grey": "#555555",
        "brand-grey-light": "#999999",
        "brand-border": "#e5e5e5",
        "brand-surface": "#fafafa",
      },
      fontFamily: {
        sans: ['"Source Sans 3"', "sans-serif"],
        display: ['"Instrument Serif"', "serif"],
      },
    },
  },
  plugins: [],
};
