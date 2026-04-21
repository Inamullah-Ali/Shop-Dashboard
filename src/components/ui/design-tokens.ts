export const designTokens = {
  colors: {
    bgApp: "bg-background",
    bgSurface: "bg-card",
    bgMuted: "bg-muted",
    border: "border-border",
    textPrimary: "text-foreground",
    textMuted: "text-muted-foreground",
    accent: "text-indigo-500",
  },
  radius: {
    base: "rounded-lg",
  },
  spacing: {
    page: "p-4 sm:p-6 lg:p-8",
    card: "p-4",
    compact: "px-2.5 py-2",
  },
  text: {
    title: "text-2xl font-semibold tracking-tight",
    body: "text-sm",
    caption: "text-xs",
  },
  effects: {
    noShadow: "shadow-none",
    glass:
      "border border-white/10 bg-white/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5",
    noFocus:
      "focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
  },
} as const;
