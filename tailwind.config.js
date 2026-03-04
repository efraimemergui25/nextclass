/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Heebo', 'sans-serif'],
            },
            colors: {
                'brand-blue': '#007AFF',
                'brand-dark': '#1D1D1F',
                'brand-light': '#F5F5F7',
                'brand-surface': '#FFFFFF',
            }
        },
    },
    plugins: [],
}
