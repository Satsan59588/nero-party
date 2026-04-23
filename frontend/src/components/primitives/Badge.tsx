interface BadgeProps {
  variant?: "live" | "neutral" | "super" | "skip" | "dark" | "mint";
  dot?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const variants = {
  live:    { background: "#dbe7dd", color: "#17a34a" },
  neutral: { background: "transparent", color: "var(--fg-3)", border: "1px solid var(--border-default)" },
  super:   { background: "#caefd2", color: "#15803d" },
  skip:    { background: "#edf9ef", color: "#17a34a" },
  dark:    { background: "#0a0a0a", color: "#fff" },
  mint:    { background: "var(--nero-mint-200)", color: "var(--nero-green-700)" },
};

export function Badge({ variant = "neutral", dot, children, style }: BadgeProps) {
  const v = variants[variant];
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      borderRadius: 9999,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      fontFamily: "var(--font-body)",
      ...v,
      ...style,
    }}>
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: 99,
          background: v.color,
          animation: "neroBlink 1.2s ease-in-out infinite",
        }} />
      )}
      {children}
    </span>
  );
}
