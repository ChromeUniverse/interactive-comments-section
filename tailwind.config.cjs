/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],  
  theme: {
    fontWeight: {
      normal: 400,
      semibold: 500,
      bold: 700,
    },
    colors: {
      // Primary
      moderateBlue: "hsl(238, 40%, 52%)",
      softRed: "hsl(358, 79%, 66%)",
      lightGrayishBlue: "hsl(239, 57%, 85%)",
      paleRed: "hsl(357, 100%, 86%)",
      // Neutral
      darkBlue: "hsl(212, 24%, 26%)",
      grayishBlue: "hsl(211, 10%, 45%)",
      lightGray: "hsl(223, 19%, 93%)",
      veryLightGray: "hsl(228, 33%, 97%)",
      white: "hsl(0, 0%, 100%)",
    },
    fontFamily: {
      'sans': 'Rubik'
    },
    extend: {},
  },
  plugins: [],
}
