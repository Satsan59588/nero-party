interface AvatarProps {
  name: string;
  size?: number;
  ring?: boolean;
}

export function Avatar({ name, size = 40, ring }: AvatarProps) {
  const initials = (name || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hue =
    (name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      flexShrink: 0,
      background: `linear-gradient(135deg, hsl(${hue} 15% 88%), hsl(${hue} 20% 78%))`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#0a0a0a",
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: size * 0.38,
      boxShadow: ring ? "0 0 0 2px #fff, 0 0 0 4px #17a34a" : "none",
    }}>
      {initials}
    </div>
  );
}
