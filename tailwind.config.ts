import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Semantic design tokens (CSS-variable-driven) ---
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        popover: { DEFAULT: "var(--popover)", foreground: "var(--popover-foreground)" },
        primary: { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)" },
        secondary: { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        accent: { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
        destructive: { DEFAULT: "var(--destructive)", foreground: "var(--destructive-foreground)" },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",

        // --- Surface hierarchy tokens ---
        surface: {
          DEFAULT: "var(--surface)",
          dim: "var(--surface-dim)",
          bright: "var(--surface-bright)",
          "container-lowest": "var(--surface-container-lowest)",
          "container-low": "var(--surface-container-low)",
          container: "var(--surface-container)",
          "container-high": "var(--surface-container-high)",
          "container-highest": "var(--surface-container-highest)",
        },

        // --- Brand palette ---
        "brand-gold": {
          DEFAULT: "var(--brand-gold)",
          soft: "var(--brand-gold-soft)",
        },
        "brand-slate": "var(--brand-slate)",
        "brand-ink": "var(--brand-ink)",
        "brand-cta-fg": "var(--brand-cta-foreground)",

        // --- Glass / outline ---
        glass: "var(--glass-outline)",

        // --- Interactive hover tokens ---
        "hover-surface": {
          DEFAULT: "var(--interactive-hover-surface)",
          strong: "var(--interactive-hover-surface-strong)",
        },
        "hover-fg": "var(--interactive-hover-foreground)",
        "hover-icon": "var(--interactive-hover-icon)",
        "hover-border": "var(--interactive-hover-border)",

        // --- Status tokens ---
        "status-success": {
          bg: "var(--status-success-bg)",
          fg: "var(--status-success-fg)",
          border: "var(--status-success-border)",
          solid: "var(--status-success-solid)",
        },
        "status-info": {
          bg: "var(--status-info-bg)",
          fg: "var(--status-info-fg)",
          border: "var(--status-info-border)",
          solid: "var(--status-info-solid)",
        },
        "status-warning": {
          bg: "var(--status-warning-bg)",
          fg: "var(--status-warning-fg)",
          border: "var(--status-warning-border)",
          solid: "var(--status-warning-solid)",
        },
        "status-neutral": {
          bg: "var(--status-neutral-bg)",
          fg: "var(--status-neutral-fg)",
          border: "var(--status-neutral-border)",
          solid: "var(--status-neutral-solid)",
        },
        "status-danger": {
          bg: "var(--status-danger-bg)",
          fg: "var(--status-danger-fg)",
          border: "var(--status-danger-border)",
          solid: "var(--status-danger-solid)",
        },
        "status-low": {
          bg: "var(--status-low-bg)",
          fg: "var(--status-low-fg)",
          border: "var(--status-low-border)",
          solid: "var(--status-low-solid)",
        },

        // --- Fixed brand hex palette (for static contexts) ---
        brand: {
          50: "#f8f4ec",
          100: "#efe4d1",
          200: "#e7d4af",
          300: "#d8b97d",
          400: "#cda864",
          500: "#c5a059",
          600: "#a77f36",
          700: "#7a5d25",
          800: "#4e3c17",
          900: "#23190b",
          950: "#130b00",
        },

        // --- Document type colors ---
        type: {
          act: "#002344",
          judgment: "#36454f",
          regulation: "#708090",
          constitution: "#c5a059",
        },

        // --- Sidebar ---
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },

        // --- Chart ---
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        display: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Label scale (Manrope — all-caps, tracked)
        "label-xs": ["0.625rem", { lineHeight: "1rem", letterSpacing: "0.05em", fontWeight: "600" }],
        "label-sm": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.05em", fontWeight: "600" }],
        "label-md": ["0.75rem", { lineHeight: "1.125rem", letterSpacing: "0.05em", fontWeight: "600" }],
        // Display scale (Manrope — tight tracking)
        "display-sm": ["2rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        "display-md": ["2.5rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "600" }],
        "display-lg": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" }],
        // Heading scale (Manrope)
        "heading-sm": ["1.125rem", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "600" }],
        "heading-md": ["1.25rem", { lineHeight: "1.35", letterSpacing: "-0.015em", fontWeight: "600" }],
        "heading-lg": ["1.5rem", { lineHeight: "1.3", letterSpacing: "-0.02em", fontWeight: "600" }],
        "heading-xl": ["1.75rem", { lineHeight: "1.25", letterSpacing: "-0.02em", fontWeight: "600" }],
        // Body scale (Newsreader for prose, Manrope for UI)
        "body-sm": ["0.875rem", { lineHeight: "1.6" }],
        "body-md": ["1rem", { lineHeight: "1.7" }],
        "body-lg": ["1.0625rem", { lineHeight: "1.9" }],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        112: "28rem",
        128: "32rem",
      },
      borderRadius: {
        // Design system radius scale
        none: "0",
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        DEFAULT: "var(--radius)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "1rem",
        "3xl": "1.25rem",
        // Named semantic radii for containers
        card: "1.5rem",
        panel: "1.75rem",
        hero: "2rem",
        full: "9999px",
      },
      boxShadow: {
        // Design system shadow scale
        soft: "var(--shadow-soft)",
        floating: "var(--shadow-floating)",
        ambient: "0 8px 24px -12px rgb(21 35 54 / 0.1)",
        none: "none",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-10px)" },
        },
        "slide-in-from-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-from-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "slide-in-from-left": "slide-in-from-left 0.3s ease-out",
        "slide-in-from-right": "slide-in-from-right 0.3s ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate, typography],
};

export default config;
