/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        crema: "#FDF8F3",
        rosa: {
          50: "#FDF2F4",
          100: "#FBE4E8",
          200: "#F6C9D2",
          300: "#EFA3B3",
          400: "#E4718C",
          500: "#D44D6E",
        },
        malva: {
          100: "#F0E4EB",
          200: "#DCC3D1",
          300: "#C495AF",
          400: "#B0688C",
          500: "#9D5C7D",
          600: "#7A3B5E",
          700: "#5E2C48",
          800: "#452136",
        },
        dorado: "#C9A24B",
      },
      fontFamily: {
        sans: ["'Nunito Sans'", "system-ui", "sans-serif"],
        display: ["'Playfair Display'", "serif"],
      },
      animation: {
        "pulse-soft": "pulseSoft 1.8s ease-in-out infinite",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(212, 77, 110, 0.5)" },
          "50%": { transform: "scale(1.04)", boxShadow: "0 0 0 12px rgba(212, 77, 110, 0)" },
        },
      },
    },
  },
  plugins: [],
};
