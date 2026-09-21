import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#087F6D", dark: "#066759", light: "#0A9A84" },
        canvas: "#F7F8F5",
        ink: { DEFAULT: "#16332E", soft: "#465F59" },
        mint: { DEFAULT: "#E4F4EB", deep: "#C9E9D8" },
        citrus: "#D9EC91",
        line: "#E1E7E3",
        danger: "#B42318",
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans Variable"', "system-ui", "sans-serif"],
        sans: ['"Figtree Variable"', "system-ui", "sans-serif"],
      },
      // Radius scale: 8px controls, 16px cards, full pills/avatars. Nothing else.
      borderRadius: { DEFAULT: "8px", lg: "16px", full: "9999px" },
      boxShadow: {
        card: "0 1px 2px rgba(22,51,46,.06), 0 8px 24px -12px rgba(22,51,46,.14)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(.22,1,.36,1)",
      },
      keyframes: {
        "rise": { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "none" } },
        "word-in": { from: { opacity: "0", transform: "translateY(60%)" }, to: { opacity: "1", transform: "none" } },
        "word-out": { from: { opacity: "1", transform: "none" }, to: { opacity: "0", transform: "translateY(-60%)" } },
        "drift": { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        "kenburns": { from: { transform: "scale(1.04)" }, to: { transform: "scale(1.12) translate(-1.5%, 1%)" } },
        "draw": { from: { transform: "scaleX(0)" }, to: { transform: "scaleX(1)" } },
        "pulse-ring": { "0%": { boxShadow: "0 0 0 0 rgba(8,127,109,.35)" }, "100%": { boxShadow: "0 0 0 14px rgba(8,127,109,0)" } },
        "grow": { from: { transform: "scaleY(0)" }, to: { transform: "scaleY(1)" } },
        "in-right": { from: { opacity: "0", transform: "translateX(28px)" }, to: { opacity: "1", transform: "none" } },
        "in-left": { from: { opacity: "0", transform: "translateX(-28px)" }, to: { opacity: "1", transform: "none" } },
        "out-left": { from: { opacity: "1", transform: "none" }, to: { opacity: "0", transform: "translateX(-28px)" } },
        "out-right": { from: { opacity: "1", transform: "none" }, to: { opacity: "0", transform: "translateX(28px)" } },
        "fade": { from: { opacity: "0" }, to: { opacity: "1" } },
        "shimmer": { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
        "pop": { "0%": { transform: "scale(.6)", opacity: "0" }, "70%": { transform: "scale(1.06)", opacity: "1" }, "100%": { transform: "scale(1)" } },
      },
      animation: {
        rise: "rise .8s cubic-bezier(.22,1,.36,1) backwards",
        "word-in": "word-in .5s cubic-bezier(.22,1,.36,1) backwards",
        "word-out": "word-out .4s cubic-bezier(.22,1,.36,1) both",
        drift: "drift 6s ease-in-out infinite",
        kenburns: "kenburns 22s ease-in-out infinite alternate",
        draw: "draw .9s cubic-bezier(.22,1,.36,1) backwards",
        "pulse-ring": "pulse-ring 2.2s ease-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        fade: "fade .25s ease-out backwards",
        "in-right": "in-right .38s cubic-bezier(.22,1,.36,1) backwards",
        "in-left": "in-left .38s cubic-bezier(.22,1,.36,1) backwards",
        "out-left": "out-left .18s ease-in forwards",
        "out-right": "out-right .18s ease-in forwards",
        grow: "grow .9s cubic-bezier(.22,1,.36,1) backwards",
        pop: "pop .5s cubic-bezier(.22,1,.36,1) backwards",
      },
    },
  },
  plugins: [],
};

export default config;
