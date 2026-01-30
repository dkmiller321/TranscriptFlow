/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
  			display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
  			mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			xl: 'calc(var(--radius) + 4px)',
  			'2xl': 'calc(var(--radius) + 8px)',
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// Eucalyptus Grove palette
  			sage: {
  				400: 'hsl(53 20% 71%)',
  				500: 'hsl(53 20% 61%)',
  				600: 'hsl(53 20% 51%)',
  			},
  			stone: {
  				400: 'hsl(0 0% 64%)',
  				500: 'hsl(0 0% 54%)',
  				600: 'hsl(0 0% 44%)',
  			},
  			cream: {
  				400: 'hsl(20 9% 98%)',
  				500: 'hsl(20 9% 95%)',
  				600: 'hsl(20 9% 90%)',
  			},
  			forest: {
  				400: 'hsl(116 20% 46%)',
  				500: 'hsl(116 20% 36%)',
  				600: 'hsl(116 20% 26%)',
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))',
  			},
  		},
  		boxShadow: {
  			glow: '0 0 40px -10px hsl(116 20% 36% / 0.5)',
  			'glow-lg': '0 0 60px -15px hsl(116 20% 36% / 0.6)',
  			'glow-multi': '0 0 60px -15px hsl(53 20% 61% / 0.4), 0 0 40px -10px hsl(116 20% 36% / 0.3), 0 0 30px -5px hsl(0 0% 54% / 0.2)',
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0', opacity: '0' },
  				to: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
  				to: { height: '0', opacity: '0' },
  			},
  			'fade-in': {
  				from: { opacity: '0', transform: 'translateY(10px)' },
  				to: { opacity: '1', transform: 'translateY(0)' },
  			},
  			'fade-out': {
  				from: { opacity: '1', transform: 'translateY(0)' },
  				to: { opacity: '0', transform: 'translateY(10px)' },
  			},
  			'scale-in': {
  				from: { transform: 'scale(0.95)', opacity: '0' },
  				to: { transform: 'scale(1)', opacity: '1' },
  			},
  			'slide-in-right': {
  				from: { transform: 'translateX(100%)' },
  				to: { transform: 'translateX(0)' },
  			},
  			'slide-out-right': {
  				from: { transform: 'translateX(0)' },
  				to: { transform: 'translateX(100%)' },
  			},
  			float: {
  				'0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
  				'25%': { transform: 'translate(30px, -30px) rotate(5deg)' },
  				'50%': { transform: 'translate(-20px, 20px) rotate(-5deg)' },
  				'75%': { transform: 'translate(10px, -10px) rotate(3deg)' },
  			},
  			morph: {
  				'0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
  				'25%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
  				'50%': { borderRadius: '50% 60% 30% 60% / 30% 60% 70% 40%' },
  				'75%': { borderRadius: '60% 40% 60% 30% / 70% 30% 50% 60%' },
  			},
  			'pulse-glow': {
  				'0%, 100%': { opacity: '1', boxShadow: '0 0 20px hsl(116 20% 36% / 0.4)' },
  				'50%': { opacity: '0.8', boxShadow: '0 0 40px hsl(116 20% 36% / 0.6)' },
  			},
  			'gradient-shift': {
  				'0%, 100%': { backgroundPosition: '0% 50%' },
  				'50%': { backgroundPosition: '100% 50%' },
  			},
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.3s ease-out',
  			'fade-out': 'fade-out 0.3s ease-out',
  			'scale-in': 'scale-in 0.2s ease-out',
  			'slide-in-right': 'slide-in-right 0.3s ease-out',
  			'slide-out-right': 'slide-out-right 0.3s ease-out',
  			float: 'float 20s ease-in-out infinite',
  			'float-delayed': 'float 25s ease-in-out infinite 5s',
  			'float-slow': 'float 30s ease-in-out infinite 10s',
  			morph: 'morph 15s ease-in-out infinite',
  			'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
  			'gradient-shift': 'gradient-shift 8s ease infinite',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
