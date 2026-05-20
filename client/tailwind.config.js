export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#24143D",
        secondary: "#9B7CFF",
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
        surface: "rgba(255,255,255,0.78)",
        text: "#24143D",
        muted: "#655477",
        border: "rgba(143,111,206,0.28)",
        paper: "#F6EEFF",
        paperSoft: "#EEE2FF"
      },
      fontFamily: {
        sans: ["Roboto", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["PT Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        paper: "0 1px 0 rgba(255,255,255,0.82) inset, 0 30px 80px rgba(93,54,150,0.18), 0 0 44px rgba(155,124,255,0.2)",
        tactile: "0 1px 0 rgba(255,255,255,0.82) inset, 0 24px 64px rgba(93,54,150,0.16), 0 0 34px rgba(155,124,255,0.18)"
      },
      borderRadius: {
        paper: "52px"
      }
    }
  },
  plugins: []
};
