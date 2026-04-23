import { Icon } from "./Icon";

interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "accent" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: string;
  iconRight?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  style?: React.CSSProperties;
}

const sizes = {
  sm: { padding: "8px 14px", fontSize: 13 },
  md: { padding: "12px 22px", fontSize: 15 },
  lg: { padding: "16px 28px", fontSize: 17 },
};

const variants = {
  primary:   { background: "#0a0a0a", color: "#fff", border: "1px solid transparent" },
  secondary: { background: "transparent", color: "#0a0a0a", border: "1px solid #e0e0e0" },
  ghost:     { background: "transparent", color: "var(--fg-2)", border: "1px solid transparent" },
  accent:    { background: "var(--nero-mint-300)", color: "var(--nero-green-700)", border: "1px solid transparent", fontWeight: 600 },
  danger:    { background: "#fff", color: "#0a0a0a", border: "1px solid #e0e0e0" },
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  children,
  onClick,
  disabled,
  type = "button",
  style,
}: ButtonProps) {
  const iconSize = size === "sm" ? 14 : 16;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: 9999,
        fontFamily: "var(--font-display)",
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 200ms var(--ease-nero)",
        whiteSpace: "nowrap",
        userSelect: "none",
        opacity: disabled ? 0.5 : 1,
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
}
