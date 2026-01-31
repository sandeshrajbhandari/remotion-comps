/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                poppins: ["Poppins", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "sans-serif"],
                podkova: ["Podkova", "ui-serif", "Georgia", "Cambria", "Times New Roman", "Times", "serif"],
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
