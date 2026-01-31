/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#1e1e2e",
        surface: "#313244",
        text: "#cdd6f4",
        primary: "#f38ba8",
        secondary: "#cba6f7",
        success: "#a6e3a1",
      },
    },
  },
  plugins: [],
};
