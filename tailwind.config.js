/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./lib/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tokens semânticos ligados às CSS variables (trocam no tema escuro)
        "brand-red": "var(--red)",
        "brand-red-light": "var(--red-light)",
        "brand-black": "var(--ink)", // blocos escuros fortes (CTA, FAB, pílula ativa)
        "brand-text": "var(--text)", // texto primário
        "brand-grey": "var(--grey)",
        "brand-grey-light": "var(--grey-light)",
        "brand-border": "var(--border)",
        "brand-surface": "var(--surface)",
        "brand-card": "var(--card)", // superfície de cartões/inputs (era bg-white)
        "brand-onink-muted": "var(--onink-muted)", // texto secundário sobre blocos escuros
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "sans-serif"],
        display: ['"Plus Jakarta Sans"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
