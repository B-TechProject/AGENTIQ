module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0d14",
        coal: "#131521",
        bone: "#f7f4ef",
        ember: "#ff6b3d",
        lake: "#2aa9a1",
        sun: "#f7c948",
        haze: "#e7eef7",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,107,61,0.25), 0 16px 60px rgba(11,13,20,0.35)",
      },
      fontFamily: {
        display: ["\"Space Grotesk\"", "system-ui", "sans-serif"],
        mono: ["\"IBM Plex Mono\"", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseLine: {
          "0%": { opacity: 0.2 },
          "50%": { opacity: 0.7 },
          "100%": { opacity: 0.2 },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        pulseLine: "pulseLine 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
