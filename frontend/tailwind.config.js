/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            keyframes: {
                progress: {
                    '0%': { transform: 'scaleX(0)' },
                    '50%': { transform: 'scaleX(0.5)' },
                    '100%': { transform: 'scaleX(1)' },
                }
            },
            animation: {
                progress: 'progress 2s ease-in-out infinite',
            }
        },
    },
    plugins: [],
}