/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/pages/**/*.tsx"],
   corePlugins: {
    animation: true, 
  },
  theme: {
    extend: {
      width: {
        15: "3.75rem",
        18: "4.5rem",
        25: "6.25rem",
        88: "22rem",
        "1/10": "10%",
        "2/10": "20%",
        "3/10": "30%",
        "4/10": "40%",
        "5/10": "50%",
        "6/10": "60%",
        "7/10": "70%",
        "8/10": "80%",
        "9/10": "90%",
      },
      height: {
        18: "4.5rem",
        15: "3.75rem",
        30: "7.5rem",
      },
      flex: {
        2: "2 2 0%",
        3: "3 3 0%",
        4: "4 4 0%",
        5: "5 5 0%",
        6: "6 6 0%",
        7: "7 7 0%",
        8: "8 8 0%",
        9: "9 9 0%",
      },
      flexBasis: {
        18: "4.5rem",
      },
      borderRadius: {
        half: "50%",
      },
      colors: {
        "main-bg": "var(--bg-main-color)",
        /** border color */
        bc: "var(--border-color)",

        primary: "var(--primary-color)",
        info: "var(--info-color)",
        success: "var(--success-color)",
        warning: "var(--warning-color)",
        error: "var(--error-color)",

        main: "var(--main-color)",
        "secondary-1": "var(--secondary-color-1)",
        "secondary-2": "var(--secondary-color-2)",
        "secondary-3": "var(--secondary-color-3)",
        "secondary-4": "var(--secondary-color-4)",
        "secondary-5": "var(--secondary-color-5)",

        selected: "var(--selected-color)",
        active: "var(--active-color)",

        split: "var(--split-line-color)",

        "icon-4": "var(--icon-color-4)",
      },
    },
    screens: {
      sm: "768px",
      md: "976px",
      lg: "1280px",
      xl: "1440px",
      "2xl": "1920px",
      small: {
        max: "1280px",
      },
      middle: {
        min: "1281px",
        max: "1440px",
      },
      large: {
        min: "1441px",
      },
    },
  },
};
