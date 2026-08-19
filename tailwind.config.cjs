module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "sans-serif"],
      },
      keyframes: {
        // Slow drift on the background layer. A 480px-wide GIF stretched to a
        // full viewport is soft no matter what, so lean into it: motion plus a
        // touch of blur reads as intentional, where a static upscale just
        // reads as a low-quality image.
        drift: {
          "0%, 100%": { transform: "scale(1.08) translate3d(0, 0, 0)" },
          "50%": { transform: "scale(1.14) translate3d(-1.5%, -1%, 0)" },
        },
      },
      animation: {
        drift: "drift 24s ease-in-out infinite",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["[data-theme=light]"],
          // daisyUI puts `animation: button-pop` on every .btn with no state
          // qualifier, so each one scales in once on page load — the auth
          // buttons visibly jump as the page settles. Zero it out; the
          // :active press still animates via its own transform.
          "--animation-btn": "0s",
        },
      },
    ],
  },
};
