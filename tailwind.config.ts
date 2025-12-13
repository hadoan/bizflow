import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sora)", "var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", '"Source Code Pro"', "Monaco", "monospace"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "36px" }],
        "4xl": ["36px", { lineHeight: "40px" }],
      },
      spacing: {
        0: "0",
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        7: "28px",
        8: "32px",
        9: "36px",
        10: "40px",
        12: "48px",
        14: "56px",
        16: "64px",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Brand Colors - Flow Blue (Primary)
        primary: {
          50: "#e8f4ff",
          100: "#d4ebff",
          200: "#b3dcff",
          300: "#85c7ff",
          400: "#5aafff",
          500: "#2f8cff", // Flow Blue
          600: "#1a6edb",
          700: "#1558b3",
          800: "#124591",
          900: "#0f3874",
          950: "#0a2749",
        },
        // Brand Colors - Flow Green (Success)
        success: {
          50: "#edfdf5",
          100: "#d4fbe6",
          200: "#adf5d2",
          300: "#75ecb9",
          400: "#3edb9c",
          500: "#2ed47a", // Flow Green
          600: "#1ab365",
          700: "#158e52",
          800: "#147043",
          900: "#125c38",
          950: "#073420",
        },
        // Brand Colors - Flow Amber (Warning)
        warning: {
          50: "#fff9eb",
          100: "#ffefcc",
          200: "#ffdc94",
          300: "#ffc75c",
          400: "#ffb020", // Flow Amber
          500: "#f99009",
          600: "#dd6a04",
          700: "#b74a07",
          800: "#94390d",
          900: "#7a300e",
          950: "#461703",
        },
        // Brand Colors - Flow Coral (Danger/Destructive)
        danger: {
          50: "#fff1f3",
          100: "#ffe1e6",
          200: "#ffc8d3",
          300: "#ff9eae",
          400: "#ff6a84",
          500: "#ff4d6d", // Flow Coral
          600: "#ed1c47",
          700: "#c8103a",
          800: "#a61137",
          900: "#8d1335",
          950: "#4e0518",
        },
        destructive: {
          50: "#fff1f3",
          100: "#ffe1e6",
          200: "#ffc8d3",
          300: "#ff9eae",
          400: "#ff6a84",
          500: "#ff4d6d", // Flow Coral
          600: "#ed1c47",
          700: "#c8103a",
          800: "#a61137",
          900: "#8d1335",
          950: "#4e0518",
        },
        // Neutrals
        ink: {
          50: "#f5f6f7",
          100: "#e6e8eb",
          200: "#d0d3d9",
          300: "#adb3bd",
          400: "#848d9c",
          500: "#677082",
          600: "#525b6c",
          700: "#444c5a",
          800: "#3b414c",
          900: "#0b1220", // Ink - main
          950: "#080d16",
        },
        slate: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5dae2",
          300: "#b1bac9",
          400: "#8795ab",
          500: "#6a7791",
          600: "#5b667a", // Slate - main
          700: "#4a5263",
          800: "#3f4553",
          900: "#373b47",
          950: "#25272e",
        },
        cloud: {
          50: "#f9fafb",
          100: "#eef2f7", // Cloud - main
          200: "#e3e8f0",
          300: "#d1d9e4",
          400: "#b8c3d4",
          500: "#9ba9bf",
          600: "#8290ab",
          700: "#6d7b96",
          800: "#5b667a",
          900: "#4d5562",
          950: "#32363e",
        },
        // Module Colors (for business area indicators)
        module: {
          finance: "#2f8cff",   // Flow Blue
          crm: "#2ed47a",       // Flow Green
          tasks: "#ffb020",     // Flow Amber
          operations: "#ff4d6d", // Flow Coral
        },
      },
      borderRadius: {
        sm: "2px",
        base: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(11, 18, 32, 0.05)",
        base: "0 1px 3px 0 rgba(11, 18, 32, 0.1), 0 1px 2px 0 rgba(11, 18, 32, 0.06)",
        md: "0 4px 6px -1px rgba(11, 18, 32, 0.1), 0 2px 4px -1px rgba(11, 18, 32, 0.06)",
        lg: "0 10px 15px -3px rgba(11, 18, 32, 0.1), 0 4px 6px -2px rgba(11, 18, 32, 0.05)",
        xl: "0 20px 25px -5px rgba(11, 18, 32, 0.1), 0 10px 10px -5px rgba(11, 18, 32, 0.04)",
        brand: "0 8px 24px rgba(11, 18, 32, 0.10)", // Brand shadow
      },
      transitionDuration: {
        150: "150ms",
        200: "200ms",
        300: "300ms",
        500: "500ms",
      },
    },
  },
  plugins: [],
};

export default config;
