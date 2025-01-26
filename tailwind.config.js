/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#115740",
        gem: {
          DEFAULT: "#7a3d84",
          dark:"#282d37",
          green:"#3fc99b"
        }
      },
    },
  },
  plugins: [],
};
