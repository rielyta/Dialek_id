/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        custom1: "#177B49",
        custom2: "#0D4422",
        custom4: "#E53E3E",
        custom9: "#D1FAE5",
        "bg-form": "#B1D5CE",
        form: "#5D6D77",
        "custom-green-button": "#177B49",
      },
      fontFamily: {
        irish: ['"Irish Grover"', "cursive"],
        inter: ["Inter", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};