/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        espresso: "#1e1714",
        crema: "#f5eadf",
        saffron: "#e2a13a",
        moss: "#6f8f57",
        berry: "#a53f5b",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(21, 15, 10, 0.18)",
      },
    },
  },
  plugins: [],
};
