module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        paper: "#f9f9ee",
      },
      fontFamily: {
        script: ["var(--font-script)"],
        mono: ["var(--font-mono)"],
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
      },
    },
  },
  plugins: [],
};
