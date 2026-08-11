module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: { themes: ["light"] },
};
