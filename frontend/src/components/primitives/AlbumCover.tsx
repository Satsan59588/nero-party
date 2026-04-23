interface AlbumCoverProps {
  title: string;
  artist?: string;
  thumbnail?: string;
  size?: number;
  radius?: number;
}

const palettes = [
  { bg: "#0a0a0a", fg: "#edf9ef", accent: "#17a34a" },
  { bg: "#17a34a", fg: "#fff",    accent: "#0a0a0a" },
  { bg: "#f4e9d6", fg: "#0a0a0a", accent: "#c97a3a" },
  { bg: "#2d3047", fg: "#e0fbfc", accent: "#fca311" },
  { bg: "#fff",    fg: "#0a0a0a", accent: "#ff3d68" },
  { bg: "#1a1a2e", fg: "#e94560", accent: "#f8f3d4" },
  { bg: "#ebebeb", fg: "#0a0a0a", accent: "#17a34a" },
  { bg: "#d4e4bc", fg: "#2d3047", accent: "#96ac4f" },
];

export function AlbumCover({ title, thumbnail, size = 56, radius = 10 }: AlbumCoverProps) {
  // If we have a real thumbnail URL, use it
  if (thumbnail) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius,
        overflow: "hidden", flexShrink: 0,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      }}>
        <img
          src={thumbnail}
          alt={title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
    );
  }

  // Fallback: generated cover
  let h = 0;
  for (let i = 0; i < (title || "").length; i++) {
    h = ((h * 31) + title.charCodeAt(i)) >>> 0;
  }
  const p = palettes[h % palettes.length];
  const glyph = (title || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "♪";

  return (
    <div style={{
      position: "relative",
      width: size,
      height: size,
      borderRadius: radius,
      background: p.bg,
      overflow: "hidden",
      flexShrink: 0,
      boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      color: p.fg,
      fontSize: size * 0.42,
      letterSpacing: "-0.04em",
    }}>
      {glyph}
    </div>
  );
}
