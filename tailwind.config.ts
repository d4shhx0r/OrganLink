import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          active: "var(--primary-active)",
          subtle: "var(--primary-subtle)",
        },
        input: {
          bg: "var(--input-bg)",
          border: "var(--input-border)",
          focus: "var(--input-focus)",
        },
        muted: {
          DEFAULT: "var(--text-muted)",
          subtle: "var(--text-subtle)",
        },
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#F9FAFB",
          hover: "#F3F4F6",
        }
      },
      borderRadius: {
        'button': "12px",
        'input': "12px",
        'card': "16px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        'subtle': "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)",
        'focus': "0 0 0 3px rgba(124, 0, 217, 0.15)",
      }
    },
  },
  plugins: [],
};
export default config;
