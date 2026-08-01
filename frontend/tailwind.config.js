/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0616',
        night: '#0d0722',
        plum: '#1a0b2e',
        magenta: '#ff2d78',
        hotpink: '#ff3d9a',
        neon: '#e0409a',
        violet: '#9b24e6',
        electric: '#3d62ff',
        ice: '#8fb4ff',
        /* Homepage Scoped Color System */
        'home-magenta': '#e40063',
        'home-pink': '#ff2d78',
        'home-blue': '#3154f5',
        'home-navy': '#071530',
        'home-deep': '#030617',
      },
      fontFamily: {
        display: ['Michroma', 'sans-serif'],
        head: ['"Chakra Petch"', 'sans-serif'],
        body: ['Rajdhani', 'sans-serif'],
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        pulseGlow: {
          '0%,100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        pulseGlow: 'pulseGlow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
